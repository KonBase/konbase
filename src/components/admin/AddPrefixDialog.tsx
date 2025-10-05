import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { Plus, Hash, AlertCircle } from 'lucide-react';

interface AddPrefixDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingPrefix?: {
    id: string;
    name: string;
    prefix: string;
    description?: string;
    categoryId?: string;
    isActive: boolean;
  } | null;
}

const AddPrefixDialog: React.FC<AddPrefixDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingPrefix
}) => {
  const { toast } = useToast();
  const { currentAssociation } = useAssociation();
  
  const [formData, setFormData] = useState({
    name: '',
    prefix: '',
    description: '',
    categoryId: 'none',
    isActive: true
  });
  
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (editingPrefix) {
        setFormData({
          name: editingPrefix.name,
          prefix: editingPrefix.prefix,
          description: editingPrefix.description || '',
          categoryId: editingPrefix.categoryId || 'none',
          isActive: editingPrefix.isActive
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingPrefix]);

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
      toast({
        title: 'Error',
        description: 'Failed to fetch categories.',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      prefix: '',
      description: '',
      categoryId: 'none',
      isActive: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.prefix.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name and prefix are required.',
        variant: 'destructive'
      });
      return;
    }

    // Validate prefix format (alphanumeric, 2-10 characters)
    if (!/^[A-Z0-9]{2,10}$/.test(formData.prefix)) {
      toast({
        title: 'Invalid Prefix',
        description: 'Prefix must be 2-10 uppercase letters/numbers only.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const prefixData = {
        name: formData.name.trim(),
        prefix: formData.prefix.trim().toUpperCase(),
        description: formData.description.trim() || null,
        category_id: formData.categoryId === 'none' ? null : formData.categoryId,
        is_active: formData.isActive,
        association_id: currentAssociation?.id,
        updated_at: new Date().toISOString()
      };

      if (editingPrefix) {
        // Update existing prefix
        const { error } = await supabase
          .from('code_prefixes')
          .update(prefixData)
          .eq('id', editingPrefix.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Code prefix updated successfully.'
        });
      } else {
        // Create new prefix
        const { error } = await supabase
          .from('code_prefixes')
          .insert([prefixData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Code prefix created successfully.'
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving prefix:', error);
      
      if (error.code === '23505') { // Unique constraint violation
        toast({
          title: 'Duplicate Prefix',
          description: 'This prefix is already in use.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save code prefix.',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            {editingPrefix ? 'Edit Code Prefix' : 'Add Code Prefix'}
          </DialogTitle>
          <DialogDescription>
            Configure a prefix for auto-generating unique QR codes and barcodes
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Electronics, Furniture"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prefix">Prefix *</Label>
            <Input
              id="prefix"
              value={formData.prefix}
              onChange={(e) => setFormData({...formData, prefix: e.target.value.toUpperCase()})}
              placeholder="e.g., ELEC, FURN"
              maxLength={10}
              required
            />
            <p className="text-xs text-muted-foreground">
              2-10 uppercase letters/numbers only
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({...formData, categoryId: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          {/* Usage Example */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Example Generated Code:</span>
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {formData.prefix || 'PREFIX'}-{Date.now().toString(36).toUpperCase()}-ABC123
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Format: PREFIX-TIMESTAMP-RANDOM
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingPrefix ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {editingPrefix ? 'Update Prefix' : 'Create Prefix'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPrefixDialog;
