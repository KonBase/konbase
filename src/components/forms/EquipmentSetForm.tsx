import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Paper, Typography, Button as MuiButton, IconButton, Divider } from '@mui/material';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { equipmentSetSchema, EquipmentSetFormData } from '@/lib/validations/schemas';
import { Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

interface EquipmentSetFormProps {
  initialData?: Partial<EquipmentSetFormData>;
  onSubmit: (data: EquipmentSetFormData) => Promise<void>;
  loading?: boolean;
  title?: string;
}

export const EquipmentSetForm: React.FC<EquipmentSetFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  title = 'Equipment Set Details',
}) => {
  const { data: session } = useSession();
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({});

  const { data: items = [] } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const response = await fetch('/api/inventory/items', {
        headers: {
          'x-association-id': session?.user?.associations?.[0]?.association?.id || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch items');
      const result = await response.json();
      return result.data;
    },
    enabled: !!session,
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<EquipmentSetFormData>({
    resolver: zodResolver(equipmentSetSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      items: initialData?.items || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const handleAddItem = () => {
    append({ itemId: '', quantity: 1 });
  };

  const handleRemoveItem = (index: number) => {
    remove(index);
  };

  const handleItemSelect = (index: number, itemId: string) => {
    const currentItems = watch('items');
    currentItems[index].itemId = itemId;
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const currentItems = watch('items');
    currentItems[index].quantity = quantity;
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            name="name"
            control={control}
            label="Equipment Set Name"
            required
          />
          
          <TextField
            name="description"
            control={control}
            label="Description"
            multiline
            rows={3}
          />

          <Divider sx={{ my: 2 }} />

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Items in Set</Typography>
            <MuiButton
              variant="outlined"
              startIcon={<Plus size={16} />}
              onClick={handleAddItem}
              size="small"
            >
              Add Item
            </MuiButton>
          </Box>

          {fields.map((field, index) => (
            <Box key={field.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Box sx={{ flex: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Select Item</InputLabel>
                  <Select
                    value={watch(`items.${index}.itemId`) || ''}
                    onChange={(e) => handleItemSelect(index, e.target.value)}
                    label="Select Item"
                  >
                    {items.map((item: any) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ width: 120 }}>
                <TextField
                  name={`items.${index}.quantity`}
                  control={control}
                  label="Quantity"
                  type="number"
                  required
                  inputProps={{ min: 1 }}
                />
              </Box>

              <IconButton
                color="error"
                onClick={() => handleRemoveItem(index)}
                size="small"
              >
                <Trash2 size={16} />
              </IconButton>
            </Box>
          ))}

          {fields.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <Typography>No items added yet. Click "Add Item" to get started.</Typography>
            </Box>
          )}
          
          <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
            <Button
              type="submit"
              variant="contained"
              loading={loading}
            >
              {initialData ? 'Update Equipment Set' : 'Create Equipment Set'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default EquipmentSetForm;
