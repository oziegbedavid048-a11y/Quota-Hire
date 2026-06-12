import { WifiOff, RefreshCcw } from 'lucide-react';
import { Button } from './Button';

interface GlobalErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const GlobalErrorState = ({ error, onRetry }: GlobalErrorStateProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-neutral-50 dark:bg-neutral-950 font-body py-16 px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-warm-500/10 pointer-events-none" />

      <div className="w-full max-w-md flex-shrink-0 relative z-10 text-center">
        <div className="bg-white/40 dark:bg-neutral-900/40 backdrop-blur-2xl rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-orange-500/20 p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none rounded-t-[2.5rem]" />

          <div className="w-20 h-20 mx-auto rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center mb-6">
            <WifiOff className="w-10 h-10 text-orange-500" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-4 tracking-tight">
            Connection Lost
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-medium mb-8">
            {error || "We couldn't connect to our servers. Please check your internet connection and try again."}
          </p>

          <Button
            onClick={onRetry}
            className="w-full py-3.5 sm:py-4 rounded-xl text-sm sm:text-base font-bold text-white shadow-xl transition-all duration-300 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 hover:shadow-orange-500/30 flex items-center justify-center gap-2"
          >
            <RefreshCcw size={20} />
            Retry Connection
          </Button>
        </div>
      </div>
    </div>
  );
};
