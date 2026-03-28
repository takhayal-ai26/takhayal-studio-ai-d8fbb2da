import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, CreditCard, FileText } from 'lucide-react';
import AdminUsers from './AdminUsers';
import AdminBilling from './AdminBilling';

export default function AdminUsersMerged() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage users, credits, billing, and subscription plans</p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="users" className="text-xs gap-1.5"><Users size={14} /> All Users</TabsTrigger>
          <TabsTrigger value="billing" className="text-xs gap-1.5"><CreditCard size={14} /> Credits & Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <AdminUsers embedded />
        </TabsContent>

        <TabsContent value="billing">
          <AdminBilling embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
