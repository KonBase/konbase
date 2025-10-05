import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Spinner } from '@/components/ui/spinner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, AlertTriangle, Clock, Calendar, CheckCircle, Archive, Shield, ShieldCheck } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getMFAFactors } from '@/utils/mfa-utils';

const ProfilePage = () => {
  const { profile, loading: profileLoading } = useUserProfile();
  const [conventions, setConventions] = useState([]);
  const [loadingConventions, setLoadingConventions] = useState(true);
  const [associationName, setAssociationName] = useState<string | null>(null);
  const [mfaStatus, setMfaStatus] = useState<{ enabled: boolean; factorCount: number }>({ enabled: false, factorCount: 0 });
  const [loadingMfa, setLoadingMfa] = useState(true);

  useEffect(() => {
    const fetchConventions = async () => {
      if (!profile?.id) return;

      setLoadingConventions(true);
      try {
        const { data, error } = await supabase
          .from('convention_access')
          .select('id, role, conventions(name, start_date, end_date)')
          .eq('user_id', profile.id);

        if (error) throw error;

        setConventions(data || []);
      } catch (error) {
        console.error('Error fetching conventions:', error);
      } finally {
        setLoadingConventions(false);
      }
    };

    // Fetch association name
    const fetchAssociation = async () => {
      if (!profile?.id) return;
      try {
        const { data, error } = await supabase
          .from('association_members')
          .select('association_id, associations(name)')
          .eq('user_id', profile.id)
          .limit(1)
          .single();

        if (error || !data || !data.associations) {
          setAssociationName(null);
        } else {
          setAssociationName(data.associations.name);
        }
      } catch (error) {
        setAssociationName(null);
      }
    };

    // Fetch MFA status
    const fetchMFAStatus = async () => {
      if (!profile?.id) return;
      
      setLoadingMfa(true);
      try {
        const factorsData = await getMFAFactors();
        const verifiedFactors = factorsData.verified;
        
        setMfaStatus({
          enabled: verifiedFactors.length > 0,
          factorCount: verifiedFactors.length
        });
      } catch (error) {
        console.error('Error fetching MFA status:', error);
        setMfaStatus({ enabled: false, factorCount: 0 });
      } finally {
        setLoadingMfa(false);
      }
    };

    fetchConventions();
    fetchAssociation();
    fetchMFAStatus();
  }, [profile?.id]);

  if (profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-700 dark:border-blue-400 dark:text-blue-300">
            <Clock className="mr-1 h-3 w-3" /> Planned
          </Badge>
        );
      case 'active':
        return (
          <Badge variant="default">
            <Calendar className="mr-1 h-3 w-3" /> Active
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="mr-1 h-3 w-3" /> Completed
          </Badge>
        );
      case 'archived':
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            <Archive className="mr-1 h-3 w-3" /> Archived
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'organizer':
        return <Badge variant="default">Organizer</Badge>;
      case 'staff':
        return <Badge variant="secondary">Staff</Badge>;
      case 'helper':
        return (
          <Badge variant="outline" className={'bg-orange-600'}>Helper</Badge>
        );
      case 'attendee':
      default:
        return <Badge variant="outline" className="bg-muted">Attendee</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your personal information and profile settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.profile_image || ''} alt={profile?.name || 'User'} />
                  <AvatarFallback className="text-lg">
                    {profile?.name ? getInitials(profile.name) : <User className="h-6 w-6" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{profile?.name}</h2>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <Badge variant="secondary" className="mt-1 capitalize">
                    {profile?.role || 'guest'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Account Created</p>
                  <p className="mt-1">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Association</p>
                  <div className="mt-1 flex items-center gap-2">
                    {associationName ? (
                      <p>{associationName}</p>
                    ) : (
                      <button
                        className="px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
                        onClick={() => console.log('Append to Association button clicked')}
                      >
                        Append to Association
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account preferences and security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Two-Factor Authentication</p>
                <div className="mt-1 flex items-center gap-2">
                  {loadingMfa ? (
                    <div className="flex items-center gap-2">
                      <Spinner size="sm" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  ) : (
                    <>
                      {mfaStatus.enabled ? (
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">
                            Enabled ({mfaStatus.factorCount} factor{mfaStatus.factorCount === 1 ? '' : 's'})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Disabled</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  You can configure 2FA in the Settings page.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="mt-1">{profile?.email || 'No email provided'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">User ID</p>
                <p className="mt-1 text-xs font-mono text-muted-foreground break-all">
                  {profile?.id || 'Unknown'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Convention</CardTitle>
              <CardDescription>
                List of conventions you are associated with
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingConventions ? (
                <div className="flex justify-center">
                  <Spinner size="sm" />
                </div>
              ) : conventions.length > 0 ? (
                <table className="w-full table-auto">
                  <tbody>
                    {conventions.map((convention) => {
                      const status =
                        new Date() >= new Date(convention.conventions.start_date) &&
                        new Date() <= new Date(convention.conventions.end_date)
                          ? 'active'
                          : new Date() < new Date(convention.conventions.start_date)
                          ? 'planned'
                          : 'completed';

                      return (
                        <tr key={convention.id} className="">
                          <td className="px-4 py-2">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{convention.conventions.name[0]}</AvatarFallback>
                            </Avatar>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{convention.conventions.name}</p>
                              {getStatusBadge(status)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(convention.conventions.start_date).toLocaleDateString()} - {new Date(convention.conventions.end_date).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="px-4 py-2">
                            {getRoleBadge(convention.role)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You are not associated with any conventions.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
