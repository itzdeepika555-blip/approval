import React from 'react';

interface LoadingStateProps {
  message?: string;
  submessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading statutory records...',
  submessage = 'Synchronizing with Government Single Window Engine',
}) => {
  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-full border-3 border-blue-200 border-t-blue-700 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-amber-500 rounded-full animate-ping opacity-75" />
        </div>
      </div>
      <p className="text-sm font-semibold text-gray-800 mb-1">{message}</p>
      {submessage && <p className="text-xs text-gray-500 max-w-sm">{submessage}</p>}
    </div>
  );
};
