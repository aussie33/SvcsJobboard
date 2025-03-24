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
import { Loader2, Lock, User } from 'lucide-react';
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
  username: z.string().min(1, 'Username or email is required'),
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
      accountType: 'applicant'
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
        <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border-2 border-gray-300">
          <DialogHeader>
            <DialogTitle className="text-xl text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">Login to Your Account</DialogTitle>
            <DialogDescription className="text-center">
              Enter your credentials to access your account. You can log in with either your username or email address.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-purple-800 font-medium">Account Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                      >
                        <div className={`flex items-center justify-center space-x-2 border-2 rounded-md p-3 cursor-pointer transition-all ${field.value === 'applicant' ? 'bg-purple-100 border-purple-500 shadow-sm' : 'border-gray-300 hover:border-purple-400'}`}>
                          <RadioGroupItem value="applicant" id="account-applicant" className="sr-only" />
                          <Label htmlFor="account-applicant" className="cursor-pointer font-medium">Job Applicant</Label>
                        </div>
                        <div className={`flex items-center justify-center space-x-2 border-2 rounded-md p-3 cursor-pointer transition-all ${field.value === 'employee' ? 'bg-purple-100 border-purple-500 shadow-sm' : 'border-gray-300 hover:border-purple-400'}`}>
                          <RadioGroupItem value="employee" id="account-employee" className="sr-only" />
                          <Label htmlFor="account-employee" className="cursor-pointer font-medium">Employee</Label>
                        </div>
                        <div className={`flex items-center justify-center space-x-2 border-2 rounded-md p-3 cursor-pointer transition-all ${field.value === 'admin' ? 'bg-purple-100 border-purple-500 shadow-sm' : 'border-gray-300 hover:border-purple-400'}`}>
                          <RadioGroupItem value="admin" id="account-admin" className="sr-only" />
                          <Label htmlFor="account-admin" className="cursor-pointer font-medium">Administrator</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg border-2 border-purple-200 shadow-sm">
                <div className="flex justify-center mb-3">
                  <svg 
                    width="80" 
                    height="80" 
                    viewBox="0 0 200 200" 
                  >
                    <polygon 
                      points="100,20 180,160 20,160" 
                      fill="#9333ea" 
                      stroke="#9333ea" 
                      strokeWidth="6"
                    />
                    <polygon 
                      points="100,60 140,120 60,120" 
                      fill="#1e1e1e" 
                      stroke="#9333ea" 
                      strokeWidth="0"
                    />
                    <path 
                      d="M 100,20 L 100,160" 
                      stroke="#9333ea" 
                      strokeWidth="6"
                      fill="none"
                    />
                    <path 
                      d="M 54,120 L 146,120" 
                      stroke="#9333ea" 
                      strokeWidth="6"
                      fill="none"
                    />
                  </svg>
                </div>
                <div className="mb-3 text-center">
                  <h3 className="text-purple-900 font-semibold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">Enter Your Credentials</h3>
                </div>
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="mb-4">
                      <FormLabel className="text-purple-800 font-medium">Username or Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 h-4 w-4" />
                          <Input 
                            {...field} 
                            placeholder="Enter your username or email" 
                            className="pl-10 border-2 border-gray-300 focus:border-purple-500 transition-colors focus:ring-purple-300 bg-white"
                          />
                        </div>
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
                      <FormLabel className="text-purple-800 font-medium">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 h-4 w-4" />
                          <Input 
                            {...field} 
                            type="password" 
                            placeholder="Enter your password" 
                            className="pl-10 border-2 border-gray-300 focus:border-purple-500 transition-colors focus:ring-purple-300 bg-white"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Account management links */}
              <div className="flex justify-center bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-4 border-2 border-purple-200 shadow-sm">
                <div className="text-sm flex gap-6">
                  <button 
                    type="button" 
                    className="text-purple-700 hover:text-purple-900 font-medium hover:underline text-center flex items-center gap-1"
                    onClick={() => setShowSignupModal(true)}
                  >
                    <span className="text-xs">➕</span> Create an account
                  </button>
                  <button 
                    type="button" 
                    className="text-purple-700 hover:text-purple-900 font-medium hover:underline text-center flex items-center gap-1"
                    onClick={() => setShowResetModal(true)}
                  >
                    <span className="text-xs">🔑</span> Forgot password?
                  </button>
                </div>
              </div>
              
              {loginError && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 p-3 rounded-md text-sm">
                  {loginError}
                </div>
              )}

              <div className="text-sm text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                <p className="font-medium mb-2">Demo accounts available:</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-600"></span> 
                    Admin: <strong className="text-blue-800">admin</strong> / <strong className="text-blue-800">admin123</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-600"></span> 
                    Employee: <strong className="text-green-800">employee</strong> / <strong className="text-green-800">employee123</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-600"></span> 
                    Applicant: <strong className="text-purple-800">applicant</strong> / <strong className="text-purple-800">applicant123</strong>
                  </li>
                </ul>
              </div>
              
              <DialogFooter className="gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isLoading}
                  className="border-2 border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium border-2 border-purple-400 shadow-md"
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
          onClose={() => {
            setShowSignupModal(false);
            // Close the parent login modal as well when account creation is successful
            onClose();
          }} 
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