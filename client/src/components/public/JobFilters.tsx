import { useState, useEffect } from 'react';
import { Category } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface JobFiltersProps {
  categories: Category[];
  isLoading: boolean;
  onSearch: (term: string) => void;
  onCategoryChange: (categoryId: number, isSelected: boolean) => void;
  onLocationChange: (location: string) => void;
  selectedCategories: number[];
  selectedLocation: string;
}

const JobFilters: React.FC<JobFiltersProps> = ({
  categories,
  isLoading,
  onSearch,
  onCategoryChange,
  onLocationChange,
  selectedCategories,
  selectedLocation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  return (
    <div className="md:w-1/4 space-y-6">
      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-medium mb-4">Search Jobs</h2>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search job title or keyword"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
          <button className="absolute right-2 top-2 text-gray-400 hover:text-primary">
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Categories */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-medium mb-4">Filter By Category</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`category-${category.id}`} 
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={(checked) => {
                    onCategoryChange(category.id, checked === true);
                  }}
                />
                <Label htmlFor={`category-${category.id}`} className="cursor-pointer">
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Location */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-medium mb-4">Location</h2>
        <Select 
          value={selectedLocation} 
          onValueChange={onLocationChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="onsite">Onsite</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default JobFilters;
