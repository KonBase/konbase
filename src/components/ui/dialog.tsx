import React from 'react';
import {
  Dialog as MuiDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogProps as MuiDialogProps,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import { X } from 'lucide-react';

interface DialogProps extends Omit<MuiDialogProps, 'title'> {
  title?: string;
  onClose: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  title,
  onClose,
  actions,
  children,
  maxWidth = 'sm',
  fullWidth = true,
  ...props
}) => {
  return (
    <MuiDialog
      {...props}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 24,
        },
      }}
    >
      {title && (
        <DialogTitle>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
          >
            <Typography variant='h6' component='div'>
              {title}
            </Typography>
            <IconButton
              aria-label='close'
              onClick={onClose}
              sx={{
                color: theme => theme.palette.grey[500],
              }}
            >
              <X size={24} />
            </IconButton>
          </Box>
        </DialogTitle>
      )}

      <DialogContent dividers>{children}</DialogContent>

      {actions && <DialogActions sx={{ p: 2 }}>{actions}</DialogActions>}
    </MuiDialog>
  );
};

export default Dialog;
