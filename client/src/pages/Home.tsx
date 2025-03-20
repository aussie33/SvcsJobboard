import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import JobListings from '@/components/public/JobListings';
import ApplyModal from '@/components/public/ApplyModal';
import { type Job } from '@shared/schema';

const Home = () => {
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<(Job & { tags: string[] }) | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const handleApplyClick = (job: Job & { tags: string[] }) => {
    setSelectedJob(job);
    setIsApplyModalOpen(true);
  };

  const handleApplyModalClose = () => {
    setIsApplyModalOpen(false);
  };

  const handleApplicationSubmit = () => {
    setIsApplyModalOpen(false);
    setSelectedJob(null);
    
    // Invalidate both jobs and applications queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ['/api/my-applications'] });
    queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Find Your Dream Career
          </h1>
          <p className="text-xl text-blue-100 max-w-xl mx-auto">
            Explore opportunities that match your skills and ambitions. Your next career move starts here.
          </p>
        </div>
      </div>
      
      <main className="container mx-auto py-8 px-4">
        <JobListings onApplyClick={handleApplyClick} />
      </main>
      
      {selectedJob && (
        <ApplyModal
          job={selectedJob}
          isOpen={isApplyModalOpen}
          onClose={handleApplyModalClose}
          onSubmit={handleApplicationSubmit}
        />
      )}
    </div>
  );
};

export default Home;
