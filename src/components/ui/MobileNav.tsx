import { useState } from 'react';
import { Menu, ChevronRight, Settings, User, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  navItems,
  type SidebarItem,
} from '@/components/layout/navigation/navItems';
import { useAuth } from '@/contexts/auth';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = usePathname();
  const router = useRouter();

  const userInitial = user?.email ? user.email[0].toUpperCase() : '?';
  const userName =
    user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  const isActive = (path: string) => {
    return location === path || location.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    router.push('/login');
  };

  // Render a nav item with its submenu (if any)
  const renderNavItem = (item: SidebarItem) => {
    const active = isActive(item.path);

    return (
      <div key={item.path} className="mb-2">
        <Link
          href={item.path}
          onClick={() => setOpen(false)}
          className={cn(
            'flex items-center justify-between w-full p-3 rounded-md text-sm transition-colors',
            active
              ? 'bg-accent text-accent-foreground font-medium'
              : 'hover:bg-accent/50',
          )}
        >
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">{item.icon}</span>
            <span>{item.title}</span>
          </div>
          {item.submenu && <ChevronRight className="h-4 w-4 opacity-70" />}
        </Link>

        {item.submenu && (
          <div className="ml-6 mt-1 space-y-1 border-l pl-4 border-sidebar-border">
            {item.submenu.map((subItem) => (
              <Link
                key={subItem.path}
                href={subItem.path}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-md text-sm transition-colors',
                  isActive(subItem.path)
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'hover:bg-accent/50',
                )}
              >
                <span className="text-muted-foreground">{subItem.icon}</span>
                <span>{subItem.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[85vw] max-w-[300px] p-0 overflow-hidden"
      >
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="flex items-center gap-2">
            <img
              src="/uploads/23ec7a1d-12fd-47d9-b8eb-080c0d7c18e5.png"
              alt="KonBase Logo"
              className="h-7 w-7"
            />
            KonBase Dashboard
          </SheetTitle>
          <SheetDescription className="sr-only">
            Navigate through different sections of your KonBase dashboard
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-65px)]">
          <div className="flex items-center p-4 border-b bg-muted/40">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarFallback>{userInitial}</AvatarFallback>
              {user?.user_metadata?.avatar_url && (
                <AvatarImage
                  src={user.user_metadata.avatar_url}
                  alt={userName}
                />
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{userName}</div>
              <div className="text-xs text-muted-foreground truncate">
                {user?.email}
              </div>
            </div>
            <ThemeToggle />
          </div>

          <ScrollArea className="flex-1 p-3">
            <div className="mb-3">
              <Badge variant="outline" className="mb-2">
                Main Navigation
              </Badge>
              <nav className="flex flex-col space-y-1">
                {navItems.filter((item) => !item.submenu).map(renderNavItem)}
              </nav>
            </div>

            <Separator className="my-3" />

            {navItems
              .filter((item) => item.submenu)
              .map((category) => (
                <div key={category.path} className="mb-3">
                  <Badge variant="outline" className="mb-2">
                    {category.title}
                  </Badge>
                  <nav className="flex flex-col space-y-1">
                    {category.submenu?.map((subItem) => (
                      <Link
                        key={subItem.path}
                        href={subItem.path}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-md text-sm transition-colors',
                          isActive(subItem.path)
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'hover:bg-accent/50',
                        )}
                      >
                        <span className="text-muted-foreground">
                          {subItem.icon}
                        </span>
                        <span>{subItem.title}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
              ))}
          </ScrollArea>

          <div className="p-3 border-t">
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 p-2 rounded-md text-sm hover:bg-accent/50 transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 p-2 rounded-md text-sm hover:bg-accent/50 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </div>
            <Button
              variant="outline"
              className="w-full mt-2 text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
