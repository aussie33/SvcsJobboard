import { useEffect } from 'react';
import { useLocation } from 'wouter';
import EmployeePortal from '@/components/employee/EmployeePortal';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const EmployeeDashboard = () => {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect if user is not logged in or not an employee or admin
    if (!isLoading && (!user || (user.role !== 'employee' && user.role !== 'admin'))) {
      setLocation('/');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (user.role !== 'employee' && user.role !== 'admin')) {
    return null; // Will redirect in useEffect
  }

  return <EmployeePortal />;
};

export default EmployeeDashboard;
