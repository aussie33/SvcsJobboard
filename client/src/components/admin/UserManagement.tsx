import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import { formatDate } from '@/lib/formatters';
import { Loader2, Search } from 'lucide-react';
import AddUserModal from './AddUserModal';
import PaginationControls from '../shared/PaginationControls';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20); // Default to 20 items per page as specified
  
  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query users with filters - fixed parameter handling
  const { data: users = [], isLoading, refetch } = useQuery<User[]>({
    queryKey: ['/api/users', { role: roleFilter, status: statusFilter }],
    queryFn: async ({ queryKey }) => {
      // Create query string manually for better control
      let url = '/api/users';
      const params = new URLSearchParams();
      
      const [_, { role, status }] = queryKey as [string, { role?: string, status?: string }];
      
      // Only add role filter if it's not 'all'
      if (role && role !== 'all') {
        params.append('role', role);
      }
      
      // Only add status filter if it's not 'all'
      if (status && status !== 'all') {
        params.append('active', status);
      }
      
      // Only add ? if we have parameters
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      console.log('Fetching users with URL:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching users: ${errorText}`);
      }
      
      return response.json();
    }
  });

  // Update user status mutation
  const toggleUserStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/users/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Status Updated",
        description: "User status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user status",
        variant: "destructive",
      });
    }
  });

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (user: User) => {
    toggleUserStatus.mutate({ id: user.id, isActive: !user.isActive });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleUserSaved = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    queryClient.invalidateQueries({ queryKey: ['/api/users'] });
  };

  // Filtered users based on search term
  const filteredUsers = Array.isArray(users) 
    ? users.filter((user: User) => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Portal User Accounts</h2>
            <Button onClick={() => setIsModalOpen(true)}>
              Add New User
            </Button>
          </div>
          
          <div className="flex mb-4 flex-col sm:flex-row gap-2">
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <Select 
              value={roleFilter} 
              onValueChange={setRoleFilter}
            >
              <SelectTrigger className="w-full sm:w-auto border-2">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="applicant">Applicant</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={statusFilter} 
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-auto border-2">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Admin Type</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length > 0 ? (
                      paginatedUsers.map((user: User) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarFallback className="bg-gray-200 text-gray-600">
                                  {getInitials(user.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{user.fullName}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-500">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.isActive ? (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.role === 'admin' ? (
                              user.isSuperAdmin ? (
                                <Badge className="bg-purple-100 text-purple-800">Super Admin</Badge>
                              ) : (
                                <Badge className="bg-blue-100 text-blue-700">Regular Admin</Badge>
                              )
                            ) : (
                              <Badge variant="outline" className="text-gray-500">N/A</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.lastLogin ? formatDate(new Date(user.lastLogin)) : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                className="text-primary hover:text-blue-700"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleStatus(user)}
                                className={user.isActive ? "text-red-500 hover:text-red-700" : "text-green-500 hover:text-green-700"}
                              >
                                {user.isActive ? 'Disable' : 'Enable'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          <p className="text-gray-500">No users found</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-300 shadow-sm">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredUsers.length}
                  itemsPerPage={itemsPerPage}
                  setCurrentPage={setCurrentPage}
                  setItemsPerPage={handleItemsPerPageChange}
                  showItemsPerPageSelect={true}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AddUserModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose}
        onSave={handleUserSaved}
        editUser={editingUser}
      />
    </>
  );
};

export default UserManagement;
