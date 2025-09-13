import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Paper, Typography } from '@mui/material';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/button';
import {
  conventionSchema,
  ConventionFormData,
} from '@/lib/validations/schemas';

interface ConventionFormProps {
  initialData?: Partial<ConventionFormData>;
  onSubmit: (data: ConventionFormData) => Promise<void>;
  loading?: boolean;
  title?: string;
}

export const ConventionForm: React.FC<ConventionFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  title = 'Convention Details',
}) => {
  const { control, handleSubmit } = useForm<ConventionFormData>({
    resolver: zodResolver(conventionSchema),
    defaultValues: initialData,
  });

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant='h6' gutterBottom>
        {title}
      </Typography>

      <Box component='form' onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            name='name'
            control={control}
            label='Convention Name'
            required
          />

          <TextField
            name='description'
            control={control}
            label='Description'
            multiline
            rows={3}
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                name='startDate'
                control={control}
                label='Start Date'
                type='date'
                required
              />
            </Box>

            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <TextField
                name='endDate'
                control={control}
                label='End Date'
                type='date'
                required
              />
            </Box>
          </Box>

          <TextField
            name='location'
            control={control}
            label='Location'
            placeholder='Convention center, venue, etc.'
          />

          <Box display='flex' gap={2} justifyContent='flex-end'>
            <Button type='submit' variant='contained' loading={loading}>
              {initialData ? 'Update Convention' : 'Create Convention'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default ConventionForm;
