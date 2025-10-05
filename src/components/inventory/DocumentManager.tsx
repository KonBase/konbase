import React, { useState, useEffect } from 'react';
import { useAssociation } from '@/contexts/AssociationContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  PlusCircle, 
  Trash, 
  Download,
  Upload,
  FileText,
  FileImage,
  FileUp,
  FolderOpen
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Document {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  item_id: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  item_name?: string;
}

interface Item {
  id: string;
  name: string;
}

interface DocumentManagerProps {
  itemId?: string; // Optional prop to filter documents for a specific item
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ itemId }) => {
  const { currentAssociation } = useAssociation();
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    itemId: '',
    file: null as File | null
  });
  
  useEffect(() => {
    if (currentAssociation) {
      fetchDocuments();
      fetchItems();
    } else {
      setDocuments([]);
      setItems([]);
      setLoading(false);
    }
  }, [currentAssociation]);
  
  const fetchDocuments = async () => {
    if (!currentAssociation) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          items:item_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      // If itemId is provided, filter documents for that specific item
      if (itemId) {
        query = query.eq('item_id', itemId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const formattedDocuments: Document[] = data.map(doc => ({
        ...doc,
        item_name: doc.items?.name
      }));
      
      setDocuments(formattedDocuments);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchItems = async () => {
    if (!currentAssociation) return;
    
    try {
      const { data, error } = await supabase
        .from('items')
        .select('id, name')
        .eq('association_id', currentAssociation.id)
        .order('name');
      
      if (error) throw error;
      
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory items.',
        variant: 'destructive'
      });
    }
  };
  
  const handleAddDocument = async () => {
    if (!currentAssociation || !formData.file || !formData.name) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill out all required fields.',
        variant: 'destructive'
      });
      return;
    }

    // Use itemId prop if provided, otherwise use formData.itemId
    const targetItemId = itemId || formData.itemId;
    if (!targetItemId) {
      toast({
        title: 'Missing Item',
        description: 'Please select an item.',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    let filePath: string | null = null; // Define filePath here to be accessible in catch block

    try {
      const fileExt = formData.file.name.split('.').pop();
      const uniqueFileName = `${crypto.randomUUID()}.${fileExt}`;
      // Construct the path according to RLS policy: association_id/item_id/fileName
      filePath = `${currentAssociation.id}/${targetItemId}/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents') // Bucket name remains 'documents'
        .upload(filePath, formData.file); // Use the new structured path

      if (uploadError) throw uploadError;

      // Fetch the public URL using the *correct* filePath
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Handle potential errors if getPublicUrl doesn't return data as expected
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Could not retrieve public URL for the uploaded file.');
      }
      const fileUrl = urlData.publicUrl;

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      // Insert metadata into the documents table
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          name: formData.name, // The user-provided document name
          file_url: fileUrl,   // The actual storage URL
          file_type: formData.file.type,
          item_id: targetItemId,
          uploaded_by: user.id
          // association_id is implicitly linked via item_id, no need to store here usually
        });

      if (docError) throw docError;

      toast({
        title: 'Success',
        description: 'Document uploaded successfully.',
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchDocuments();
    } catch (error: any) {
      console.error('Error adding document:', error);
      // Attempt to clean up storage if database insert failed and filePath was set
      if (error.message.includes('insert') && filePath) {
          console.warn('Database insert failed after storage upload. Attempting to remove orphaned file:', filePath);
          await supabase.storage.from('documents').remove([filePath]);
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload document.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleDeleteDocument = async () => {
    if (!currentDocument) return;

    try {
      // Extract the storage path from the file_url
      // Assuming file_url is like: https://<project_ref>.supabase.co/storage/v1/object/public/documents/<association_id>/<item_id>/<filename.ext>
      const urlString = currentDocument.file_url;
      let filePath: string | null = null;
      try {
        const url = new URL(urlString);
        // Find the part after /documents/
        const pathSegments = url.pathname.split('/documents/');
        if (pathSegments.length > 1) {
          filePath = pathSegments[1]; // Should be <association_id>/<item_id>/<filename.ext>
        }
      } catch (e) {
        console.error("Could not parse file URL:", urlString, e);
        // Fallback attempt if URL parsing fails (e.g., if it's not a standard URL)
        const fallbackParts = urlString.split('/documents/');
        if (fallbackParts.length > 1) {
          filePath = fallbackParts[1];
        }
      }

      if (!filePath) {
        throw new Error('Could not determine file path from URL for deletion.');
      }

      // 1. Delete the database record first
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', currentDocument.id);

      if (dbError) throw dbError;

      // 2. Delete the file from storage if database deletion was successful
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]); // Use the extracted path

      if (storageError) {
        // Log a warning but don't necessarily fail the whole operation,
        // as the primary record is gone. Might need manual cleanup later.
        console.error('Warning: File could not be deleted from storage:', storageError);
        toast({
          title: 'Warning',
          description: 'Document record deleted, but failed to remove file from storage.',
          variant: 'default' // Use default or warning variant
        });
      } else {
          toast({
          title: 'Success',
          description: 'Document deleted successfully.',
        });
      }

      setIsDeleteDialogOpen(false);
      fetchDocuments(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete document.',
        variant: 'destructive'
      });
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({...formData, file: e.target.files[0]});
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      itemId: '',
      file: null
    });
  };
  
  const openDeleteDialog = (document: Document) => {
    setCurrentDocument(document);
    setIsDeleteDialogOpen(true);
  };
  
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <FileImage className="h-5 w-5" />;
    } else if (fileType === 'application/pdf') {
      return <FileUp className="h-5 w-5" />;
    } else {
      return <FileText className="h-5 w-5" />;
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents & Warranties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Documents & Warranties</CardTitle>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No Documents Uploaded</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload documents, manuals, or warranty information for your inventory items.
              </p>
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                Upload Your First Document
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  {!itemId && <TableHead>Related Item</TableHead>}
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {getFileIcon(doc.file_type)}
                      </div>
                    </TableCell>
                    <TableCell>{doc.name}</TableCell>
                    {!itemId && <TableCell>{doc.item_name}</TableCell>}
                    <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => window.open(doc.file_url, '_blank')}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(doc)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document, manual, warranty, or other file related to an inventory item.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="document-name">Document Name *</Label>
              <Input
                id="document-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            
            {!itemId && (
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="item">Related Item *</Label>
                <Select
                  value={formData.itemId}
                  onValueChange={(value) => setFormData({...formData, itemId: value})}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="file">File *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  className="flex-1"
                  required
                />
              </div>
              {formData.file && (
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {formData.file.name} ({(formData.file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddDocument} 
              disabled={!formData.name || (!itemId && !formData.itemId) || !formData.file || uploading}
            >
              {uploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {currentDocument && (
            <div className="py-4">
              <div className="flex items-center gap-2">
                {getFileIcon(currentDocument.file_type)}
                <p className="font-semibold">{currentDocument.name}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Related to: {currentDocument.item_name}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDocument}>
              Delete Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentManager;
