import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React component:', error, errorInfo);
  }

  private handleRetry = () => {
    // A simple window reload to completely reset the application state
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-neutral-50 dark:bg-neutral-950 font-body py-16 px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-warm-500/10 pointer-events-none" />

          <div className="w-full max-w-md flex-shrink-0 relative z-10 text-center">
            <div className="bg-white/40 dark:bg-neutral-900/40 backdrop-blur-2xl rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-red-500/20 p-8 sm:p-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none rounded-t-[2.5rem]" />

              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-4 tracking-tight">
                Oops! Something went wrong.
              </h1>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-medium mb-8">
                The application encountered an unexpected error. Please try refreshing the page to recover.
              </p>

              <Button
                onClick={this.handleRetry}
                className="w-full py-3.5 sm:py-4 rounded-xl text-sm sm:text-base font-bold text-white shadow-xl transition-all duration-300 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 hover:shadow-red-500/30 flex items-center justify-center gap-2"
              >
                <RefreshCcw size={20} />
                Try Again
              </Button>
              
              {this.state.error && process.env.NODE_ENV === 'development' && (
                <div className="mt-8 text-left bg-black/10 dark:bg-black/30 p-4 rounded-xl overflow-auto text-xs text-neutral-800 dark:text-neutral-300 font-mono max-h-40">
                  {this.state.error.message}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
