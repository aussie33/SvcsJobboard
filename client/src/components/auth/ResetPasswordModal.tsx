import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Create a schema for the reset password form
const resetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ResetFormData = z.infer<typeof resetSchema>;

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ 
  isOpen, 
  onClose
}) => {
  const { toast } = useToast();
  const [resetRequested, setResetRequested] = useState(false);
  
  // Form setup
  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: '',
    }
  });
  
  // Reset password mutation
  const mutation = useMutation({
    mutationFn: async (data: ResetFormData) => {
      const response = await apiRequest('POST', '/api/auth/reset-password', data);
      return response.json();
    },
    onSuccess: () => {
      setResetRequested(true);
      toast({
        title: "Reset Request Sent",
        description: "If an account exists with that email, you'll receive password reset instructions.",
      });
    },
    onError: (error) => {
      // Even if there's an error, we don't want to reveal if the email exists or not
      // So we show the same success message for security reasons
      setResetRequested(true);
      toast({
        title: "Reset Request Sent",
        description: "If an account exists with that email, you'll receive password reset instructions.",
      });
    }
  });
  
  const onSubmit = (data: ResetFormData) => {
    mutation.mutate(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !mutation.isPending) {
        onClose();
        // Reset the state when modal is closed
        if (resetRequested) setResetRequested(false);
      }
    }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Enter your email address and we'll send you instructions to reset your password.
          </DialogDescription>
        </DialogHeader>
        
        {resetRequested ? (
          <div className="py-6 text-center space-y-4">
            <div className="text-green-600 text-2xl">✓</div>
            <h3 className="text-xl font-medium">Request Submitted</h3>
            <p className="text-gray-500">
              If an account exists with that email, you'll receive password reset instructions shortly.
            </p>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="john.doe@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordModal;