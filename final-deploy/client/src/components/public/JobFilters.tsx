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
  onCityChange: (city: string) => void;
  onStateChange: (state: string) => void;
  selectedCategories: number[];
  selectedLocation: string;
  selectedCity: string;
  selectedState: string;
}

const JobFilters: React.FC<JobFiltersProps> = ({ 
  categories, 
  isLoading, 
  onSearch, 
  onCategoryChange, 
  onLocationChange,
  onCityChange,
  onStateChange,
  selectedCategories,
  selectedLocation,
  selectedCity,
  selectedState
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityInput, setCityInput] = useState(selectedCity || '');
  const [stateInput, setStateInput] = useState(selectedState || '');
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

  // Handle city input
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCityInput(e.target.value);
  };

  // Handle state input
  const handleStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStateInput(e.target.value);
  };

  // Apply city filter
  const handleApplyCityFilter = () => {
    onCityChange(cityInput);
  };

  // Apply state filter
  const handleApplyStateFilter = () => {
    onStateChange(stateInput);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setCityInput('');
    setStateInput('');
    onSearch('');
    onLocationChange('all');
    onCityChange('');
    onStateChange('');
    
    // Uncheck all categories
    selectedCategories.forEach(categoryId => {
      onCategoryChange(categoryId, false);
    });
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedCategories.length > 0 || 
                          selectedLocation !== 'all' || selectedCity || selectedState;

  return (
    <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-300 shadow-md mb-8 space-y-6">
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search job titles, skills, or keywords"
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 border-gray-300 focus:border-blue-500"
          />
        </div>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Search</Button>
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

        {/* Location filters */}
        <div className="flex-1 space-y-4">
          {/* Location type filter */}
          <div>
            <h3 className="font-medium mb-2">Location</h3>
            <Select 
              value={selectedLocation} 
              onValueChange={onLocationChange}
            >
              <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 bg-white">
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
          
          {/* City filter */}
          <div>
            <h3 className="font-medium mb-2">City</h3>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Filter by city"
                value={cityInput}
                onChange={handleCityChange}
                className="border-gray-300 focus:border-blue-500"
              />
              <Button 
                onClick={handleApplyCityFilter} 
                variant="outline" 
                className="shrink-0 border-2 border-gray-300 bg-gray-50 hover:bg-gray-100"
              >
                Apply
              </Button>
            </div>
          </div>
          
          {/* State filter */}
          <div>
            <h3 className="font-medium mb-2">State/Province</h3>
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Filter by state"
                value={stateInput}
                onChange={handleStateChange}
                className="border-gray-300 focus:border-blue-500"
              />
              <Button 
                onClick={handleApplyStateFilter} 
                variant="outline" 
                className="shrink-0 border-2 border-gray-300 bg-gray-50 hover:bg-gray-100"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset filters button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="text-gray-600 border-2 border-gray-300 bg-gray-50 hover:bg-gray-100"
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