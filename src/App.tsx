import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate } from
'react-router-dom';
import { Toaster } from 'sonner';
import { AppProvider, useAppContext } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { MyJobs } from './pages/company/MyJobs';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { VerifyEmail } from './pages/auth/VerifyEmail';
import { EmployeeSetup } from './pages/employee/Setup';
import { EmployeeProfilePage } from './pages/employee/Profile';
import ResumeUpload from './pages/employee/ResumeUpload';
import { CompanySetup } from './pages/company/Setup';
import { Dashboard } from './pages/Dashboard';
import { CompanyProfilePage } from './pages/company/Profile';
import { PostJob } from './pages/company/PostJob';
import { JobApplicants } from './pages/company/JobApplicants';
import { JobsList } from './pages/jobs/JobsList';
import { JobDetail } from './pages/jobs/JobDetail';
import { ApplyJobPage } from './pages/jobs/ApplyJobPage';
import { NotificationsPage } from './pages/Notifications';
import { About } from './pages/About';
import { Onboarding } from './pages/auth/Onboarding';
import { AIProfileCoach } from './pages/employee/AIProfileCoach';
import { ApplicationTracker } from './pages/employee/ApplicationTracker';
import { SavedJobs } from './pages/jobs/SavedJobs';
import { Purpose } from './pages/Purpose';
import { Contact } from './pages/Contact';

import UnifiedDashboardLayout from './components/layout/UnifiedDashboardLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { GlobalErrorState } from './components/ui/GlobalErrorState';
import { Settings } from './pages/Settings';

// Protected Route Wrapper
const ProtectedRoute = ({
  children,
  allowedRoles
}: {children: React.ReactNode;allowedRoles?: string[];}) => {
  const { currentUser } = useAppContext();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  const location = useLocation();
  const { appError, retryFetchData } = useAppContext();
  
  const isDashboardRoute = location.pathname.includes('/dashboard') || location.pathname.includes('/admin') || location.pathname.includes('/employee/') || location.pathname.includes('/company/') || location.pathname.startsWith('/jobs') || location.pathname.includes('/notifications') || location.pathname.includes('/saved-jobs') || location.pathname === '/settings';
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password' || location.pathname === '/reset-password' || location.pathname === '/verify-email';
  
  if (appError) {
    return <GlobalErrorState error={appError} onRetry={retryFetchData} />;
  }
  
  return (
    <ErrorBoundary>
      <div className={`flex flex-col ${isDashboardRoute ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
        {!isDashboardRoute && <Navbar />}
        <main className="flex-grow flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/purpose" element={<Purpose />} />

          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/jobs" element={<UnifiedDashboardLayout><JobsList /></UnifiedDashboardLayout>} />
          <Route path="/jobs/:id" element={<UnifiedDashboardLayout><JobDetail /></UnifiedDashboardLayout>} />
          <Route path="/jobs/:id/apply" element={<UnifiedDashboardLayout><ApplyJobPage /></UnifiedDashboardLayout>} />

          {/* Employee Routes */}
          <Route
            path="/employee/setup"
            element={
            <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeSetup />
              </ProtectedRoute>
            } />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['employee', 'company']}>
                <UnifiedDashboardLayout><Dashboard /></UnifiedDashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['employee', 'company', 'admin']}>
                <UnifiedDashboardLayout><NotificationsPage /></UnifiedDashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/employee/profile"
            element={
            <ProtectedRoute allowedRoles={['employee']}>
                <UnifiedDashboardLayout><EmployeeProfilePage /></UnifiedDashboardLayout>
              </ProtectedRoute>
            } />

          <Route
            path="/employee/resume"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <UnifiedDashboardLayout><ResumeUpload /></UnifiedDashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/employee/ai-coach"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <UnifiedDashboardLayout><AIProfileCoach /></UnifiedDashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/tracker"
            element={
              <ProtectedRoute allowedRoles={['employee']}>
                <UnifiedDashboardLayout><ApplicationTracker /></UnifiedDashboardLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/saved-jobs"
            element={
              <ProtectedRoute allowedRoles={['employee', 'company']}>
                <UnifiedDashboardLayout><SavedJobs /></UnifiedDashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['employee', 'company']}>
                <UnifiedDashboardLayout><Settings /></UnifiedDashboardLayout>
              </ProtectedRoute>
            }
          />
          

          

          {/* Company Routes */}
          <Route
            path="/company/setup"
            element={
            <ProtectedRoute allowedRoles={['company']}>
                <CompanySetup />
              </ProtectedRoute>
            } />
          

          
          <Route
            path="/company/profile"
            element={
            <ProtectedRoute allowedRoles={['company']}>
                <UnifiedDashboardLayout><CompanyProfilePage /></UnifiedDashboardLayout>
              </ProtectedRoute>
            } />
          
          <Route
            path="/company/post-job"
            element={
            <ProtectedRoute allowedRoles={['company']}>
                <UnifiedDashboardLayout><PostJob /></UnifiedDashboardLayout>
              </ProtectedRoute>
            } />
          
          <Route
            path="/company/jobs"
            element={
            <ProtectedRoute allowedRoles={['company']}>
                <UnifiedDashboardLayout><MyJobs /></UnifiedDashboardLayout>
              </ProtectedRoute>
            } />
          
          <Route
            path="/company/jobs/:id/applicants"
            element={
            <ProtectedRoute allowedRoles={['company']}>
                <UnifiedDashboardLayout><JobApplicants /></UnifiedDashboardLayout>
              </ProtectedRoute>
            } />
          


          
        </Routes>
      </main>
      {!isDashboardRoute && !isAuthRoute && <Footer />}
      </div>
    </ErrorBoundary>
  );

};
export function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Router basename="/Quota-Hire" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
          <Toaster position="top-right" richColors closeButton theme="system" />
        </Router>
      </AppProvider>
    </ThemeProvider>);

}