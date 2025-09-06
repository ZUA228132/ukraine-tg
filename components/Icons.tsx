import React from 'react';

export const LockIcon: React.FC<{ unlocked?: boolean }> = ({ unlocked }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className={`transition-all duration-500 ${unlocked ? 'transform -translate-y-1' : ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d={unlocked ? "M13.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m12.15-3.383A4.5 4.5 0 0018 6.75a4.5 4.5 0 00-4.5 4.5v3.75m0 0H6.375m10.125 0a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75v-4.5a.75.75 0 01.75-.75h13.5" : "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"} />
  </svg>
);

export const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

export const CrossIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const FaceEnrollRingIcon: React.FC<{ progress: number }> = ({ progress }) => {
  const strokeWidth = 4;
  const radius = 50 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
      {/* Solid gray background track */}
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="#4b5563" // Gray color for the track
        strokeWidth={strokeWidth}
      />
      {/* Solid green progress arc that fills over the track */}
      {progress > 0 && (
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="#34d399" // Green color for progress
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference * progress} ${circumference}`}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};


export const CrosshairIcon: React.FC = () => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-80">
    <path d="M50 15 C 55 35, 55 65, 50 85" stroke="#87CEFA" strokeWidth="1" strokeLinecap="round" />
    <path d="M15 50 C 35 45, 65 45, 85 50" stroke="#87CEFA" strokeWidth="1" strokeLinecap="round" />
  </svg>
);