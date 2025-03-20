import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  RadioGroup,
  RadioGroupItem
} from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

// Import modals
import SignupModal from './SignupModal';
import ResetPasswordModal from './ResetPasswordModal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  accountType: z.enum(['admin', 'employee', 'applicant'], {
    required_error: 'You need to select an account type',
  })
});

type FormData = z.infer<typeof formSchema>;

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
      accountType: 'employee'
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setLoginError('');
    
    try {
      const user = await login({
        username: data.username,
        password: data.password
      });
      
      onClose();
      
      // Check if the user role matches the selected account type
      if (user && user.role !== data.accountType) {
        toast({
          title: "Account Type Mismatch",
          description: `You selected ${data.accountType} but logged in as ${user.role}. Redirecting to the correct portal.`,
          variant: "destructive"
        });
      }
      
      // Force a page refresh to ensure the session is properly recognized
      setTimeout(() => {
        if (user && user.role === 'admin') {
          window.location.href = '/admin';
        } else if (user && user.role === 'employee') {
          window.location.href = '/employee';
        } else {
          window.location.href = '/';
        }
      }, 500);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Login to Your Account</DialogTitle>
            <DialogDescription>
              Enter your credentials to access your account.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Account Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="admin" id="account-admin" />
                          <Label htmlFor="account-admin">Administrator</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="employee" id="account-employee" />
                          <Label htmlFor="account-employee">Employee</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="applicant" id="account-applicant" />
                          <Label htmlFor="account-applicant">Job Applicant</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="password" 
                        placeholder="Enter your password" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Account management links */}
              <div className="text-sm flex flex-col space-y-2">
                <button 
                  type="button" 
                  className="text-primary hover:underline text-left"
                  onClick={() => setShowSignupModal(true)}
                >
                  Create an account
                </button>
                <button 
                  type="button" 
                  className="text-primary hover:underline text-left"
                  onClick={() => setShowResetModal(true)}
                >
                  Forgot password?
                </button>
              </div>
              
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
                  {loginError}
                </div>
              )}

              <div className="text-sm text-gray-500">
                <p>Demo accounts available:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Admin: username: <strong>admin</strong>, password: <strong>admin123</strong></li>
                  <li>Employee: username: <strong>employee</strong>, password: <strong>employee123</strong></li>
                  <li>Applicant: username: <strong>applicant</strong>, password: <strong>applicant123</strong></li>
                </ul>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Login
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Signup Modal */}
      {showSignupModal && (
        <SignupModal 
          isOpen={showSignupModal} 
          onClose={() => setShowSignupModal(false)} 
        />
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <ResetPasswordModal 
          isOpen={showResetModal} 
          onClose={() => setShowResetModal(false)} 
        />
      )}
    </>
  );
};

export default LoginModal;