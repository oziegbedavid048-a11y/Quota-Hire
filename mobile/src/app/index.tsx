import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalDashboardData } from '@/hooks/useLocalDashboardData';
import EmployeeDashboard from '@/components/employee-dashboard';
import CompanyDashboard from '@/components/company-dashboard';
import { Palette } from '@/constants/theme';
import * as SecureStore from 'expo-secure-store';

export default function DashboardScreen() {
  const { user, isLoading } = useLocalDashboardData();

  // Detect role — prefer SecureStore (real login) over mock
  const [role, setRole] = React.useState<string | null>(null);
  React.useEffect(() => {
    SecureStore.getItemAsync('user_role').then(r => setRole(r || user?.role || 'employee'));
  }, [user]);

  if (isLoading || role === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFBEB' }}>
        <ActivityIndicator size="large" color={Palette.accent500} />
      </View>
    );
  }

  if (role === 'company') {
    return <CompanyDashboard />;
  }

  return <EmployeeDashboard />;
}
