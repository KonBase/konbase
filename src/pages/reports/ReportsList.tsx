
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart, FileSpreadsheet } from 'lucide-react';
import { useAssociation } from '@/contexts/AssociationContext';

const ReportsList = () => {
  const { currentAssociation, isLoading } = useAssociation();
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
        <div className="h-4 w-96 bg-muted rounded animate-pulse"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-40 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (!currentAssociation) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>No Association Selected</CardTitle>
            <CardDescription>
              Please select or create an association to access reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/association'}>
              Go to Associations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and view reports for your inventory and conventions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
          <Button>
            <BarChart className="mr-2 h-4 w-4" />
            Create Report
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Implementation In Progress</CardTitle>
          <CardDescription>
            The reporting module is currently under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Coming report types:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Inventory status reports</li>
            <li>Movement history reports</li>
            <li>Convention equipment usage reports</li>
            <li>Item maintenance reports</li>
            <li>Custom report builder</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsList;
