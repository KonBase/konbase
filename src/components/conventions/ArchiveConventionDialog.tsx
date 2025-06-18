'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Archive } from 'lucide-react';
import { Convention } from '@/types/convention';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface ArchiveConventionDialogProps {
  convention: Convention;
  onArchived?: () => void;
  trigger?: React.ReactNode;
}

const ArchiveConventionDialog = ({
  convention,
  onArchived,
  trigger,
}: ArchiveConventionDialogProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const exportToTxt = () => {
    // Convert convention data to text
    const conventionText = `
Convention: ${convention.name}
Description: ${convention.description || 'N/A'}
Start Date: ${new Date(convention.start_date).toLocaleDateString()}
End Date: ${new Date(convention.end_date).toLocaleDateString()}
Location: ${convention.location || 'N/A'}
Status: ${convention.status}
Created: ${new Date(convention.created_at).toLocaleDateString()}
Last Updated: ${new Date(convention.updated_at).toLocaleDateString()}
    `.trim();

    // Create blob and download
    const blob = new Blob([conventionText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `convention_${convention.id}_archive.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleArchive = async () => {
    setIsLoading(true);

    try {
      // Update convention status to archived
      const { error } = await supabase
        .from('conventions')
        .update({ status: 'archived' })
        .eq('id', convention.id);

      if (error) throw error;

      // Export convention data
      exportToTxt();

      toast({
        title: 'Convention archived',
        description: `${convention.name} has been archived successfully.`,
      });

      if (onArchived) onArchived();
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error archiving convention:', error);
      toast({
        title: 'Error archiving convention',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {trigger ? (
        <span onClick={() => setIsOpen(true)}>{trigger}</span>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          disabled={convention.status === 'archived'}
        >
          <Archive className="mr-2 h-4 w-4" />
          {convention.status === 'archived' ? 'Archived' : 'Archive'}
        </Button>
      )}

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Convention</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the convention "{convention.name}" and export
              its data to a text file. Archived conventions are read-only and
              cannot be modified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={isLoading}>
              {isLoading ? 'Archiving...' : 'Archive and Export'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ArchiveConventionDialog;
