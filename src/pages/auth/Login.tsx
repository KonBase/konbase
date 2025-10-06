
import LoginForm from '@/components/auth/LoginForm';
import SupabaseAuthDebug from '@/components/debug/SupabaseAuthDebug';
import { ScrollArea } from '@/components/ui/scroll-area';

const Login = () => {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <div className="hidden lg:flex flex-1 bg-primary/10 items-center justify-center p-8">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-6 text-primary">KonBase Supply Chain</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Streamline your convention inventory management with our comprehensive solution.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 14v1" />
                  <path d="M9 19v2" />
                  <path d="M9 3v2" />
                  <path d="M9 9v1" />
                  <path d="M15 14v1" />
                  <path d="M15 19v2" />
                  <path d="M15 3v2" />
                  <path d="M15 9v1" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Equipment Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Keep track of every item in your inventory with location and status updates.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 9h8" />
                  <path d="M8 13h5" />
                  <path d="M8 4h8a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
                  <path d="M8 12h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
                  <path d="M8 20h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1Z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Convention Management</h3>
                <p className="text-sm text-muted-foreground">
                  Plan and manage your conventions with equipment requirements and room mapping.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Association Management</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your organization members, permissions and equipment sharing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-8 flex items-center justify-center">
        <div className="max-w-md mx-auto w-full space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">KonBase</h1>
            <p className="text-muted-foreground">Supply Chain Management</p>
          </div>
          <LoginForm />
          
          {/* Temporary debug component - remove in production */}
          <div className="border-t pt-8">
            <h2 className="text-lg font-semibold mb-4 text-center">Debug: Supabase Auth</h2>
            <SupabaseAuthDebug />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Login;
