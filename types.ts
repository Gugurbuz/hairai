
export type CameraMode = 'user' | 'environment';

export type CaptureStatus = 
  | 'initializing' 
  | 'searching' 
  | 'wrong-pose' 
  | 'perfect' 
  | 'capturing' 
  | 'manual';

export interface PoseTarget {
  minYaw: number;
  maxYaw: number;
  minPitch?: number;
  maxPitch?: number;
}

export interface StepConfig {
  id: string;
  label: string; // Long label for top instruction
  shortLabel: string; // Short label for bottom progress bar
  target: PoseTarget | null;
  guide: string;
}

export interface PoseResult {
  yaw: number;
  pitch: number;
}

export interface LeadData {
  fullName: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  age: string;
}

export type ViewState = 
  | 'landing' 
  | 'gender-select' 
  | 'instructions' 
  | 'camera' 
  | 'analysis' 
  | 'lead-form' 
  | 'report';

// Extend Window interface for BlazeFace globals
declare global {
  interface Window {
    blazeface: {
      load: () => Promise<any>;
    };
    tf: any;
  }
}
