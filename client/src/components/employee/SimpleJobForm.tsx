import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SimpleJobFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const SimpleJobForm: React.FC<SimpleJobFormProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    categoryId: 1,
    shortDescription: '',
    fullDescription: '',
    requirements: '',
    type: 'full-time',
    location: 'remote',
    salaryRange: '',
    status: 'active'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    staleTime: 1000 * 60 * 5,
  });

  // Create job mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating job with data:', data);
      const response = await apiRequest('POST', '/api/jobs', { 
        job: data, 
        tags: [] 
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create job');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      onSave();
      toast({
        title: "Job Created",
        description: "Your job posting has been created successfully.",
      });
      // Reset form
      setFormData({
        title: '',
        department: '',
        categoryId: 1,
        shortDescription: '',
        fullDescription: '',
        requirements: '',
        type: 'full-time',
        location: 'remote',
        salaryRange: '',
        status: 'active'
      });
    },
    onError: (error: any) => {
      console.error('Job creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create job",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    mutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !mutation.isPending) onClose();
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Job Posting</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g. Senior Frontend Developer"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="e.g. Engineering"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.categoryId.toString()}
                onValueChange={(value) => handleInputChange('categoryId', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories || []).map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Employment Type</Label>
              <Select 
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Select 
                value={formData.location}
                onValueChange={(value) => handleInputChange('location', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="salary">Salary Range</Label>
            <Input
              id="salary"
              value={formData.salaryRange}
              onChange={(e) => handleInputChange('salaryRange', e.target.value)}
              placeholder="e.g. $80,000 - $120,000"
            />
          </div>

          <div>
            <Label htmlFor="shortDescription">Short Description</Label>
            <Textarea
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => handleInputChange('shortDescription', e.target.value)}
              placeholder="Brief description of the role..."
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="fullDescription">Full Description</Label>
            <Textarea
              id="fullDescription"
              value={formData.fullDescription}
              onChange={(e) => handleInputChange('fullDescription', e.target.value)}
              placeholder="Detailed job description..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => handleInputChange('requirements', e.target.value)}
              placeholder="Required skills and qualifications..."
              rows={4}
              required
            />
          </div>

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
              Create Job
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};