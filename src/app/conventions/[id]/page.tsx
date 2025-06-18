'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Settings, ArrowLeft } from 'lucide-react';
import { ConventionLocationsTab } from '@/components/conventions/ConventionLocationsTab';
import ConventionLogsTab from '@/components/conventions/ConventionLogsTab';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';

interface ConventionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ConventionDetailPage({
  params,
}: ConventionDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [convention, setConvention] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchConvention = async () => {
    try {
      const { data, error } = await supabase
        .from('conventions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setConvention(data);
    } catch (error: any) {
      console.error('Error fetching convention:', error);
      toast.error('Failed to load convention details');
      router.push('/conventions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConvention();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!convention) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Convention not found</h2>
        <p className="text-muted-foreground mb-4">
          The convention you're looking for doesn't exist.
        </p>
        <Button asChild>
          <Link href="/conventions">Back to Conventions</Link>
        </Button>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/conventions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Conventions
            </Link>
          </Button>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Edit Convention
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{convention.name}</CardTitle>
              <CardDescription className="mt-2">
                {convention.description}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(convention.status)}>
              {convention.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Duration</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(convention.start_date).toLocaleDateString()} -{' '}
                  {new Date(convention.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            {convention.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {convention.location}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Attendees</p>
                <p className="text-sm text-muted-foreground">
                  {convention.attendee_count || 0} registered
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="consumables">Consumables</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Convention Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Convention details and overview content...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Equipment tracking for this convention...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consumables">
          <Card>
            <CardHeader>
              <CardTitle>Consumables</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Consumable items for this convention...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements">
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Convention requirements and specifications...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <ConventionLocationsTab conventionId={id} />
        </TabsContent>

        <TabsContent value="logs">
          <ConventionLogsTab conventionId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
