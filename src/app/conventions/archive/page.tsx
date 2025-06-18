'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Archive,
  CalendarDays,
  MapPin,
  Users,
  ArrowLeft,
  Search,
  Download,
  Filter,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AuthGuard } from '@/components/guards/AuthGuard';

export default function ConventionArchivePage() {
  const { toast } = useToast();
  const [archivedConventions, setArchivedConventions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchArchivedConventions();
  }, []);

  const fetchArchivedConventions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('conventions')
        .select('*')
        .in('status', ['completed', 'archived'])
        .order('end_date', { ascending: false });

      if (error) throw error;

      setArchivedConventions(data || []);
    } catch (error: any) {
      console.error('Error loading archived conventions:', error);
      toast({
        title: 'Error loading archived conventions',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConventions = archivedConventions.filter((convention) => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();
    return (
      convention.name.toLowerCase().includes(term) ||
      convention.location?.toLowerCase().includes(term) ||
      convention.description?.toLowerCase().includes(term)
    );
  });

  return (
    <AuthGuard>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Archive className="h-6 w-6" /> Convention Archive
            </h1>
            <p className="text-muted-foreground">
              View completed and archived conventions.
            </p>
            <Button variant="link" asChild className="p-0 h-auto text-sm">
              <Link href="/conventions">Back to Active Conventions</Link>
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" disabled>
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Archived Conventions</CardTitle>
            <CardDescription>Browse your past conventions.</CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name, location, or description..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-muted-foreground">
                  Loading archive...
                </span>
              </div>
            ) : filteredConventions.length === 0 ? (
              <div className="text-center py-10">
                <Archive className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Archived Conventions
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? 'No conventions match your search criteria.'
                    : "You don't have any completed or archived conventions yet."}
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
                      <TableHead>Name</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConventions.map((convention) => (
                      <TableRow key={convention.id}>
                        <TableCell className="font-medium">
                          {convention.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            <span>
                              {format(new Date(convention.start_date), 'MMM d')}{' '}
                              -{' '}
                              {format(
                                new Date(convention.end_date),
                                'MMM d, yyyy',
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{convention.location || 'No location'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              convention.status === 'archived'
                                ? 'outline'
                                : 'secondary'
                            }
                          >
                            {convention.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/conventions/${convention.id}`}>
                              View
                            </Link>
                          </Button>
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
    </AuthGuard>
  );
}
