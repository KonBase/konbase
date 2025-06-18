'use client';

import { AuthGuard } from '@/components/guards/AuthGuard';
import AssociationForm from '@/components/setup/AssociationForm';
import InvitationCodeForm from '@/components/setup/InvitationCodeForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AssociationSetupPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto py-6 max-w-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold">Association Setup</h1>
          <p className="text-muted-foreground">
            Join an existing association or create a new one
          </p>
        </div>

        <Tabs defaultValue="join" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="join">Join Association</TabsTrigger>
            <TabsTrigger value="create">Create Association</TabsTrigger>
          </TabsList>

          <TabsContent value="join">
            <Card>
              <CardHeader>
                <CardTitle>Join an Association</CardTitle>
                <CardDescription>
                  Enter an invitation code to join an existing association
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvitationCodeForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create New Association</CardTitle>
                <CardDescription>
                  Set up a new association for your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AssociationForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}
