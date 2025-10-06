import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, ClipboardIcon, CheckCircleIcon, Loader2, User, Calendar, AlertTriangle, Check, X, Hourglass } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAssociation } from '@/contexts/AssociationContext';
import { useToast } from '@/hooks/use-toast';
import { ConventionRequirement } from '@/types/convention';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { AddRequirementDialog } from '@/components/conventions/AddRequirementDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ConventionRequirements = () => {
  const { id: conventionId } = useParams<{ id: string }>();
  const { currentAssociation } = useAssociation();
  const [requirements, setRequirements] = useState<ConventionRequirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddRequirementOpen, setIsAddRequirementOpen] = useState(false);
  const { toast } = useToast();

  const fetchRequirements = async () => {
    if (!conventionId || !currentAssociation) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('convention_requirements')
        .select(`
          *,
          profiles!assigned_to(id, email, name),
          approver:profiles!created_by(id, email, name)
        `)
        .eq('convention_id', conventionId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to include joined fields
      const transformedData = data?.map(item => ({
        ...item,
        assignee: item.profiles,
        creator: item.approver
      })) || [];
      
      setRequirements(transformedData);
    } catch (error: any) {
      console.error('Error loading requirements:', error);
      toast({
        title: 'Error loading requirements',
        description: error.message || 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRequirements();
  }, [conventionId, currentAssociation]);

  const handleRequirementAdded = () => {
    fetchRequirements();
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'requested':
        return <Badge variant="outline" className="border-blue-500 text-blue-700 dark:border-blue-400 dark:text-blue-300"><Hourglass className="mr-1 h-3 w-3" /> Requested</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Check className="mr-1 h-3 w-3" /> Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive"><X className="mr-1 h-3 w-3" /> Denied</Badge>;
      case 'fulfilled':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircleIcon className="mr-1 h-3 w-3" /> Fulfilled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Count requirements by status
  const statusCounts = {
    requested: requirements.filter(r => r.status === 'requested').length,
    approved: requirements.filter(r => r.status === 'approved').length,
    denied: requirements.filter(r => r.status === 'denied').length,
    fulfilled: requirements.filter(r => r.status === 'fulfilled').length,
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Requirements Management</h1>
            <p className="text-muted-foreground">Track tasks, equipment, and resource needs for this convention.</p>
            {/* Link back to convention details */}
            <Button variant="link" asChild className="p-0 h-auto text-sm">
              <RouterLink to={`/conventions/${conventionId}`}>Back to Convention Details</RouterLink>
            </Button>
          </div>
          <Button onClick={() => setIsAddRequirementOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Requirement
          </Button>
        </div>

        {/* Status Overview Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requested</CardTitle>
              <Hourglass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.requested}</div>
              <p className="text-xs text-muted-foreground">Pending approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.approved}</div>
              <p className="text-xs text-muted-foreground">Ready to fulfill</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fulfilled</CardTitle>
              <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.fulfilled}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Denied</CardTitle>
              <X className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.denied}</div>
              <p className="text-xs text-muted-foreground">Rejected requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Requirements List Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Requirements</CardTitle>
            <CardDescription>List of all requirements for this convention.</CardDescription>
            {/* TODO: Add filtering/sorting options here */}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading requirements...</span>
              </div>
            ) : requirements.length === 0 ? (
              <div className="text-center py-10">
                <ClipboardIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Requirements Added Yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add requirements needed for this convention.
                </p>
                <Button variant="default" className="mt-4" onClick={() => setIsAddRequirementOpen(true)}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add First Requirement
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name / Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requirements.map((requirement) => (
                      <TableRow key={requirement.id}>
                        <TableCell className="font-medium max-w-xs">
                          <p className="truncate font-semibold">{requirement.description}</p>
                          <p className="text-xs text-muted-foreground truncate">Requirement ID: {requirement.id.slice(0, 8)}</p>
                        </TableCell>
                        <TableCell>{getStatusBadge(requirement.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {requirement.assignee?.name || requirement.assignee?.email || 'Unassigned'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDistanceToNow(new Date(requirement.created_at), { addSuffix: true })}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {format(new Date(requirement.created_at), 'PPP p')}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-right">
                          {/* TODO: Implement View/Edit/Approve/Deny actions */}
                          <Button variant="ghost" size="sm" disabled>View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Requirement Dialog */}
        <AddRequirementDialog
          isOpen={isAddRequirementOpen}
          onClose={() => setIsAddRequirementOpen(false)}
          conventionId={conventionId || ''}
          onRequirementAdded={handleRequirementAdded}
        />
      </div>
    </TooltipProvider>
  );
};

export default ConventionRequirements;
