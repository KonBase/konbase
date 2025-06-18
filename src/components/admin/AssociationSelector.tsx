'use client';

import { useState, useEffect } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { supabase } from '@/lib/supabase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Association } from '@/types';
import { Check, ChevronsUpDown, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

export function AssociationSelector() {
  const { currentAssociation, setCurrentAssociation, userAssociations } =
    useAssociation();
  const { profile } = useUserProfile();
  const [open, setOpen] = useState(false);
  const [adminAssociations, setAdminAssociations] = useState<Association[]>([]);
  const router = useRouter();

  // Only fetch admin associations if the user has the appropriate role
  useEffect(() => {
    if (profile?.role === 'super_admin' || profile?.role === 'system_admin') {
      fetchAdminAssociations();
    }
  }, [profile]);

  const fetchAdminAssociations = async () => {
    try {
      const { data: associations, error } = await supabase
        .from('associations')
        .select('*');

      if (error) throw error;

      if (associations) {
        const formattedAssociations = associations.map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description || undefined,
          logo: a.logo || undefined,
          address: a.address || undefined,
          contactEmail: a.contact_email,
          contactPhone: a.contact_phone || undefined,
          website: a.website || undefined,
          createdAt: a.created_at,
          updatedAt: a.updated_at,
        }));

        // Ensure userAssociations exists before filtering
        const userAssociationsArray = userAssociations || [];

        // Filter out associations the user already has access to
        const filteredAssociations = formattedAssociations.filter(
          (assoc) =>
            !userAssociationsArray.some(
              (userAssoc) => userAssoc.id === assoc.id,
            ),
        );

        setAdminAssociations(filteredAssociations);
      }
    } catch (error) {
      console.error('Error fetching admin associations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch associations',
        variant: 'destructive',
      });
    }
  };

  // Ensure userAssociations is always an array (default to empty array if undefined)
  const safeUserAssociations = userAssociations || [];

  // Combine user associations and admin associations for super admins
  const isAdmin =
    profile?.role === 'super_admin' || profile?.role === 'system_admin';
  const displayedAssociations = isAdmin
    ? [...safeUserAssociations, ...adminAssociations]
    : safeUserAssociations;

  const handleSelectAssociation = (association: Association) => {
    try {
      setCurrentAssociation(association);
      setOpen(false);

      // Add a toast notification for feedback
      toast({
        title: 'Association Selected',
        description: `You are now viewing ${association.name}`,
      });
    } catch (error: any) {
      console.error('Error selecting association:', error);
      toast({
        title: 'Error',
        description: 'Failed to select association',
        variant: 'destructive',
      });
    }
  };

  const handleManageAssociation = () => {
    if (currentAssociation) {
      router.push(`/association/profile`);
    }
  };

  // If there are no associations to display and no current association, return null
  if (!currentAssociation && displayedAssociations.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[180px] md:w-[220px] justify-between"
          >
            {currentAssociation
              ? currentAssociation.name
              : 'Select Association...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-0">
          <Command>
            <CommandInput placeholder="Search association..." />
            <CommandList>
              <CommandEmpty>No association found.</CommandEmpty>
              <CommandGroup>
                {displayedAssociations.map((association) => (
                  <CommandItem
                    key={association.id}
                    value={association.id}
                    onSelect={() => handleSelectAssociation(association)}
                    className="flex items-center justify-between"
                  >
                    <span className="truncate">
                      {association.name}
                      {!safeUserAssociations.some(
                        (a) => a.id === association.id,
                      ) &&
                        isAdmin && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (Admin)
                          </span>
                        )}
                    </span>
                    {currentAssociation?.id === association.id && (
                      <Check className="ml-2 h-4 w-4" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {currentAssociation && isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleManageAssociation}
          className="h-9 w-9"
          title="Manage Association"
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
