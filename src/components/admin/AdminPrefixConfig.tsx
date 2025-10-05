import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import AddPrefixDialog from './AddPrefixDialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Hash,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { CodePrefix } from '@/utils/qr-barcode-utils';

const AdminPrefixConfig: React.FC = () => {
  const { toast } = useToast();
  const { currentAssociation } = useAssociation();
  
  const [prefixes, setPrefixes] = useState<CodePrefix[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrefix, setEditingPrefix] = useState<CodePrefix | null>(null);

  useEffect(() => {
    if (currentAssociation) {
      fetchPrefixes();
      fetchCategories();
    }
  }, [currentAssociation]);

  const fetchPrefixes = async () => {
    try {
      const { data, error } = await supabase
        .from('code_prefixes')
        .select(`
          *,
          categories:category_id (name)
        `)
        .eq('association_id', currentAssociation?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(item => ({
        ...item,
        categoryName: item.categories?.name
      })) || [];

      setPrefixes(formattedData);
    } catch (error: any) {
      console.error('Error fetching prefixes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch code prefixes.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('association_id', currentAssociation?.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDialogSuccess = () => {
    fetchPrefixes();
  };

  const handleEdit = (prefix: CodePrefix) => {
    setEditingPrefix(prefix);
    setIsDialogOpen(true);
  };

  const handleDelete = async (prefix: CodePrefix) => {
    if (!confirm(`Are you sure you want to delete the prefix "${prefix.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('code_prefixes')
        .delete()
        .eq('id', prefix.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Code prefix deleted successfully.'
      });

      fetchPrefixes();
    } catch (error: any) {
      console.error('Error deleting prefix:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete code prefix.',
        variant: 'destructive'
      });
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingPrefix(null);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Code Prefix Configuration</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Code Prefix Configuration
        </CardTitle>
        <CardDescription>
          Manage prefixes for auto-generating QR codes and barcodes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Prefix Button */}
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Prefix
        </Button>

        {/* Add/Edit Prefix Dialog */}
        <AddPrefixDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          onSuccess={handleDialogSuccess}
          editingPrefix={editingPrefix}
        />

        {/* Prefixes Table */}
        {prefixes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No code prefixes configured yet.</p>
            <p className="text-sm">Create your first prefix to start generating codes.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prefixes.map((prefix) => (
                <TableRow key={prefix.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{prefix.name}</div>
                      {prefix.description && (
                        <div className="text-sm text-muted-foreground">
                          {prefix.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {prefix.prefix}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {prefix.categoryName || (
                      <span className="text-muted-foreground">No category</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {prefix.isActive ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-red-600">Inactive</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(prefix.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(prefix)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(prefix)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Usage Instructions */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            How Code Prefixes Work
          </h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Each prefix generates unique codes in the format: PREFIX-TIMESTAMP-RANDOM</li>
            <li>• Codes are automatically generated when creating inventory items</li>
            <li>• Prefixes can be linked to specific categories for organization</li>
            <li>• Inactive prefixes won't be used for new code generation</li>
            <li>• Example: ELEC-1A2B3C4D-XY7Z9K generates codes like ELEC-1A2B3C4D-XY7Z9K</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPrefixConfig;
