import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
      
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'light' ?
        <motion.span
          key="moon"
          initial={{
            opacity: 0,
            rotate: -90,
            scale: 0.5
          }}
          animate={{
            opacity: 1,
            rotate: 0,
            scale: 1
          }}
          exit={{
            opacity: 0,
            rotate: 90,
            scale: 0.5
          }}
          transition={{
            duration: 0.25
          }}
          className="block">
          
            <Moon size={18} />
          </motion.span> :

        <motion.span
          key="sun"
          initial={{
            opacity: 0,
            rotate: 90,
            scale: 0.5
          }}
          animate={{
            opacity: 1,
            rotate: 0,
            scale: 1
          }}
          exit={{
            opacity: 0,
            rotate: -90,
            scale: 0.5
          }}
          transition={{
            duration: 0.25
          }}
          className="block">
          
            <Sun size={18} />
          </motion.span>
        }
      </AnimatePresence>
    </button>);

};