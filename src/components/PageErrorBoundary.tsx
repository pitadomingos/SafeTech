import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PageErrorBoundary extends (React.Component as any) {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Page Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center w-full h-[60vh] bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 text-center mt-8">
          <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4">
            <AlertTriangle size={48} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Module Offline</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
            This specific module encountered an unexpected error. The rest of the application remains fully functional.
          </p>
          <div className="bg-slate-200 dark:bg-slate-800 p-4 rounded-lg text-left text-xs font-mono text-red-600 dark:text-red-400 max-w-lg overflow-auto mb-6">
            {(this.state as any).error?.message || "Unknown rendering error."}
          </div>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <RefreshCw size={18} />
            Try Reloading Module
          </button>
        </div>
      );
    }

    return (this.props as any).children;
  }
}
