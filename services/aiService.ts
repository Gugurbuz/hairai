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
  if (!prediction || !prediction.landmarks) return { yaw: 0, pitch: 0 };
  
  // BlazeFace landmarks: [eyeRight, eyeLeft, nose, mouth, earRight, earLeft]
  const lm = prediction.landmarks as number[][]; 
  const rightEye = lm[0];
  const leftEye = lm[1];
  const nose = lm[2];

  // YAW (Rotation Left/Right)
  // Determine where the nose is relative to the center of the eyes
  const eyeMidX = (rightEye[0] + leftEye[0]) / 2;
  const eyeDist = Math.abs(rightEye[0] - leftEye[0]); // Distance between eyes as a scale unit
  
  // Normalization: 0 = Center, -1 = Right, +1 = Left (Approx)
  // Note: Directions depend on mirroring.
  const yaw = (nose[0] - eyeMidX) / (eyeDist || 1);

  // PITCH (Up/Down) - Simple approximation
  const eyeMidY = (rightEye[1] + leftEye[1]) / 2;
  const noseY = nose[1];
  const pitch = (noseY - eyeMidY) / (eyeDist || 1); 

  return { yaw, pitch };
};