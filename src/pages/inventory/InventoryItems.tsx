import { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { useAssociation } from '@/contexts/AssociationContext';
import { Link } from 'react-router-dom';
import SearchBarWithScanner from '@/components/search/SearchBarWithScanner';
import BulkCodeGenerator from '@/components/inventory/BulkCodeGenerator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
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
  PlusCircle,
  Search,
  Edit,
  Trash,
  Package,
  X,
  ArrowUpDown,
  AlertCircle, // Added AlertCircle
  CheckCircle2, // Added CheckCircle2
  CalendarOff, // Added CalendarOff
  DollarSign // Added DollarSign
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/useCategories';
import { useLocations } from '@/hooks/useLocations';
import { format, isPast, differenceInDays } from 'date-fns'; // Added date-fns
import { Textarea } from '@/components/ui/textarea'; // Added Textarea

// Interface for Item type (assuming this structure based on the code)
interface Item {
  id: string;
  name: string;
  description: string | null;
  serial_number: string | null;
  barcode: string | null;
  condition: string;
  category_id: string;
  location_id: string;
  association_id: string;
  is_consumable: boolean;
  quantity: number | null;
  minimum_quantity: number | null;
  image: string | null;
  notes: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  warranty_expiration: string | null;
  created_at: string;
  updated_at: string;
  // Added optional fields for joined data (if fetched separately or planned)
  categoryName?: string;
  locationName?: string;
}

// Helper function to format currency
const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value); // Adjust currency as needed
};

// Define the return type for warranty status
type WarrantyStatus = {
  text: string;
  variant: 'outline' | 'destructive' | 'warning' | 'secondary'; // Explicit literal types
  icon: JSX.Element;
};

// Helper function to format warranty status
const formatWarrantyStatus = (expirationDate: string | null): WarrantyStatus => {
  if (!expirationDate) return { text: 'N/A', variant: 'outline', icon: <CalendarOff className="h-3 w-3" /> };
  const expiry = new Date(expirationDate);
  if (isPast(expiry)) {
    return { text: `Expired ${format(expiry, 'MMM yyyy')}`, variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> };
  }
  const daysLeft = differenceInDays(expiry, new Date());
  if (daysLeft <= 30) {
    return { text: `Expires in ${daysLeft}d`, variant: 'warning', icon: <AlertCircle className="h-3 w-3" /> };
  }
  return { text: `Expires ${format(expiry, 'MMM yyyy')}`, variant: 'secondary', icon: <CheckCircle2 className="h-3 w-3" /> };
};

const InventoryItems = () => {
  const { currentAssociation } = useAssociation();
  const { toast } = useToast();
  const { categories, loading: categoriesLoading } = useCategories(); // Added loading state
  const { locations, loading: locationsLoading } = useLocations(); // Added loading state

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  // Removed viewMode state as it wasn't implemented
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Item | 'categoryName' | 'locationName'>('name'); // Use keyof Item
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serial_number: '',
    barcode: '',
    condition: 'good',
    category_id: '',
    location_id: '',
    is_consumable: false,
    quantity: 1,
    minimum_quantity: null as number | null,
    purchase_date: '',
    purchase_price: null as number | null,
    warranty_expiration: '',
    notes: ''
  });

  // Combine loading states
  const isDataLoading = loading || categoriesLoading || locationsLoading;

  // Memoize category and location maps for performance
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
  const locationMap = useMemo(() => new Map(locations.map(l => [l.id, l.name])), [locations]);

  useEffect(() => {
    if (currentAssociation) {
      fetchItems();
    } else {
      setItems([]);
      setLoading(false);
    }
    // Dependency array includes filters, sort, and search query for re-fetching/re-filtering
  }, [currentAssociation, filterCategory, filterLocation, filterCondition, sortField, sortDirection, searchQuery]);

  const fetchItems = async () => {
    if (!currentAssociation) return;

    setLoading(true);
    try {
      // Fetch items with category and location names joined
      let query = supabase
        .from('items')
        .select(`
          *,
          categories ( name ),
          locations ( name )
        `)
        .eq('association_id', currentAssociation.id);

      // Apply filters directly in the query
      if (filterCategory && filterCategory !== 'all') {
        query = query.eq('category_id', filterCategory);
      }
      if (filterLocation && filterLocation !== 'all') {
        query = query.eq('location_id', filterLocation);
      }
      if (filterCondition && filterCondition !== 'all') {
        query = query.eq('condition', filterCondition);
      }

      // Apply sorting - handle joined fields client-side for simplicity
      const sortKey = sortField as keyof Item; // Cast for direct DB sort
      if (sortField !== 'categoryName' && sortField !== 'locationName') {
         query = query.order(sortKey, { ascending: sortDirection === 'asc' });
      }


      const { data, error } = await query;

      if (error) throw error;

      // Process data: Map snake_case, add joined names, filter by search
      let processedData = (data || []).map(item => ({
        ...item,
        categoryName: item.categories?.name || 'N/A',
        locationName: item.locations?.name || 'N/A',
      })) as Item[];

      // Apply search filter client-side
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        processedData = processedData.filter(item =>
          item.name.toLowerCase().includes(searchLower) ||
          (item.description && item.description.toLowerCase().includes(searchLower)) ||
          (item.serial_number && item.serial_number.toLowerCase().includes(searchLower)) ||
          (item.barcode && item.barcode.toLowerCase().includes(searchLower)) ||
          item.categoryName?.toLowerCase().includes(searchLower) || // Search joined names
          item.locationName?.toLowerCase().includes(searchLower)   // Search joined names
        );
      }

       // Apply client-side sorting for joined fields if necessary
      if (sortField === 'categoryName' || sortField === 'locationName') {
        processedData.sort((a, b) => {
          const valA = a[sortField]?.toLowerCase() || '';
          const valB = b[sortField]?.toLowerCase() || '';
          if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
          if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }


      setItems(processedData);
    } catch (error: any) {
      console.error('Error fetching items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory items.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Item | 'categoryName' | 'locationName') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    // Re-fetch/re-sort is handled by useEffect dependency change
  };

  // --- CRUD Handlers (handleAddItem, handleEditItem, handleDeleteItem) ---
  // These seem mostly okay, but ensure purchase_price is handled as number
  const handleAddItem = async () => {
    if (!currentAssociation || !formData.name || !formData.category_id || !formData.location_id) {
       toast({ title: 'Missing Information', description: 'Please fill in all required fields (*).', variant: 'warning' });
       return;
    }

    try {
      const { error } = await supabase
        .from('items')
        .insert({
          ...formData,
          association_id: currentAssociation.id,
          quantity: formData.is_consumable ? (formData.quantity || 1) : 1, // Ensure quantity is set
          minimum_quantity: formData.is_consumable ? formData.minimum_quantity : null,
          purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null, // Ensure number
          // Clear empty strings to null for optional date fields
          purchase_date: formData.purchase_date || null,
          warranty_expiration: formData.warranty_expiration || null,
        })
        .select(); // Select to potentially get the created item back

      if (error) throw error;

      toast({ title: 'Success', description: 'Item added successfully.' });
      setIsAddDialogOpen(false);
      resetForm();
      fetchItems(); // Re-fetch to update the list
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleEditItem = async () => {
    if (!currentItem || !formData.name || !formData.category_id || !formData.location_id) {
       toast({ title: 'Missing Information', description: 'Please fill in all required fields (*).', variant: 'warning' });
       return;
    }

    try {
      const { error } = await supabase
        .from('items')
        .update({
          ...formData,
          quantity: formData.is_consumable ? (formData.quantity || 1) : 1, // Ensure quantity is set
          minimum_quantity: formData.is_consumable ? formData.minimum_quantity : null,
          purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null, // Ensure number
          // Clear empty strings to null for optional date fields
          purchase_date: formData.purchase_date || null,
          warranty_expiration: formData.warranty_expiration || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentItem.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Item updated successfully.' });
      setIsEditDialogOpen(false);
      resetForm();
      fetchItems(); // Re-fetch to update the list
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteItem = async () => {
    if (!currentItem) return;

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', currentItem.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Item deleted successfully.' });
      setIsDeleteDialogOpen(false);
      fetchItems(); // Re-fetch to update the list
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };
  // --- End CRUD Handlers ---


  const openEditDialog = (item: Item) => {
    setCurrentItem(item); // Ensure currentItem is set for both edit and potential delete
    setFormData({
      name: item.name,
      description: item.description || '',
      serial_number: item.serial_number || '',
      barcode: item.barcode || '',
      condition: item.condition || 'good', // Default if null
      category_id: item.category_id || '', // Default if null
      location_id: item.location_id || '', // Default if null
      is_consumable: item.is_consumable,
      quantity: item.quantity ?? 1, // Use ?? for nullish coalescing
      minimum_quantity: item.minimum_quantity,
      purchase_date: item.purchase_date || '',
      purchase_price: item.purchase_price,
      warranty_expiration: item.warranty_expiration || '',
      notes: item.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      serial_number: '',
      barcode: '',
      condition: 'good',
      category_id: categories.length > 0 ? categories[0].id : '', // Pre-select if possible
      location_id: locations.length > 0 ? locations[0].id : '', // Pre-select if possible
      is_consumable: false,
      quantity: 1,
      minimum_quantity: null,
      purchase_date: '',
      purchase_price: null,
      warranty_expiration: '',
      notes: ''
    });
  };

  // Use memoized maps for category/location names
  const getCategoryName = (categoryId: string) => categoryMap.get(categoryId) || 'N/A';
  const getLocationName = (locationId: string) => locationMap.get(locationId) || 'N/A';

  // Render Sort Icon Helper
  const renderSortIcon = (field: keyof Item | 'categoryName' | 'locationName') => {
    if (sortField === field) {
      return <ArrowUpDown className={`ml-2 h-4 w-4 inline-block ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />;
    }
    // Show dimmed icon on hoverable headers
    return <ArrowUpDown className="ml-2 h-4 w-4 inline-block opacity-0 group-hover:opacity-30 transition-opacity" />;
  };


  // --- Render Logic ---
  if (!currentAssociation) {
    // No Association Message (looks good)
    return (
      <div className="container mx-auto p-4 md:p-6"> {/* Added container */}
        <Card>
          <CardHeader>
            <CardTitle>No Association Selected</CardTitle>
            <CardDescription>You need to select or create an association first.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">To get started with inventory management, please create or join an association.</p>
            <Button className="mt-2" asChild>
              <a href="/association">Manage Associations</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isDataLoading) {
    // Improved Loading Skeleton
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6"> {/* Added container */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <Skeleton className="h-10 w-full md:w-72" />
          <div className="flex gap-2 w-full md:w-auto">
            <Skeleton className="h-10 w-full md:w-[180px]" />
            <Skeleton className="h-10 w-full md:w-[180px]" />
            <Skeleton className="h-10 w-full md:w-[150px]" />
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {Array(7).fill(0).map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-20" /></TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    {Array(7).fill(0).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Content Render
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6"> {/* Added container */}
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            {items.length} item{items.length !== 1 ? 's' : ''} found {searchQuery || filterCategory !== 'all' || filterLocation !== 'all' || filterCondition !== 'all' ? ' (filtered)' : ''}
          </p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} disabled={categories.length === 0 || locations.length === 0}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Item
        </Button>
         {categories.length === 0 || locations.length === 0 && (
            <p className="text-sm text-destructive text-right md:text-left">
                <AlertCircle className="inline h-4 w-4 mr-1"/>
                Create categories and locations before adding items.
            </p>
         )}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="codes">QR/Barcode Generation</TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-6">

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Search Input */}
        <div className="w-full md:w-72">
          <SearchBarWithScanner
            onSearch={setSearchQuery}
            onScanResult={(result) => {
              // Handle scanned code - could be item code, barcode, or serial number
              setSearchQuery(result);
            }}
            placeholder="Search name, desc, serial, or scan code..."
            className="w-full"
            showScanner={true}
          />
        </div>

        {/* Filter Selects */}
        <div className="flex gap-2 w-full md:w-auto flex-wrap">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(location => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCondition} onValueChange={setFilterCondition}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                    className="cursor-pointer hover:bg-muted/50 group hidden md:table-cell" // Hide on small screens
                    onClick={() => handleSort('barcode')}
                >
                  Barcode {renderSortIcon('barcode')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 group"
                  onClick={() => handleSort('name')}
                >
                  Name {renderSortIcon('name')}
                </TableHead>

                <TableHead
                  className="cursor-pointer hover:bg-muted/50 group hidden md:table-cell" // Hide on small screens
                  onClick={() => handleSort('categoryName')}
                >
                  Category {renderSortIcon('categoryName')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 group hidden lg:table-cell" // Hide on medium screens
                  onClick={() => handleSort('locationName')}
                >
                  Location {renderSortIcon('locationName')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50 group"
                  onClick={() => handleSort('condition')}
                >
                  Condition {renderSortIcon('condition')}
                </TableHead>
                 <TableHead
                  className="cursor-pointer hover:bg-muted/50 group hidden sm:table-cell" // Hide on smallest screens
                  onClick={() => handleSort('quantity')}
                >
                  Qty {renderSortIcon('quantity')}
                </TableHead>
                 <TableHead
                  className="cursor-pointer hover:bg-muted/50 group hidden lg:table-cell" // Hide on medium screens
                  onClick={() => handleSort('purchase_price')}
                >
                  Price {renderSortIcon('purchase_price')}
                </TableHead>
                 <TableHead
                  className="cursor-pointer hover:bg-muted/50 group hidden xl:table-cell" // Hide on large screens
                  onClick={() => handleSort('warranty_expiration')}
                >
                  Warranty {renderSortIcon('warranty_expiration')}
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16"> {/* Increased colspan */}
                    <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No items found</p>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery || filterCategory !== 'all' || filterLocation !== 'all' || filterCondition !== 'all'
                        ? "Try adjusting your search or filters."
                        : "Add your first inventory item to get started."}
                    </p>
                     {!searchQuery && filterCategory === 'all' && filterLocation === 'all' && filterCondition === 'all' && (
                       <Button size="sm" className="mt-4" onClick={() => { resetForm(); setIsAddDialogOpen(true); }} disabled={categories.length === 0 || locations.length === 0}>
                         Add Item
                       </Button>
                     )}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const warrantyStatus = formatWarrantyStatus(item.warranty_expiration);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-mono text-sm">{item.barcode || 'No code'}</span>
                          <span className="text-xs text-muted-foreground md:hidden"> {/* Show category/location on small screens here */}
                            {getCategoryName(item.category_id)} / {getLocationName(item.location_id)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <Link 
                            to={`/inventory/items/${item.id}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {item.name}
                          </Link>
                          <span className="text-xs text-muted-foreground md:hidden"> {/* Show category/location on small screens here */}
                            {getCategoryName(item.category_id)} / {getLocationName(item.location_id)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{getCategoryName(item.category_id)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{getLocationName(item.location_id)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          item.condition === 'new' ? 'default' :
                          item.condition === 'good' ? 'secondary' :
                          item.condition === 'fair' ? 'outline' :
                          item.condition === 'poor' || item.condition === 'damaged' || item.condition === 'retired' ? 'destructive' :
                          'outline'
                        } className="capitalize">
                          {item.condition}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {item.is_consumable ? (
                          <Badge variant={item.quantity !== null && item.minimum_quantity !== null && item.quantity <= item.minimum_quantity ? 'destructive' : 'secondary'}>
                            {item.quantity ?? 0}
                            {item.minimum_quantity !== null && ` (min ${item.minimum_quantity})`}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Asset</Badge>
                        )}
                      </TableCell>
                       <TableCell className="hidden lg:table-cell">{formatCurrency(item.purchase_price)}</TableCell>
                       <TableCell className="hidden xl:table-cell">
                         <Badge variant={warrantyStatus.variant} className="text-xs">
                           {warrantyStatus.icon}
                           <span className="ml-1">{warrantyStatus.text}</span>
                         </Badge>
                       </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1"> {/* Reduced gap */}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </TabsContent>

        {/* QR/Barcode Generation Tab */}
        <TabsContent value="codes" className="space-y-6">
          <BulkCodeGenerator />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialogs */}
      {/* Using ScrollArea within DialogContent for long forms */}
      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl"> {/* Increased max width */}
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Fill in the details for the new inventory item. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-1"> {/* Added ScrollArea */}
            <div className="grid gap-6 py-4 pr-4"> {/* Increased gap, added padding-right */}
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="purchase">Purchase Info</TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid w-full items-center gap-1.5 md:col-span-2"> {/* Name spans full width */}
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})} required>
                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                        <SelectContent>
                          {categories.map(category => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="location">Location *</Label>
                      <Select value={formData.location_id} onValueChange={(value) => setFormData({...formData, location_id: value})} required>
                        <SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger>
                        <SelectContent>
                          {locations.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                     <div className="grid w-full items-center gap-1.5 md:col-span-2"> {/* Description spans full width */}
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Optional: Add a brief description..." />
                    </div>
                  </div>
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="serial_number">Serial Number</Label>
                      <Input id="serial_number" value={formData.serial_number} onChange={(e) => setFormData({...formData, serial_number: e.target.value})} />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="barcode">Barcode</Label>
                      <Input id="barcode" value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="condition">Condition *</Label>
                      <Select value={formData.condition} onValueChange={(value: string) => setFormData({...formData, condition: value})} required>
                        <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                          <SelectItem value="damaged">Damaged</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                     <div className="grid w-full items-center gap-1.5 md:col-span-2"> {/* Item Type spans full width */}
                      <Label>Item Type</Label>
                      <RadioGroup
                        value={formData.is_consumable ? "consumable" : "asset"}
                        onValueChange={(value) => setFormData({ ...formData, is_consumable: value === "consumable", quantity: value === "consumable" ? (formData.quantity || 1) : 1 })}
                        className="flex space-x-4 pt-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="asset" id="asset" />
                          <Label htmlFor="asset">Asset (Unique)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="consumable" id="consumable" />
                          <Label htmlFor="consumable">Consumable (Quantity)</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {formData.is_consumable && (
                      <>
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="quantity">Quantity *</Label>
                          <Input id="quantity" type="number" min="0" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} required />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="minimum_quantity">Minimum Quantity Alert</Label>
                          <Input id="minimum_quantity" type="number" min="0" value={formData.minimum_quantity || ''} onChange={(e) => setFormData({...formData, minimum_quantity: e.target.value ? parseInt(e.target.value) : null})} placeholder="Optional threshold"/>
                        </div>
                      </>
                    )}
                     <div className="grid w-full items-center gap-1.5 md:col-span-2"> {/* Notes spans full width */}
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Optional: Add internal notes..." />
                    </div>
                  </div>
                </TabsContent>

                {/* Purchase Info Tab */}
                <TabsContent value="purchase" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="purchase_date">Purchase Date</Label>
                      <Input id="purchase_date" type="date" value={formData.purchase_date} onChange={(e) => setFormData({...formData, purchase_date: e.target.value})} />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="purchase_price">Purchase Price</Label>
                      <div className="relative">
                         <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                         <Input id="purchase_price" type="number" step="0.01" min="0" value={formData.purchase_price || ''} onChange={(e) => setFormData({...formData, purchase_price: e.target.value ? parseFloat(e.target.value) : null})} className="pl-8" placeholder="0.00"/>
                      </div>
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="warranty_expiration">Warranty Expiration</Label>
                      <Input id="warranty_expiration" type="date" value={formData.warranty_expiration} onChange={(e) => setFormData({...formData, warranty_expiration: e.target.value})} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea> {/* End ScrollArea */}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleAddItem} disabled={!formData.name || !formData.category_id || !formData.location_id}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog (Structure mirrors Add Dialog) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Item: {currentItem?.name}</DialogTitle> {/* Show item name */}
            <DialogDescription>
              Update details for this inventory item. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
           <ScrollArea className="max-h-[70vh] p-1"> {/* Added ScrollArea */}
             <div className="grid gap-6 py-4 pr-4"> {/* Increased gap, added padding-right */}
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="purchase">Purchase Info</TabsTrigger>
                </TabsList>

                {/* Basic Info Tab - Edit */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid w-full items-center gap-1.5 md:col-span-2">
                      <Label htmlFor="edit-name">Name *</Label>
                      <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="edit-category">Category *</Label>
                      <Select value={formData.category_id} onValueChange={(value) => setFormData({...formData, category_id: value})} required>
                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                        <SelectContent>
                          {categories.map(category => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="edit-location">Location *</Label>
                      <Select value={formData.location_id} onValueChange={(value) => setFormData({...formData, location_id: value})} required>
                        <SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger>
                        <SelectContent>
                          {locations.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                     <div className="grid w-full items-center gap-1.5 md:col-span-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea id="edit-description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Optional: Add a brief description..." />
                    </div>
                  </div>
                </TabsContent>

                {/* Details Tab - Edit */}
                <TabsContent value="details" className="space-y-4 mt-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="edit-serial_number">Serial Number</Label>
                      <Input id="edit-serial_number" value={formData.serial_number} onChange={(e) => setFormData({...formData, serial_number: e.target.value})} />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="edit-barcode">Barcode</Label>
                      <Input id="edit-barcode" value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="edit-condition">Condition *</Label>
                      <Select value={formData.condition} onValueChange={(value: string) => setFormData({...formData, condition: value})} required>
                        <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                          <SelectItem value="damaged">Damaged</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                     <div className="grid w-full items-center gap-1.5 md:col-span-2">
                      <Label>Item Type</Label>
                      <RadioGroup
                        value={formData.is_consumable ? "consumable" : "asset"}
                        onValueChange={(value) => setFormData({ ...formData, is_consumable: value === "consumable", quantity: value === "consumable" ? (formData.quantity || 1) : 1 })}
                        className="flex space-x-4 pt-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="asset" id="edit-asset" />
                          <Label htmlFor="edit-asset">Asset (Unique)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="consumable" id="edit-consumable" />
                          <Label htmlFor="edit-consumable">Consumable (Quantity)</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {formData.is_consumable && (
                      <>
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="edit-quantity">Quantity *</Label>
                          <Input id="edit-quantity" type="number" min="0" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} required />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="edit-minimum_quantity">Minimum Quantity Alert</Label>
                          <Input id="edit-minimum_quantity" type="number" min="0" value={formData.minimum_quantity || ''} onChange={(e) => setFormData({...formData, minimum_quantity: e.target.value ? parseInt(e.target.value) : null})} placeholder="Optional threshold"/>
                        </div>
                      </>
                    )}
                     <div className="grid w-full items-center gap-1.5 md:col-span-2">
                      <Label htmlFor="edit-notes">Notes</Label>
                      <Textarea id="edit-notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Optional: Add internal notes..." />
                    </div>
                  </div>
                </TabsContent>

                {/* Purchase Info Tab - Edit */}
                <TabsContent value="purchase" className="space-y-4 mt-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="edit-purchase_date">Purchase Date</Label>
                      <Input id="edit-purchase_date" type="date" value={formData.purchase_date} onChange={(e) => setFormData({...formData, purchase_date: e.target.value})} />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="edit-purchase_price">Purchase Price</Label>
                       <div className="relative">
                         <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                         <Input id="edit-purchase_price" type="number" step="0.01" min="0" value={formData.purchase_price || ''} onChange={(e) => setFormData({...formData, purchase_price: e.target.value ? parseFloat(e.target.value) : null})} className="pl-8" placeholder="0.00"/>
                      </div>
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="edit-warranty_expiration">Warranty Expiration</Label>
                      <Input id="edit-warranty_expiration" type="date" value={formData.warranty_expiration} onChange={(e) => setFormData({...formData, warranty_expiration: e.target.value})} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea> {/* End ScrollArea */}
          <DialogFooter className="sm:justify-between"> {/* Adjust footer layout */}
            {/* Delete Button added on the left */}
            <Button
              variant="destructive"
              onClick={() => {
                setIsEditDialogOpen(false); // Close edit dialog
                setIsDeleteDialogOpen(true); // Open delete confirmation dialog
              }}
            >
              Delete Item
            </Button>
            {/* Existing Cancel/Save buttons on the right */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleEditItem} disabled={!formData.name || !formData.category_id || !formData.location_id}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog (Remains the same, now triggered from Edit Dialog) */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {currentItem && (
            <div className="py-4">
              <p className="font-semibold">{currentItem.name}</p>
              <p className="text-sm text-muted-foreground">
                {getCategoryName(currentItem.category_id)} / {getLocationName(currentItem.location_id)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteItem}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryItems;
