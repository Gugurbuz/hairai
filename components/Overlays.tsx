import React from 'react';
import { CaptureStatus } from '../types';

interface OverlayProps {
  status: CaptureStatus;
}

interface SideOverlayProps extends OverlayProps {
  direction: 'left' | 'right';
}

export const HeadFrontOverlay: React.FC<OverlayProps> = ({ status }) => {
  const isPerfect = status === 'perfect';
  const strokeColor = isPerfect ? '#10b981' : 'rgba(255, 255, 255, 0.85)';
  const fillColor = isPerfect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)';
  
  return (
    <svg 
      viewBox="0 0 200 250" 
      className="w-full h-full pointer-events-none transition-all duration-300"
      style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.6))' }}
    >
      {/* 
         Medical Mannequin Silhouette - Front
         Refined path for a more natural head shape with ears and neck.
      */}
      <path 
        d="M 100 25
           C 128 25 148 45 152 75
           C 153 82 153 88 152 95
           C 155 98 158 102 158 110
           C 158 122 154 128 152 130
           L 152 140
           C 152 175 130 205 100 205
           C 70 205 48 175 48 140
           L 48 130
           C 46 128 42 122 42 110
           C 42 102 45 98 48 95
           C 47 88 47 82 48 75
           C 52 45 72 25 100 25 Z"
        fill={fillColor}
        stroke={strokeColor} 
        strokeWidth={isPerfect ? 3 : 2}
        strokeLinejoin="round"
      />

      {/* Inner Ear Details - Subtle cues for rotation */}
      <path 
        d="M 152 100 C 155 105 155 115 152 120 M 48 100 C 45 105 45 115 48 120"
        stroke={strokeColor}
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />

      {/* Clinical Grid Lines - Only visible when not perfect to guide the user */}
      {!isPerfect && (
        <>
          {/* Eye Level Axis */}
          <line 
            x1="40" y1="105" 
            x2="160" y2="105" 
            stroke="rgba(255,255,255,0.5)" 
            strokeWidth="1" 
            strokeDasharray="4,3" 
          />
          {/* Eye markers */}
          <path d="M 65 105 L 75 105 M 70 100 L 70 110" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
          <path d="M 125 105 L 135 105 M 130 100 L 130 110" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />

          {/* Center Vertical Axis */}
          <line 
            x1="100" y1="25" 
            x2="100" y2="205" 
            stroke="rgba(255,255,255,0.3)" 
            strokeWidth="1" 
            strokeDasharray="8,4" 
          />
        </>
      )}

      {/* Shoulder/Neck Hints */}
      <path 
        d="M 65 200 Q 60 220 30 230 M 135 200 Q 140 220 170 230" 
        stroke={strokeColor} 
        strokeWidth="1.5" 
        strokeDasharray="3,3" 
        opacity="0.5"
        fill="none"
      />

      {/* Status Text */}
      <text 
        x="100" y="242" 
        textAnchor="middle" 
        fill="white" 
        fontSize="12" 
        fontWeight="700" 
        letterSpacing="0.05em"
        style={{ textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
      >
        {isPerfect ? 'Position Locked' : 'Align Face'}
      </text>
    </svg>
  );
};

export const HeadSideOverlay: React.FC<SideOverlayProps> = ({ direction, status }) => {
  const isPerfect = status === 'perfect';
  const strokeColor = isPerfect ? '#10b981' : 'rgba(255, 255, 255, 0.85)';
  const fillColor = isPerfect ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)';

  return (
    <svg 
      viewBox="0 0 200 250" 
      className={`w-full h-full pointer-events-none transition-all duration-300 ${direction === 'left' ? 'scale-x-[-1]' : ''}`}
      style={{ filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.6))' }}
    >
      {/* 
         Medical Mannequin Silhouette - Profile
         Detailed curves for forehead, nose bridge, lips, chin, and jaw.
      */}
      <path 
        d="M 90 30
           C 115 30 135 50 138 75  
           C 139 80 138 85 145 92 
           L 152 98               
           L 142 105              
           C 144 108 144 112 140 115 
           C 138 118 138 120 140 122 
           C 138 130 132 138 125 142 
           C 120 145 110 152 100 152 
           L 95 152
           C 85 152 75 145 65 140
           L 65 210
           L 45 210
           L 45 140
           C 45 100 50 30 90 30 Z"
        fill={fillColor} 
        stroke={strokeColor} 
        strokeWidth={isPerfect ? 3 : 2} 
        strokeLinejoin="round"
      />
      
      {/* Detailed Ear Landmark */}
      <g transform="translate(68, 95)" opacity="0.9">
        <path 
           d="M 15 0 C 5 0 0 10 0 20 C 0 35 10 45 20 42 C 25 40 28 30 28 20 C 28 5 22 0 15 0 Z"
           stroke={strokeColor}
           strokeWidth="1.5"
           fill="none"
        />
        <path 
           d="M 10 10 C 15 8 20 12 18 22 M 12 28 C 8 28 5 25 5 20"
           stroke={strokeColor}
           strokeWidth="1"
           fill="none"
           opacity="0.7"
        />
      </g>

      {/* Eye Level Guide */}
       {!isPerfect && (
        <line 
            x1="120" y1="95" 
            x2="160" y2="95" 
            stroke="rgba(255,255,255,0.5)" 
            strokeWidth="1" 
            strokeDasharray="3,3" 
        />
       )}

      <text 
        x="100" y="242" 
        textAnchor="middle" 
        fill="white" 
        fontSize="12" 
        fontWeight="700" 
        letterSpacing="0.05em"
        style={{ textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
        transform={direction === 'left' ? 'scale(-1, 1) translate(-200, 0)' : ''}
      >
        {direction === 'right' ? 'SHOW RIGHT EAR' : 'SHOW LEFT EAR'}
      </text>
    </svg>
  );
};