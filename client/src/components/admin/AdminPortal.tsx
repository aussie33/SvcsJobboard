import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from './UserManagement';
import CategoryManagement from './CategoryManagement';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const AdminPortal = () => {
  const [activeTab, setActiveTab] = useState('user-accounts');
  const { user } = useAuth();
  
  if (!user || user.role !== 'admin') return null;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Admin Portal</CardTitle>
            <CardDescription>Manage user accounts and system settings</CardDescription>
          </CardHeader>
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="border-b border-gray-200 w-full justify-start rounded-none px-6">
              <TabsTrigger value="user-accounts" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                User Management
              </TabsTrigger>
              <TabsTrigger value="categories" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Job Categories
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>
        
        <TabsContent value="user-accounts" className="m-0" hidden={activeTab !== 'user-accounts'}>
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="categories" className="m-0" hidden={activeTab !== 'categories'}>
          <CategoryManagement />
        </TabsContent>
      </div>
    </section>
  );
};

export default AdminPortal;
