import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { Bell, Check } from 'lucide-react';
import { AnimatedBackground } from '../components/ui/AnimatedBackground';

export const NotificationsPage = () => {
  const { notifications, markNotificationRead } = useAppContext();

  useEffect(() => {
    // Automatically mark all unread notifications as read when the page is opened
    notifications.forEach((notification) => {
      if (!notification.read) {
        markNotificationRead(notification.id);
      }
    });
  }, [notifications, markNotificationRead]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.03 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, height: 0, transition: { duration: 0.2 } }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Just now';
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return 'Just now';
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 relative overflow-hidden font-sans">
      <AnimatedBackground />

      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 px-2">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-1">
            Notifications
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            Stay updated with your latest alerts and messages.
          </p>
        </motion.div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          {notifications.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
              <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-800/50 rounded-full mx-auto mb-4 flex items-center justify-center text-neutral-400 dark:text-neutral-500">
                <Bell strokeWidth={1.5} size={28} />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-1">All Caught Up!</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">You have no new notifications right now.</p>
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="divide-y divide-neutral-100 dark:divide-neutral-800">
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.div 
                    key={notification.id} 
                    variants={itemVariants}
                    layout
                    className={`p-5 flex items-start gap-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 group ${
                      notification.read ? 'opacity-80' : 'bg-blue-50/30 dark:bg-blue-900/10'
                    }`}
                  >
                    <div className="mt-1 relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        notification.read 
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400' 
                          : 'bg-accent-100 dark:bg-accent-900/40 text-accent-600'
                      }`}>
                        <Bell strokeWidth={1.5} size={18} />
                      </div>
                      {!notification.read && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent-500 border-2 border-white dark:border-neutral-900 rounded-full" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-1">
                        <h3 className={`text-base truncate ${notification.read ? 'font-medium text-neutral-700 dark:text-neutral-300' : 'font-semibold text-neutral-900 dark:text-white'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed ${notification.read ? 'text-neutral-500 dark:text-neutral-500' : 'text-neutral-600 dark:text-neutral-300'}`}>
                        {notification.message}
                      </p>
                    </div>

                    {!notification.read && (
                      <button 
                        onClick={() => markNotificationRead(notification.id)}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 text-neutral-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/30 rounded-lg transition-all flex-shrink-0 self-center"
                        title="Mark as read"
                        aria-label="Mark as read"
                      >
                        <Check strokeWidth={2} size={18} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
