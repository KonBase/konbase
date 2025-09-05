import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Paper, Typography } from '@mui/material';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/button';
import { associationSchema, AssociationFormData } from '@/lib/validations/schemas';

interface AssociationFormProps {
  initialData?: Partial<AssociationFormData>;
  onSubmit: (data: AssociationFormData) => Promise<void>;
  loading?: boolean;
  title?: string;
}

export const AssociationForm: React.FC<AssociationFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  title = 'Association Details',
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AssociationFormData>({
    resolver: zodResolver(associationSchema),
    defaultValues: initialData,
  });

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
            label="Association Name"
            required
          />
          
          <TextField
            name="description"
            control={control}
            label="Description"
            multiline
            rows={3}
          />
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                name="website"
                control={control}
                label="Website"
                placeholder="https://example.com"
              />
            </Box>
            
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                name="email"
                control={control}
                label="Contact Email"
                type="email"
              />
            </Box>
          </Box>
          
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <TextField
              name="phone"
              control={control}
              label="Phone Number"
            />
          </Box>
          
          <TextField
            name="address"
            control={control}
            label="Address"
            multiline
            rows={2}
          />
          
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              loading={loading}
            >
              {initialData ? 'Update Association' : 'Create Association'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default AssociationForm;
