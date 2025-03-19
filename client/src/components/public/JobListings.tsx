import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, Clock, Calendar } from 'lucide-react';
import JobFilters from './JobFilters';
import { type Job, type Category } from '@shared/schema';
import { formatDate } from '@/lib/formatters';

interface JobListingsProps {
  onApplyClick: (job: Job & { tags: string[] }) => void;
}

const JobListings: React.FC<JobListingsProps> = ({ onApplyClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [filteredJobs, setFilteredJobs] = useState<(Job & { tags: string[] })[]>([]);

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

  // Filter jobs based on search term, categories, and location
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
    
    setFilteredJobs(result);
  }, [jobs, searchTerm, selectedCategories, selectedLocation]);

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
        selectedCategories={selectedCategories}
        selectedLocation={selectedLocation}
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
          filteredJobs.map((job) => (
            <Card key={job.id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-1">{job.title}</CardTitle>
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
                <Button 
                  onClick={() => onApplyClick(job)}
                  className="transition-all duration-200"
                >
                  Apply Now
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default JobListings;