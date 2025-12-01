
import { PoseResult } from '../types';

export const loadScript = (src: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { 
      resolve(true); 
      return; 
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.body.appendChild(script);
  });
};

export const calculatePose = (prediction: any): PoseResult => {
  if (!prediction || !prediction.landmarks) return { yaw: 0, pitch: 0, roll: 0, probability: 0 };
  
  const probability = prediction.probability ? prediction.probability[0] : 0;
  
  // BlazeFace landmarks: [eyeRight, eyeLeft, nose, mouth, earRight, earLeft]
  const lm = prediction.landmarks as number[][]; 
  const rightEye = lm[0];
  const leftEye = lm[1];
  const nose = lm[2];
  
  // Distance between eyes (Inter-pupillary distance)
  const dx = rightEye[0] - leftEye[0];
  const dy = rightEye[1] - leftEye[1];
  const eyeDist = Math.sqrt(dx * dx + dy * dy);

  // Center point between eyes
  const eyeMidX = (rightEye[0] + leftEye[0]) / 2;
  const eyeMidY = (rightEye[1] + leftEye[1]) / 2;

  // YAW: Relative X position of nose to eye-center
  const yawRaw = (nose[0] - eyeMidX) / (eyeDist || 1);

  // PITCH: Relative Y position of nose to eye-center
  // Offset 0.4 because nose is naturally lower
  const pitchRaw = ((nose[1] - eyeMidY) / (eyeDist || 1)) - 0.4; 

  // ROLL: Angle of the eyes relative to horizontal
  // In radians. 0 is horizontal.
  const rollRaw = Math.atan2(dy, dx); 

  return { yaw: yawRaw, pitch: pitchRaw, roll: rollRaw, probability };
};
