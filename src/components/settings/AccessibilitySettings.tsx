'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeProvider';
import { useAccessibility, useAnnounce } from '@/contexts/AccessibilityProvider';
import {
  Eye,
  Type,
  Contrast,
  MousePointer,
  Zap,
  Sparkles,
  Layers,
  ScreenShare,
  Braces,
  Settings2,
  Volume2,
} from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const AccessibilitySettings = () => {
  const {
    textSize,
    setTextSize,
    contrast,
    setContrast,
    reducedMotion,
    setReducedMotion,
    animations,
    setAnimations,
    density,
    setDensity,
    screenReader,
    setScreenReader,
  } = useTheme();
  const { preferences } = useAccessibility();
  const announce = useAnnounce();
  const { toast } = useToast();

  const handleSave = () => {
    // Settings are automatically saved via ThemeProvider useEffect
    // This function provides user feedback
    const message = 'Your accessibility preferences have been updated and will persist across sessions.';
    
    toast({
      title: 'Settings Saved',
      description: message,
      duration: 3000,
    });
    
    // Announce to screen readers
    announce('Accessibility settings saved successfully', 'polite');
  };

  const handleResetDefaults = () => {
    setTextSize('default' as any);
    setContrast('default' as any);
    setReducedMotion(false);
    setAnimations(true);
    setDensity('comfortable');
    setScreenReader(false);
    
    const message = 'All accessibility settings have been reset to their default values.';
    
    toast({
      title: 'Settings Reset',
      description: message,
      duration: 3000,
    });
    
    // Announce to screen readers
    announce('Accessibility settings reset to defaults', 'polite');
  };

  return (
    <div className="space-y-6 max-w-4xl" role="main" aria-labelledby="accessibility-settings-title">
      <div className="space-y-2">
        <h1 id="accessibility-settings-title" className="text-3xl font-bold tracking-tight">
          Accessibility Settings
        </h1>
        <p className="text-muted-foreground text-lg">
          Configure accessibility features and preferences to improve your experience with KonBase. These settings follow WCAG 2.1 guidelines.
        </p>
      </div>
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle id="visual-preferences-title" className="flex items-center gap-3 text-xl">
            <Eye className="h-6 w-6" aria-hidden="true" />
            Visual Preferences
          </CardTitle>
          <CardDescription className="text-base">
            Adjust text size and color contrast for better readability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-0" role="group" aria-labelledby="visual-preferences-title" data-card-content>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="text-size" className="flex items-center gap-2">
                  <Type className="h-4 w-4" aria-hidden="true" />
                  Text Size
                </Label>
                <span className="text-sm text-muted-foreground capitalize">
                  {textSize}
                </span>
              </div>
              <Select
                value={textSize}
                onValueChange={(value) => {
                  setTextSize(value as any);
                  announce(`Text size changed to ${value}`, 'polite');
                }}
                aria-describedby="text-size-description"
              >
                <SelectTrigger id="text-size" aria-label="Text size selection">
                  <SelectValue placeholder="Select text size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="larger">Larger</SelectItem>
                </SelectContent>
              </Select>
              <p id="text-size-description" className="text-sm text-muted-foreground mt-1">
                Controls the size of text throughout the application
              </p>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="contrast" className="flex items-center gap-2">
                  <Contrast className="h-4 w-4" aria-hidden="true" />
                  Color Contrast
                </Label>
                <span className="text-sm text-muted-foreground capitalize">
                  {contrast}
                </span>
              </div>
              <Select
                value={contrast}
                onValueChange={(value) => {
                  setContrast(value as any);
                  announce(`Color contrast changed to ${value}`, 'polite');
                }}
                aria-describedby="contrast-description"
              >
                <SelectTrigger id="contrast" aria-label="Color contrast selection">
                  <SelectValue placeholder="Select contrast level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="increased">Increased</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <p id="contrast-description" className="text-sm text-muted-foreground mt-1">
                Enhances the difference between text and background colors
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle id="motion-animation-title" className="flex items-center gap-3 text-xl">
            <Zap className="h-6 w-6" aria-hidden="true" />
            Motion and Animation
          </CardTitle>
          <CardDescription className="text-base">
            Control animations and motion effects for comfort and accessibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-0" role="group" aria-labelledby="motion-animation-title" data-card-content>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="reduce-motion" className="text-base font-medium">
                Reduce Motion
              </Label>
              <p className="text-base text-muted-foreground">
                Minimize animations and transitions that may cause discomfort
              </p>
            </div>
            <Switch
              id="reduce-motion"
              checked={reducedMotion}
              onCheckedChange={(checked) => {
                setReducedMotion(checked);
                announce(`Reduced motion ${checked ? 'enabled' : 'disabled'}`, 'polite');
              }}
              aria-describedby="reduce-motion-description"
              className="mt-1"
            />
          </div>
          <div id="reduce-motion-description" className="p-4 bg-muted/50 rounded-lg border">
            <p className="text-base text-muted-foreground">
              When enabled, animations will be reduced or disabled to prevent motion sensitivity issues and improve focus for users with vestibular disorders.
            </p>
          </div>

          <Separator />

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Animation Level
            </Label>
            <Select
              value={animations ? 'full' : 'none'}
              onValueChange={(value) => setAnimations(value === 'full')}
              disabled={reducedMotion}
              aria-describedby="animations-description"
              aria-label="Select animation level"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select animation level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Animations</SelectItem>
                <SelectItem value="reduced">Reduced Animations</SelectItem>
                <SelectItem value="none">No Animations</SelectItem>
              </SelectContent>
            </Select>
            <p id="animations-description" className="text-sm text-muted-foreground mt-1">
              Controls the amount of animations displayed
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle id="interface-density-title" className="flex items-center gap-3 text-xl">
            <Layers className="h-6 w-6" aria-hidden="true" />
            Interface Density
          </CardTitle>
          <CardDescription className="text-base">
            Adjust spacing and sizing of interface elements for comfort and accessibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-0" role="group" aria-labelledby="interface-density-title" data-card-content>
          <div className="space-y-4">
            <Label className="text-base font-medium">Interface Density</Label>
            <ToggleGroup
              type="single"
              value={density}
              onValueChange={(value) => {
                if (value) {
                  setDensity(value as any);
                  announce(`Interface density changed to ${value}`, 'polite');
                }
              }}
              className="justify-start"
              aria-describedby="density-description"
              aria-label="Interface density selection"
            >
              <ToggleGroupItem value="compact" className="text-base px-4 py-2">Compact</ToggleGroupItem>
              <ToggleGroupItem value="comfortable" className="text-base px-4 py-2">Comfortable</ToggleGroupItem>
              <ToggleGroupItem value="spacious" className="text-base px-4 py-2">Spacious</ToggleGroupItem>
            </ToggleGroup>
            <div id="density-description" className="p-4 bg-muted/50 rounded-lg border">
              <p className="text-base text-muted-foreground">
                {density === 'compact' && 'Minimal spacing between elements for maximum information density. Best for experienced users who prefer efficiency.'}
                {density === 'comfortable' && 'Balanced spacing that meets WCAG guidelines while maintaining efficiency. Recommended for most users.'}
                {density === 'spacious' && 'Generous spacing for improved accessibility and touch interaction. Ideal for users with motor difficulties or touch devices.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle id="screen-reader-title" className="flex items-center gap-3 text-xl">
            <Volume2 className="h-6 w-6" aria-hidden="true" />
            Screen Reader
          </CardTitle>
          <CardDescription className="text-base">
            Configure screen reader announcements and optimizations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-0" role="group" aria-labelledby="screen-reader-title" data-card-content>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="screen-reader-optimized" className="text-base font-medium">
                Screen Reader Optimizations
              </Label>
              <p className="text-base text-muted-foreground">
                Enable enhanced compatibility with screen readers
              </p>
            </div>
            <Switch
              id="screen-reader-optimized"
              checked={settings.screenReaderOptimized}
              onCheckedChange={(checked) => updateSettings({ screenReaderOptimized: checked })}
              aria-describedby="screen-reader-optimized-description"
              className="mt-1"
            />
          </div>
          <div id="screen-reader-optimized-description" className="p-4 bg-muted/50 rounded-lg border">
            <p className="text-base text-muted-foreground">
              Provides additional context, descriptions, and live announcements specifically designed to improve the experience for screen reader users.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-6" role="group" aria-label="Accessibility settings actions">
        <Button 
          variant="outline" 
          onClick={handleResetDefaults}
          aria-describedby="reset-description"
        >
          Reset to Defaults
        </Button>
        <Button 
          onClick={handleSave}
          aria-describedby="save-description"
        >
          Save Changes
        </Button>
      </div>
      <div className="sr-only">
        <p id="reset-description">Reset all accessibility settings to their default values</p>
        <p id="save-description">Save current accessibility preferences and apply them immediately</p>
      </div>
    </div>
  );
};

export { AccessibilitySettings };
