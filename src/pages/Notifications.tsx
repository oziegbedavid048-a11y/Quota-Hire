import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { Bell, CheckCircle2, Trash2 } from 'lucide-react';
import { AnimatedBackground } from '../components/ui/AnimatedBackground';

export const NotificationsPage = () => {
  const { notifications, markNotificationRead } = useAppContext();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen  py-12 px-4 relative overflow-hidden font-sans">
      <AnimatedBackground />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-100 dark:bg-accent-900/30 text-accent-500 rounded-[24px] mb-6 shadow-inner-soft">
            <Bell size={32} />
          </div>
          <h1 className="text-2xl md:text-xl md:text-2xl md:text-xl md:text-2xl md:text-2xl md:text-xl md:text-2xl font-display font-extrabold text-neutral-900 dark:text-white mb-2">
            Notifications
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg">
            Stay updated with your latest alerts and messages.
          </p>
        </motion.div>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-soft p-8 text-center">
              <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-[32px] mx-auto mb-6 flex items-center justify-center text-neutral-300 dark:text-neutral-600 shadow-inner-soft">
                <Bell size={40} />
              </div>
              <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-2">All Caught Up!</h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-lg">You have no new notifications.</p>
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.div 
                    key={notification.id} 
                    variants={itemVariants}
                    layout
                    className={`p-6 rounded-[24px] flex items-start gap-6 transition-all duration-300 ${
                      notification.read 
                        ? 'bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-800/50 opacity-70 hover:opacity-100' 
                        : 'card-soft border-l-[6px] border-l-accent-500'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center font-bold ${
                      notification.read ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400' : 'bg-accent-100 dark:bg-accent-900/30 text-accent-500 shadow-inner-soft'
                    }`}>
                      <Bell size={20} />
                    </div>
                    
                    <div className="flex-1 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                        <h3 className={`text-lg font-extrabold ${notification.read ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-900 dark:text-white'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md self-start sm:self-auto shrink-0">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-base leading-relaxed ${notification.read ? 'text-neutral-500 dark:text-neutral-500' : 'text-neutral-600 dark:text-neutral-300'}`}>
                        {notification.message}
                      </p>
                    </div>

                    {!notification.read && (
                      <button 
                        onClick={() => markNotificationRead(notification.id)}
                        className="p-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-accent-500 hover:text-accent-500 rounded-2xl transition-all shrink-0 mt-1 shadow-sm group"
                        title="Mark as read"
                      >
                        <CheckCircle2 size={20} className="text-neutral-400 group-hover:text-accent-500 transition-colors" />
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
