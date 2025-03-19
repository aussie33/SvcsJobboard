import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { applicationWithResumeSchema, ApplicationWithResume, Job } from '@shared/schema';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { apiRequest } from '@/lib/queryClient';
import { Label } from '@/components/ui/label';
import { isValidUrl } from '@/lib/fileUtils';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';

interface ApplyModalProps {
  job: Job & { tags: string[] };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const ApplyModal: React.FC<ApplyModalProps> = ({ job, isOpen, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const { toast } = useToast();

  const form = useForm<ApplicationWithResume>({
    resolver: zodResolver(applicationWithResumeSchema),
    defaultValues: {
      jobId: job.id,
      name: '',
      email: '',
      phone: '',
      resumeUrl: '',
      coverLetter: '',
      applicantId: 0 // Will be set by the server if logged in
    }
  });

  const handleSubmit = async (data: ApplicationWithResume) => {
    setIsSubmitting(true);
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('jobId', String(data.jobId));
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('phone', data.phone || '');
      formData.append('coverLetter', data.coverLetter || '');
      
      // Add resume file or URL
      if (resumeFile) {
        formData.append('resume', resumeFile);
      } else if (resumeUrl) {
        formData.append('resumeUrl', resumeUrl);
      }
      
      // Submit application
      const response = await fetch('/api/applications', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      toast({
        title: "Application Submitted",
        description: "Your application has been successfully submitted.",
      });
      
      onSubmit();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Error",
        description: error instanceof Error ? error.message : "An error occurred while submitting your application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setResumeFile(file);
    if (file) {
      setResumeUrl('');
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setResumeUrl(url);
    if (url) {
      setResumeFile(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      if (!isSubmitting) onClose();
    }}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
          <DialogDescription>
            Fill out the form below to apply for this position.
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
                    <Input placeholder="John Doe" {...field} />
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
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
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
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Resume/CV</FormLabel>
              <div className="mt-1 flex flex-col space-y-4">
                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-2 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <Label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-600 focus-within:outline-none"
                      >
                        <span>Upload a file</span>
                        <Input
                          id="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                        />
                      </Label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX (max 5MB)</p>
                    {resumeFile && (
                      <p className="text-sm text-green-600">Selected: {resumeFile.name}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <FormLabel>Or provide a Google Doc link</FormLabel>
                  <Input
                    type="url"
                    placeholder="https://docs.google.com/document/d/..."
                    value={resumeUrl}
                    onChange={handleUrlChange}
                  />
                  {resumeUrl && !isValidUrl(resumeUrl) && (
                    <p className="text-xs text-red-500 mt-1">Please enter a valid URL</p>
                  )}
                </div>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="coverLetter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter / Additional Information</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us why you're a good fit for this role..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" required />
              <Label htmlFor="terms" className="text-sm text-gray-900">
                I agree to the <a href="#" className="text-primary hover:text-blue-600">privacy policy</a> and 
                <a href="#" className="text-primary hover:text-blue-600"> terms of service</a>.
              </Label>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
