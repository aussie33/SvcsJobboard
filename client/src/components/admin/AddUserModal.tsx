import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { insertUserSchema, User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Shield, AlertCircle } from 'lucide-react';
import { z } from 'zod';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editUser?: User | null;
}

// Extended schema for the form
const formSchema = insertUserSchema.extend({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  preferredName: z.string().optional(),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
  notes: z.string().optional(),
  isSuperAdmin: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof formSchema>;

const AddUserModal: React.FC<AddUserModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  editUser 
}) => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [showSuperAdminField, setShowSuperAdminField] = useState(false);
  
  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      middleName: '',
      preferredName: '',
      fullName: '',
      role: 'employee',
      department: '',
      isActive: true,
      notes: ''
    }
  });
  
  // Check if current user is super admin
  useEffect(() => {
    setShowSuperAdminField(currentUser?.isSuperAdmin === true);
  }, [currentUser]);

  // Set default values when editing a user
  useEffect(() => {
    if (editUser) {
      form.reset({
        username: editUser.username,
        email: editUser.email,
        password: '', // Don't expose the password
        confirmPassword: '',
        firstName: editUser.firstName || '',
        lastName: editUser.lastName || '',
        middleName: editUser.middleName || '',
        preferredName: editUser.preferredName || '',
        fullName: editUser.fullName,
        role: editUser.role,
        department: editUser.department || '',
        isActive: editUser.isActive,
        isSuperAdmin: editUser.isSuperAdmin || false,
        notes: ''
      });
    } else {
      form.reset({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        middleName: '',
        preferredName: '',
        fullName: '',
        role: 'employee',
        department: '',
        isActive: true,
        isSuperAdmin: false,
        notes: ''
      });
    }
  }, [editUser, form]);
  
  // Create/update user mutation
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Remove confirmPassword and notes from data before sending
      const { confirmPassword, notes, ...userData } = data;
      
      // Create or update user
      const url = editUser ? `/api/users/${editUser.id}` : '/api/users';
      const method = editUser ? 'PATCH' : 'POST';
      
      // If editing and password is empty, remove it from the request
      if (editUser && !userData.password) {
        const { password, ...userDataWithoutPassword } = userData;
        const response = await apiRequest(method, url, userDataWithoutPassword);
        return response.json();
      }
      
      const response = await apiRequest(method, url, userData);
      return response.json();
    },
    onSuccess: () => {
      onSave();
      toast({
        title: editUser ? "User Updated" : "User Created",
        description: editUser 
          ? "User account has been updated successfully." 
          : "User account has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while saving the user",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: FormData) => {
    // Generate the fullName from name components if not explicitly provided
    if (!data.fullName || data.fullName.trim() === '') {
      data.fullName = `${data.firstName} ${data.middleName ? data.middleName + ' ' : ''}${data.lastName}`.trim();
    }
    
    mutation.mutate(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !mutation.isPending) onClose();
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Doe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="A." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="preferredName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Johnny" />
                    </FormControl>
                    <FormDescription>
                      If provided, this name will be displayed in greetings
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="johndoe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="john.doe@example.com" type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{editUser ? 'New Password (leave blank to keep current)' : 'Password'}</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="••••••••" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="••••••••" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Reset isSuperAdmin to false if role is not admin
                        if (value !== 'admin' && form.getValues('isSuperAdmin')) {
                          form.setValue('isSuperAdmin', false);
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="applicant">Applicant</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Engineering" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === 'active')}
                      value={field.value ? 'active' : 'inactive'}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="active" id="status-active" />
                        <Label htmlFor="status-active">Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="inactive" id="status-inactive" />
                        <Label htmlFor="status-inactive">Inactive</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {showSuperAdminField && form.watch('role') === 'admin' && (
              <FormField
                control={form.control}
                name="isSuperAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 space-y-0">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-purple-600" />
                        Super Admin
                      </FormLabel>
                      <FormDescription>
                        Super Admins have additional privileges and cannot be modified by regular admins.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={editUser?.isSuperAdmin && currentUser?.id !== editUser?.id}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Additional notes about this user"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    These notes are for administrative purposes only.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
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
                {editUser ? 'Update User' : 'Add User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserModal;
