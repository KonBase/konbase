'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { LayoutDashboard, Github, MessageCircle } from 'lucide-react';
import UserMenu from './shared/UserMenu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { checkUserHasRole } from '@/contexts/auth/AuthUtils'; // Import the utility function
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function HomeHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, userProfile } = useAuth(); // user object now contains profileImage, userProfile might be redundant here if only avatar is needed from it.

  // Extract user display values with fallbacks
  const userName =
    user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';

  // Check if user has admin access using the utility function
  // Pass 'userProfile' which should contain the role information
  // Ensure checkUserHasRole expects UserProfile or adapt the function/type
  const isAdmin =
    userProfile &&
    (checkUserHasRole(userProfile, 'admin') ||
      checkUserHasRole(userProfile, 'system_admin') ||
      checkUserHasRole(userProfile, 'super_admin'));
  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  const renderMobileMenu = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent side="left" className="w-[80vw] max-w-[300px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="py-4 px-4">
          <nav className="flex flex-col space-y-4">
            <Link
              href="/#features"
              className="px-4 py-2 hover:bg-accent rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/#about"
              className="px-4 py-2 hover:bg-accent rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <div className="px-4 py-2">
              <h3 className="font-medium mb-2">Community</h3>
              <div className="ml-2 space-y-2">
                <a
                  href="https://github.com/KonBase/KonBase"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-accent rounded-md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </a>
                <a
                  href="https://discord.gg/konbase"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-accent rounded-md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Discord</span>
                </a>
              </div>
            </div>
            <div className="pt-4 border-t">
              {!!user ? (
                <Button
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push('/dashboard');
                  }}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogin();
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleRegister();
                    }}
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <header className="w-full border-b bg-konbase-blue text-konbase-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="text-konbase-white mr-2 md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </Button>

            <Link href="/" className="flex items-center space-x-2">
              <img
                src="/uploads/23ec7a1d-12fd-47d9-b8eb-080c0d7c18e5.png"
                alt="KonBase Logo"
                className="h-10 w-10"
              />
              <h1 className="text-2xl font-bold text-konbase-yellow">
                KonBase
              </h1>
            </Link>
          </div>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link
                  href="/#features"
                  className="text-konbase-white hover:text-konbase-yellow px-4 py-2 transition-colors"
                >
                  Features
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link
                  href="/#about"
                  className="text-konbase-white hover:text-konbase-yellow px-4 py-2 transition-colors"
                >
                  About
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-konbase-white bg-transparent hover:bg-konbase-blue-800/40 hover:text-konbase-yellow">
                  Community
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-4 w-[400px] bg-white dark:bg-gray-800 text-foreground">
                    <a
                      href="https://github.com/KonBase/KonBase"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded-md"
                    >
                      <Github className="h-5 w-5 dark:text-konbase-yellow" />
                      <div>
                        <div className="font-medium">GitHub</div>
                        <div className="text-sm text-muted-foreground">
                          Contribute to the code
                        </div>
                      </div>
                    </a>
                    <a
                      href="https://discord.gg/konbase"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded-md"
                    >
                      <MessageCircle className="h-5 w-5 dark:text-konbase-yellow" />
                      <div>
                        <div className="font-medium">Discord</div>
                        <div className="text-sm text-muted-foreground">
                          Join the community
                        </div>
                      </div>
                    </a>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-2">
            {!!user ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDashboard}
                  className="text-konbase-white bg-transparent border-konbase-white/30 hover:bg-konbase-blue-800/40 hover:text-konbase-yellow hidden sm:flex"
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>

                <div className="hidden sm:block">
                  <ThemeToggle />
                </div>

                <UserMenu userImage={user?.profileImage}
                  userName={userName}
                  userEmail={userEmail}
                  isAdmin={isAdmin}
                  variant="ghost"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="hidden sm:block">
                  <ThemeToggle />
                </div>
                <Button
                  variant="ghost"
                  onClick={handleLogin}
                  className="text-konbase-white hover:text-konbase-yellow hover:bg-konbase-blue-800/40 hidden sm:inline-flex"
                >
                  Login
                </Button>
                <Button
                  onClick={handleRegister}
                  className="bg-konbase-yellow text-konbase-blue hover:bg-konbase-yellow/90"
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {renderMobileMenu()}
    </>
  );
}

export default HomeHeader;
