'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, MapPin, Users } from 'lucide-react';
import CreateConventionDialog from '@/components/conventions/CreateConventionDialog';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ConventionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [conventions, setConventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const fetchConventions = async () => {
    try {
      const { data, error } = await supabase
        .from('conventions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConventions(data || []);
    } catch (error: any) {
      console.error('Error fetching conventions:', error);
      toast.error('Failed to load conventions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConventions();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'upcoming':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Conventions</h1>
          <p className="text-muted-foreground">
            Manage your events and conventions
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Convention
        </Button>
      </div>

      {conventions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No conventions yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first convention
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Convention
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conventions.map((convention) => (
            <Card
              key={convention.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <Link href={`/conventions/${convention.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{convention.name}</CardTitle>
                    <Badge className={getStatusColor(convention.status)}>
                      {convention.status}
                    </Badge>
                  </div>
                  <CardDescription>{convention.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      {new Date(
                        convention.start_date,
                      ).toLocaleDateString()} -{' '}
                      {new Date(convention.end_date).toLocaleDateString()}
                    </div>
                    {convention.location && (
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        {convention.location}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      {convention.attendee_count || 0} attendees
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}

      <CreateConventionDialog
        onConventionCreated={() => {
          fetchConventions();
        }}
      />
    </div>
  );
}
