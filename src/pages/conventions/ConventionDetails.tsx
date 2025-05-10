import { useEffect, useState, useCallback } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Package, Loader2, Edit, LogOut, Info, ListChecks, Map, Droplets, FileText, History } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Convention } from '@/types/convention';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConventionAttendeesPage from '@/components/conventions/ConventionAttendeesPage';
import ConventionLocationsTab from '@/components/conventions/ConventionLocationsTab';
import ConventionLogsTab from '@/components/conventions/ConventionLogsTab';
import RedeemInvitationButton from '@/components/conventions/RedeemInvitationButton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const ConventionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();  const [convention, setConvention] = useState<Convention | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [equipmentCount, setEquipmentCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [hasAccess, setHasAccess] = useState(true); // Default to true initially
  const [attendeeCount, setAttendeeCount] = useState(0);
  const { toast } = useToast();
  const fetchConventionData = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch convention details, equipment count, staff count, and attendee count in parallel
      const [
        conventionResult, 
        equipmentResult, 
        staffResult,
        attendeeResult,
        accessCheckResult
      ] = await Promise.all([
        supabase.from('conventions').select('*').eq('id', id).single(),
        supabase.from('convention_equipment').select('id', { count: 'exact', head: true }).eq('convention_id', id),
        supabase.from('convention_access')
          .select('id', { count: 'exact', head: true })
          .eq('convention_id', id)
          .in('role', ['organizer', 'staff']),
        supabase.from('convention_access')
          .select('id', { count: 'exact', head: true })
          .eq('convention_id', id),
        // Check if the current user has access to the convention
        user ? supabase.rpc('can_access_convention', { p_convention_id: id }) : { data: false }
      ]);

      // Check for errors after all promises settle
      if (conventionResult.error) throw conventionResult.error;
      if (equipmentResult.error) throw equipmentResult.error;
      if (staffResult.error) throw staffResult.error;
      if (attendeeResult.error) throw attendeeResult.error;
      if (accessCheckResult.error) throw accessCheckResult.error;

      setConvention(conventionResult.data);
      setEquipmentCount(equipmentResult.count ?? 0);
      setStaffCount(staffResult.count ?? 0);
      setAttendeeCount(attendeeResult.count ?? 0);
      setHasAccess(!!accessCheckResult.data);

    } catch (error: any) {
      console.error('Error loading convention data:', error);
      toast({
        title: 'Error loading convention data',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
      // Optionally clear state on error
      setConvention(null);
      setEquipmentCount(0);
      setStaffCount(0);
      setAttendeeCount(0);
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchConventionData();
  }, [fetchConventionData]);

  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="outline" className="border-blue-500 text-blue-700 dark:border-blue-400 dark:text-blue-300">Planned</Badge>;
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading Convention Details...</span>
      </div>
    );
  }

  if (!convention) {
    return (
      <div className="container mx-auto py-6 p-4 md:p-6">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Info className="h-6 w-6 text-destructive" /> Convention Not Found
            </CardTitle>
            <CardDescription>The requested convention (ID: {id}) could not be found or loaded. It might have been deleted or you may not have access.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/conventions')}>
              <LogOut className="mr-2 h-4 w-4" /> Back to Conventions List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const startDate = new Date(convention.start_date);
  const endDate = new Date(convention.end_date);

  return (
    <div className="space-y-6 p-4 md:p-6">      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            {convention.name}
            {getStatusBadge(convention.status)}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4" />
            <span>{format(startDate, 'MMMM d')} - {format(endDate, 'MMMM d, yyyy')}</span>
            <span className="text-muted">|</span>
            <MapPin className="h-4 w-4" />
            <span>{convention.location || 'No location set'}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {!hasAccess && (
            <RedeemInvitationButton 
              variant="default"
              label="Join Convention"
              onRedeemed={fetchConventionData}
            />
          )}
          {/* TODO: Implement Edit functionality */}
          <Button variant="outline" disabled>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>
      </div>      {/* Overview Cards - Improved layout and content */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{`${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`}</div>
            <p className="text-xs text-muted-foreground">{format(startDate, 'yyyy')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate" title={convention.location || 'Not set'}>{convention.location || 'Not set'}</div>
            <p className="text-xs text-muted-foreground">Primary venue</p>
          </CardContent>
        </Card>        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{attendeeCount}</div>
            <p className="text-xs text-muted-foreground">Total participants</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{staffCount}</div>
            <p className="text-xs text-muted-foreground">Organizers & staff</p>
          </CardContent>
        </Card>
        <Card className="hidden lg:block">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipment</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{equipmentCount}</div>
            <p className="text-xs text-muted-foreground">Items assigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="details" className="w-full">
        {/* Scrollable TabsList on smaller screens */}
        <div className="overflow-x-auto">
          <TabsList className="inline-grid w-full grid-cols-[auto,auto,auto,auto,auto,auto,auto] sm:w-auto sm:grid-cols-7 gap-1">
            <TabsTrigger value="details" className="flex items-center gap-1"><FileText className="h-4 w-4"/>Details</TabsTrigger>
            <TabsTrigger value="attendees" className="flex items-center gap-1"><Users className="h-4 w-4"/>Attendees</TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-1"><Package className="h-4 w-4"/>Equipment</TabsTrigger>
            <TabsTrigger value="consumables" className="flex items-center gap-1"><Droplets className="h-4 w-4"/>Consumables</TabsTrigger>
            <TabsTrigger value="requirements" className="flex items-center gap-1"><ListChecks className="h-4 w-4"/>Requirements</TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center gap-1"><Map className="h-4 w-4"/>Locations</TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1"><History className="h-4 w-4"/>Logs</TabsTrigger>
          </TabsList>
        </div>
        <Separator className="my-4" />

        {/* Tab Content Panes */}
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Convention Details</CardTitle>
              <CardDescription>General information and description for {convention.name}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className={`mt-1 ${!convention.description ? 'text-muted-foreground italic' : ''}`}>
                  {convention.description || 'No description provided.'}
                </p>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <div className="mt-1">{getStatusBadge(convention.status)}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Created At</h3>
                  <p className="mt-1 text-sm">{format(new Date(convention.created_at), 'PPP p')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>        <TabsContent value="attendees" className="mt-4">
          {/* Render the ConventionAttendeesPage component */}
          {id ? (
            <>
              {/* Show join banner for users without access */}
              {!hasAccess && (
                <Card className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                  <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
                    <div>
                      <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300">Join This Convention</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-400">You need an invitation code to access this convention's attendees and resources.</p>
                    </div>
                    <RedeemInvitationButton 
                      variant="default"
                      onRedeemed={fetchConventionData}
                      className="whitespace-nowrap"
                    />
                  </CardContent>
                </Card>
              )}
              <ConventionAttendeesPage conventionId={id} />
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Attendees</CardTitle>
                <CardDescription>Manage attendees for this convention.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-6">
                 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                 <span className="ml-2">Loading attendee information...</span>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="locations" className="mt-4">
          {/* Render the ConventionLocationsTab component */}
          {id ? (
            <ConventionLocationsTab conventionId={id} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Locations</CardTitle>
                <CardDescription>Manage locations for this convention.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-6">
                 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                 <span className="ml-2">Loading locations information...</span>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          {/* Render the ConventionLogsTab component */}
          {id ? (
            <ConventionLogsTab conventionId={id} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Activity Logs</CardTitle>
                <CardDescription>View convention activity logs.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center p-6">
                 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                 <span className="ml-2">Loading logs information...</span>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Placeholder Cards for other sections - linking to dedicated pages */}
        {(['equipment', 'consumables', 'requirements'] as const).map((section) => (
          <TabsContent key={section} value={section} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{section}</CardTitle>
                <CardDescription>Manage {section} assigned to this convention.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-start gap-2">
                <p className="text-sm text-muted-foreground">View and manage all {section} items for this convention on the dedicated page.</p>
                <Button asChild variant="default" size="sm">
                  <RouterLink to={`/conventions/${convention.id}/${section}`}>
                    Go to {section.charAt(0).toUpperCase() + section.slice(1)} Page
                  </RouterLink>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ConventionDetails;
