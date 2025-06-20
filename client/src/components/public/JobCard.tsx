import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Job } from '@shared/schema';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/formatters';

interface JobCardProps {
  job: Job & { tags: string[] };
  onApplyClick: () => void;
  onTitleClick: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onApplyClick, onTitleClick }) => {
  // Determine badge colors for job type
  const getTypeColor = (type: string) => {
    return 'bg-blue-100 text-blue-800';
  };

  // Determine badge colors for job location
  const getLocationColor = (location: string) => {
    switch (location) {
      case 'remote':
        return 'bg-green-100 text-green-800';
      case 'hybrid':
        return 'bg-yellow-100 text-yellow-800';
      case 'onsite':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border-2 border-gray-300 p-6 hover:shadow-md transition duration-150">
      <div className="flex justify-between items-start">
        <div>
          <h2 
            className="text-xl font-semibold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors hover:underline" 
            onClick={onTitleClick}
          >
            {job.title}
          </h2>
          <p className="text-gray-600 mt-1">{job.department}</p>
          <div className="flex mt-2 space-x-2">
            <Badge variant="secondary" className={`${getTypeColor(job.type)} border border-blue-200`}>
              {job.type.charAt(0).toUpperCase() + job.type.slice(1)}
            </Badge>
            <Badge variant="secondary" className={`${getLocationColor(job.location)} border`}>
              {job.location.charAt(0).toUpperCase() + job.location.slice(1)}
              {job.location !== 'remote' && job.city && job.state && ` (${job.city}, ${job.state})`}
            </Badge>
          </div>
        </div>
        <Button onClick={onApplyClick} className="bg-blue-600 hover:bg-blue-700">Apply Now</Button>
      </div>
      
      <p className="mt-4 text-gray-700">{job.shortDescription}</p>
      
      <div className="mt-4 flex flex-wrap gap-2">
        {job.tags && job.tags.map((tag, index) => (
          <Badge key={index} variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
            {tag}
          </Badge>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-500 flex items-center border-t border-gray-200 pt-3">
        <Clock className="h-4 w-4 mr-1" />
        <span>Posted {formatDistanceToNow(new Date(job.postedDate || new Date()))} ago</span>
      </div>
    </div>
  );
};

export default JobCard;
