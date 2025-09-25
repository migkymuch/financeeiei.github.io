import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { CheckCircle, AlertCircle, Clock, Save } from 'lucide-react';
import { useFinanceState } from '../hooks/useFinanceState';

interface DataPersistenceIndicatorProps {
  className?: string;
}

export default function DataPersistenceIndicator({ className = '' }: DataPersistenceIndicatorProps) {
  const { error, lastUpdated } = useFinanceState();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSaveTime, setLastSaveTime] = useState<string>('');

  useEffect(() => {
    if (error) {
      setSaveStatus('error');
    } else if (lastUpdated) {
      setSaveStatus('saved');
      setLastSaveTime(new Date(lastUpdated).toLocaleTimeString());
    }
  }, [error, lastUpdated]);

  const getStatusIcon = () => {
    switch (saveStatus) {
      case 'saved':
        return <CheckCircle className="w-3 h-3" />;
      case 'saving':
        return <Clock className="w-3 h-3 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Save className="w-3 h-3" />;
    }
  };

  const getStatusColor = () => {
    switch (saveStatus) {
      case 'saved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'saving':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (saveStatus) {
      case 'saved':
        return lastSaveTime ? `บันทึกแล้ว ${lastSaveTime}` : 'บันทึกแล้ว';
      case 'saving':
        return 'กำลังบันทึก...';
      case 'error':
        return 'เกิดข้อผิดพลาด';
      default:
        return 'สถานะไม่ทราบ';
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`flex items-center gap-1 ${getStatusColor()} ${className}`}
    >
      {getStatusIcon()}
      <span className="text-xs">{getStatusText()}</span>
    </Badge>
  );
}
