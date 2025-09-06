import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FaceEnrollRingIcon, CrosshairIcon } from './Icons';

interface FaceScannerProps {
  onComplete: (imageData: string, videoBlob: Blob | null) => void;
  onCancel: () => void;
}

const analysisTexts = [
  "Аналіз...",
  "Пошук обличчя...",
  "Оцінка чіткості...",
  "Перевірка освітлення...",
];

const FaceScanner: React.FC<FaceScannerProps> = ({ onComplete, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [analysisText, setAnalysisText] = useState(analysisTexts[0]);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnalysisText(prev => {
        const currentIndex = analysisTexts.indexOf(prev);
        const nextIndex = (currentIndex + 1) % analysisTexts.length;
        return analysisTexts[nextIndex];
      });
    }, 2000); // Change text every 2 seconds
  
    return () => clearInterval(interval);
  }, []);

  const captureImageAndComplete = useCallback(() => {
    const capture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.translate(canvas.width, 0);
                context.scale(-1, 1);
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpeg', 0.9);
                const videoBlob = recordedChunksRef.current.length > 0 ? new Blob(recordedChunksRef.current, { type: 'video/webm' }) : null;
                onComplete(imageData, videoBlob);
            }
        }
    };

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.onstop = capture; // Ensure capture happens after stopping
        mediaRecorderRef.current.stop();
    } else {
        capture(); // Fallback if recorder state is not as expected
    }
  }, [onComplete]);

  // Automatic Scan Logic
  useEffect(() => {
    let stream: MediaStream | null = null;
    let startTime: number | null = null;
    const scanDuration = 15000 + Math.random() * 18000; // 15-33 seconds

    const step = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }
      const elapsedTime = timestamp - startTime;
      const currentProgress = Math.min(elapsedTime / scanDuration, 1);
      setProgress(currentProgress);

      if (elapsedTime < scanDuration) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        captureImageAndComplete();
      }
    };

    const enableCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 720 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          
          recordedChunksRef.current = [];
          mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
          mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
              recordedChunksRef.current.push(event.data);
            }
          };
          mediaRecorderRef.current.start();

          animationFrameRef.current = requestAnimationFrame(step);
        }
      } catch (err) {
        console.error("Error accessing camera: ", err);
        setError('Не вдалося отримати доступ до камери. Перевірте дозволи.');
      }
    };

    enableCamera();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [captureImageAndComplete]);


  return (
    <div className="w-full h-full flex flex-col items-center justify-between bg-black animate-fade-in relative p-4">
       <style>{`
            @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
            .animate-fade-in { animation: fade-in 0.5s ease-in-out; }
            .analysis-text {
                opacity: 0;
                animation: fade-in-out 2s infinite;
            }
            @keyframes fade-in-out {
                0% { opacity: 0; }
                25% { opacity: 1; }
                75% { opacity: 1; }
                100% { opacity: 0; }
            }
        `}</style>
      
      <div className="text-center pt-12">
        <h1 className="text-3xl font-bold text-white">Сканування обличчя</h1>
      </div>

      <div className="relative w-[80vw] max-w-[300px] aspect-square flex items-center justify-center">
        <div className="absolute inset-0 bg-gray-200 rounded-full" />
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover rounded-full transform -scale-x-100"
        />
        <div className="absolute inset-0">
          <FaceEnrollRingIcon progress={progress} />
        </div>
        <div className="absolute inset-0 p-4">
          <CrosshairIcon />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
             <p className="text-lg text-white/90 drop-shadow-md mt-28">Повільно повертайте голову</p>
        </div>
      </div>
        
      {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      
      <div className="w-full px-8 pb-4">
        <div className="w-full max-w-sm mx-auto mb-4 h-10 flex items-center justify-center">
            <p className="text-sm text-gray-400 tracking-widest text-center analysis-text" key={analysisText}>
                {analysisText}
            </p>
        </div>
        <div className="w-full max-w-sm mx-auto">
            <button 
                onClick={onCancel}
                className="w-full bg-gray-700/50 hover:bg-gray-700/80 text-white font-semibold py-3 px-8 rounded-full transition-colors backdrop-blur-sm"
            >
            Скасувати
            </button>
        </div>
      </div>
    </div>
  );
};

export default FaceScanner;