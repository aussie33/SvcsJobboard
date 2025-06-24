import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ManageJobs from './ManageJobs';
import ViewApplications from './ViewApplications';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User } from '@shared/schema';

const EmployeePortal = () => {
  const [activeTab, setActiveTab] = useState('manage-jobs');
  const { user } = useAuth();

  if (!user) return null;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Employee Portal</CardTitle>
            <CardDescription>Manage your job postings and applicants</CardDescription>
          </CardHeader>
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="border-b border-gray-200 w-full justify-start rounded-none px-6">
              <TabsTrigger value="manage-jobs" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Manage Job Postings
              </TabsTrigger>
              <TabsTrigger value="applications" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                View Applications
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>
        
        <Tabs value={activeTab} className="w-full">
          <TabsContent value="manage-jobs">
            <ManageJobs user={user} />
          </TabsContent>
          
          <TabsContent value="applications">
            <ViewApplications user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default EmployeePortal;
