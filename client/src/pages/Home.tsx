import { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import JobListings from '@/components/public/JobListings';
import ApplyModal from '@/components/public/ApplyModal';
import { type Job, type Category } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Code, Briefcase, FileText, Shield, Heart, TrendingUp } from 'lucide-react';

const Home = () => {
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<(Job & { tags: string[] }) | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Fetch categories for the categories grid
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

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

  // Get icon for category
  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'administrative':
        return <FileText className="h-6 w-6" />;
      case 'technology':
      case 'software':
      case 'engineering':
        return <Code className="h-6 w-6" />;
      case 'management':
        return <Users className="h-6 w-6" />;
      case 'sales':
      case 'marketing':
        return <TrendingUp className="h-6 w-6" />;
      case 'healthcare':
        return <Heart className="h-6 w-6" />;
      case 'security':
        return <Shield className="h-6 w-6" />;
      case 'business':
        return <Building2 className="h-6 w-6" />;
      default:
        return <Briefcase className="h-6 w-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#9C27B0] to-[#8E24AA] py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Find Your Dream Career
          </h1>
          <p className="text-xl text-purple-100 max-w-xl mx-auto">
            Explore opportunities that match your skills and ambitions. Your next career move starts here.
          </p>
        </div>
      </div>
      
      {/* Job Categories Grid */}
      {categories.length > 0 && (
        <div className="container mx-auto py-12 px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Explore Job Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className="overflow-hidden transition-all duration-200 hover:shadow-xl border-0 shadow-lg cursor-pointer group"
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      {getCategoryIcon(category.name)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {category.description || 'Explore opportunities in this field'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
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
