// components/LabelProcessingIndicator.tsx
import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, Tag } from 'lucide-react';
import { LabelProcessingStatus } from '../types';

interface LabelProcessingIndicatorProps {
  status: LabelProcessingStatus;
  onReset: () => void;
}

const LabelProcessingIndicator: React.FC<LabelProcessingIndicatorProps> = ({ status, onReset }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (status.isActive || status.isFinished) {
      setIsVisible(true);
      setIsPulsing(false); // Reset pulse on new activity
    }

    if (status.isFinished) {
      setIsPulsing(true);
      const pulseTimer = setTimeout(() => setIsPulsing(false), 2000); // Pulse duration
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        onReset();
      }, 5000); // Stay visible for 5 seconds

      return () => {
        clearTimeout(pulseTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [status, onReset]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-[101] p-3 rounded-lg shadow-lg border transition-all duration-500 flex items-center gap-3 ${
      status.isFinished 
        ? `bg-green-100 border-green-300 ${isPulsing ? 'animate-pulse' : ''}`
        : 'bg-white border-gray-200'
    }`}>
      {status.isActive && <Loader2 size={20} className="animate-spin text-blue-600" />}
      {status.isFinished && <CheckCircle size={20} className="text-green-600" />}
      
      <div>
        <p className={`font-semibold text-sm ${status.isFinished ? 'text-green-800' : 'text-gray-800'}`}>
          {status.message}
        </p>
        {status.isActive && status.total > 0 && (
          <div className="w-40 bg-gray-200 rounded-full h-1.5 mt-1">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${status.progress}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabelProcessingIndicator;