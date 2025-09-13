import React from 'react';
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Checkbox,
  Skeleton,
  Typography,
  Box,
} from '@mui/material';
import { TableColumn } from '@/types';

interface DataTableProps<T = Record<string, unknown>> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: (selected: boolean) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  selectable = false,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  sortBy,
  sortOrder = 'asc',
  onSort,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const isAllSelected =
    selectable && data.length > 0 && selectedRows.length === data.length;
  const isIndeterminate =
    selectable && selectedRows.length > 0 && selectedRows.length < data.length;

  if (loading) {
    return (
      <TableContainer component={Paper}>
        <MuiTable>
          <TableHead>
            <TableRow>
              {selectable && <TableCell padding='checkbox' />}
              {columns.map(column => (
                <TableCell key={String(column.id)}>
                  <Skeleton width='80%' />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                {selectable && <TableCell padding='checkbox' />}
                {columns.map(column => (
                  <TableCell key={String(column.id)}>
                    <Skeleton />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </MuiTable>
      </TableContainer>
    );
  }

  return (
    <TableContainer component={Paper}>
      <MuiTable>
        <TableHead>
          <TableRow>
            {selectable && (
              <TableCell padding='checkbox'>
                <Checkbox
                  indeterminate={isIndeterminate}
                  checked={isAllSelected}
                  onChange={e => onSelectAll?.(e.target.checked)}
                  inputProps={{ 'aria-label': 'select all' }}
                />
              </TableCell>
            )}
            {columns.map(column => (
              <TableCell
                key={String(column.id)}
                align={column.align || 'left'}
                style={{ width: column.width }}
              >
                {column.sortable && onSort ? (
                  <TableSortLabel
                    active={sortBy === column.id}
                    direction={sortBy === column.id ? sortOrder : 'asc'}
                    onClick={() => onSort(String(column.id))}
                  >
                    {column.label}
                  </TableSortLabel>
                ) : (
                  column.label
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectable ? 1 : 0)}
                align='center'
              >
                <Box py={4}>
                  <Typography variant='body2' color='text.secondary'>
                    {emptyMessage}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            data.map(row => (
              <TableRow key={row.id} hover>
                {selectable && (
                  <TableCell padding='checkbox'>
                    <Checkbox
                      checked={selectedRows.includes(row.id)}
                      onChange={() => onSelectRow?.(row.id)}
                      inputProps={{ 'aria-label': `select row ${row.id}` }}
                    />
                  </TableCell>
                )}
                {columns.map(column => {
                  const value = row[column.id as keyof typeof row];
                  const displayValue = column.format
                    ? column.format(value, row)
                    : String(value || '');

                  return (
                    <TableCell
                      key={String(column.id)}
                      align={column.align || 'left'}
                    >
                      {displayValue}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
}

export default DataTable;
