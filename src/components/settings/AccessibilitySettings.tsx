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
} from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const AccessibilitySettings = () => {
  const { toast } = useToast();
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

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your accessibility preferences have been updated.',
    });
  };

  const handleResetDefaults = () => {
    setTextSize('default' as any);
    setContrast('default' as any);
    setReducedMotion(false);
    setAnimations(true);
    setDensity('comfortable');
    setScreenReader(false);

    toast({
      title: 'Settings Reset',
      description: 'Accessibility settings have been reset to defaults.',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Visual Preferences
          </CardTitle>
          <CardDescription>
            Customize how content appears on screen to improve readability and
            visual comfort
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="text-size" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Text Size
                </Label>
                <span className="text-sm text-muted-foreground capitalize">
                  {textSize}
                </span>
              </div>
              <Select
                value={textSize}
                onValueChange={(value) => setTextSize(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select text size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="larger">Larger</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Controls the size of text throughout the application
              </p>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="contrast" className="flex items-center gap-2">
                  <Contrast className="h-4 w-4" />
                  Color Contrast
                </Label>
                <span className="text-sm text-muted-foreground capitalize">
                  {contrast}
                </span>
              </div>
              <Select
                value={contrast}
                onValueChange={(value) => setContrast(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contrast level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="increased">Increased</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Enhances the difference between text and background colors
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointer className="h-5 w-5" />
            Motion & Animations
          </CardTitle>
          <CardDescription>
            Control movement and animations for improved comfort and reduced
            distractions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label
                htmlFor="reduced-motion"
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Reduce Motion
              </Label>
              <p className="text-sm text-muted-foreground">
                Minimize animations throughout the interface
              </p>
            </div>
            <Switch
              id="reduced-motion"
              checked={reducedMotion}
              onCheckedChange={setReducedMotion}
            />
          </div>

          <Separator />

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4" />
              Animation Level
            </Label>
            <Select
              value={animations ? 'full' : 'none'}
              onValueChange={(value) => setAnimations(value === 'full')}
              disabled={reducedMotion}
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
            <p className="text-sm text-muted-foreground mt-1">
              Controls the amount of animations displayed
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Interface Density
          </CardTitle>
          <CardDescription>
            Adjust the spacing between UI elements to match your preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Density</Label>
            <ToggleGroup
              type="single"
              value={density}
              onValueChange={(value) => {
                if (value) setDensity(value as any);
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
              <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
              <ToggleGroupItem value="spacious">Spacious</ToggleGroupItem>
            </ToggleGroup>
            <p className="text-sm text-muted-foreground mt-1">
              Controls the spacing between items throughout the interface
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScreenShare className="h-5 w-5" />
            Assistive Technology
          </CardTitle>
          <CardDescription>
            Configure settings for compatibility with assistive technologies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label
                htmlFor="screen-reader"
                className="flex items-center gap-2"
              >
                <Braces className="h-4 w-4" />
                Screen Reader Optimizations
              </Label>
              <p className="text-sm text-muted-foreground">
                Improve compatibility with screen readers and other assistive
                technologies
              </p>
            </div>
            <Switch
              id="screen-reader"
              checked={screenReader}
              onCheckedChange={setScreenReader}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleResetDefaults}
          className="flex items-center gap-2"
        >
          <Settings2 className="h-4 w-4" />
          Reset to Defaults
        </Button>
        <Button onClick={handleSave}>Save Preferences</Button>
      </div>
    </div>
  );
};

export { AccessibilitySettings };
