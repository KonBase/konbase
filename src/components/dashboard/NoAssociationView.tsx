'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const NoAssociationView = () => {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>No Association Found</CardTitle>
        <CardDescription>
          You are not currently part of any association. Join one or create a
          new one to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Associations allow you to manage inventory and conventions
          collaboratively.
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild>
          <Link href="/setup">Set Up Association</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NoAssociationView;
