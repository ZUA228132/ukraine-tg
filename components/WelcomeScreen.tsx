import React, { useState } from 'react';
import { LockIcon } from './Icons';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [agreed, setAgreed] = useState(false);
  const telegram = (window as any).Telegram?.WebApp;
  const userName = telegram?.initDataUnsafe?.user?.first_name || 'User';

  return (
    <div className="flex flex-col items-center justify-between h-full text-center p-8 text-white animate-fade-in">
       <style>{`
            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .animate-fade-in { animation: fade-in 0.5s ease-in-out; }
            .checkbox-custom {
              width: 1.5rem;
              height: 1.5rem;
              border: 2px solid #555;
              border-radius: 6px;
              display: inline-block;
              position: relative;
              vertical-align: middle;
              margin-right: 0.75rem;
              background-color: #222;
              transition: background-color 0.2s, border-color 0.2s;
            }
            .checkbox-custom.checked {
              background-color: #007aff;
              border-color: #007aff;
            }
            .checkbox-custom.checked::after {
              content: '';
              position: absolute;
              left: 7px;
              top: 2px;
              width: 6px;
              height: 12px;
              border: solid white;
              border-width: 0 3px 3px 0;
              transform: rotate(45deg);
            }
        `}</style>
      
      <div className="flex-grow flex flex-col items-center justify-center pt-16">
        <h1 className="text-3xl font-bold mb-4">Підтвердження віку</h1>
        <p className="text-lg text-gray-400 max-w-sm">
          Вітаємо, {userName}. Щоб продовжити, нам потрібно переконатися, що ви досягли повноліття.
        </p>
      </div>

      <div className="w-full pb-8">
        <div className="text-left max-w-xs mx-auto mb-6">
          <label htmlFor="agreement" className="flex items-center text-gray-400 cursor-pointer">
            <input 
              id="agreement"
              type="checkbox" 
              checked={agreed} 
              onChange={() => setAgreed(!agreed)} 
              className="opacity-0 absolute h-0 w-0"
            />
            <span className={`checkbox-custom ${agreed ? 'checked' : ''}`}></span>
            <span className="text-sm">Я згоден на обробку моїх біометричних даних для підтвердження віку.</span>
          </label>
        </div>
        <button
          onClick={onStart}
          disabled={!agreed}
          className="w-full max-w-xs mx-auto bg-blue-600 text-white font-bold py-4 px-4 rounded-xl text-lg transition-all duration-200 active:scale-95 disabled:bg-gray-600 disabled:opacity-50"
        >
          Почати перевірку
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;