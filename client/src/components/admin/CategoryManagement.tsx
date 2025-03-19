import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/formatters';
import { Category } from '@shared/schema';
import { Loader2 } from 'lucide-react';
import AddCategoryModal from './AddCategoryModal';

const CategoryManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch categories including inactive ones
  const { data: categories, isLoading } = useQuery({
    queryKey: ['/api/categories', { includeInactive: true }],
  });

  // Get jobs to count per category
  const { data: jobs } = useQuery({
    queryKey: ['/api/jobs'],
  });

  // Update category status mutation
  const toggleCategoryStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/categories/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Status Updated",
        description: "Category status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update category status",
        variant: "destructive",
      });
    }
  });

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (category: Category) => {
    const newStatus = category.status === 'active' ? 'inactive' : 'active';
    toggleCategoryStatus.mutate({ id: category.id, status: newStatus });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleCategorySaved = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
  };

  // Count jobs per category
  const getCategoryJobCount = (categoryId: number) => {
    if (!jobs) return 0;
    return jobs.filter((job: any) => job.categoryId === categoryId).length;
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Job Categories</h2>
            <Button onClick={() => setIsModalOpen(true)}>
              Add New Category
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Job Count</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories && categories.length > 0 ? (
                    categories.map((category: Category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description || '-'}</TableCell>
                        <TableCell>{getCategoryJobCount(category.id)}</TableCell>
                        <TableCell>{formatDate(new Date(category.createdAt))}</TableCell>
                        <TableCell>
                          {category.status === 'active' ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                              className="text-primary hover:text-blue-700"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(category)}
                              className={category.status === 'active' ? "text-red-500 hover:text-red-700" : "text-green-500 hover:text-green-700"}
                            >
                              {category.status === 'active' ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        <p className="text-gray-500">No categories found</p>
                        <Button 
                          variant="link" 
                          onClick={() => setIsModalOpen(true)}
                          className="mt-2"
                        >
                          Create your first category
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddCategoryModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose}
        onSave={handleCategorySaved}
        editCategory={editingCategory}
      />
    </>
  );
};

export default CategoryManagement;
