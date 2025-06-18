'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/guards/AuthGuard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Calendar, Settings, Building } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';
import { CreateAssociationDialog } from '@/components/association/CreateAssociationDialog';
import { ErrorType } from '@/types/common';

interface Association {
  id: string;
  name: string;
  description?: string;
  member_count?: number;
  convention_count?: number;
  created_at: string;
}

export default function AssociationPage() {
  const router = useRouter();
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const fetchAssociations = async () => {
    try {
      const { data, error } = await supabase
        .from('associations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssociations(data || []);
    } catch (error) {
      const err = error as ErrorType;
      console.error('Error fetching associations:', err);
      toast.error('Failed to load associations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssociations();
  }, []);

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Association Management
              </h1>
              <p className="text-muted-foreground">
                Manage your associations and their settings.
              </p>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Association
            </Button>
          </div>

          {associations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No associations yet
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  Get started by creating your first association
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Association
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {associations.map((association) => (
                <Card
                  key={association.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <Link href={`/associations/${association.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {association.name}
                        </CardTitle>
                        <Badge variant="outline">Active</Badge>
                      </div>
                      <CardDescription>
                        {association.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                          <p className="text-sm font-medium">
                            {association.member_count || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Members
                          </p>
                        </div>
                        <div>
                          <Calendar className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                          <p className="text-sm font-medium">
                            {association.convention_count || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Conventions
                          </p>
                        </div>
                        <div>
                          <Settings className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                          <p className="text-sm font-medium">Active</p>
                          <p className="text-xs text-muted-foreground">
                            Status
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>

        <CreateAssociationDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={() => {
            fetchAssociations();
            setIsCreateDialogOpen(false);
          }}
        />
      </div>
    </AuthGuard>
  );
}
