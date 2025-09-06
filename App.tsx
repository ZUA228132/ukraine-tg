import React, { useState, useCallback, useEffect } from 'react';
import { VerificationStatus, Submission } from './types';
import WelcomeScreen from './components/WelcomeScreen';
import FaceScanner from './components/FaceScanner';
import VerificationView from './components/VerificationView';
import PassportUpload from './components/PassportUpload';
import { getSubmissions, clearSubmissions, submitVerification } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.IDLE);
  const [error, setError] = useState<string>('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  
  const [verificationData, setVerificationData] = useState<{
    faceImage: string;
    faceVideo: Blob | null;
  } | null>(null);

  const isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true';

  useEffect(() => {
    if (isAdmin) {
      getSubmissions()
        .then(setSubmissions)
        .catch(e => console.error("Failed to load submissions", e))
        .finally(() => setIsAdminLoading(false));
    }
  }, [isAdmin]);

  const handleStart = () => {
    setStatus(VerificationStatus.SCANNING);
  };
  
  const handleCancel = () => {
    setStatus(VerificationStatus.IDLE);
    setVerificationData(null);
  }

  const handleRetry = () => {
    setStatus(VerificationStatus.SCANNING);
    setError('');
    setVerificationData(null);
  };

  const handleClearSubmissions = () => {
    if (window.confirm('Ви впевнені, що хочете видалити всі заявки? Ця дія незворотна.')) {
      clearSubmissions().then(() => setSubmissions([]));
    }
  };

  const handleScanComplete = useCallback((imageData: string, videoBlob: Blob | null) => {
    setVerificationData({ faceImage: imageData, faceVideo: videoBlob });
    setStatus(VerificationStatus.PASSPORT_UPLOAD);
  }, []);
  
  const handlePassportComplete = useCallback(async (passportImageData: string) => {
    if (!verificationData) {
      setError('Дані сканування обличчя відсутні.');
      setStatus(VerificationStatus.FAILED);
      return;
    }

    setStatus(VerificationStatus.VERIFYING);
    
    try {
        const userName = (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.first_name || 'Anonymous';
        await submitVerification(userName, verificationData.faceImage, verificationData.faceVideo, passportImageData);
        setStatus(VerificationStatus.SUCCESS);
    } catch (e: any) {
        console.error("Failed to submit verification", e);
        setError(e.message || 'Не вдалося надіслати заявку.');
        setStatus(VerificationStatus.FAILED);
    }
  }, [verificationData]);


  if (isAdmin) {
    return (
      <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Адмін-панель</h1>
            <button
              onClick={handleClearSubmissions}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-transform duration-200 active:scale-95"
            >
              Очистити все
            </button>
          </div>
          {isAdminLoading ? (
             <p className="text-gray-400 text-center py-10">Завантаження заявок...</p>
          ) : submissions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {submissions.map((sub) => (
                <div key={sub.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg flex flex-col">
                   <div className="p-4">
                    <p className="font-bold text-lg truncate">{sub.userName}</p>
                    <p className="text-xs text-gray-400">{new Date(sub.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1 flex-grow">
                    <a href={sub.imageData} target="_blank" rel="noopener noreferrer">
                      <img src={sub.imageData} alt="Face" className="w-full h-32 object-cover" title="Face Scan"/>
                    </a>
                    <a href={sub.passportImageData} target="_blank" rel="noopener noreferrer">
                      <img src={sub.passportImageData} alt="Passport" className="w-full h-32 object-cover" title="Passport"/>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-10">Заявок поки немає.</p>
          )}
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (status) {
      case VerificationStatus.IDLE:
        return <WelcomeScreen onStart={handleStart} />;
      case VerificationStatus.SCANNING:
        return <FaceScanner onComplete={handleScanComplete} onCancel={handleCancel} />;
      case VerificationStatus.PASSPORT_UPLOAD:
        return <PassportUpload onComplete={handlePassportComplete} onCancel={handleCancel} />;
      case VerificationStatus.VERIFYING:
      case VerificationStatus.SUCCESS:
      case VerificationStatus.FAILED:
        return <VerificationView status={status} error={error} onRetry={handleRetry} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      {renderContent()}
    </div>
  );
};

export default App;