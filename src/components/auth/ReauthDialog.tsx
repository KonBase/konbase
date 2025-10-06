import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';

const formSchema = z.object({
  password: z.string().min(1, {
    message: 'Password is required.',
  }),
  mfaCode: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ReauthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (password: string, mfaCode?: string) => Promise<boolean>;
  actionName?: string;
  isVerifying?: boolean;
}

const ReauthDialog: React.FC<ReauthDialogProps> = ({
  isOpen,
  onClose,
  onVerify,
  actionName = "perform this action",
  isVerifying = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showMFA, setShowMFA] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      mfaCode: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    const success = await onVerify(values.password, values.mfaCode);
    
    if (success) {
      form.reset();
      onClose();
    }
  };

  const handleClose = () => {
    if (!isVerifying) {
      form.reset();
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security Verification Required
          </AlertDialogTitle>
          <AlertDialogDescription>
            For your security, please verify your identity to {actionName}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This helps protect your account from unauthorized access to sensitive operations.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          {...field}
                          disabled={isVerifying}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isVerifying}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel>Two-Factor Authentication (Optional)</FormLabel>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMFA(!showMFA)}
                    disabled={isVerifying}
                    className="text-xs"
                  >
                    {showMFA ? 'Hide' : 'Show'} MFA
                  </Button>
                </div>
                
                {showMFA && (
                  <FormField
                    control={form.control}
                    name="mfaCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Enter 6-digit code (optional)"
                            maxLength={6}
                            {...field}
                            disabled={isVerifying}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isVerifying}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full sm:w-auto"
                >
                  {isVerifying ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Identity'
                  )}
                </Button>
              </AlertDialogFooter>
            </form>
          </Form>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ReauthDialog;
