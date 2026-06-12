import React from 'react';
import { motion } from 'framer-motion';
import { Shield, TrendingUp, Users } from 'lucide-react';
import { useScreenInit } from '../useScreenInit';
export const Purpose = () => {
  useScreenInit('scr_prsrzn');
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.6
          }}
          className="text-center mb-16">
          
          <h1 className="text-2xl md:text-xl md:text-2xl md:text-xl md:text-2xl md:text-2xl md:text-xl md:text-2xl font-display font-bold text-neutral-900 dark:text-white mb-6">
            Our Purpose
          </h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Elevating the sales profession through transparency, verification,
            and direct connection.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
          {
            icon: <Shield className="w-8 h-8 text-accent-600" />,
            title: 'Transparency First',
            desc: 'We mandate upfront salary and OTE ranges on every job posting. No more wasted interview cycles.'
          },
          {
            icon: <TrendingUp className="w-8 h-8 text-accent-600" />,
            title: 'Verified Performance',
            desc: 'We shift the focus from buzzwords to actual metrics: quota attainment, deal sizes, and win rates.'
          },
          {
            icon: <Users className="w-8 h-8 text-accent-600" />,
            title: 'Direct Connection',
            desc: 'We eliminate the middleman, allowing top talent to connect directly with hiring managers.'
          }].
          map((item, i) =>
          <motion.div
            key={i}
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: i * 0.2,
              duration: 0.6
            }}
            className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-center">
            
              <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
                {item.title}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                {item.desc}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>);

};