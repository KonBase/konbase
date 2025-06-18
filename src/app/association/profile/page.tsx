'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Save, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAssociation } from '@/contexts/AssociationContext';
import { Separator } from '@/components/ui/separator';
import { AuthGuard } from '@/components/guards/AuthGuard';

export default function AssociationProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentAssociation, updateAssociation } = useAssociation();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (currentAssociation) {
      setName(currentAssociation.name);
      setDescription(currentAssociation.description || '');
      setWebsite(currentAssociation.website || '');
      setContactEmail(currentAssociation.contactEmail || '');
      setContactPhone(currentAssociation.contactPhone || '');
      setAddress(currentAssociation.address || '');
    }
  }, [currentAssociation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentAssociation) {
      toast({
        title: 'No association selected',
        description: 'Please select an association to update.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await updateAssociation({
        id: currentAssociation.id,
        name,
        description,
        website,
        contactEmail,
        contactPhone,
        address,
      });

      toast({
        title: 'Profile updated',
        description: 'Association profile has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating association:', error);
      toast({
        title: 'Update failed',
        description:
          error.message ||
          'An error occurred while updating the association profile.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentAssociation) {
    return (
      <AuthGuard>
        <div className="container mx-auto py-6 space-y-6">
          <Card className="text-center py-8">
            <CardContent>
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                No Association Selected
              </h2>
              <p className="text-muted-foreground mb-6">
                Please select an association to view and edit its profile.
              </p>
              <Button onClick={() => router.push('/associations')}>
                Select Association
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Association Profile
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Association Information</CardTitle>
              <CardDescription>
                Update your association's profile information and contact
                details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Association Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter association name"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter association description"
                  className="min-h-[100px]"
                  disabled={isLoading}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@example.com"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter association address"
                  disabled={isLoading}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AuthGuard>
  );
}
