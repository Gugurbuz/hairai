
import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, CheckCircle } from 'lucide-react';
import { loadScript, calculatePose } from '../services/aiService';
import { CaptureStatus, StepConfig } from '../types';
import { CameraOverlay } from './Overlays';

interface SmartCameraProps {
  step: number;
  setStep: (step: number) => void;
  images: Record<string, string>;
  setImages: (images: Record<string, string>) => void;
  onAnalyze: () => void;
}

const steps: StepConfig[] = [
  { 
    id: 'front', 
    label: 'Front View', 
    shortLabel: 'Hairline', 
    target: { minYaw: -0.25, maxYaw: 0.25, minPitch: -0.2, maxPitch: 0.2 }, 
    guide: 'Look straight at camera' 
  },
  { 
    id: 'right', 
    label: 'Right Side', 
    shortLabel: 'Right', 
    target: { minYaw: 0.4, maxYaw: 1.5 }, // Positive yaw = Head turned Right
    guide: 'Turn head to the Right' 
  },
  { 
    id: 'left', 
    label: 'Left Side', 
    shortLabel: 'Left', 
    target: { minYaw: -1.5, maxYaw: -0.4 }, // Negative yaw = Head turned Left
    guide: 'Turn head to the Left' 
  },
  { 
    id: 'top', 
    label: 'Crown Area', 
    shortLabel: 'Top', 
    target: { minYaw: -0.5, maxYaw: 0.5, minPitch: 0.15, maxPitch: 0.8 }, 
    guide: 'Tilt head down' 
  },
  { 
    id: 'back', 
    label: 'Donor Area', 
    shortLabel: 'Back', 
    target: null, 
    guide: 'Photo of back area' 
  },
];

