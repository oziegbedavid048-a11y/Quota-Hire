import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Menu, 
  X, 
  LogOut, 
  Search, 
  User as UserIcon,
  LayoutDashboard,
  Bell,
  Heart,
  Sparkles,
  List,
  LayoutList,
  Settings
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { toast } from 'sonner';

function FloatingHeader({ toggleSidebar, user }: { toggleSidebar: () => void; user: any }) {
  const { notifications } = useAppContext();
  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;
  
  const getProfileLink = () => {
    if (!user) return '/';
    if (user.role === 'company') return '/company/profile';
    if (user.role === 'employee') return '/employee/profile';
    return 'http://localhost:8000/admin/';
  };

  const userAvatarUrl = user?.avatarUrl;

  return (
    <header className="sticky top-0 z-40 w-full transition-colors duration-300 border-b border-neutral-200 dark:border-neutral-800 bg-white/95/95 backdrop-blur-md">
      <div className="flex h-[72px] items-center justify-between px-4 md:px-8 mx-auto w-full">
        
        {/* LEFT SIDE: Logo */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Quota Hire Logo" className="w-10 h-10 object-contain" />
            <span className="font-display font-bold text-lg md:text-xl tracking-tight text-neutral-900 dark:text-white hidden sm:block">
              Quota Hire
            </span>
          </Link>
        </div>

        {/* RIGHT SIDE: Notifications, Profile, Mobile Menu */}
        <div className="flex items-center gap-3 md:gap-4">
          
          {/* Notification Bell */}
          <Link to="/notifications" className="relative p-2.5 rounded-full bg-neutral-100 dark:bg-[#1f232b] hover:bg-neutral-200 dark:hover:bg-[#252a34] text-neutral-700 dark:text-neutral-300 transition-colors group">
            <Bell size={20} className="group-hover:animate-wiggle" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent-500 rounded-full border-2 border-white dark:border-[#1f232b]"></span>
            )}
          </Link>

          {/* Profile */}
          {user && (
            <Link to={getProfileLink()} className="flex items-center gap-3 group bg-neutral-100 dark:bg-[#1f232b] rounded-full p-1.5 pr-4 hover:bg-neutral-200 dark:hover:bg-[#252a34] transition-all">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-accent-100 dark:bg-accent-900/40 flex items-center justify-center text-accent-900 dark:text-accent-100 font-bold shrink-0">
                {userAvatarUrl ? (
                  <img src={userAvatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  (user.name || user.first_name || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">{user.name || user.first_name || 'User'}</p>
              </div>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-full bg-neutral-100 dark:bg-[#1f232b] hover:bg-neutral-200 dark:hover:bg-[#252a34] transition-colors text-neutral-900 dark:text-white shrink-0"
            onClick={toggleSidebar}
          >
            <Menu size={24} />
          </button>

        </div>
      </div>
    </header>
  );
}

function PillSidebar({ isOpen, closeSidebar, user }: { isOpen: boolean; closeSidebar: () => void; user: any }) {
  const location = useLocation();
  const { logout } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getProfileLink = () => {
    if (!user) return '/';
    if (user.role === 'company') return '/company/profile';
    if (user.role === 'employee') return '/employee/profile';
    return 'http://localhost:8000/admin/';
  };

  const links = user?.role === 'admin' ? [
    { name: 'Django Admin', href: 'http://localhost:8000/admin/', icon: LayoutDashboard },
  ] : [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ...(user?.role === 'employee' ? [
      { name: 'Browse Jobs', href: '/jobs', icon: Search },
      { name: 'Saved Jobs', href: '/saved-jobs', icon: Heart }
    ] : []),
    { name: 'My Profile', href: getProfileLink(), icon: UserIcon },
    ...(user?.role === 'employee' ? [
      { name: 'App Tracker', href: '/employee/tracker', icon: LayoutList },
      { name: 'AI Coach', href: '/employee/ai-coach', icon: Sparkles }
    ] : []),
    ...(user?.role === 'company' ? [
      { name: 'Post Job', href: '/company/post-job', icon: Briefcase },
      { name: 'My Jobs', href: '/company/jobs', icon: List }
    ] : []),
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm md:hidden" 
          onClick={closeSidebar}
        />
      )}
      
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[260px] transform transition-all duration-300 md:static md:flex-shrink-0 flex flex-col ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} md:translate-x-0 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 overflow-hidden`}
      >
        <div className="flex items-center justify-between p-5 shrink-0 border-b border-neutral-100 dark:border-neutral-800">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Quota Hire Logo" className="w-10 h-10 object-contain" />
            <span className="font-display font-bold text-lg text-neutral-900 dark:text-white tracking-tight">Quota Hire</span>
          </Link>
          <button onClick={closeSidebar} className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-500 hover:text-neutral-900 dark:hover:text-white md:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1.5 custom-scrollbar">
          {links.map((link) => {
            const isActive = location.pathname === link.href || (link.href !== '/dashboard' && location.pathname.startsWith(link.href));
            const isAICoach = link.name === 'AI Coach';

            if (isAICoach) {
              return (
                <button
                  key={link.name}
                  onClick={() => {
                    closeSidebar();
                    toast('🚀 AI Coach is coming soon!', {
                      description: 'This feature will be available very soon. Stay tuned!',
                      duration: 4000,
                    });
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer"
                >
                  <div className="p-1 rounded-full text-neutral-400">
                    <link.icon size={20} strokeWidth={2} />
                  </div>
                  {link.name}
                  <span className="ml-auto text-[10px] font-extrabold px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md uppercase tracking-wide">Soon</span>
                </button>
              );
            }

            return (
              <Link key={link.name} to={link.href} onClick={closeSidebar}>
                <div
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-accent-500 text-white shadow-soft'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <div className={`p-1 rounded-full ${isActive ? 'text-white' : 'text-neutral-400 dark:text-neutral-500'}`}>
                    <link.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  {link.name}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 shrink-0 space-y-2 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex justify-center mb-3">
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-[14px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <LogOut size={18} strokeWidth={2.5} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="p-5 md:p-8 w-full h-full animate-pulse">
      <div className="flex flex-col md:flex-row justify-between mb-10 gap-4">
        <div>
          <div className="h-10 w-64 bg-neutral-200 dark:bg-neutral-800 rounded-full mb-4"></div>
          <div className="h-4 w-96 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-full"></div>
        </div>
        <div className="h-12 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-full"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-100 dark:border-neutral-800"></div>
        ))}
      </div>
      
      <div className="h-96 bg-white dark:bg-neutral-900 rounded-[32px] border border-neutral-100 dark:border-neutral-800"></div>
    </div>
  );
}

export default function UnifiedDashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, loading } = useAppContext();
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 800); // Shorter skeleton time for snappy feel
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!loading && !currentUser) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden  relative font-sans transition-colors duration-300">
      
      <PillSidebar 
        isOpen={sidebarOpen} 
        closeSidebar={() => setSidebarOpen(false)} 
        user={currentUser}
      />
      
      <div className="flex-1 flex flex-col min-w-0 relative z-10 h-screen overflow-hidden px-2 md:px-0">
        <FloatingHeader 
          toggleSidebar={() => setSidebarOpen(true)} 
          user={currentUser} 
        />
        
        <main className="flex-1 overflow-y-auto px-2 sm:px-4 md:px-6 pb-24 md:pb-8 pt-2 sm:pt-4 custom-scrollbar relative">
          <AnimatePresence mode="wait">
            {loading || isNavigating ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                <PageSkeleton />
              </motion.div>
            ) : (
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full h-full"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
