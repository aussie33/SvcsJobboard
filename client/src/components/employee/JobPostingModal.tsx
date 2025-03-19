import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { insertJobSchema, jobWithTagsSchema, JobWithTags } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';

interface JobPostingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editJob?: JobWithTags | null;
}

const formSchema = jobWithTagsSchema.extend({
  job: insertJobSchema.extend({
    status: z.enum(['draft', 'active']),
    publishOption: z.enum(['publish-now', 'save-draft'])
  })
});

type JobFormData = z.infer<typeof formSchema>;

const JobPostingModal: React.FC<JobPostingModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  editJob 
}) => {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Form setup
  const form = useForm<JobFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      job: {
        title: '',
        department: '',
        categoryId: '',
        employeeId: 0, // Will be set by the server
        shortDescription: '',
        fullDescription: '',
        requirements: '',
        type: 'full-time',
        location: 'remote',
        salaryRange: '',
        status: 'draft',
        publishOption: 'publish-now'
      },
      tags: []
    }
  });

  // Set default values when editing a job
  useEffect(() => {
    if (editJob) {
      form.reset({
        job: {
          ...editJob,
          publishOption: editJob.status === 'active' ? 'publish-now' : 'save-draft',
          status: editJob.status
        },
        tags: editJob.tags || []
      });
      setTags(editJob.tags || []);
    } else {
      form.reset({
        job: {
          title: '',
          department: '',
          categoryId: '',
          employeeId: 0,
          shortDescription: '',
          fullDescription: '',
          requirements: '',
          type: 'full-time',
          location: 'remote',
          salaryRange: '',
          status: 'draft',
          publishOption: 'publish-now'
        },
        tags: []
      });
      setTags([]);
    }
  }, [editJob, form]);

  // Create/update job mutation
  const mutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      const { job, tags } = data;
      
      // Set status based on publish option
      job.status = job.publishOption === 'publish-now' ? 'active' : 'draft';
      
      // Create or update job
      const url = editJob ? `/api/jobs/${editJob.id}` : '/api/jobs';
      const method = editJob ? 'PATCH' : 'POST';
      
      const response = await apiRequest(method, url, { job, tags });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      onSave();
      toast({
        title: editJob ? "Job Updated" : "Job Created",
        description: editJob 
          ? "Your job posting has been updated successfully." 
          : "Your job posting has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while saving the job",
        variant: "destructive",
      });
    }
  });

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      form.setValue('tags', newTags);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    form.setValue('tags', newTags);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const onSubmit = (data: JobFormData) => {
    // Ensure tags are also submitted
    data.tags = tags;
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !mutation.isPending) onClose();
    }}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{editJob ? 'Edit Job Posting' : 'Create New Job Posting'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="job.title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Senior Frontend Developer" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="job.department"
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
              
              <FormField
                control={form.control}
                name="job.categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category: any) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="job.type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="job.location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="onsite">Onsite</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="job.salaryRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salary Range</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. $60,000 - $80,000" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="job.shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Brief overview of the position (1-2 sentences)"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="job.fullDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Job Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Detailed description of the job responsibilities"
                      rows={6}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="job.requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirements</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="List the requirements for this position"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel htmlFor="skills">Skills/Tags</FormLabel>
              <div className="flex items-center mt-1">
                <Input
                  id="skills"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Add skills, press Enter or comma to add"
                  className="flex-1"
                />
                <Button 
                  type="button"
                  variant="secondary"
                  onClick={handleAddTag}
                  className="ml-2"
                >
                  Add
                </Button>
              </div>
              
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      className="bg-blue-100 text-blue-800 flex items-center"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="job.publishOption"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Publishing Options</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="publish-now" id="publish-now" />
                        <Label htmlFor="publish-now">Publish immediately</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="save-draft" id="save-draft" />
                        <Label htmlFor="save-draft">Save as draft</Label>
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
                {editJob ? 'Update Job' : 'Create Job'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default JobPostingModal;
