import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="text-center py-12">
      <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">Something went wrong</h3>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
      {onRetry && (
        <div className="mt-6">
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
