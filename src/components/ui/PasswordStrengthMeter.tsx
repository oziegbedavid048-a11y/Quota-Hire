import React from 'react';
import { calculatePasswordStrength } from '../../utils/security';
import { motion } from 'framer-motion';

interface PasswordStrengthMeterProps {
  password?: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  const score = calculatePasswordStrength(password);
  
  // Return early if no password
  if (!password) return null;

  const getStrengthLabel = () => {
    switch (score) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  const getBarColor = (index: number) => {
    if (index >= score) return 'bg-neutral-200 dark:bg-neutral-700'; // Empty
    if (score <= 1) return 'bg-red-500';
    if (score === 2) return 'bg-yellow-500';
    if (score === 3) return 'bg-primary-500';
    return 'bg-green-500'; // score 4
  };

  return (
    <div className="mt-2 space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-neutral-500 dark:text-neutral-400 font-medium">Password Strength</span>
        <span className={`font-bold ${score <= 1 ? 'text-red-500' : score === 2 ? 'text-yellow-500' : score === 3 ? 'text-primary-500' : 'text-green-500'}`}>
          {getStrengthLabel()}
        </span>
      </div>
      <div className="flex gap-1 h-1.5">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0.5, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`h-full flex-1 rounded-full transition-colors duration-300 ${getBarColor(index)}`}
            style={{ originX: 0 }}
          />
        ))}
      </div>
      <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
        Use 8+ characters with a mix of letters, numbers & symbols.
      </p>
    </div>
  );
};
