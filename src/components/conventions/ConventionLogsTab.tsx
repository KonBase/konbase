'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FilterIcon,
  DownloadIcon,
  SearchIcon,
  History,
  Loader2,
  User,
  Edit,
  Trash,
  Plus,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/hooks/use-toast';
import { ConventionLog } from '@/types/convention';
import { ErrorType } from '@/types/common';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { exportToCSV } from '@/utils/csvExport';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConventionLogsTabProps {
  conventionId: string;
}

const ConventionLogsTab: React.FC<ConventionLogsTabProps> = ({
  conventionId,
}) => {
  const { currentAssociation } = useAssociation();
  const [logs, setLogs] = useState<ConventionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchLogs = async () => {
    if (!conventionId || !currentAssociation) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('convention_logs')
        .select(
          `
          *,
          users:user_id(id, email, display_name)
        `,
        )
        .eq('convention_id', conventionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      const err = error as ErrorType;
      console.error('Error loading logs:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        details: err && typeof err === 'object' && 'details' in err ? err.details : undefined,
        code: err && typeof err === 'object' && 'code' in err ? err.code : undefined
      });
      
      let errorMessage = 'An unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message);
      }
      
      toast({
        title: 'Error loading logs',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [conventionId, currentAssociation]);

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-1 h-3 w-3" /> Create
          </Badge>
        );
      case 'update':
        return (
          <Badge
            variant="outline"
            className="border-blue-500 text-blue-700 dark:border-blue-400 dark:text-blue-300"
          >
            <Edit className="mr-1 h-3 w-3" /> Update
          </Badge>
        );
      case 'delete':
        return (
          <Badge variant="destructive">
            <Trash className="mr-1 h-3 w-3" /> Delete
          </Badge>
        );
      case 'issue':
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          >
            <Edit className="mr-1 h-3 w-3" /> Issue
          </Badge>
        );
      case 'return':
        return (
          <Badge
            variant="secondary"
            className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
          >
            <Edit className="mr-1 h-3 w-3" /> Return
          </Badge>
        );
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const getEntityBadge = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'equipment':
        return <Badge variant="outline">Equipment</Badge>;
      case 'consumable':
        return <Badge variant="outline">Consumable</Badge>;
      case 'requirement':
        return <Badge variant="outline">Requirement</Badge>;
      case 'location':
        return <Badge variant="outline">Location</Badge>;
      case 'convention':
        return <Badge variant="outline">Convention</Badge>;
      case 'attendee':
        return <Badge variant="outline">Attendee</Badge>;
      default:
        return <Badge variant="outline">{entityType}</Badge>;
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.entity_type.toLowerCase().includes(searchLower) ||
      log.users?.display_name?.toLowerCase().includes(searchLower) ||
      log.users?.email?.toLowerCase().includes(searchLower) ||
      (log.details &&
        JSON.stringify(log.details).toLowerCase().includes(searchLower))
    );
  });

  const exportLogs = () => {
    try {
      const data = filteredLogs.map((log) => ({
        Date: format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        User: log.users?.display_name || log.users?.email || log.user_id,
        Action: log.action,
        EntityType: log.entity_type,
        Details: JSON.stringify(log.details || {}),
      }));

      exportToCSV(
        data,
        `convention-logs-${conventionId}-${format(new Date(), 'yyyy-MM-dd')}`,
      );

      toast({
        title: 'Logs exported',
        description: 'Convention logs have been exported to CSV successfully',
      });
    } catch (error) {
      const err = error as ErrorType;
      console.error('Error exporting logs:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        details: err && typeof err === 'object' && 'details' in err ? err.details : undefined,
        code: err && typeof err === 'object' && 'code' in err ? err.code : undefined
      });
      
      let errorMessage = 'An unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message);
      }
      
      toast({
        title: 'Error exporting logs',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header with Export Button */}
        <div className="flex justify-between items-center">
          <CardTitle>Activity Logs</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              <FilterIcon className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button
              variant="outline"
              onClick={exportLogs}
              disabled={filteredLogs.length === 0}
            >
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Logs Table Card */}
        <Card>
          <CardHeader>
            <CardTitle>Convention Activity Log</CardTitle>
            <CardDescription>
              History of all recorded actions for this convention.
            </CardDescription>
            <div className="relative mt-4">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search logs (by user, action, type, details)..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search activity logs"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">
                  Loading logs...
                </span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-10">
                <History className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Logs Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchTerm
                    ? 'No logs match your search criteria.'
                    : 'No activity has been recorded for this convention yet.'}
                </p>
                {searchTerm && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Timestamp</TableHead>
                      <TableHead className="w-[150px]">User</TableHead>
                      <TableHead className="w-[100px]">Action</TableHead>
                      <TableHead className="w-[120px]">Entity Type</TableHead>
                      <TableHead>Details / Changes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                {formatDistanceToNow(new Date(log.created_at), {
                                  addSuffix: true,
                                })}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {format(new Date(log.created_at), 'PPP p')}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="font-medium flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {log.users?.display_name || log.users?.email || (
                            <span className="italic text-muted-foreground">
                              System
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>{getEntityBadge(log.entity_type)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {log.details ? (
                            <pre className="whitespace-pre-wrap break-all font-mono text-xs bg-muted/50 p-1 rounded max-w-md">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default ConventionLogsTab;
