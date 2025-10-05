import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAssociation } from '@/contexts/AssociationContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  Package, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Shield, 
  FileText, 
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  CalendarOff,
  Eye,
  Download,
  Upload,
  Plus
} from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import ImageViewer from '@/components/inventory/ImageViewer';
import DocumentManager from '@/components/inventory/DocumentManager';
import ImageUpload from '@/components/inventory/ImageUpload';
import QRCodeDisplay from '@/components/inventory/QRCodeDisplay';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ItemDetail {
  id: string;
  name: string;
  description: string | null;
  serial_number: string | null;
  barcode: string | null;
  item_code: string | null;
  condition: string;
  category_id: string | null;
  location_id: string | null;
  association_id: string;
  is_consumable: boolean;
  quantity: number | null;
  minimum_quantity: number | null;
  purchase_price: number | null;
  purchase_date: string | null;
  warranty_expiration: string | null;
  image: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  categoryName?: string;
  locationName?: string;
}

interface Document {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

const InventoryItemDetail = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { currentAssociation } = useAssociation();
  const { toast } = useToast();

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (itemId && currentAssociation) {
      fetchItemDetails();
      fetchDocuments();
    }
  }, [itemId, currentAssociation]);

  const fetchItemDetails = async () => {
    if (!itemId || !currentAssociation) return;

    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          categories ( name ),
          locations ( name )
        `)
        .eq('id', itemId)
        .eq('association_id', currentAssociation.id)
        .single();

      if (error) throw error;

      const processedItem = {
        ...data,
        categoryName: data.categories?.name || 'N/A',
        locationName: data.locations?.name || 'N/A',
      } as ItemDetail;

      setItem(processedItem);
    } catch (error: any) {
      console.error('Error fetching item details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load item details.',
        variant: 'destructive'
      });
      navigate('/inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!itemId) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleDeleteItem = async () => {
    if (!item) return;

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Item deleted successfully.'
      });
      navigate('/inventory');
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete item.',
        variant: 'destructive'
      });
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatWarrantyStatus = (expirationDate: string | null) => {
    if (!expirationDate) return { text: 'N/A', variant: 'outline' as const, icon: <CalendarOff className="h-4 w-4" /> };
    
    const expiry = new Date(expirationDate);
    if (isPast(expiry)) {
      return { 
        text: `Expired ${format(expiry, 'MMM yyyy')}`, 
        variant: 'destructive' as const, 
        icon: <AlertCircle className="h-4 w-4" /> 
      };
    }
    
    const daysLeft = differenceInDays(expiry, new Date());
    if (daysLeft <= 30) {
      return { 
        text: `Expires in ${daysLeft}d`, 
        variant: 'warning' as const, 
        icon: <AlertCircle className="h-4 w-4" /> 
      };
    }
    
    return { 
      text: `Expires ${format(expiry, 'MMM yyyy')}`, 
      variant: 'secondary' as const, 
      icon: <CheckCircle2 className="h-4 w-4" /> 
    };
  };

  const getConditionBadgeVariant = (condition: string) => {
    switch (condition) {
      case 'new': return 'default';
      case 'good': return 'secondary';
      case 'fair': return 'outline';
      case 'poor':
      case 'damaged':
      case 'retired': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Item Not Found</CardTitle>
            <CardDescription>The requested item could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/inventory">Back to Inventory</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const warrantyStatus = formatWarrantyStatus(item.warranty_expiration);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{item.name}</h1>
            <p className="text-muted-foreground">
              {item.categoryName} • {item.locationName}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/inventory/items/${item.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Item Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Item Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              {item.image ? (
                <div className="relative group">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setShowImageViewer(true)}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setShowImageViewer(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Size
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-4" />
                  <p className="text-lg font-medium mb-2">No Image Available</p>
                  <p className="text-sm mb-4">Upload an image to better identify this item</p>
                  <Button onClick={() => setShowImageUpload(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Item Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Item Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm">{item.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Condition</label>
                  <div className="mt-1">
                    <Badge variant={getConditionBadgeVariant(item.condition)} className="capitalize">
                      {item.condition}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Serial Number</label>
                  <p className="text-sm">{item.serial_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Barcode</label>
                  <p className="text-sm">{item.barcode || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Item Type</label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {item.is_consumable ? 'Consumable' : 'Asset'}
                    </Badge>
                  </div>
                </div>
                {item.is_consumable && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                    <div className="mt-1">
                      <Badge 
                        variant={
                          item.minimum_quantity !== null && 
                          item.quantity !== null && 
                          item.quantity <= item.minimum_quantity 
                            ? 'destructive' 
                            : 'secondary'
                        }
                      >
                        {item.quantity ?? 0}
                        {item.minimum_quantity !== null && ` (min ${item.minimum_quantity})`}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
              
              {item.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm mt-1">{item.description}</p>
                </div>
              )}
              
              {item.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm mt-1">{item.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Purchase Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Purchase Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Purchase Price</label>
                  <p className="text-sm">{formatCurrency(item.purchase_price)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Purchase Date</label>
                  <p className="text-sm">
                    {item.purchase_date ? format(new Date(item.purchase_date), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Warranty Status</label>
                  <div className="mt-1">
                    <Badge variant={warrantyStatus.variant} className="text-xs">
                      {warrantyStatus.icon}
                      <span className="ml-1">{warrantyStatus.text}</span>
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code & Barcode */}
          <QRCodeDisplay
            itemId={item.id}
            itemName={item.name}
            itemCode={item.item_code}
            prefix="ITEM"
            onCodeGenerated={(code) => {
              // Update the item with the new code
              setItem(prev => prev ? { ...prev, item_code: code } : null);
            }}
          />

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents & Warranties
              </CardTitle>
              <CardDescription>
                Upload and manage documents, warranties, manuals, and receipts for this item.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentManager itemId={item.id} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Location & Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location & Category
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <p className="text-sm">{item.categoryName}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Location</label>
                <p className="text-sm">{item.locationName}</p>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm">{format(new Date(item.created_at), 'MMM dd, yyyy')}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">{format(new Date(item.updated_at), 'MMM dd, yyyy')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {showImageViewer && item.image && (
        <ImageViewer
          imageUrl={item.image}
          imageName={item.name}
          onClose={() => setShowImageViewer(false)}
        />
      )}

      {/* Image Upload Modal */}
      {showImageUpload && (
        <ImageUpload
          itemId={item.id}
          currentImageUrl={item.image}
          onSuccess={(newImageUrl) => {
            setItem(prev => prev ? { ...prev, image: newImageUrl } : null);
            setShowImageUpload(false);
            toast({
              title: 'Success',
              description: 'Image uploaded successfully.'
            });
          }}
          onClose={() => setShowImageUpload(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-semibold">{item.name}</p>
            <p className="text-sm text-muted-foreground">
              {item.categoryName} • {item.locationName}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryItemDetail;
