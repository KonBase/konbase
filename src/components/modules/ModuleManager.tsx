'use client';

import React, { useState, useRef } from 'react';
import { useModules } from './ModuleContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import {
  AlertCircle,
  Info,
  Package,
  Upload,
  RefreshCw,
  Shield,
  ExternalLink,
  ArrowDownToLine,
} from 'lucide-react';
import { ErrorDetails } from '../../utils/debug/error-details';
import moduleService from './ModuleService';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const ModuleManager: React.FC = () => {
  const { manifests, refreshModuleState } = useModules();
  const [activeTab, setActiveTab] = useState('installed');
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleToggleModule = async (
    moduleId: string,
    currentState: boolean,
  ) => {
    setLoading(moduleId);
    setError(null);

    try {
      if (currentState) {
        await moduleService.disableModule(moduleId);
        toast({
          title: 'Module Disabled',
          description: 'The module has been disabled successfully.',
        });
      } else {
        await moduleService.enableModule(moduleId);
        toast({
          title: 'Module Enabled',
          description: 'The module has been enabled successfully.',
        });
      }
      refreshModuleState();
    } catch (err) {
      setError(err);
      toast({
        title: 'Operation Failed',
        description:
          err instanceof Error ? err.message : 'Failed to toggle module status',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const openModuleDetails = (moduleId: string) => {
    setSelectedModule(moduleId);
    setIsDetailDialogOpen(true);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const simulateProgress = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        setUploadProgress(progress);

        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            setIsUploadDialogOpen(false);
            setUploadProgress(0);
            toast({
              title: 'Module Uploaded',
              description:
                'The module has been uploaded successfully and is ready to be enabled.',
            });
            refreshModuleState();
          }, 500);
        }
      }, 150);
    };

    simulateProgress();
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const getSelectedModuleDetails = () => {
    return manifests.find((m) => m.id === selectedModule);
  };

  const moduleDetail = getSelectedModuleDetails();

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Module Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshModuleState}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsUploadDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Module
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="installed">Installed Modules</TabsTrigger>
          <TabsTrigger value="store">Module Store</TabsTrigger>
          <TabsTrigger value="developer">Developer Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="installed">
          {manifests.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Modules Installed</CardTitle>
                <CardDescription>
                  You don't have any modules installed yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Visit the Module Store to browse available modules or check
                  the Developer Resources to learn how to create your own.
                </p>
                <Button onClick={() => setActiveTab('store')}>
                  Browse Module Store
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {manifests.map((manifest) => (
                <Card
                  key={manifest.id}
                  className={manifest.isEnabled ? 'border-green-200' : ''}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle>{manifest.name}</CardTitle>
                          {manifest.isEnabled && (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 hover:bg-green-50"
                            >
                              Enabled
                            </Badge>
                          )}
                        </div>
                        <CardDescription>v{manifest.version}</CardDescription>
                      </div>
                      <Switch
                        checked={manifest.isEnabled}
                        disabled={loading === manifest.id}
                        onCheckedChange={() =>
                          handleToggleModule(manifest.id, manifest.isEnabled)
                        }
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {manifest.description || 'No description provided.'}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Author: {manifest.author || 'Unknown'}</p>
                      <p>
                        Installed:{' '}
                        {new Date(manifest.installDate).toLocaleDateString()}
                      </p>
                      {manifest.permissions?.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium flex items-center">
                            <Shield className="h-3 w-3 mr-1" />
                            Permissions:
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {manifest.permissions.map((perm) => (
                              <Badge
                                key={perm}
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModuleDetails(manifest.id)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <div className="mt-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  <ErrorDetails errorData={error} />
                </AlertDescription>
              </Alert>
            </div>
          )}
        </TabsContent>

        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle>Module Store</CardTitle>
              <CardDescription>
                Browse and install modules to extend your Konbase functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-6 border border-dashed rounded-md">
                <div className="text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Module Store Coming Soon
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The module store is currently under development. Check back
                    later!
                  </p>
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setIsUploadDialogOpen(true)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Custom Module
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="developer">
          <Card>
            <CardHeader>
              <CardTitle>Developer Resources</CardTitle>
              <CardDescription>
                Learn how to create custom modules for Konbase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-md">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <Info className="mr-2 h-5 w-5" />
                    Getting Started
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Creating modules for Konbase is straightforward. Follow our
                    documentation to get started.
                  </p>
                  <Button variant="outline" className="mt-2" asChild>
                    <a
                      href="https://konbase.cfd/docs/modules"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Documentation
                    </a>
                  </Button>
                </div>

                <div className="p-4 bg-muted rounded-md">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <Info className="mr-2 h-5 w-5" />
                    Module Templates
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Start with our module templates to quickly create new
                    modules.
                  </p>
                  <Button variant="outline" className="mt-2" asChild>
                    <a
                      href="/templates/SampleModule.tsx"
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <ArrowDownToLine className="h-4 w-4 mr-2" />
                      Download Templates
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Module Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{moduleDetail?.name || 'Module Details'}</DialogTitle>
            <DialogDescription>
              Detailed information about this module
            </DialogDescription>
          </DialogHeader>

          {moduleDetail && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Description</h3>
                <p className="text-sm mt-1">
                  {moduleDetail.description || 'No description provided.'}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium">Version</h3>
                  <p className="text-sm mt-1">{moduleDetail.version}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Author</h3>
                  <p className="text-sm mt-1">
                    {moduleDetail.author || 'Unknown'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Installed On</h3>
                  <p className="text-sm mt-1">
                    {new Date(moduleDetail.installDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Last Updated</h3>
                  <p className="text-sm mt-1">
                    {new Date(moduleDetail.updateDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium">Status</h3>
                <div className="flex items-center mt-1">
                  <Badge
                    variant={moduleDetail.isEnabled ? 'default' : 'secondary'}
                  >
                    {moduleDetail.isEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                    onClick={() =>
                      handleToggleModule(
                        moduleDetail.id,
                        moduleDetail.isEnabled,
                      )
                    }
                    disabled={loading === moduleDetail.id}
                  >
                    {moduleDetail.isEnabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>

              {moduleDetail.permissions &&
                moduleDetail.permissions.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium flex items-center">
                        <Shield className="h-4 w-4 mr-1" />
                        Permissions
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {moduleDetail.permissions.map((perm) => (
                          <Badge key={perm} variant="outline">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

              {moduleDetail.requires && moduleDetail.requires.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium">Dependencies</h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {moduleDetail.requires.map((dep) => (
                        <Badge key={dep} variant="outline">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Module Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Module</DialogTitle>
            <DialogDescription>
              Upload a custom module (.zip) file to extend Konbase
              functionality.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-4">
            {isUploading ? (
              <div className="w-full space-y-4">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-center text-sm text-muted-foreground">
                  Uploading module... {uploadProgress}%
                </p>
              </div>
            ) : (
              <>
                <div
                  className="border-2 border-dashed rounded-lg p-8 w-full text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={handleFileSelect}
                >
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">
                    Click to select a module file
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports .zip module packages
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".zip"
                  onChange={handleFileUpload}
                />
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
