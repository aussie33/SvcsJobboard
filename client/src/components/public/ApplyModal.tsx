import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { type Job, applicationWithResumeSchema, type ApplicationWithResume } from '@shared/schema';

interface ApplyModalProps {
  job: Job & { tags: string[] };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const ApplyModal: React.FC<ApplyModalProps> = ({ job, isOpen, onClose, onSubmit }) => {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<ApplicationWithResume>({
    resolver: zodResolver(applicationWithResumeSchema),
    defaultValues: {
      jobId: job.id,
      applicantId: 0, // Will be set on the server for anonymous applications
      name: '',
      email: '',
      phone: '',
      coverLetter: '',
      resumeUrl: '',
      resume: undefined
    }
  });
  
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('POST', '/api/applications', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Application Submitted',
        description: 'Your application has been successfully submitted.',
      });
      onSubmit();
      form.reset();
      setResumeFile(null);
    },
    onError: (error) => {
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'There was an error submitting your application.',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = async (data: ApplicationWithResume) => {
    if (!resumeFile) {
      toast({
        title: 'Resume Required',
        description: 'Please upload your resume to continue.',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('jobId', job.id.toString());
    formData.append('applicantId', '0'); // Will be assigned on server
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('phone', data.phone || '');
    formData.append('coverLetter', data.coverLetter || '');
    formData.append('resume', resumeFile);

    await mutation.mutateAsync(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      form.setValue('resumeUrl', URL.createObjectURL(file));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Apply for {job.title}</DialogTitle>
          <DialogDescription>
            Complete the form below to apply for this position in the {job.department} department.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Your email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel" 
                        placeholder="Your phone number" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="coverLetter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us why you're interested in this position and what makes you a good fit"
                      className="min-h-[120px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="resumeUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resume (PDF, DOC, DOCX)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-24 border-dashed flex flex-col gap-2"
                        onClick={() => document.getElementById('resume-upload')?.click()}
                      >
                        <Upload className="h-5 w-5" />
                        <span>{resumeFile ? resumeFile.name : 'Click to upload your resume'}</span>
                        {resumeFile && (
                          <span className="text-xs text-gray-500">
                            {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        )}
                      </Button>
                      <input
                        id="resume-upload"
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
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
                Submit Application
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyModal;