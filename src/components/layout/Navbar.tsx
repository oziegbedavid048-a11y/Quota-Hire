import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  LogOut,
  User as UserIcon,
  Bell,
  Menu,
  X,
  Search } from
'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
export const Navbar = () => {
  const { currentUser, logout, notifications, markNotificationRead } =
  useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const userNotifications = notifications.filter(
    (n) => n.userId === currentUser?.id
  );
  const unreadCount = userNotifications.filter((n) => !n.read).length;
  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };
  const getDashboardLink = () => {
    if (!currentUser) return '/';
    if (currentUser.role === 'admin') return `${import.meta.env.VITE_BACKEND_URL}/admin/`;
    if (currentUser.role === 'company') return '/dashboard';
    return '/dashboard';
  };
  const getProfileLink = () => {
    if (!currentUser) return '/';
    if (currentUser.role === 'company') return '/company/profile';
    if (currentUser.role === 'employee') return '/employee/profile';
    return `${import.meta.env.VITE_BACKEND_URL}/admin/`;
  };
  const isAuthPage =
  location.pathname === '/login' || location.pathname === '/signup';
  if (isAuthPage) return null;
  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-6">
      <div className="max-w-6xl mx-auto rounded-[32px] border border-white/50 dark:border-white/10 bg-white/30 dark:bg-neutral-950/30 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo size={38} />
          <span className="font-display font-bold text-xl tracking-tight text-neutral-900 dark:text-white">
            Quota Hire
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {!currentUser ?
          <>
              <Link
              to="/"
              className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
              
                Home
              </Link>
              <Link to="/about" className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">About</Link>

              <Link to="/contact" className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Contact</Link>
              <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700"></div>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </> :

          <>
              {currentUser.role === 'employee' && (
                <Link
                  to="/jobs"
                  className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Jobs
                </Link>
              )}
              <Link
              to={getDashboardLink()}
              className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
              
                Dashboard
              </Link>

              <div className="flex items-center gap-2 ml-4 border-l border-neutral-200 dark:border-neutral-800 pl-4 relative">
                <button
                className="relative p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}>
                
                  <Bell size={18} />
                  {unreadCount > 0 &&
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full"></span>
                }
                </button>

                <AnimatePresence>
                  {isNotificationsOpen &&
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 10
                  }}
                  animate={{
                    opacity: 1,
                    y: 0
                  }}
                  exit={{
                    opacity: 0,
                    y: 10
                  }}
                  className="absolute top-full right-12 mt-2 w-80 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl rounded-xl shadow-elevated border border-neutral-200 dark:border-neutral-800 overflow-hidden z-50">
                  
                      <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900">
                        <h3 className="font-bold text-neutral-900 dark:text-white">
                          Notifications
                        </h3>
                        {unreadCount > 0 &&
                    <span className="text-xs bg-accent-100 dark:bg-accent-900/40 text-accent-800 dark:text-accent-200 px-2 py-0.5 rounded-full font-medium">
                            {unreadCount} new
                          </span>
                    }
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {userNotifications.length === 0 ?
                    <div className="p-6 text-center text-neutral-500 dark:text-neutral-400 text-sm">
                            No notifications yet.
                          </div> :

                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {userNotifications.map((notif) =>
                      <div
                        key={notif.id}
                        className={`p-4 ${!notif.read ? 'bg-accent-50/50 dark:bg-accent-900/20' : 'bg-white dark:bg-neutral-900'} hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors`}
                        onClick={() => {
                          markNotificationRead(notif.id);
                          setIsNotificationsOpen(false);
                        }}>
                        
                                <div className="flex justify-between items-start mb-1">
                                  <h4
                            className={`text-sm ${!notif.read ? 'font-bold text-neutral-900 dark:text-white' : 'font-medium text-neutral-700 dark:text-neutral-300'}`}>
                            
                                    {notif.title}
                                  </h4>
                                  {!notif.read &&
                          <span className="w-2 h-2 bg-accent-500 rounded-full mt-1.5 flex-shrink-0"></span>
                          }
                                </div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                  {notif.message}
                                </p>
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2 block">
                                  {new Date(
                            notif.createdAt
                          ).toLocaleDateString()}
                                </span>
                              </div>
                      )}
                          </div>
                    }
                      </div>
                    </motion.div>
                }
                </AnimatePresence>

                <Link
                to={getProfileLink()}
                className="w-8 h-8 rounded-full bg-accent-100 dark:bg-accent-900/40 flex items-center justify-center text-accent-900 dark:text-accent-100 font-medium hover:ring-2 hover:ring-accent-300 dark:hover:ring-accent-600 transition-all ml-1">
                
                  {currentUser.name.charAt(0)}
                </Link>
                <button
                onClick={handleLogout}
                className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
                title="Log out">
                
                  <LogOut size={18} />
                </button>
              </div>
            </>
          }
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center gap-2">
          <button
            className="p-2 text-neutral-900 dark:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen &&
        <motion.div
          initial={{
            height: 0,
            opacity: 0
          }}
          animate={{
            height: 'auto',
            opacity: 1
          }}
          exit={{
            height: 0,
            opacity: 0
          }}
          className="md:hidden bg-white/30 dark:bg-neutral-950/30 backdrop-blur-2xl border border-white/50 dark:border-white/10 overflow-hidden mt-2 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          
            <div className="px-5 py-6 flex flex-col gap-4">
              {!currentUser ?
            <>
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-neutral-700 dark:text-neutral-300 py-2">Home</Link>
                  <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-neutral-700 dark:text-neutral-300 py-2">About</Link>

                  <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-neutral-700 dark:text-neutral-300 py-2">Contact</Link>
                  <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800 my-2"></div>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full mb-2">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </> :

            <>
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="w-10 h-10 rounded-full bg-accent-100 dark:bg-accent-900/40 flex items-center justify-center text-accent-900 dark:text-accent-100 font-bold text-lg">
                      {currentUser.name.charAt(0)}
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
                to={getDashboardLink()}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium text-neutral-700 dark:text-neutral-300 py-2 flex items-center gap-2">
                
                    <Briefcase size={18} /> Dashboard
                  </Link>
                  {currentUser.role === 'employee' && (
                    <Link
                      to="/jobs"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-base font-medium text-neutral-700 dark:text-neutral-300 py-2 flex items-center gap-2">
                      <Search size={18} /> Browse Jobs
                    </Link>
                  )}
                  <Link
                to={getProfileLink()}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium text-neutral-700 dark:text-neutral-300 py-2 flex items-center gap-2">
                
                    <UserIcon size={18} /> My Profile
                  </Link>

                  <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800 my-2"></div>
                  <button
                onClick={handleLogout}
                className="text-base font-medium text-red-600 py-2 flex items-center gap-2 text-left">
                
                    <LogOut size={18} /> Log out
                  </button>
                </>
            }
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </header>);

};