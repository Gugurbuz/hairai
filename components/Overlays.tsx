
import React from 'react';
import { CaptureStatus } from '../types';
import { ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Move } from 'lucide-react';

interface OverlayProps {
  status: CaptureStatus;
  stepId: string;
  guidance?: 'left' | 'right' | 'up' | 'down' | 'closer' | 'back' | 'perfect' | null;
}

// --- Silhouettes ---

const FrontSilhouette = ({ isActive }: { isActive: boolean }) => (
  <path 
    d="M 20 100 Q 20 70 30 65 Q 25 40 30 25 Q 50 5 70 25 Q 75 40 70 65 Q 80 70 80 100"
    fill="none"
    stroke={isActive ? "#10b981" : "rgba(255,255,255,0.4)"}
    strokeWidth={isActive ? "1" : "0.5"}
    strokeDasharray={isActive ? "none" : "4 2"}
    className="transition-all duration-300"
  />
);

const SideSilhouette = ({ isActive, direction }: { isActive: boolean, direction: 'left' | 'right' }) => (
  <path 
    d="M 35 100 Q 35 80 40 70 Q 30 60 30 40 Q 35 10 60 10 Q 75 10 75 30 Q 75 60 70 70 Q 75 80 75 100"
    fill="none"
    stroke={isActive ? "#10b981" : "rgba(255,255,255,0.4)"}
    strokeWidth={isActive ? "1" : "0.5"}
    strokeDasharray={isActive ? "none" : "4 2"}
    transform={direction === 'left' ? "scale(-1, 1) translate(-100, 0)" : ""}
    className="transition-all duration-300"
  />
);

const TopSilhouette = ({ isActive }: { isActive: boolean }) => (
  <path 
    d="M 25 70 Q 25 20 50 20 Q 75 20 75 70 Q 75 90 50 90 Q 25 90 25 70"
    fill="none"
    stroke={isActive ? "#10b981" : "rgba(255,255,255,0.4)"}
    strokeWidth={isActive ? "1" : "0.5"}
    strokeDasharray={isActive ? "none" : "4 2"}
    className="transition-all duration-300"
  />
);

// --- Directional Arrows ---

const BigArrow = ({ type }: { type: 'left' | 'right' | 'up' | 'down' }) => {
  const icons = {
    left: ChevronLeft,
    right: ChevronRight,
    up: ChevronUp,
    down: ChevronDown
  };
  const Icon = icons[type];
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
       <div className="bg-black/50 p-6 rounded-full backdrop-blur-sm animate-pulse">
          <Icon size={64} className="text-white" strokeWidth={3} />
       </div>
    </div>
  );
};

const DistanceGuide = ({ type }: { type: 'closer' | 'back' }) => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
       <div className="bg-black/50 px-6 py-3 rounded-full backdrop-blur-sm flex items-center gap-3">
          <Move size={32} className="text-white animate-bounce" />
          <span className="text-white font-bold text-xl uppercase">
            {type === 'closer' ? 'Move Closer' : 'Move Back'}
          </span>
       </div>
    </div>
);

export const CameraOverlay: React.FC<OverlayProps> = ({ status, stepId, guidance }) => {
  const isPerfect = status === 'perfect';

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
      {/* SVG Silhouette Layer */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-60">
        {stepId === 'front' && <FrontSilhouette isActive={isPerfect} />}
        {stepId === 'right' && <SideSilhouette direction="right" isActive={isPerfect} />}
        {stepId === 'left' && <SideSilhouette direction="left" isActive={isPerfect} />}
        {stepId === 'top' && <TopSilhouette isActive={isPerfect} />}
      </svg>

      {/* Dynamic Guidance Layer */}
      {guidance === 'left' && <BigArrow type="left" />}
      {guidance === 'right' && <BigArrow type="right" />}
      {guidance === 'up' && <BigArrow type="up" />}
      {guidance === 'down' && <BigArrow type="down" />}
      
      {guidance === 'closer' && <DistanceGuide type="closer" />}
      {guidance === 'back' && <DistanceGuide type="back" />}

      {/* Success Pulse */}
      {isPerfect && (
        <div className="absolute inset-0 border-[6px] border-emerald-500 animate-pulse box-border" />
      )}
    </div>
  );
};
