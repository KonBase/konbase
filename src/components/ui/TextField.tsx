import React from 'react';
import {
  TextField as MuiTextField,
  TextFieldProps as MuiTextFieldProps,
  FormControl,
  FormLabel,
  FormHelperText,
} from '@mui/material';
import { useController, Control, FieldPath, FieldValues } from 'react-hook-form';

interface TextFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<MuiTextFieldProps, 'name' | 'value' | 'onChange'> {
  name: TName;
  control: Control<TFieldValues>;
  label: string;
  required?: boolean;
  rules?: any;
}

export function TextField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  required = false,
  rules = {},
  ...props
}: TextFieldProps<TFieldValues, TName>) {
  const {
    field,
    fieldState: { error }
  } = useController({
    name,
    control,
    rules: {
      required: required ? `${label} is required` : undefined,
      ...rules,
    },
  });

  return (
    <MuiTextField
      {...field}
      {...props}
      label={label}
      error={!!error}
      helperText={error?.message || props.helperText}
      required={required}
      fullWidth
      variant="outlined"
      margin="normal"
    />
  );
}

export default TextField;
