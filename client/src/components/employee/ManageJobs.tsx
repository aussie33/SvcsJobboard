import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { JobWithTags, User, Category } from '@shared/schema';
import JobPostingModal from './JobPostingModal';
import JobDetailModal from '@/components/shared/JobDetailModal';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from '@/lib/formatters';
import { Pencil, Pause, Play, Trash, Search } from 'lucide-react';

interface ManageJobsProps {
  user: User;
}

const ManageJobs: React.FC<ManageJobsProps> = ({ user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobWithTags | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobWithTags | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query to get all of employee's jobs regardless of status
  const { 
    data: jobs, 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['/api/jobs', { employeeId: user.id }],
  });

  // Query to get all categories
  const { 
    data: categories = [],
  } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Mutation to update job status
  const updateJobStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/jobs/${id}`, {
        job: { status }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Job Updated",
        description: "Job status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update job status",
        variant: "destructive",
      });
    }
  });

  // Mutation to delete job
  const deleteJob = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PATCH', `/api/jobs/${id}`, {
        job: { status: 'closed' }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Job Deleted",
        description: "Job has been removed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete job",
        variant: "destructive",
      });
    }
  });

  const handleViewJobDetail = (job: JobWithTags) => {
    setSelectedJob(job);
    setIsDetailModalOpen(true);
  };

  const handleEditJob = (job: JobWithTags) => {
    setEditingJob(job);
    setIsModalOpen(true);
    // If detail modal is open, close it
    if (isDetailModalOpen) {
      setIsDetailModalOpen(false);
    }
  };

  const handleToggleStatus = (job: JobWithTags) => {
    const newStatus = job.status === 'active' ? 'paused' : 'active';
    updateJobStatus.mutate({ id: job.id, status: newStatus });
  };
  
  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedJob(null);
  };

  const handleDeleteJob = (id: number) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      deleteJob.mutate(id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  const handleJobSaved = () => {
    setIsModalOpen(false);
    setEditingJob(null);
    refetch();
  };

  // Filter jobs based on search query
  const filteredJobs = jobs ? jobs.filter((job: JobWithTags) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Search by job title or department
    return job.title.toLowerCase().includes(query) || 
           job.department.toLowerCase().includes(query);
  }) : [];

  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'closed':
        return <Badge className="bg-red-100 text-red-800">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Job Postings</h2>
              <Button onClick={() => setIsModalOpen(true)}>
                Create New Job
              </Button>
            </div>
            
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search by job title or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {isLoading ? (
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
                    <TableHead>Job Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applications</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.length > 0 ? (
                    filteredJobs.map((job: JobWithTags) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">
                          <span 
                            className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors"
                            onClick={() => handleViewJobDetail(job)}
                          >
                            {job.title}
                          </span>
                        </TableCell>
                        <TableCell>{job.department}</TableCell>
                        <TableCell>{renderStatusBadge(job.status)}</TableCell>
                        <TableCell>{job.applicationCount || 0}</TableCell>
                        <TableCell>
                          {job.postedDate 
                            ? formatDistanceToNow(new Date(job.postedDate)) + ' ago'
                            : 'Not published'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditJob(job)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            
                            {job.status !== 'draft' && job.status !== 'closed' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleToggleStatus(job)}
                              >
                                {job.status === 'active' ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteJob(job.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        {searchQuery ? (
                          <p className="text-gray-500">No job postings match your search</p>
                        ) : (
                          <>
                            <p className="text-gray-500">No job postings found</p>
                            <Button 
                              variant="link" 
                              onClick={() => setIsModalOpen(true)}
                              className="mt-2"
                            >
                              Create your first job posting
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <JobPostingModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        onSave={handleJobSaved}
        editJob={editingJob}
      />

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          isOpen={isDetailModalOpen}
          onClose={handleDetailModalClose}
          onEditClick={() => handleEditJob(selectedJob)}
          categories={categories}
          isEmployee={true}
          currentUser={user}
        />
      )}
    </>
  );
};

export default ManageJobs;
