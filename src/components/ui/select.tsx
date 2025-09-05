import React from 'react';
import {
  Select as MuiSelect,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  SelectProps as MuiSelectProps,
} from '@mui/material';
import { useController, Control, FieldPath, FieldValues } from 'react-hook-form';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<MuiSelectProps, 'name' | 'value' | 'onChange'> {
  name: TName;
  control: Control<TFieldValues>;
  label: string;
  options: SelectOption[];
  required?: boolean;
  rules?: any;
}

export function Select<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  label,
  options,
  required = false,
  rules = {},
  ...props
}: SelectProps<TFieldValues, TName>) {
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
    <FormControl fullWidth margin="normal" error={!!error}>
      <InputLabel required={required}>{label}</InputLabel>
      <MuiSelect
        {...field}
        {...props}
        label={label}
        displayEmpty={!required}
      >
        {!required && (
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </MenuItem>
        ))}
      </MuiSelect>
      {error && <FormHelperText>{error.message}</FormHelperText>}
    </FormControl>
  );
}

export default Select;
