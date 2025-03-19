import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import JobFilters from './JobFilters';
import JobCard from './JobCard';
import ApplyModal from './ApplyModal';
import { Job } from '@shared/schema';
import { Loader2 } from 'lucide-react';

const JobListings = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedJob, setSelectedJob] = useState<(Job & { tags: string[] }) | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch jobs with filters
  const { 
    data: jobs, 
    isLoading: jobsLoading,
    refetch: refetchJobs
  } = useQuery({
    queryKey: [
      '/api/jobs', 
      { 
        search: searchTerm, 
        categoryId: selectedCategories, 
        location: selectedLocation === 'all' ? '' : selectedLocation 
      }
    ],
    refetchOnWindowFocus: false,
  });

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleCategoryChange = (categoryId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCategories(prev => [...prev, categoryId]);
    } else {
      setSelectedCategories(prev => prev.filter(id => id !== categoryId));
    }
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
  };

  const handleApplyClick = (job: Job & { tags: string[] }) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  const handleApplicationSubmit = () => {
    handleCloseModal();
    refetchJobs();
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Search and Filters */}
          <JobFilters 
            categories={categories || []}
            isLoading={categoriesLoading}
            onSearch={handleSearch}
            onCategoryChange={handleCategoryChange}
            onLocationChange={handleLocationChange}
            selectedCategories={selectedCategories}
            selectedLocation={selectedLocation}
          />
          
          {/* Job Listings */}
          <div className="md:w-3/4">
            <h1 className="text-2xl font-bold mb-6">Available Positions</h1>
            
            {jobsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : jobs && jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    onApplyClick={() => handleApplyClick(job)} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-500">
                  Try adjusting your search criteria or check back later for new opportunities.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {isModalOpen && selectedJob && (
        <ApplyModal 
          job={selectedJob} 
          isOpen={isModalOpen} 
          onClose={handleCloseModal}
          onSubmit={handleApplicationSubmit}
        />
      )}
    </section>
  );
};

export default JobListings;
