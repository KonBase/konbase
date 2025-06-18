'use client';

import { AuthGuard } from '@/components/guards/AuthGuard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Calendar,
  Download,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

const reportTypes = [
  {
    title: 'Convention Reports',
    description: 'Attendance, revenue, and performance reports',
    icon: Calendar,
    href: '/reports/conventions',
    color: 'text-blue-500',
  },
  {
    title: 'Inventory Reports',
    description: 'Stock levels, usage, and valuation reports',
    icon: Package,
    href: '/reports/inventory',
    color: 'text-green-500',
  },
  {
    title: 'Financial Reports',
    description: 'Revenue, expenses, and profit reports',
    icon: DollarSign,
    href: '/reports/financial',
    color: 'text-yellow-500',
  },
  {
    title: 'Member Reports',
    description: 'Membership statistics and activity',
    icon: Users,
    href: '/reports/members',
    color: 'text-purple-500',
  },
  {
    title: 'Custom Reports',
    description: 'Create custom reports with filters',
    icon: Filter,
    href: '/reports/custom',
    color: 'text-indigo-500',
  },
  {
    title: 'Scheduled Reports',
    description: 'Manage automated report generation',
    icon: Calendar,
    href: '/reports/scheduled',
    color: 'text-pink-500',
  },
];

export default function ReportsPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
              <p className="text-muted-foreground">
                Generate and view various reports and analytics.
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export All
              </Button>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Create Report
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <Card
                  key={report.title}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <Icon className={`h-8 w-8 ${report.color}`} />
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={report.href}>Generate Report</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Reports Section */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Your recently generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        Convention Performance Q4 2023
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Generated 2 days ago
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Inventory Valuation Report</p>
                      <p className="text-sm text-muted-foreground">
                        Generated 1 week ago
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
