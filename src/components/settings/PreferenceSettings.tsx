'use client';

import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeProvider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';

export function PreferenceSettings() {
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    dateFormat,
    setDateFormat,
    timeFormat,
    setTimeFormat,
  } = useTheme();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSavePreferences = async () => {
    setIsLoading(true);

    try {
      // Simulate API call to save preferences
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast({
        title: 'Preferences saved',
        description: 'Your preferences have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Failed to save preferences',
        description: 'An error occurred while saving your preferences.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Customize your application experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="theme">Theme</Label>
          <Select
            value={theme}
            onValueChange={(value) =>
              setTheme(value as 'light' | 'dark' | 'system')
            }
          >
            <SelectTrigger id="theme">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateFormat">Date Format</Label>
          <Select value={dateFormat} onValueChange={setDateFormat}>
            <SelectTrigger id="dateFormat">
              <SelectValue placeholder="Select date format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeFormat">Time Format</Label>
          <Select
            value={timeFormat}
            onValueChange={(value) => setTimeFormat(value as '12h' | '24h')}
          >
            <SelectTrigger id="timeFormat">
              <SelectValue placeholder="Select time format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
              <SelectItem value="24h">24-hour</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSavePreferences} disabled={isLoading}>
          {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
}
