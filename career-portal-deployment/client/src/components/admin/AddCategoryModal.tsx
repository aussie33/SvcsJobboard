import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { insertCategorySchema, Category } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editCategory?: Category | null;
}

type FormData = { 
  name: string; 
  description: string; 
  status: string;
};

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  editCategory 
}) => {
  const { toast } = useToast();
  
  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'active'
    }
  });
  
  // Set default values when editing a category
  useEffect(() => {
    if (editCategory) {
      form.reset({
        name: editCategory.name,
        description: editCategory.description || '',
        status: editCategory.status
      });
    } else {
      form.reset({
        name: '',
        description: '',
        status: 'active'
      });
    }
  }, [editCategory, form]);
  
  // Create/update category mutation
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Create or update category
      const url = editCategory ? `/api/categories/${editCategory.id}` : '/api/categories';
      const method = editCategory ? 'PATCH' : 'POST';
      
      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      onSave();
      toast({
        title: editCategory ? "Category Updated" : "Category Created",
        description: editCategory 
          ? "Category has been updated successfully." 
          : "Category has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while saving the category",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !mutation.isPending) onClose();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Engineering" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Brief description of this category"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="active" id="category-active" />
                        <Label htmlFor="category-active">Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="inactive" id="category-inactive" />
                        <Label htmlFor="category-inactive">Inactive</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
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
                {editCategory ? 'Update Category' : 'Add Category'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCategoryModal;
