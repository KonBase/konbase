'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Building2, Edit, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAssociation } from '@/contexts/AssociationContext';
import { AuthGuard } from '@/components/guards/AuthGuard';

export default function AssociationsPage() {
  const {
    userAssociations,
    currentAssociation,
    setCurrentAssociation,
    isLoading,
  } = useAssociation();
  const router = useRouter();

  const handleSelectAssociation = (id: string) => {
    const association = userAssociations.find((a) => a.id === id);
    if (association) {
      setCurrentAssociation(association);
      router.push('/dashboard');
    }
  };

  const handleCreateAssociation = () => {
    // Navigate to the correct setup page
    router.push('/setup/association');
  };

  return (
    <AuthGuard>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Associations</h1>
            <p className="text-muted-foreground">
              Select an association to manage or create a new one.
            </p>
          </div>
          <Button onClick={handleCreateAssociation}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Association
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Card key={i} className="w-full opacity-60 animate-pulse">
                <CardHeader>
                  <div className="h-7 w-40 bg-muted rounded"></div>
                  <div className="h-5 w-64 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {userAssociations.length === 0 ? (
              <Card className="text-center p-6">
                <CardHeader>
                  <CardTitle>No Associations Found</CardTitle>
                  <CardDescription>
                    You don't have any associations yet. Create your first
                    association to get started.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center">
                  <Button onClick={handleCreateAssociation}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Association
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userAssociations.map((association) => (
                  <Card
                    key={association.id}
                    className={`cursor-pointer transition-shadow hover:shadow-md ${
                      currentAssociation?.id === association.id
                        ? 'border-primary'
                        : ''
                    }`}
                    onClick={() => handleSelectAssociation(association.id)}
                  >
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">
                          {association.name}
                        </CardTitle>
                        <CardDescription>
                          {association.contactEmail}
                        </CardDescription>
                      </div>
                      <div
                        className={`p-2 rounded-full ${
                          currentAssociation?.id === association.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <Building2 className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {association.description || 'No description provided'}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/associations/${association.id}`);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push('/settings');
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AuthGuard>
  );
}
