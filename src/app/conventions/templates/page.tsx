'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Copy,
  Trash,
  Edit,
  Bookmark,
  BookmarkCheck,
  Info,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ConventionTemplate } from '@/types/convention';
import { Badge } from '@/components/ui/badge';
import { CreateTemplateDialog } from '@/components/conventions/CreateTemplateDialog';
import { AuthGuard } from '@/components/guards/AuthGuard';

export default function ConventionTemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ConventionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('convention_templates')
        .select('*')
        .order('created_at', { ascending: false });

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

  const handleTemplateCreated = () => {
    fetchTemplates();
    setIsCreateDialogOpen(false);
  };

  const createConventionFromTemplate = async (templateId: string) => {
    try {
      // Call a server function to create a convention from the template
      const { data, error } = await supabase.rpc(
        'create_convention_from_template',
        {
          template_id: templateId,
        },
      );

      if (error) throw error;

      toast({
        title: 'Convention created',
        description: 'Convention has been created from template',
      });

      // Navigate to the new convention
      if (data && data.id) {
        router.push(`/conventions/${data.id}`);
      } else {
        router.push('/conventions');
      }
    } catch (error: any) {
      console.error('Error creating convention from template:', error);
      toast({
        title: 'Error creating convention',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthGuard>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Convention Templates
            </h1>
            <p className="text-muted-foreground">
              Manage reusable convention templates to quickly create new
              conventions.
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>

        <Tabs defaultValue="my-templates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="my-templates">My Templates</TabsTrigger>
            <TabsTrigger value="organization-templates">
              Organization Templates
            </TabsTrigger>
            <TabsTrigger value="community-templates" disabled>
              Community Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-templates">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-5 w-3/4 bg-muted rounded"></div>
                      <div className="h-4 w-1/2 bg-muted rounded"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 w-full bg-muted rounded mb-2"></div>
                      <div className="h-4 w-2/3 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Templates Found
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first template to quickly set up conventions
                    with predefined settings.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {template.name}
                          </CardTitle>
                          <CardDescription>
                            {new Date(template.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">Template</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {template.description || 'No description provided'}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.includes_locations && (
                          <Badge variant="secondary" className="text-xs">
                            Locations
                          </Badge>
                        )}
                        {template.includes_requirements && (
                          <Badge variant="secondary" className="text-xs">
                            Requirements
                          </Badge>
                        )}
                        {template.includes_equipment && (
                          <Badge variant="secondary" className="text-xs">
                            Equipment
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                    <div className="p-4 pt-0 flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          createConventionFromTemplate(template.id)
                        }
                      >
                        <Copy className="mr-1 h-3 w-3" />
                        Use Template
                      </Button>

                      <div className="space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="organization-templates">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookmarkCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Organization Templates
                </h3>
                <p className="text-muted-foreground text-center mb-1">
                  Templates shared within your organization will appear here.
                </p>
                <p className="text-muted-foreground text-center mb-4 text-sm">
                  No organization templates available at this time.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center">
              <Info className="h-4 w-4 mr-2 text-muted-foreground" />
              <CardTitle className="text-base">About Templates</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Templates allow you to save convention configurations including
              locations, equipment requirements, roles, and other settings. Use
              templates to quickly create conventions with similar structures
              without starting from scratch.
            </p>
          </CardContent>
        </Card>

        <CreateTemplateDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onTemplateCreated={handleTemplateCreated}
        />
      </div>
    </AuthGuard>
  );
}
