import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, ClipboardIcon, Copy, CalendarIcon, Loader2, Info, Settings, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/hooks/use-toast';
import { ConventionTemplate } from '@/types/convention';
import { format, formatDistanceToNow } from 'date-fns';
import { AddTemplateDialog } from '@/components/conventions/AddTemplateDialog';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ConventionTemplates = () => {
  const { currentAssociation } = useAssociation();
  const [templates, setTemplates] = useState<ConventionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    if (!currentAssociation) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('convention_templates')
        .select(`
          *,
          creator:created_by(email, name)
        `)
        .eq('association_id', currentAssociation.id)
        .order('name');
      
      if (error) throw error;
      
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error loading templates',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTemplates();
  }, [currentAssociation]);

  const handleTemplateAdded = () => {
    fetchTemplates();
  };

  const useTemplate = (templateId: string) => {
    // TODO: Navigate to the create convention page with template ID
    // This might need adjustment based on the actual creation route
    // navigate(`/conventions/create?template=${templateId}`);
    toast({ title: "Navigate to Create", description: `Would navigate to create page using template ID: ${templateId}` });
  };

  const formatConfigurationSummary = (config: Record<string, any> | null): string => {
    if (!config) return 'No configuration details';
    const items = [];
    if (config.locations?.length) items.push(`${config.locations.length} locations`);
    if (config.equipment?.length) items.push(`${config.equipment.length} equipment`);
    if (config.consumables?.length) items.push(`${config.consumables.length} consumables`);
    if (config.requirements?.length) items.push(`${config.requirements.length} requirements`);

    if (items.length === 0) return 'Basic configuration';
    return `Includes: ${items.join(', ')}`;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Convention Templates</h1>
            <p className="text-muted-foreground">Create reusable configurations for quick convention setup.</p>
            {/* Optional: Link back to conventions list or dashboard */}
            {/* <Button variant="link" asChild className="p-0 h-auto text-sm">
              <RouterLink to={`/conventions`}>Back to Conventions</RouterLink>
            </Button> */}
          </div>
          <Button onClick={() => setIsAddTemplateOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create New Template
          </Button>
        </div>

        {/* Templates Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Available Templates</CardTitle>
            <CardDescription>Select a template to start a new convention or manage existing templates.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading templates...</span>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-10">
                <ClipboardIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Templates Created Yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first template to streamline convention setup.
                </p>
                <Button variant="default" className="mt-4" onClick={() => setIsAddTemplateOpen(true)}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create First Template
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card key={template.id} className="flex flex-col hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg font-semibold flex-1 mr-2">{template.name}</CardTitle>
                        {/* TODO: Add Edit/Delete actions for template */}
                        {/* <Button variant="ghost" size="icon" className="h-7 w-7"><Settings className="h-4 w-4" /></Button> */}
                      </div>
                      <CardDescription className="text-sm line-clamp-2 h-10 pt-1">
                        {template.description || 'No description provided'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow pb-3 space-y-2">
                      <Separator />
                      <div className="text-xs text-muted-foreground space-y-1 pt-2">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3" />
                          <span>Created by {template.creator?.name || template.creator?.email || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="h-3 w-3" />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>{formatDistanceToNow(new Date(template.created_at), { addSuffix: true })}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {format(new Date(template.created_at), 'PPP p')}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex items-start gap-1.5 pt-1">
                          <Settings className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{formatConfigurationSummary(template.configuration)}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-3">
                      <Button
                        variant="default" // Changed variant
                        size="sm" // Changed size
                        className="w-full"
                        onClick={() => useTemplate(template.id)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Use This Template
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* About Templates Card */}
        <Card className="bg-muted/30 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5"/> About Templates</CardTitle>
            <CardDescription>How to leverage convention templates effectively.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Templates save time by pre-filling common convention details. Create templates for recurring event types.
            </p>
            <p>A template can include pre-defined:</p>
            <ul className="list-disc list-inside space-y-1 text-xs pl-2">
              <li>Locations (e.g., Main Hall, Panel Room A)</li>
              <li>Equipment lists (e.g., 10 Projectors, 20 Microphones)</li>
              <li>Consumable needs (e.g., 500 Badges, 10 Water Coolers)</li>
              <li>Standard requirements/tasks (e.g., Setup AV, Check Registration)</li>
            </ul>
            <p>
              Click "Use This Template" on a card to start creating a new convention based on that template's configuration.
            </p>
          </CardContent>
        </Card>

        {/* Add Template Dialog */}
        <AddTemplateDialog
          isOpen={isAddTemplateOpen}
          onClose={() => setIsAddTemplateOpen(false)}
          onTemplateAdded={handleTemplateAdded}
        />
      </div>
    </TooltipProvider>
  );
};

export default ConventionTemplates;
