import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, LogOut, Search, User as UserIcon, Bell } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Logo } from '../ui/Logo';
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
    <header className="sticky top-0 z-50 w-full px-4 pt-4">
      <div className="max-w-7xl mx-auto rounded-[32px] border border-white/50 dark:border-white/10 bg-white/30 dark:bg-neutral-950/30 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="px-5 h-16 flex items-center justify-between">
        
        {/* Left Side: Mobile Menu Button + Logo */}
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu size={24} />
          </button>
          
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={36} />
            <span className="font-display font-bold text-xl tracking-tight text-neutral-900 dark:text-white hidden sm:block">
              Quota Hire
            </span>
          </Link>
        </div>

        {/* Right Side: Profile & Actions */}
        <div className="flex items-center gap-3">
          
          <Link to="/notifications" className="relative p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-950">
                {unreadCount}
              </span>
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
      </div>
    </header>
  );
};
