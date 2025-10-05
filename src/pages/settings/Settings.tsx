import { useState, useEffect, useRef } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Shield, 
  User, 
  Lock, 
  Globe, 
  Moon, 
  Sun, 
  Laptop, 
  MessageSquare,
  Accessibility
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeProvider';
import { useToast } from '@/hooks/use-toast';
import TwoFactorAuth from '@/components/auth/TwoFactorAuth';
import AccessibilitySettings from '@/components/settings/AccessibilitySettings';
import LanguageRegionSettings from '@/components/settings/LanguageRegionSettings';
import SessionManagement from '@/components/settings/SessionManagement';
import PasswordChange from '@/components/settings/PasswordChange';
import { useResponsive } from '@/hooks/useResponsive';
import { useTranslation } from '@/utils/languageUtils';
import { useAuth } from '@/contexts/auth';
import { useLocation } from 'react-router-dom';

const Settings = () => {
  const { profile, loading, refreshProfile } = useUserProfile();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  const componentMountedRef = useRef(false);
  const location = useLocation();
  
  const [isFormSaving, setIsFormSaving] = useState(false);
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    conventions: true,
    inventory: true,
    messages: true,
    updates: true
  });
  
  // Force refresh when component mounts to ensure we have the latest data
  useEffect(() => {
    if (!componentMountedRef.current) {
      componentMountedRef.current = true;
      refreshProfile();
    }
  }, [refreshProfile, location]);
  
  // Listen for forced refresh events from RouteChangeHandler
  useEffect(() => {
    const handleForceRefresh = (event: CustomEvent) => {
      if (event.detail?.targetSection === 'settings') {
        refreshProfile();
      }
    };
    
    window.addEventListener('force-section-refresh', handleForceRefresh as EventListener);
    
    return () => {
      window.removeEventListener('force-section-refresh', handleForceRefresh as EventListener);
    };
  }, [refreshProfile]);
  
  // Listen for route section changes
  useEffect(() => {
    const handleRouteChange = (event: CustomEvent) => {
      const { currentPath } = event.detail;
      
      if (currentPath?.includes('/settings')) {
        refreshProfile();
      }
    };
    
    window.addEventListener('route-section-changed', handleRouteChange as EventListener);
    
    return () => {
      window.removeEventListener('route-section-changed', handleRouteChange as EventListener);
    };
  }, [refreshProfile]);

  const handleNotificationChange = (type: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  
  const saveAccountSettings = async () => {
    setIsFormSaving(true);
    
    try {
      // Simulating an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: t("Settings updated"),
        description: t("Your account settings have been saved successfully."),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("Failed to update settings"),
        description: t("There was a problem saving your settings. Please try again."),
      });
    } finally {
      setIsFormSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 md:py-6 px-4 md:px-6 space-y-4 md:space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("Settings")}</h1>
        
        <Tabs defaultValue="account" className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className={`grid w-full ${isMobile ? 'grid-cols-3' : 'md:grid-cols-6'} mb-4 min-w-max`}>
              <TabsTrigger value="account" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className={isMobile ? "text-xs" : ""}>{t("Account")}</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                <span className={isMobile ? "text-xs" : ""}>{t("Appearance")}</span>
              </TabsTrigger>
              <TabsTrigger value="accessibility" className="flex items-center gap-2">
                <Accessibility className="h-4 w-4" />
                <span className={isMobile ? "text-xs" : ""}>{t("Accessibility")}</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className={isMobile ? "text-xs" : ""}>{t("Notifications")}</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className={isMobile ? "text-xs" : ""}>{t("Security")}</span>
              </TabsTrigger>
              <TabsTrigger value="language" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className={isMobile ? "text-xs" : ""}>{t("Language")}</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t("Account Settings")}
                </CardTitle>
                <CardDescription>{t("Manage your account information")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("Name")}</Label>
                  <Input id="name" defaultValue={profile?.name || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("Email")}</Label>
                  <Input id="email" type="email" defaultValue={profile?.email || ''} />
                </div>
                
                <Separator />
                
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing">{t("Marketing emails")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("Receive emails about new features and updates")}
                    </p>
                  </div>
                  <Switch id="marketing" defaultChecked={true} />
                </div>
                
                <Button 
                  onClick={saveAccountSettings} 
                  disabled={isFormSaving}
                  className={isMobile ? "w-full" : ""}
                >
                  {isFormSaving ? t('Saving...') : t('Save Changes')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="h-5 w-5" />
                  {t("Appearance")}
                </CardTitle>
                <CardDescription>{t("Customize the look and feel of the application")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="mb-2 text-lg font-medium">{t("Theme")}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant={theme === 'light' ? 'default' : 'outline'} 
                      className="flex flex-col items-center justify-center gap-1 h-20 md:h-24"
                      onClick={() => setTheme('light')}
                    >
                      <Sun className="h-5 w-5 md:h-6 md:w-6" />
                      <span className={isMobile ? "text-xs" : ""}>{t("Light")}</span>
                    </Button>
                    <Button 
                      variant={theme === 'dark' ? 'default' : 'outline'} 
                      className="flex flex-col items-center justify-center gap-1 h-20 md:h-24"
                      onClick={() => setTheme('dark')}
                    >
                      <Moon className="h-5 w-5 md:h-6 md:w-6" />
                      <span className={isMobile ? "text-xs" : ""}>{t("Dark")}</span>
                    </Button>
                    <Button 
                      variant={theme === 'system' ? 'default' : 'outline'} 
                      className="flex flex-col items-center justify-center gap-1 h-20 md:h-24"
                      onClick={() => setTheme('system')}
                    >
                      <Laptop className="h-5 w-5 md:h-6 md:w-6" />
                      <span className={isMobile ? "text-xs" : ""}>{t("System")}</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="accessibility">
            <AccessibilitySettings />
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  {t("Notification Settings")}
                </CardTitle>
                <CardDescription>{t("Configure how you receive notifications")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">{t("Email Notifications")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("Receive notifications via email")}
                    </p>
                  </div>
                  <Switch 
                    id="email-notifications" 
                    checked={notifications.email}
                    onCheckedChange={() => handleNotificationChange('email')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">{t("Push Notifications")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("Receive notifications in the browser")}
                    </p>
                  </div>
                  <Switch 
                    id="push-notifications" 
                    checked={notifications.push}
                    onCheckedChange={() => handleNotificationChange('push')}
                  />
                </div>
                
                <Separator />
                <h3 className="text-sm font-medium pt-2">{t("Notification Categories")}</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {t("Messages & Mentions")}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t("When someone mentions you or sends you a message")}
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.messages}
                    onCheckedChange={() => handleNotificationChange('messages')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="convention-reminders">{t("Convention Reminders")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("Get reminders about upcoming conventions")}
                    </p>
                  </div>
                  <Switch 
                    id="convention-reminders" 
                    checked={notifications.conventions}
                    onCheckedChange={() => handleNotificationChange('conventions')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="inventory-alerts">{t("Inventory Alerts")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("Get notified about inventory changes")}
                    </p>
                  </div>
                  <Switch 
                    id="inventory-alerts" 
                    checked={notifications.inventory}
                    onCheckedChange={() => handleNotificationChange('inventory')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="app-updates">{t("Product Updates")}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t("Receive notifications about new features and updates")}
                    </p>
                  </div>
                  <Switch 
                    id="app-updates" 
                    checked={notifications.updates}
                    onCheckedChange={() => handleNotificationChange('updates')}
                  />
                </div>
                
                <Button className={isMobile ? "w-full" : ""}>
                  {t("Save Notification Settings")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <div className="grid gap-4 md:gap-6">
              <TwoFactorAuth />
              
              <PasswordChange />
              
              <SessionManagement />
            </div>
          </TabsContent>
          
          <TabsContent value="language">
            <LanguageRegionSettings />
          </TabsContent>
          
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
