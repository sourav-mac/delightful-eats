import { Outlet } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';

export function AdminLayoutWrapper() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
