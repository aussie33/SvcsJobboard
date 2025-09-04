import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { loginSchema, type User, type LoginCredentials } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials?: LoginCredentials) => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState<LoginCredentials | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for the current user
  const { 
    data: user, 
    isLoading: isUserLoading, 
    error: userError 
  } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    retry: false,
    gcTime: 0,
    queryFn: getQueryFn({ on401: "returnNull" }) // Return null on 401 instead of throwing
  });

  // Login mutation
  const loginMutation = useMutation<User, Error, LoginCredentials>({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return response.json();
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(['/api/auth/me'], userData);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userData.fullName}!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/logout', {});
      return response.json();
    },
    onSuccess: () => {
      // Clear user data
      queryClient.setQueryData(['/api/auth/me'], null);
      // Clear application data
      queryClient.setQueryData(['/api/my-applications'], []);
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-applications'] });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error) => {
      toast({
        title: "Logout Failed",
        description: error instanceof Error ? error.message : "An error occurred during logout",
        variant: "destructive",
      });
    }
  });

  // Login function
  const login = async (credentials?: LoginCredentials) => {
    // If credentials are provided, use them directly
    if (credentials) {
      try {
        // Validate credentials
        loginSchema.parse(credentials);
        const userData = await loginMutation.mutateAsync(credentials);
        
        // Force refetch user data to ensure state is updated
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        queryClient.setQueryData(['/api/auth/me'], userData);
        
        return userData;
      } catch (error) {
        toast({
          title: "Validation Error",
          description: "Please provide a valid username and password",
          variant: "destructive",
        });
        throw error;
      }
    }
    
    throw new Error("Login credentials are required");
  };

  // Logout function
  const logout = async () => {
    await logoutMutation.mutateAsync();
    // Redirect to home page after logout
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ 
      user: user || null, 
      isLoading: isUserLoading || loginMutation.isPending || logoutMutation.isPending,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
