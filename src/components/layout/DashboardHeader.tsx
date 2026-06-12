import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Menu, LogOut, Search, User as UserIcon, Bell } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardHeader = () => {
  const { currentUser, logout, notifications } = useAppContext();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getProfileLink = () => {
    if (!currentUser) return '/';
    if (currentUser.role === 'company') return '/company/profile';
    if (currentUser.role === 'employee') return '/employee/profile';
    return '/admin';
  };

  if (!currentUser) return null;
  
  const userAvatarUrl = (currentUser as any).avatarUrl;
  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-[15px] bg-white/30 dark:bg-black/30 border-b border-white/20 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="px-4 md:px-6 h-16 flex items-center justify-between">
        
        {/* Left Side: Mobile Menu Button + Logo */}
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu size={24} />
          </button>
          
          <Link to="/" className="flex items-center gap-2.5">
            <div className="bg-accent-600 text-white p-2 rounded-xl">
              <Briefcase size={22} />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-neutral-900 dark:text-white hidden sm:block">
              Quota Hire
            </span>
          </Link>
        </div>

        {/* Right Side: Profile Photo */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          <Link to="/notifications" className="relative p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full border-2 border-white dark:border-black/30"></span>
            )}
          </Link>
          
          <Link
            to={getProfileLink()}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-neutral-200 dark:border-neutral-800 hover:border-accent-500 transition-colors bg-accent-100 dark:bg-accent-900/40 flex items-center justify-center text-accent-900 dark:text-accent-100 font-medium">
            {userAvatarUrl ? (
              <img src={userAvatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              currentUser.name.charAt(0)
            )}
          </Link>
          
          <button
            onClick={handleLogout}
            className="hidden sm:flex p-2 text-neutral-500 hover:text-red-600 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
            title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="px-5 py-4 flex flex-col gap-2">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-accent-100 dark:bg-accent-900/40 flex items-center justify-center text-accent-900 dark:text-accent-100 font-bold text-lg">
                  {userAvatarUrl ? (
                    <img src={userAvatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name.charAt(0)
                  )}
                </div>
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                    {currentUser.role}
                  </p>
                </div>
              </div>

              <Link
                to="/jobs"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium text-neutral-700 dark:text-neutral-300 py-2 flex items-center gap-2">
                <Search size={18} /> Browse Jobs
              </Link>
              <Link
                to={getProfileLink()}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium text-neutral-700 dark:text-neutral-300 py-2 flex items-center gap-2">
                <UserIcon size={18} /> My Profile
              </Link>

              <button
                onClick={handleLogout}
                className="text-base font-medium text-red-600 py-2 flex items-center gap-2 text-left mt-2 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                <LogOut size={18} /> Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
