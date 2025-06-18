'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Calendar, BarChart3, Archive, FileUp } from 'lucide-react';

const ConventionManagementSection: React.FC = () => {
  return (
    <div className="mb-6 md:mb-8">
      <h2 className="text-2xl font-bold tracking-tight mb-4">
        Convention Management
      </h2>
      <div className="grid gap-4 md:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
          <Link href="/conventions" className="block p-6">
            <div className="flex items-center space-x-4">
              <Calendar className="h-10 w-10 text-primary" />
              <div>
                <h3 className="font-semibold">Conventions</h3>
                <p className="text-sm text-muted-foreground">
                  Manage conventions
                </p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
          <Link href="/reports" className="block p-6">
            <div className="flex items-center space-x-4">
              <BarChart3 className="h-10 w-10 text-primary" />
              <div>
                <h3 className="font-semibold">Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Generate reports
                </p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
          <Link href="/conventions/archive" className="block p-6">
            <div className="flex items-center space-x-4">
              <Archive className="h-10 w-10 text-primary" />
              <div>
                <h3 className="font-semibold">Archiving</h3>
                <p className="text-sm text-muted-foreground">
                  Archive past conventions
                </p>
              </div>
            </div>
          </Link>
        </Card>

        <Card className="hover:bg-accent/50 cursor-pointer transition-colors">
          <Link href="/conventions/templates" className="block p-6">
            <div className="flex items-center space-x-4">
              <FileUp className="h-10 w-10 text-primary" />
              <div>
                <h3 className="font-semibold">Templates</h3>
                <p className="text-sm text-muted-foreground">
                  Create convention templates
                </p>
              </div>
            </div>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default ConventionManagementSection;
