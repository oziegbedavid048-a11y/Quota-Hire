import React from 'react';
import EmployeeDashboard from '@/components/employee-dashboard';
import CompanyDashboard from '@/components/company-dashboard';
import { useStoredRole } from '@/services/user-role';

export default function DashboardScreen() {
  const role = useStoredRole();

  if (role === 'company') {
    return <CompanyDashboard />;
  }

  return <EmployeeDashboard />;
}