export const SmartCamera: React.FC<SmartCameraProps> = ({ step, setStep, images, setImages, onAnalyze }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number>();
  
  const [model, setModel] = useState<any>(null);
  const [status, setStatus] = useState<CaptureStatus>('initializing');
  const [instruction, setInstruction] = useState<string>("Initializing...");
  const [guidance, setGuidance] = useState<'left'|'right'|'up'|'down'|'closer'|'back'|'perfect'|null>(null);
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const currentStep = steps[step];

  // 1. Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
             videoRef.current?.play().catch(() => {});
          };
        }
      } catch (err) {
        setStatus('manual');
      }
    };
    startCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // 2. Load AI
  useEffect(() => {
    if (currentStep.id === 'back') {
      setStatus('manual');
      setInstruction("Take a photo of the back area");
      setGuidance(null);
      return;
    }

    const loadAI = async () => {
      setInstruction("Aligning...");
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0/dist/tf.min.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.7/dist/blazeface.min.js");
      if (window.blazeface) {
        const m = await window.blazeface.load();
        setModel(m);
        setStatus('searching');
      }
    };
    loadAI();
  }, [currentStep.id]);

  // 3. Render Loop
  useEffect(() => {
    if (capturedImage || status === 'manual') return;

    const loop = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState === 4 && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          // Draw Mirrored Video
          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0);
          ctx.restore();

          if (model && currentStep.target) {
            const predictions = await model.estimateFaces(video, false);

            if (predictions.length > 0) {
              const face = predictions[0];
              const pose = calculatePose(face);
              
              // 1. Distance Check
              const faceWidth = face.bottomRight[0] - face.topLeft[0];
              const coverage = faceWidth / canvas.width;

              let newGuidance: typeof guidance = null;
              let isAligned = false;

              if (coverage < 0.25) {
                newGuidance = 'closer';
                setInstruction("Move Closer");
              } else if (coverage > 0.70) {
                newGuidance = 'back';
                setInstruction("Move Back");
              } else {
                // 2. Angle Check (Mirrored Yaw)
                const yaw = pose.yaw * -1; // Mirror the yaw for intuitive checking
                const pitch = pose.pitch;
                const { minYaw, maxYaw, minPitch, maxPitch } = currentStep.target;

                // Priority Logic: Fix Yaw first, then Pitch
                if (yaw < minYaw) {
                    newGuidance = 'left'; // "Turn Left" (arrow pointing left)
                    setInstruction("Turn Left");
                } else if (yaw > maxYaw) {
                    newGuidance = 'right'; // "Turn Right"
                    setInstruction("Turn Right");
                } else {
                    // Yaw is good, check Pitch if needed
                    if (minPitch !== undefined && pitch < minPitch) {
                        newGuidance = 'down';
                        setInstruction("Tilt Down");
                    } else if (maxPitch !== undefined && pitch > maxPitch) {
                        newGuidance = 'up';
                        setInstruction("Tilt Up");
                    } else {
                        isAligned = true;
                    }
                }
              }

              setGuidance(newGuidance);

              if (isAligned) {
                setStatus('perfect');
                setInstruction("Perfect - Hold Still");
                setProgress(p => Math.min(p + 4, 100)); // Fill bar
              } else {
                setStatus('wrong-pose');
                setProgress(p => Math.max(p - 5, 0)); // Decay bar
              }

            } else {
               setInstruction("Face not found");
               setGuidance(null);
               setProgress(0);
            }
          }
        }
      }
      requestRef.current = requestAnimationFrame(loop);
    };

    loop();
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [model, status, currentStep, capturedImage]);

  // Auto-Capture Trigger
  useEffect(() => {
    if (progress >= 100 && !capturedImage) {
        takePhoto();
    }
  }, [progress, capturedImage]);

  const takePhoto = () => {
    const canvas = canvasRef.current;
    if (canvas) {
        if (navigator.vibrate) navigator.vibrate(200);
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.9));
        setStatus('capturing');
    }
  };

  const nextStep = () => {
    const newImages = { ...images, [currentStep.id]: capturedImage! };
    setImages(newImages);
    setCapturedImage(null);
    setProgress(0);
    setGuidance(null);
    if (step < steps.length - 1) {
        setStep(step + 1);
    } else {
        onAnalyze();
    }
  };

  return (
    <div className="flex flex-col h-full bg-black relative">
       
       {/* Top Instruction Pill */}
       <div className="absolute top-8 left-0 right-0 z-30 flex justify-center">
            <div className={`px-6 py-3 rounded-full backdrop-blur-md border border-white/10 shadow-lg transition-colors duration-300 ${status === 'perfect' ? 'bg-emerald-500/90 text-white' : 'bg-black/70 text-white'}`}>
                <span className="font-bold text-lg">{instruction}</span>
            </div>
       </div>

       {/* Camera Viewport */}
       <div className="flex-1 relative overflow-hidden bg-gray-900 flex items-center justify-center">
           <video ref={videoRef} className="absolute opacity-0 pointer-events-none" playsInline autoPlay muted />
           
           {capturedImage ? (
               <img src={capturedImage} className="absolute inset-0 w-full h-full object-contain bg-black z-40" />
           ) : (
               <>
                   <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
                   {status !== 'manual' && currentStep.id !== 'back' && (
                       <CameraOverlay status={status} stepId={currentStep.id} guidance={guidance} />
                   )}
               </>
           )}
       </div>

       {/* Bottom Controls */}
       <div className="bg-black p-6 z-30 pb-10">
           {capturedImage ? (
               <div className="flex gap-4">
                   <button onClick={() => setCapturedImage(null)} className="flex-1 py-4 bg-gray-800 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                       <RotateCcw size={20}/> Retake
                   </button>
                   <button onClick={nextStep} className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                       <CheckCircle size={20}/> Continue
                   </button>
               </div>
           ) : (
               <div className="flex flex-col gap-6">
                   {/* Step Indicator */}
                   <div className="flex justify-center gap-3">
                       {steps.map((s, i) => (
                           <div key={i} className={`flex flex-col items-center gap-1 transition-colors ${i === step ? 'text-white' : i < step ? 'text-emerald-500' : 'text-gray-600'}`}>
                               <div className={`w-3 h-3 rounded-full ${i === step ? 'bg-white scale-125' : i < step ? 'bg-emerald-500' : 'bg-gray-700'}`} />
                               <span className="text-[10px] font-medium uppercase tracking-wider">{s.shortLabel}</span>
                           </div>
                       ))}
                   </div>
                   
                   {/* Auto Capture Progress Bar */}
                   {(status !== 'manual' && currentStep.id !== 'back') && (
                       <div className="h-14 w-full bg-gray-800 rounded-full relative overflow-hidden flex items-center justify-center border border-white/10">
                           <div 
                                className="absolute left-0 top-0 bottom-0 bg-emerald-500 transition-all duration-100 ease-linear"
                                style={{ width: `${progress}%` }} 
                           />
                           <span className="relative z-10 font-bold text-white tracking-wide uppercase text-sm">
                               {progress > 0 ? "Aligning..." : "Auto Capture"}
                           </span>
                       </div>
                   )}

                   {/* Manual Shutter for Back View */}
                   {(status === 'manual' || currentStep.id === 'back') && (
                       <div className="flex justify-center">
                           <button onClick={takePhoto} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/10 active:scale-95 transition-transform">
                               <div className="w-12 h-12 bg-white rounded-full" />
                           </button>
                       </div>
                   )}
               </div>
           )}
       </div>
    </div>
  );
};
