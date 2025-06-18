import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  CalendarPlus,
  Calendar,
  MapPin,
  Users,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ConventionsTabProps {
  associationId: string;
}

export function ConventionsTab({ associationId }: ConventionsTabProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [conventions, setConventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConventions = async () => {
    try {
      const { data, error } = await supabase
        .from('conventions')
        .select('*')
        .eq('association_id', associationId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setConventions(data || []);
    } catch (error: any) {
      console.error('Error fetching conventions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conventions.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConventions();
  }, [associationId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="secondary">Upcoming</Badge>;
      case 'active':
        return <Badge>Active</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      case 'archived':
        return (
          <Badge variant="outline" className="bg-muted">
            Archived
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    };

    if (start.getFullYear() === end.getFullYear()) {
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString('en-US', options)}-${end.getDate()}, ${end.getFullYear()}`;
      }
      return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}, ${end.getFullYear()}`;
    }
    return `${start.toLocaleDateString('en-US', { ...options, year: 'numeric' })} - ${end.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Conventions</CardTitle>
          <CardDescription>
            View and manage conventions organized by this association.
          </CardDescription>
        </div>
        <Button onClick={() => router.push('/conventions?create=true')}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Create Convention
        </Button>
      </CardHeader>
      <CardContent>
        {conventions.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No conventions yet. Create your first convention to get started!
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Attendees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conventions.map((convention) => (
                <TableRow key={convention.id}>
                  <TableCell className="font-medium">
                    {convention.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-1 h-3 w-3" />
                      {formatDateRange(
                        convention.start_date,
                        convention.end_date,
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {convention.location && (
                      <div className="flex items-center text-sm">
                        <MapPin className="mr-1 h-3 w-3" />
                        {convention.location}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Users className="mr-1 h-3 w-3" />
                      {convention.attendee_count || 0}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(convention.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/conventions/${convention.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
