import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Application } from '@shared/schema';
import { formatDate } from '@/lib/formatters';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, ExternalLink } from 'lucide-react';

interface ViewApplicationsProps {
  user: User;
}

const ViewApplications: React.FC<ViewApplicationsProps> = ({ user }) => {
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const { toast } = useToast();

  // Fetch employee's jobs
  const { data: jobs, isLoading: isJobsLoading } = useQuery({
    queryKey: ['/api/jobs', { employeeId: user.id }],
  });

  // Fetch applications based on filters
  const { 
    data: applications, 
    isLoading: isApplicationsLoading,
    refetch: refetchApplications
  } = useQuery({
    queryKey: ['/api/applications', { jobId: selectedJob, status: selectedStatus }],
    enabled: user.role === 'admin' || user.role === 'employee',
  });

  // Handle status change
  const handleStatusChange = async (applicationId: number, status: string) => {
    try {
      await apiRequest('PATCH', `/api/applications/${applicationId}`, { status });
      toast({
        title: "Status Updated",
        description: "Application status has been updated successfully.",
      });
      refetchApplications();
      if (selectedApplication && selectedApplication.id === applicationId) {
        setSelectedApplication({...selectedApplication, status});
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update application status",
        variant: "destructive",
      });
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-100 text-blue-800">New</Badge>;
      case 'reviewing':
        return <Badge className="bg-purple-100 text-purple-800">Reviewing</Badge>;
      case 'interviewed':
        return <Badge className="bg-green-100 text-green-800">Interviewed</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'hired':
        return <Badge className="bg-green-100 text-green-800">Hired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Handle view application details
  const handleViewApplication = (application: Application) => {
    setSelectedApplication(application);
  };

  // Get job title by id
  const getJobTitle = (jobId: number) => {
    const job = jobs?.find(j => j.id === jobId);
    return job ? job.title : 'Unknown Job';
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Applications Received</h2>
            <div className="flex space-x-2">
              <Select 
                value={selectedJob} 
                onValueChange={setSelectedJob}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Job Postings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Job Postings</SelectItem>
                  {!isJobsLoading && jobs && jobs.map((job: any) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={selectedStatus} 
                onValueChange={setSelectedStatus}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="interviewed">Interviewed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isApplicationsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications && applications.length > 0 ? (
                    applications.map((application: Application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarFallback className="bg-gray-200 text-gray-600">
                                {getInitials(application.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{application.name}</div>
                              <div className="text-sm text-gray-500">{application.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getJobTitle(application.jobId)}</TableCell>
                        <TableCell>{formatDate(new Date(application.appliedDate))}</TableCell>
                        <TableCell>{renderStatusBadge(application.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="link" 
                            onClick={() => handleViewApplication(application)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6">
                        <p className="text-gray-500">No applications found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Details Dialog */}
      {selectedApplication && (
        <Dialog 
          open={!!selectedApplication} 
          onOpenChange={(open) => !open && setSelectedApplication(null)}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
              <DialogDescription>
                Viewing application for {getJobTitle(selectedApplication.jobId)}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-2">
                <span className="text-sm font-medium">Name:</span>
                <span className="col-span-3">{selectedApplication.name}</span>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-2">
                <span className="text-sm font-medium">Email:</span>
                <span className="col-span-3">{selectedApplication.email}</span>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-2">
                <span className="text-sm font-medium">Phone:</span>
                <span className="col-span-3">{selectedApplication.phone || 'Not provided'}</span>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-2">
                <span className="text-sm font-medium">Applied:</span>
                <span className="col-span-3">{formatDate(new Date(selectedApplication.appliedDate))}</span>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-2">
                <span className="text-sm font-medium">Resume:</span>
                <div className="col-span-3">
                  {selectedApplication.resumeUrl ? (
                    selectedApplication.resumeUrl.startsWith('http') ? (
                      <a 
                        href={selectedApplication.resumeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Document
                      </a>
                    ) : (
                      <a 
                        href={selectedApplication.resumeUrl} 
                        download
                        className="flex items-center text-primary hover:underline"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download Resume
                      </a>
                    )
                  ) : (
                    <span className="text-gray-500">No resume provided</span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                <span className="text-sm font-medium">Cover Letter:</span>
                <div className="col-span-3 bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto">
                  {selectedApplication.coverLetter ? (
                    <p className="whitespace-pre-wrap text-sm">{selectedApplication.coverLetter}</p>
                  ) : (
                    <p className="text-gray-500">No cover letter provided</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <div className="col-span-3">
                  <Select 
                    value={selectedApplication.status} 
                    onValueChange={(value) => handleStatusChange(selectedApplication.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="interviewed">Interviewed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setSelectedApplication(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ViewApplications;
