import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { type Category } from '@shared/schema';

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
  const locationOptions = ['all', 'remote', 'onsite', 'hybrid'];

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Submit search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    onSearch('');
    onLocationChange('all');
    
    // Uncheck all categories
    selectedCategories.forEach(categoryId => {
      onCategoryChange(categoryId, false);
    });
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedCategories.length > 0 || selectedLocation !== 'all';

  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8 space-y-6">
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search job titles, skills, or keywords"
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Categories filter */}
        <div className="flex-1">
          <h3 className="font-medium mb-2">Categories</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {isLoading ? (
              <div className="flex items-center text-sm text-gray-500">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="flex items-center text-sm text-gray-500">No categories available</div>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`category-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={(checked) => 
                      onCategoryChange(category.id, checked === true)
                    }
                  />
                  <label 
                    htmlFor={`category-${category.id}`}
                    className="text-sm flex-grow cursor-pointer"
                  >
                    {category.name}
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Location filter */}
        <div className="flex-1">
          <h3 className="font-medium mb-2">Location</h3>
          <Select 
            value={selectedLocation} 
            onValueChange={onLocationChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locationOptions.map((location) => (
                <SelectItem key={location} value={location}>
                  {location === 'all' ? 'All Locations' : 
                    location.charAt(0).toUpperCase() + location.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reset filters button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="text-gray-600"
            onClick={handleClearFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default JobFilters;