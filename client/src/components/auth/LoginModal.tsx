import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormMessage 
} from '@/components/ui/form';
import { 
  RadioGroup,
  RadioGroupItem
} from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { FaLinkedin, FaGoogle } from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

// Import modals
import SignupModal from './SignupModal';
import ResetPasswordModal from './ResetPasswordModal';

// Import the logo
import logoImage from '../../cropped-logo.png';

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
  const [showPassword, setShowPassword] = useState(false);
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
        <DialogContent 
          className="sm:max-w-[450px] p-0 overflow-hidden border-0 shadow-xl"
          aria-labelledby="login-title"
          aria-describedby="login-description"
        >
          <DialogTitle id="login-title" className="sr-only">Login to your account</DialogTitle>
          <DialogDescription id="login-description" className="sr-only">
            Enter your credentials to access The Resource Consultants portal
          </DialogDescription>
          
          <div className="flex flex-col h-full">
            {/* Header with logo and title */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 pt-20 pb-10 px-4 text-white text-center">
              <div className="flex justify-center mb-6 mt-8">
                <img 
                  src={logoImage} 
                  alt="The Resource Consultants Logo" 
                  className="w-full max-w-[380px] h-auto"
                />
              </div>
              <h1 className="text-2xl font-bold">Login Now</h1>
              <p className="text-sm text-white/90 mt-2">
                Please login or sign up to continue using our app
              </p>
            </div>
            
            {/* Account type selector */}
            <div className="bg-gray-100 px-6 py-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="accountType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <div className="flex justify-center gap-2">
                          <div className="flex flex-wrap justify-center gap-2 sm:flex-nowrap">
                            <div 
                              className={`px-4 py-2 border-2 rounded-md cursor-pointer transition-all text-center min-w-[80px] ${field.value === 'applicant' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'border-gray-300 text-gray-700'}`}
                              onClick={() => form.setValue('accountType', 'applicant')}
                            >
                              <Label className="cursor-pointer font-medium">Applicant</Label>
                            </div>
                            
                            <div 
                              className={`px-4 py-2 border-2 rounded-md cursor-pointer transition-all text-center min-w-[80px] ${field.value === 'employee' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'border-gray-300 text-gray-700'}`}
                              onClick={() => form.setValue('accountType', 'employee')}
                            >
                              <Label className="cursor-pointer font-medium">Employee</Label>
                            </div>
                            
                            <div 
                              className={`px-4 py-2 border-2 rounded-md cursor-pointer transition-all text-center min-w-[80px] ${field.value === 'admin' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'border-gray-300 text-gray-700'}`}
                              onClick={() => form.setValue('accountType', 'admin')}
                            >
                              <Label className="cursor-pointer font-medium">Admin</Label>
                            </div>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Social login section */}
                  <div className="space-y-4">
                    <div className="text-center text-sm text-gray-600 font-medium">
                      Enter via Social Networks
                    </div>
                    <div className="flex justify-center gap-4">
                      <button
                        type="button"
                        className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                      >
                        <FaGoogle className="h-5 w-5 text-red-500" />
                      </button>
                      <button
                        type="button"
                        className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
                      >
                        <FaLinkedin className="h-5 w-5 text-blue-700" />
                      </button>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-gray-100 text-gray-500">or login with email</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Email and password fields */}
                  <div className="space-y-4 pt-2">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Your username or email"
                              className="h-12 px-4 border-2 border-gray-300 rounded-lg bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                            />
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
                          <FormControl>
                            <div className="relative">
                              <Input 
                                {...field} 
                                type={showPassword ? "text" : "password"}
                                placeholder="Your password" 
                                className="h-12 px-4 border-2 border-gray-300 rounded-lg bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                              />
                              <button 
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-5 w-5" />
                                ) : (
                                  <Eye className="h-5 w-5" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <button 
                        type="button" 
                        className="text-sm text-purple-600 font-medium hover:underline"
                        onClick={() => setShowResetModal(true)}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </div>
                  
                  {loginError && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-sm text-red-700">
                      {loginError}
                    </div>
                  )}
                  
                  {/* Login button */}
                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg"
                  >
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Login
                  </Button>
                  
                  {/* Demo accounts section */}
                  <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="font-medium mb-1">Demo accounts:</p>
                    <ul className="space-y-1">
                      <li>Admin: <span className="font-mono text-purple-700">admin / admin123</span></li>
                      <li>Employee: <span className="font-mono text-purple-700">employee / employee123</span></li>
                      <li>Applicant: <span className="font-mono text-purple-700">applicant / applicant123</span></li>
                    </ul>
                  </div>
                  
                  {/* Sign up link */}
                  <div className="text-center text-sm">
                    Don't have an account? {" "}
                    <button 
                      type="button" 
                      className="text-purple-600 font-medium hover:underline"
                      onClick={() => setShowSignupModal(true)}
                    >
                      Sign up
                    </button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
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