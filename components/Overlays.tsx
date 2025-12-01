
import React from 'react';
import { CaptureStatus } from '../types';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, MoveVertical } from 'lucide-react';

interface OverlayProps {
  status: CaptureStatus;
  stepId: string;
  guidance?: 'left' | 'right' | 'up' | 'down' | 'closer' | 'back' | 'perfect' | null;
}

const HeadOutline = ({ isActive, stepId }: { isActive: boolean; stepId: string }) => {
  const strokeColor = isActive ? '#10b981' : 'rgba(255,255,255,0.3)';
  const strokeWidth = isActive ? 3 : 2;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg
        width="280"
        height="350"
        viewBox="0 0 280 350"
        className="transition-all duration-300"
      >
        {stepId === 'front' && (
          <ellipse
            cx="140"
            cy="175"
            rx="100"
            ry="140"
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={isActive ? '0' : '8 4'}
          />
        )}

        {stepId === 'right' && (
          <ellipse
            cx="140"
            cy="175"
            rx="70"
            ry="140"
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={isActive ? '0' : '8 4'}
          />
        )}

        {stepId === 'left' && (
          <ellipse
            cx="140"
            cy="175"
            rx="70"
            ry="140"
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={isActive ? '0' : '8 4'}
          />
        )}

        {stepId === 'top' && (
          <ellipse
            cx="140"
            cy="175"
            rx="100"
            ry="100"
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={isActive ? '0' : '8 4'}
          />
        )}
      </svg>
    </div>
  );
};

const DirectionArrow = ({ type }: { type: 'left' | 'right' | 'up' | 'down' }) => {
  const icons = {
    left: ArrowLeft,
    right: ArrowRight,
    up: ArrowUp,
    down: ArrowDown
  };
  const Icon = icons[type];

  const positions = {
    left: 'left-8',
    right: 'right-8',
    up: 'top-24',
    down: 'bottom-24'
  };

  const animationClass = type === 'left' || type === 'right'
    ? 'animate-[bounce-horizontal_1s_ease-in-out_infinite]'
    : 'animate-bounce';

  return (
    <>
      <style>{`
        @keyframes bounce-horizontal {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(${type === 'left' ? '-10px' : '10px'}); }
        }
      `}</style>
      <div className={`absolute ${positions[type]} ${type === 'up' || type === 'down' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2'} z-30 pointer-events-none`}>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-2xl">
          <Icon size={56} className={`text-white ${animationClass}`} strokeWidth={2.5} />
        </div>
      </div>
    </>
  );
};

const DistanceGuide = ({ type }: { type: 'closer' | 'back' }) => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-4">
      <MoveVertical size={40} className="text-white animate-pulse" strokeWidth={2.5} />
      <span className="text-white font-bold text-2xl tracking-wide">
        {type === 'closer' ? 'Move Closer' : 'Move Back'}
      </span>
    </div>
  </div>
);

export const CameraOverlay: React.FC<OverlayProps> = ({ status, stepId, guidance }) => {
  const isPerfect = status === 'perfect';

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
      {/* Head outline guide */}
      {stepId !== 'back' && <HeadOutline isActive={isPerfect} stepId={stepId} />}

      {/* Directional arrows */}
      {guidance === 'left' && <DirectionArrow type="left" />}
      {guidance === 'right' && <DirectionArrow type="right" />}
      {guidance === 'up' && <DirectionArrow type="up" />}
      {guidance === 'down' && <DirectionArrow type="down" />}

      {/* Distance guidance */}
      {guidance === 'closer' && <DistanceGuide type="closer" />}
      {guidance === 'back' && <DistanceGuide type="back" />}

      {/* Perfect alignment border */}
      {isPerfect && (
        <div className="absolute inset-0">
          <div className="absolute inset-0 border-4 border-emerald-500 rounded-lg animate-pulse" />
          <div className="absolute inset-2 border-2 border-emerald-400 rounded-lg animate-pulse" style={{ animationDelay: '0.15s' }} />
        </div>
      )}
    </div>
  );
};
