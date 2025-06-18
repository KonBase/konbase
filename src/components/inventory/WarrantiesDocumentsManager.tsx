'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useAssociation } from '@/contexts/AssociationContext';
import { supabase } from '@/lib/supabase';
import {
  FileText,
  Upload,
  Search,
  Calendar,
  AlertCircle,
  Download,
  Eye,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Document {
  id: string;
  name: string;
  type: 'warranty' | 'manual' | 'receipt' | 'other';
  item_id: string;
  item_name: string;
  file_url: string;
  file_size: number;
  expiry_date?: string;
  uploaded_at: string;
}

const uploadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['warranty', 'manual', 'receipt', 'other']),
  item_id: z.string().min(1, 'Please select an item'),
  expiry_date: z.string().optional(),
  file: z.any(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

export function WarrantiesDocumentsManager() {
  const { currentAssociation } = useAssociation();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      name: '',
      type: 'warranty',
      item_id: '',
    },
  });

  useEffect(() => {
    if (currentAssociation) {
      fetchDocuments();
      fetchItems();
    }
  }, [currentAssociation]);

  const fetchDocuments = async () => {
    if (!currentAssociation) return;

    try {
      setLoading(true);
      // This would be replaced with actual Supabase query
      // For now, using mock data
      const mockDocuments: Document[] = [
        {
          id: '1',
          name: 'Projector Warranty',
          type: 'warranty',
          item_id: '1',
          item_name: 'Epson EB-2250U Projector',
          file_url: '#',
          file_size: 1024000,
          expiry_date: '2025-12-31',
          uploaded_at: '2024-01-15',
        },
        {
          id: '2',
          name: 'Speaker System Manual',
          type: 'manual',
          item_id: '2',
          item_name: 'JBL EON615 Speaker',
          file_url: '#',
          file_size: 2048000,
          uploaded_at: '2024-02-20',
        },
      ];
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    if (!currentAssociation) return;

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name')
        .eq('association_id', currentAssociation.id)
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleUpload = async (data: UploadFormData) => {
    // This would handle actual file upload to Supabase Storage
    toast({
      title: 'Success',
      description: 'Document uploaded successfully',
    });
    setIsUploadDialogOpen(false);
    form.reset();
    fetchDocuments();
  };

  const handleDelete = async (document: Document) => {
    try {
      // This would delete from Supabase
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
      fetchDocuments();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.item_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || doc.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const expiringWarranties = documents.filter((doc) => {
    if (doc.type !== 'warranty' || !doc.expiry_date) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(doc.expiry_date).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  });

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'warranty':
        return <Calendar className="h-4 w-4" />;
      case 'manual':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576) + ' MB';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Documents Library</CardTitle>
              <CardDescription>
                Manage warranties, manuals, and other important documents
              </CardDescription>
            </div>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {expiringWarranties.length > 0 && (
            <div className="mb-4 p-4 border rounded-lg bg-orange-50 dark:bg-orange-950">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <p className="text-sm font-medium">
                  {expiringWarranties.length} warranties expiring soon
                </p>
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="warranty">Warranties</TabsTrigger>
              <TabsTrigger value="manual">Manuals</TabsTrigger>
              <TabsTrigger value="receipt">Receipts</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No documents found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm
                      ? 'Try adjusting your search'
                      : 'Upload your first document'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setIsUploadDialogOpen(true)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocuments.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getDocumentIcon(doc.type)}
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.item_name} •{' '}
                                {formatFileSize(doc.file_size)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {doc.expiry_date && (
                              <Badge
                                variant={
                                  new Date(doc.expiry_date) < new Date()
                                    ? 'destructive'
                                    : expiringWarranties.find(
                                          (w) => w.id === doc.id,
                                        )
                                      ? 'secondary'
                                      : 'outline'
                                }
                              >
                                Expires{' '}
                                {format(
                                  new Date(doc.expiry_date),
                                  'MMM d, yyyy',
                                )}
                              </Badge>
                            )}
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(doc)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a warranty, manual, or other document to your inventory
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleUpload)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Projector Warranty"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="warranty">Warranty</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="receipt">Receipt</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="item_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Item</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an item" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('type') === 'warranty' && (
                <FormField
                  control={form.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warranty Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Upload Document</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
