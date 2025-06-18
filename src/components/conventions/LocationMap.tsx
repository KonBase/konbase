'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  PlusIcon,
  MinusIcon,
  MoveIcon,
  SaveIcon,
  InfoIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ConventionLocation } from '@/types/convention';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LocationMapProps {
  conventionId: string;
  locations: ConventionLocation[];
  onLocationPositionChange?: (locationId: string, x: number, y: number) => void;
  onRefreshLocations?: () => void;
}

// Color mapping for location types
const typeColors: Record<string, { bg: string; border: string; text: string }> =
  {
    room: { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white' },
    hall: {
      bg: 'bg-emerald-500',
      border: 'border-emerald-600',
      text: 'text-white',
    },
    area: {
      bg: 'bg-amber-400',
      border: 'border-amber-500',
      text: 'text-amber-950',
    },
    storage: {
      bg: 'bg-gray-500',
      border: 'border-gray-600',
      text: 'text-white',
    },
    booth: {
      bg: 'bg-yellow-300',
      border: 'border-yellow-400',
      text: 'text-yellow-950',
    },
    stage: {
      bg: 'bg-purple-500',
      border: 'border-purple-600',
      text: 'text-white',
    },
    other: { bg: 'bg-teal-500', border: 'border-teal-600', text: 'text-white' },
  };

// Default color if type is not recognized
const defaultColor = {
  bg: 'bg-gray-400',
  border: 'border-gray-500',
  text: 'text-white',
};

const LocationMap: React.FC<LocationMapProps> = ({
  conventionId,
  locations,
  onLocationPositionChange,
  onRefreshLocations,
}) => {
  const { toast } = useToast();
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedLocation, setDraggedLocation] = useState<string | null>(null);
  const [positions, setPositions] = useState<{
    [id: string]: { x: number; y: number };
  }>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize positions from locations
  useEffect(() => {
    const initialPositions: { [id: string]: { x: number; y: number } } = {};

    locations.forEach((location) => {
      initialPositions[location.id] = {
        x: location.map_x !== null ? location.map_x : Math.random() * 80 + 10,
        y: location.map_y !== null ? location.map_y : Math.random() * 80 + 10,
      };
    });

    setPositions(initialPositions);
  }, [locations]);

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const handleLocationMouseDown = (locationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDraggedLocation(locationId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedLocation || !mapContainerRef.current) return;

    const mapRect = mapContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - mapRect.left) / mapRect.width) * 100;
    const y = ((e.clientY - mapRect.top) / mapRect.height) * 100;

    // Ensure within bounds (accounting for element size)
    const boundedX = Math.max(5, Math.min(95, x));
    const boundedY = Math.max(5, Math.min(95, y));

    setPositions((prev) => ({
      ...prev,
      [draggedLocation]: { x: boundedX, y: boundedY },
    }));

    setHasChanges(true);

    // Auto-save after short delay of no movement
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      savePositionChanges();
    }, 1000);
  };

  const handleMouseUp = () => {
    if (isDragging && draggedLocation && positions[draggedLocation]) {
      // Update parent component if callback exists
      if (onLocationPositionChange) {
        onLocationPositionChange(
          draggedLocation,
          positions[draggedLocation].x,
          positions[draggedLocation].y,
        );
      }

      // If no auto-save is pending, save now
      if (!saveTimeoutRef.current) {
        savePositionChanges();
      }
    }

    setIsDragging(false);
    setDraggedLocation(null);
  };

  const savePositionChanges = async () => {
    if (!hasChanges) return;

    setIsAutoSaving(true);

    try {
      // Process updates one at a time to ensure all succeed
      for (const [id, pos] of Object.entries(positions)) {
        const { error } = await supabase
          .from('convention_locations')
          .update({
            map_x: pos.x,
            map_y: pos.y,
          })
          .eq('id', id)
          .eq('convention_id', conventionId);

        if (error) throw error;
      }

      setHasChanges(false);

      toast({
        title: 'Map updated',
        description: 'Location positions have been saved.',
        variant: 'default',
      });

      // Refresh data if callback exists
      if (onRefreshLocations) {
        onRefreshLocations();
      }
    } catch (error: any) {
      console.error('Error saving location positions:', error);
      toast({
        title: 'Failed to save positions',
        description:
          error.message || 'An error occurred while saving location positions.',
        variant: 'destructive',
      });
    } finally {
      setIsAutoSaving(false);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    }
  };

  // Calculate a size based on location capacity
  const getLocationSize = (capacity: number | null) => {
    if (!capacity || capacity <= 0) return 10; // Default size

    // Scale logarithmically to prevent huge differences
    // Min size: 10px, Max size: 50px
    const minSize = 10;
    const maxSize = 50;
    const minCapacity = 1;
    const maxCapacity = 1000;

    const logMin = Math.log(minCapacity);
    const logMax = Math.log(maxCapacity);
    const scale =
      (Math.log(Math.min(Math.max(capacity, minCapacity), maxCapacity)) -
        logMin) /
      (logMax - logMin);

    return minSize + scale * (maxSize - minSize);
  };

  // Generate layout grid for the map
  const generateMapGrid = () => {
    const grid = [];

    // Create a more structured grid with labeled sections
    const sections = [
      { name: 'North Wing', x: 10, y: 15, width: 35, height: 20 },
      { name: 'Main Hall', x: 30, y: 40, width: 40, height: 35 },
      { name: 'South Wing', x: 10, y: 70, width: 35, height: 20 },
      { name: 'East Wing', x: 75, y: 40, width: 20, height: 40 },
    ];

    sections.forEach((section, i) => {
      grid.push(
        <div
          key={`section-${i}`}
          className="absolute bg-muted/20 border border-muted-foreground/20 rounded-md"
          style={{
            left: `${section.x}%`,
            top: `${section.y}%`,
            width: `${section.width}%`,
            height: `${section.height}%`,
          }}
        >
          <div className="absolute top-1 left-2 text-xs text-muted-foreground font-medium">
            {section.name}
          </div>
        </div>,
      );
    });

    // Add walkways/corridors
    const corridors = [
      { x: 45, y: 5, width: 10, height: 35, orientation: 'vertical' },
      { x: 5, y: 45, width: 90, height: 10, orientation: 'horizontal' },
      { x: 60, y: 55, width: 15, height: 25, orientation: 'vertical' },
    ];

    corridors.forEach((corridor, i) => {
      grid.push(
        <div
          key={`corridor-${i}`}
          className="absolute bg-background/50 border border-border/40"
          style={{
            left: `${corridor.x}%`,
            top: `${corridor.y}%`,
            width: `${corridor.width}%`,
            height: `${corridor.height}%`,
          }}
        />,
      );
    });

    return grid;
  };

  // Get the color style for a location type
  const getLocationTypeColor = (type: string | null) => {
    if (!type) return defaultColor;
    return typeColors[type.toLowerCase()] || defaultColor;
  };

  return (
    <Card className="relative p-1 overflow-hidden">
      <div className="flex justify-between items-center p-2 space-x-2">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={zoomIn}
            className="h-8 w-8"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={zoomOut}
            className="h-8 w-8 ml-1"
          >
            <MinusIcon className="h-4 w-4" />
          </Button>
          <span className="ml-2 text-xs text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {isDragging && (
            <span className="text-xs text-muted-foreground animate-pulse">
              <MoveIcon className="h-3 w-3 inline mr-1" />
              Dragging location...
            </span>
          )}
          {isAutoSaving && (
            <span className="text-xs text-muted-foreground animate-pulse">
              <SaveIcon className="h-3 w-3 inline mr-1" />
              Auto-saving...
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={savePositionChanges}
          disabled={!hasChanges || isAutoSaving}
        >
          <SaveIcon className="h-4 w-4 mr-1" />
          Save Positions
        </Button>
      </div>

      {/* Type color indicators */}
      <div className="flex flex-wrap gap-2 mb-2 px-2 justify-center">
        {Object.entries(typeColors).map(([type, colors]) => (
          <div key={type} className="flex items-center text-xs">
            <span
              className={`inline-block w-3 h-3 rounded-sm ${colors.bg} ${colors.border} border mr-1`}
            ></span>
            <span className="capitalize">{type}</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground px-2 pb-1">
        Drag locations to position them on the map. Size represents capacity.
        Positions are auto-saved when you stop dragging.
      </div>

      <div
        ref={mapContainerRef}
        className="relative h-[500px] border border-muted bg-black/5 dark:bg-white/5 rounded-md overflow-hidden shadow-inner"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="absolute inset-0 transition-transform duration-200 ease-out origin-center"
          style={{ transform: `scale(${scale})` }}
        >
          {/* Map grid background with subtle pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzMzMzMzIyIiBvcGFjaXR5PSIwLjIiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]" />

          {/* Map layout */}
          {generateMapGrid()}

          {/* Location markers */}
          <TooltipProvider>
            {locations.map((location) => {
              const position = positions[location.id] || { x: 50, y: 50 };
              const size = getLocationSize(location.capacity);
              const { bg, border, text } = getLocationTypeColor(location.type);

              return (
                <Tooltip key={location.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        'absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200',
                        isDragging && draggedLocation === location.id
                          ? 'z-50 scale-110 shadow-xl'
                          : 'z-10',
                        isDragging && draggedLocation === location.id
                          ? 'cursor-grabbing'
                          : 'cursor-grab',
                        hoveredLocation === location.id
                          ? 'ring-2 ring-primary ring-offset-1'
                          : '',
                      )}
                      style={{
                        left: `${position.x}%`,
                        top: `${position.y}%`,
                        width: `${size}px`,
                        height: `${size}px`,
                      }}
                      onMouseDown={(e) =>
                        handleLocationMouseDown(location.id, e)
                      }
                      onMouseEnter={() => setHoveredLocation(location.id)}
                      onMouseLeave={() => setHoveredLocation(null)}
                    >
                      <div
                        className={cn(
                          'h-full w-full flex items-center justify-center rounded-md',
                          'shadow-md transition-colors border',
                          bg,
                          border,
                          text,
                          'overflow-hidden',
                        )}
                      >
                        {size > 20 && (
                          <span className="text-xs font-semibold truncate px-1">
                            {size > 30
                              ? location.name.substring(0, 10) +
                                (location.name.length > 10 ? '...' : '')
                              : location.capacity}
                          </span>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="center"
                    className="max-w-[250px]"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold">{location.name}</p>
                      {location.description && (
                        <p className="text-xs opacity-80">
                          {location.description}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                        <span className="font-medium">Type:</span>
                        <span className="capitalize">
                          {location.type || '-'}
                        </span>

                        <span className="font-medium">Capacity:</span>
                        <span>{location.capacity || '-'}</span>

                        {location.building && (
                          <>
                            <span className="font-medium">Building:</span>
                            <span>{location.building}</span>
                          </>
                        )}

                        {location.floor && (
                          <>
                            <span className="font-medium">Floor:</span>
                            <span>{location.floor}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </div>

      {/* Map Legend */}
      <div className="mt-2 p-2 border rounded-md bg-card text-xs flex flex-wrap gap-2 justify-between">
        <div className="flex items-center">
          <InfoIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
          <span>Size represents capacity</span>
        </div>
        <div className="flex items-center">
          <MoveIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
          <span>Drag to position locations</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-sm bg-primary mr-1"></span>
          <span>Hover for details</span>
        </div>
      </div>
    </Card>
  );
};

export default LocationMap;
