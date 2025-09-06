import React, { useState, useCallback, ChangeEvent } from 'react';

interface PassportUploadProps {
  onComplete: (passportImageData: string) => void;
  onCancel: () => void;
}

const PassportUpload: React.FC<PassportUploadProps> = ({ onComplete, onCancel }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [imageData, setImageData] = useState<string>('');

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Файл занадто великий. Максимальний розмір 5МБ.');
        return;
      }
      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        setImageData(result);
      };
      reader.onerror = () => {
        setError('Не вдалося прочитати файл.');
      };
      reader.readAsDataURL(file);
    }
  }, []);
  
  const handleSubmit = () => {
      if (imageData) {
          onComplete(imageData);
      } else {
          setError('Будь ласка, виберіть файл для завантаження.');
      }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-between bg-black animate-fade-in p-8 text-center">
      <style>{`
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          .animate-fade-in { animation: fade-in 0.5s ease-in-out; }
      `}</style>

      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-white mb-2">Завантажте паспорт</h1>
        <p className="text-lg text-gray-400">
          Зробіть чітке фото основного розвороту вашого паспорта.
        </p>
      </div>

      <div className="flex-grow flex items-center justify-center w-full max-w-sm my-8">
        <label htmlFor="passport-upload" className="w-full h-48 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
          {preview ? (
            <img src={preview} alt="Предпросмотр паспорта" className="w-full h-full object-contain rounded-xl" />
          ) : (
            <div className="text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="font-semibold">Натисніть для завантаження</span>
            </div>
          )}
        </label>
        <input id="passport-upload" type="file" accept="image/jpeg, image/png" className="hidden" onChange={handleFileChange} />
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      <div className="w-full max-w-sm">
         <button
          onClick={handleSubmit}
          disabled={!imageData}
          className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-xl text-lg transition-all duration-200 active:scale-95 disabled:bg-gray-600 disabled:opacity-50"
        >
          Надіслати
        </button>
         <button 
            onClick={onCancel}
            className="text-white/80 hover:text-white font-semibold transition-colors text-lg mt-4"
        >
          Скасувати
        </button>
      </div>
    </div>
  );
};

export default PassportUpload;