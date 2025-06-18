'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Bell } from 'lucide-react';

interface CommunicationSectionProps {
  unreadNotifications: number;
}

const CommunicationSection: React.FC<CommunicationSectionProps> = ({
  unreadNotifications,
}) => {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight mb-4">Communication</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
          <Link href="/notifications" className="block p-6">
            <div className="flex items-center space-x-4">
              <Bell className="h-10 w-10 text-primary" />
              <div>
                <h3 className="font-semibold">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  View all notifications
                  {unreadNotifications > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                      {unreadNotifications}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default CommunicationSection;
