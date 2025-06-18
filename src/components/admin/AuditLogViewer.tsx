'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  user_id: string;
  changes: any;
  created_at: string;
  ip_address: string | null;
  user_name?: string; // Joined from profiles
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 10;
  const { toast } = useToast();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Count total logs for pagination
      const { count, error: countError } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      setTotalPages(Math.ceil((count || 0) / perPage));

      // Get logs with user information - fixed the join query
      const { data: auditLogsData, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * perPage, page * perPage - 1);

      if (logsError) throw logsError;

      // Separately fetch user profiles for each log to avoid the relationship error
      const formattedLogs: AuditLog[] = await Promise.all(
        auditLogsData.map(async (log) => {
          let userName = 'Unknown User';

          // Get user profile info if user_id exists
          if (log.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', log.user_id)
              .single();

            if (profileData) {
              userName =
                profileData.name || profileData.email || 'Unknown User';
            }
          }

          return {
            ...log,
            user_name: userName,
          };
        }),
      );

      setLogs(formattedLogs);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user_name &&
        log.user_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      log.entity_id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
  };

  // Helper to format the changes JSON
  const formatChanges = (changes: any) => {
    if (!changes) return 'No changes recorded';

    try {
      return Object.entries(changes)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(', ');
    } catch {
      return JSON.stringify(changes);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search audit logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => fetchLogs()}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex justify-between p-2 animate-pulse">
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>{log.user_name}</TableCell>
                      <TableCell className="capitalize">
                        {log.action.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="capitalize">
                        {log.entity.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        <span title={formatChanges(log.changes)}>
                          {formatChanges(log.changes)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
