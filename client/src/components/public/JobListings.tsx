import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import JobFilters from './JobFilters';
import JobCard from './JobCard';
import JobDetailModal from '@/components/shared/JobDetailModal';
import { type Job, type Category, type Application } from '@shared/schema';
import { formatDate } from '@/lib/formatters';
import { useAuth } from '@/hooks/useAuth';

interface JobListingsProps {
  onApplyClick: (job: Job & { tags: string[] }) => void;
}

const JobListings: React.FC<JobListingsProps> = ({ onApplyClick }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [filteredJobs, setFilteredJobs] = useState<(Job & { tags: string[] })[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<number[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage, setJobsPerPage] = useState(20);
  const [paginatedJobs, setPaginatedJobs] = useState<(Job & { tags: string[] })[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  
  // State for job detail modal
  const [selectedJob, setSelectedJob] = useState<(Job & { tags: string[] }) | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch all jobs
  const { 
    data: jobs = [], 
    isLoading: isJobsLoading 
  } = useQuery<(Job & { tags: string[] })[]>({
    queryKey: ['/api/jobs'],
  });
  
  // Fetch all categories
  const { 
    data: categories = [], 
    isLoading: isCategoriesLoading 
  } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Fetch user's applications if logged in as applicant
  const { 
    data: applications = [],
    isLoading: isApplicationsLoading,
    refetch: refetchApplications
  } = useQuery<Application[]>({
    queryKey: ['/api/my-applications'],
    enabled: !!user && user.role === 'applicant',
  });

  // Track jobs the user has already applied to
  useEffect(() => {
    if (applications.length > 0) {
      const appliedJobIds = applications.map(app => app.jobId);
      setAppliedJobs(appliedJobIds);
    }
  }, [applications]);

  // Filter jobs based on search term, categories, location, city, and state
  useEffect(() => {
    let result = [...jobs];
    
    // Filter by search term
    if (searchTerm) {
      const lowercaseTerm = searchTerm.toLowerCase();
      result = result.filter(job => 
        job.title.toLowerCase().includes(lowercaseTerm) ||
        job.shortDescription.toLowerCase().includes(lowercaseTerm) ||
        job.fullDescription.toLowerCase().includes(lowercaseTerm) ||
        job.tags.some(tag => tag.toLowerCase().includes(lowercaseTerm))
      );
    }
    
    // Filter by categories
    if (selectedCategories.length > 0) {
      result = result.filter(job => job.categoryId !== null && selectedCategories.includes(job.categoryId));
    }
    
    // Filter by location
    if (selectedLocation !== 'all') {
      result = result.filter(job => job.location === selectedLocation);
    }
    
    // Filter by city
    if (selectedCity) {
      result = result.filter(job => 
        job.city && job.city.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }
    
    // Filter by state
    if (selectedState) {
      result = result.filter(job => 
        job.state && job.state.toLowerCase().includes(selectedState.toLowerCase())
      );
    }
    
    // Reset to page 1 when filters change
    setCurrentPage(1);
    setFilteredJobs(result);
    
    // Calculate total pages
    setTotalPages(Math.max(1, Math.ceil(result.length / jobsPerPage)));
  }, [jobs, searchTerm, selectedCategories, selectedLocation, selectedCity, selectedState, jobsPerPage]);
  
  // Update paginated jobs when filteredJobs, currentPage, or jobsPerPage changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    setPaginatedJobs(filteredJobs.slice(startIndex, endIndex));
  }, [filteredJobs, currentPage, jobsPerPage]);

  // Handlers for filters
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };
  
  const handleCategoryChange = (categoryId: number, isSelected: boolean) => {
    setSelectedCategories(prev => {
      if (isSelected) {
        return [...prev, categoryId];
      } else {
        return prev.filter(id => id !== categoryId);
      }
    });
  };
  
  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
  };
  
  const handleCityChange = (city: string) => {
    setSelectedCity(city);
  };
  
  const handleStateChange = (state: string) => {
    setSelectedState(state);
  };
  
  // Handle job detail modal
  const handleOpenJobDetail = (job: Job & { tags: string[] }) => {
    setSelectedJob(job);
    setIsDetailModalOpen(true);
  };
  
  const handleCloseJobDetail = () => {
    setIsDetailModalOpen(false);
  };
  
  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleJobsPerPageChange = (value: string) => {
    setJobsPerPage(parseInt(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  
  // Generate array of page numbers for pagination
  const getPageNumbers = () => {
    const visiblePages = 5; // Number of page buttons to show
    const pages: (number | null)[] = [];
    
    if (totalPages <= visiblePages) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        // Add ellipsis if current page is far from start
        pages.push(null);
      }
      
      // Calculate range around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        // Add ellipsis if current page is far from end
        pages.push(null);
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore Job Opportunities</h1>
        <p className="text-gray-600">
          Find your next career move from our latest job openings
        </p>
      </div>
      
      {/* Filters */}
      <JobFilters
        categories={categories}
        isLoading={isCategoriesLoading}
        onSearch={handleSearch}
        onCategoryChange={handleCategoryChange}
        onLocationChange={handleLocationChange}
        onCityChange={handleCityChange}
        onStateChange={handleStateChange}
        selectedCategories={selectedCategories}
        selectedLocation={selectedLocation}
        selectedCity={selectedCity}
        selectedState={selectedState}
      />
      
      {/* Job Listings */}
      <div className="grid grid-cols-1 gap-6">
        {isJobsLoading ? (
          // Loading skeleton
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="bg-white border shadow-sm">
              <CardHeader className="pb-4">
                <div className="w-3/4 h-6 bg-gray-200 rounded-md animate-pulse mb-2"></div>
                <div className="w-1/2 h-4 bg-gray-200 rounded-md animate-pulse"></div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-2">
                  <div className="w-full h-4 bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="w-full h-4 bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="w-2/3 h-4 bg-gray-200 rounded-md animate-pulse"></div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-2 border-t">
                <div className="flex space-x-4">
                  <div className="w-24 h-5 bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="w-20 h-5 bg-gray-200 rounded-md animate-pulse"></div>
                </div>
                <div className="w-24 h-9 bg-gray-200 rounded-md animate-pulse"></div>
              </CardFooter>
            </Card>
          ))
        ) : filteredJobs.length === 0 ? (
          // No jobs found
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <div className="inline-flex justify-center items-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              We couldn't find any jobs matching your search criteria. Try adjusting your filters or check back later.
            </p>
          </div>
        ) : (
          // Job listings
          paginatedJobs.map((job) => (
            <Card key={job.id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle 
                      className="text-xl mb-1 text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
                      onClick={() => handleOpenJobDetail(job)}
                    >
                      {job.title}
                    </CardTitle>
                    <div className="text-sm text-gray-500">
                      {job.department}
                    </div>
                  </div>
                  <Badge variant={job.type === 'full-time' ? "default" : "outline"}>
                    {job.type.replace('-', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-gray-700 mb-4 line-clamp-3">{job.shortDescription}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="capitalize">{job.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="capitalize">{job.type.replace('-', ' ')}</span>
                  </div>
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-2" />
                    <span>
                      {categories.find(c => c.id === job.categoryId)?.name || 'Uncategorized'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Posted {job.postedDate ? formatDate(new Date(job.postedDate)) : 'Recently'}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-4 border-t">
                <div className="text-lg font-medium">
                  {job.salaryRange || 'Salary negotiable'}
                </div>
                {appliedJobs.includes(job.id) ? (
                  <Button 
                    variant="outline"
                    className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50 cursor-default flex items-center gap-2"
                    disabled
                  >
                    <CheckCircle className="h-4 w-4" />
                    Applied
                  </Button>
                ) : (
                  <Button 
                    onClick={() => onApplyClick(job)}
                    className="transition-all duration-200"
                  >
                    Apply Now
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
        
        {/* Pagination controls - only shown when there are jobs */}
        {!isJobsLoading && filteredJobs.length > 0 && (
          <div className="mt-8 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {paginatedJobs.length} of {filteredJobs.length} jobs
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Jobs per page:</span>
                <Select
                  value={jobsPerPage.toString()}
                  onValueChange={handleJobsPerPageChange}
                >
                  <SelectTrigger className="w-[80px] h-8">
                    <SelectValue placeholder="20" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="40">40</SelectItem>
                    <SelectItem value="60">60</SelectItem>
                    <SelectItem value="80">80</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Pagination>
              <PaginationContent>
                {/* First page button */}
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                
                {/* Previous page button */}
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                
                {/* Page numbers */}
                {getPageNumbers().map((page, index) => (
                  <PaginationItem key={index}>
                    {page === null ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                
                {/* Next page button */}
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>
                
                {/* Last page button */}
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
      
      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          isOpen={isDetailModalOpen}
          onClose={handleCloseJobDetail}
          onApplyClick={() => onApplyClick(selectedJob)}
          categories={categories}
          hasApplied={appliedJobs.includes(selectedJob.id)}
        />
      )}
    </div>
  );
};

export default JobListings;