import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, Building, Calendar, Tag, Pencil } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { Job, Category, User } from '@shared/schema';

interface JobDetailModalProps {
  job: Job & { tags: string[] };
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  // Optional props based on view type
  onApplyClick?: () => void;
  hasApplied?: boolean;
  onEditClick?: () => void;
  isAdmin?: boolean;
  isEmployee?: boolean;
  currentUser?: User | null;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  categories,
  onApplyClick,
  hasApplied = false,
  onEditClick,
  isAdmin = false,
  isEmployee = false,
  currentUser
}) => {
  // Find the category name
  const category = categories.find(c => c.id === job.categoryId);
  
  // Determine if this is admin/employee view or public view
  const isAdminView = isAdmin || isEmployee;
  
  // Check if current employee is the owner of this job
  const isJobOwner = isEmployee && 
    currentUser && 
    job.employeeId === currentUser.id;
  
  // Can edit if admin or if employee who created the job
  const canEdit = isAdmin || isJobOwner;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">{job.title}</DialogTitle>
              <DialogDescription className="text-base text-gray-600">
                {job.department}
              </DialogDescription>
            </div>
            {canEdit && onEditClick && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick();
                }}
                className="flex items-center gap-1"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Job status badge - only visible in admin/employee view */}
          {isAdminView && (
            <div>
              <Badge
                className={`
                  ${job.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                  ${job.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${job.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
                  ${job.status === 'closed' ? 'bg-red-100 text-red-800' : ''}
                `}
              >
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </Badge>
            </div>
          )}
          
          {/* Job summary */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center text-gray-700">
              <Briefcase className="h-4 w-4 mr-1" />
              <span>{job.type.charAt(0).toUpperCase() + job.type.slice(1).replace('-', ' ')}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{job.location.charAt(0).toUpperCase() + job.location.slice(1)}</span>
            </div>
            {category && (
              <div className="flex items-center text-gray-700">
                <Building className="h-4 w-4 mr-1" />
                <span>{category.name}</span>
              </div>
            )}
            {job.salaryRange && (
              <div className="flex items-center text-gray-700">
                <span>{job.salaryRange}</span>
              </div>
            )}
          </div>
          
          {/* Short description */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Overview</h3>
            <p className="text-gray-700">{job.shortDescription}</p>
          </div>
          
          {/* Full description */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Job Description</h3>
            <div 
              className="text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: job.fullDescription.replace(/\n/g, '<br/>') }}
            />
          </div>
          
          {/* Requirements */}
          {job.requirements && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Requirements</h3>
              <div 
                className="text-gray-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: job.requirements.replace(/\n/g, '<br/>') }}
              />
            </div>
          )}
          
          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                Skills & Technologies
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="bg-gray-100 text-gray-800">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Job details */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-medium text-gray-900 mb-2">Additional Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Posted Date:</span>
                <p className="text-gray-700">
                  {job.postedDate ? formatDate(new Date(job.postedDate)) : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Closing Date:</span>
                <p className="text-gray-700">
                  {job.expiryDate ? formatDate(new Date(job.expiryDate)) : 'Open until filled'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Job ID:</span>
                <p className="text-gray-700">{job.id}</p>
              </div>
              <div>
                <span className="text-gray-500">Department:</span>
                <p className="text-gray-700">{job.department}</p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="mr-2">
            Close
          </Button>
          
          {/* Only show Apply button for public view */}
          {!isAdminView && onApplyClick && (
            <Button 
              onClick={onApplyClick} 
              disabled={hasApplied}
            >
              {hasApplied ? 'Applied' : 'Apply Now'}
            </Button>
          )}
          
          {/* Show Edit button for admin/employee view if they can edit */}
          {isAdminView && canEdit && onEditClick && (
            <Button onClick={onEditClick}>
              Edit Job
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailModal;