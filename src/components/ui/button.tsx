import React from 'react';
import { 
  Button as MuiButton, 
  ButtonProps as MuiButtonProps,
  CircularProgress 
} from '@mui/material';

interface ButtonProps extends Omit<MuiButtonProps, 'size'> {
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  loading = false,
  disabled,
  size = 'medium',
  ...props
}) => {
  return (
    <MuiButton
      {...props}
      disabled={disabled || loading}
      size={size}
      startIcon={loading ? <CircularProgress size={16} /> : props.startIcon}
    >
      {children}
    </MuiButton>
  );
};

export default Button;
