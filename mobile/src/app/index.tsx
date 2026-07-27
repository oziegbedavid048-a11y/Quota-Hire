import React from 'react';
import EmployeeDashboard from '@/components/employee-dashboard';
import CompanyDashboard from '@/components/company-dashboard';
import * as SecureStore from 'expo-secure-store';

export default function DashboardScreen() {
  // Read role from SecureStore — cached from login, available instantly
  const [role, setRole] = React.useState<string | null>(null);

  React.useEffect(() => {
    SecureStore.getItemAsync('user_role').then(r => setRole(r || 'employee'));
  }, []);

  // If role hasn't been read yet, render nothing (not a spinner — just an invisible frame)
  // SecureStore read is typically < 5ms, so this is imperceptible
  if (role === null) return null;

  if (role === 'company') {
    return <CompanyDashboard />;
  }

  return <EmployeeDashboard />;
}
