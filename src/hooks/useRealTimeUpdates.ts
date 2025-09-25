// Hook for real-time updates and data synchronization
import { useEffect } from 'react';

interface RealTimeUpdatesProps {
  data: any;
  forceSave: () => void;
}

export const useRealTimeUpdates = ({ data, forceSave }: RealTimeUpdatesProps) => {
  // Auto-save when data changes
  useEffect(() => {
    if (data) {
      // Debounce auto-save to avoid excessive saves
      const timeoutId = setTimeout(() => {
        forceSave();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [data, forceSave]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      forceSave();
      // Optional: show warning if there are unsaved changes
      e.preventDefault();
      e.returnValue = '';
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        forceSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [forceSave]);

  // Periodic save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (data) {
        forceSave();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [data, forceSave]);

  return {
    // Force immediate save
    saveNow: forceSave,
    // Check if data exists
    hasData: !!data
  };
};