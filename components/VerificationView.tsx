import React, { useEffect, useState } from 'react';
import { VerificationStatus } from '../types';
import { CheckIcon, CrossIcon, LockIcon } from './Icons';

interface VerificationViewProps {
  status: VerificationStatus;
  error: string;
  onRetry: () => void;
}

const VerificationView: React.FC<VerificationViewProps> = ({ status, error, onRetry }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (status === VerificationStatus.SUCCESS) {
      // Trigger the unlock animation
      const timer = setTimeout(() => setIsUnlocked(true), 100);
      return () => clearTimeout(timer);
    } else {
        setIsUnlocked(false);
    }
  }, [status]);

  const getMessage = () => {
    switch (status) {
      case VerificationStatus.VERIFYING:
        return { title: 'Перевірка...', subtitle: 'Це займе лише хвилину.' };
      case VerificationStatus.SUCCESS:
        return { title: 'Успішно', subtitle: '' };
      case VerificationStatus.FAILED:
        return { title: 'Перевірку не пройдено', subtitle: error };
      default:
        return { title: '', subtitle: '' };
    }
  };

  const { title, subtitle } = getMessage();

  const renderIcon = () => {
    switch(status) {
        case VerificationStatus.VERIFYING:
            return <LockIcon />;
        case VerificationStatus.SUCCESS:
            return <LockIcon unlocked={isUnlocked} />;
        case VerificationStatus.FAILED:
            return <CrossIcon />;
        default:
            return null;
    }
  }

  const iconColorClass = {
      [VerificationStatus.VERIFYING]: 'text-gray-400',
      [VerificationStatus.SUCCESS]: 'text-white',
      [VerificationStatus.FAILED]: 'text-red-500',
      [VerificationStatus.IDLE]: '',
      [VerificationStatus.SCANNING]: '',
  }[status];


  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
        <style>{`
            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .animate-fade-in { animation: fade-in 0.5s ease-in-out; }
        `}</style>
      <div className={`w-32 h-32 mb-12 transition-colors duration-300 ${iconColorClass}`}>
        {renderIcon()}
      </div>
      <div className="h-24">
        <h1 className="text-3xl font-bold text-white mb-2 transition-opacity duration-300">{title}</h1>
        <p className="text-lg text-gray-400 max-w-sm transition-opacity duration-300">{subtitle}</p>
      </div>
      {status === VerificationStatus.FAILED && (
        <div className="absolute bottom-16 w-full px-8">
            <button
            onClick={onRetry}
            className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-lg transition-transform duration-200 active:scale-95"
            >
            Спробувати ще
            </button>
        </div>
      )}
       {status === VerificationStatus.SUCCESS && (
         <div className="absolute bottom-16 w-full px-8 flex justify-center">
            <div className="text-green-400 flex items-center gap-2">
                <CheckIcon />
                <span className="font-semibold">Готово</span>
            </div>
        </div>
       )}
    </div>
  );
};

export default VerificationView;