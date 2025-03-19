import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Location options based on schema
  const locationOptions = [
    { value: 'all', label: 'All Locations' },
    { value: 'remote', label: 'Remote' },
    { value: 'onsite', label: 'On-site' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  // Debounce search input
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);

  return (
    <Card className="mb-6 border-0 shadow-sm">
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="search"
              placeholder="Search for job titles, skills, or keywords"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categories */}
            <div>
              <h3 className="text-sm font-medium mb-3">Categories</h3>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className="h-4 w-4 rounded bg-gray-200 animate-pulse" />
                      <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
                    </div>
                  ))
                ) : (
                  categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={(checked) => {
                          onCategoryChange(category.id, checked === true);
                        }}
                      />
                      <Label
                        htmlFor={`category-${category.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {category.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-sm font-medium mb-3">Location</h3>
              <Select 
                value={selectedLocation} 
                onValueChange={onLocationChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reset Button */}
          {(selectedCategories.length > 0 || selectedLocation !== 'all' || searchTerm) && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  selectedCategories.forEach(id => onCategoryChange(id, false));
                  onLocationChange('all');
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobFilters;