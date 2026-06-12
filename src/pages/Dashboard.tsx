import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAppContext, apiFetch } from '../context/AppContext';
import { CompanyDashboardPage } from './company/CompanyDashboard';
import { EmployeeDashboardPage } from './employee/EmployeeDashboard';

const EmployeeDashboard = ({ user, analytics, analyticsLoading }: any) => {
  return <EmployeeDashboardPage user={user} analytics={analytics} analyticsLoading={analyticsLoading} />;
};

const CompanyDashboard = () => {
  return <CompanyDashboardPage />;
};

export const Dashboard = () => {
  const { currentUser, loading } = useAppContext();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await apiFetch('/dashboard/analytics/');
        setAnalytics(data);
      } catch(e) {
        console.error(e);
      } finally {
        setIsAnalyticsLoading(false);
      }
    };
    if (currentUser) {
      fetchAnalytics();
    }
  }, [currentUser]);

  if (loading || isAnalyticsLoading || !currentUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-accent-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {currentUser.role === 'company' ? (
        <CompanyDashboard />
      ) : (
        <EmployeeDashboard user={currentUser} analytics={analytics} analyticsLoading={isAnalyticsLoading} />
      )}
    </div>
  );
};
