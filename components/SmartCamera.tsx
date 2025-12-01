
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  CheckCircle, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, 
  ZapOff, AlertTriangle, Move, Sun
} from 'lucide-react';
import { loadScript, calculatePose } from '../services/aiService';
import { HeadFrontOverlay, HeadSideOverlay } from './Overlays';
import { CameraMode, CaptureStatus, StepConfig } from '../types';

interface SmartCameraProps {
  step: number;
  setStep: (step: number) => void;
  images: Record<string, string>;
  setImages: (images: Record<string, string>) => void;
  onAnalyze: () => void;
}

// Updated Steps with more forgiving thresholds
const steps: StepConfig[] = [
  { 
    id: 'front', 
    label: 'Center your face', 
    shortLabel: 'Hairline',
    target: { minYaw: -0.2, maxYaw: 0.2, minPitch: -0.25, maxPitch: 0.25 }, 
    guide: 'Look Straight' 
  },
  { 
    id: 'right', 
    label: 'Turn your head to the right', 
    shortLabel: 'Right',
    target: { minYaw: 0.25, maxYaw: 2.5 }, 
    guide: 'Turn Left' 
  },
  { 
    id: 'left', 
    label: 'Turn your head to the left', 
    shortLabel: 'Left',
    target: { minYaw: -2.5, maxYaw: -0.25 }, 
    guide: 'Turn Right' 
  },
  { 
    id: 'top', 
    label: 'Tilt your head down', 
    shortLabel: 'Crown',
    target: { minYaw: -0.6, maxYaw: 0.6, minPitch: 0.2, maxPitch: 1.5 }, 
    guide: 'Tilt Down' 
  },
  { 
    id: 'back', 
    label: 'Scan donor area', 
    shortLabel: 'Donor',
    target: null, 
    guide: 'Turn Around' 
  },
];

export const SmartCamera: React.FC<SmartCameraProps> = ({ step, setStep, images, setImages, onAnalyze }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const poseHistoryRef = useRef<{yaw: number, pitch: number, timestamp: number}[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const prevStatusRef = useRef<CaptureStatus>('initializing');
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [model, setModel] = useState<any>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('user');
  
  const [status, setStatus] = useState<CaptureStatus>('initializing');
  const [guidance, setGuidance] = useState<'left'|'right'|'up'|'down'|'stable'|'closer'|'farther'|null>(null);
  const [msg, setMsg] = useState("Initializing...");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stability, setStability] = useState(0);
  const [isLowLight, setIsLowLight] = useState(false);

  const currentStep = steps[step];

  // --- AUDIO FEEDBACK ---
  const playFeedback = useCallback((type: 'success' | 'warning' | 'shutter') => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'warning') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'shutter') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {
      console.warn("Audio feedback failed", e);
    }
  }, []);

  useEffect(() => {
    if (status === 'perfect' && prevStatusRef.current !== 'perfect') {
      playFeedback('success');
    } else if (status === 'wrong-pose' && prevStatusRef.current === 'perfect') {
      playFeedback('warning');
    }
    prevStatusRef.current = status;
  }, [status, playFeedback]);


  const getOverlay = () => {
    switch (currentStep.id) {
      case 'front': return <HeadFrontOverlay status={status} />;
      case 'right': return <HeadSideOverlay direction="right" status={status} />;
      case 'left': return <HeadSideOverlay direction="left" status={status} />;
      case 'top': return <HeadFrontOverlay status={status} />;
      case 'back': return <div className="border-4 border-dashed border-white/30 rounded-3xl w-64 h-64 flex items-center justify-center"><span className="text-white/50 font-bold">Donor Area</span></div>;
      default: return <HeadFrontOverlay status={status} />;
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadAI = async () => {
      if (currentStep.id === 'back') { 
        if(isMounted) { setStatus('manual'); setMsg("Take photo manually"); }
        return; 
      }
      try {
        setMsg("Loading AI...");
        await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.18.0/dist/tf.min.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@tensorflow-models/blazeface@0.0.7/dist/blazeface.min.js");
        if (window.blazeface) {
          const m = await window.blazeface.load();
          if (isMounted) {
            setModel(m);
            setStatus('searching');
            setMsg("Looking for face...");
          }
        }
      } catch (e) {
        if (isMounted) { setStatus('manual'); setMsg("Manual Mode"); }
      }
    };
    loadAI();
    return () => { isMounted = false; };
  }, [currentStep.id]);

  useEffect(() => {
    const startCam = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: cameraMode, width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: false 
        });
        setStream(s);
        if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(e => console.log(e));
        }
      } catch (e) { setStatus('manual'); }
    };
    startCam();
    return () => { if(stream) stream.getTracks().forEach(t=>t.stop()); };
  }, [cameraMode]);

  const calculateBrightness = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const sampleSize = 100;
    const sx = (width - sampleSize) / 2;
    const sy = (height - sampleSize) / 2;
    try {
      const frame = ctx.getImageData(sx, sy, sampleSize, sampleSize);
      const data = frame.data;
      let sum = 0;
      for (let x = 0, len = data.length; x < len; x += 4) {
        sum += (data[x] + data[x+1] + data[x+2]) / 3;
      }
      return Math.floor(sum / (sampleSize * sampleSize / 4)); // approx
    } catch (e) { return 128; }
  };

  const calculateVariance = (history: {yaw: number, pitch: number}[]) => {
     if (history.length < 5) return 0;
     const yaws = history.map(h => h.yaw);
     const pitches = history.map(h => h.pitch);
     const calcVar = (arr: number[]) => {
        const mean = arr.reduce((a,b)=>a+b)/arr.length;
        return arr.reduce((a,b)=>a + Math.pow(b-mean, 2), 0) / arr.length;
     };
     return Math.max(calcVar(yaws), calcVar(pitches));
  };

  useEffect(() => {
    if (!videoRef.current || !stream || capturedImage || status === 'capturing') return;
    
    if (currentStep.id === 'back' && status !== 'manual') setStatus('manual');

    const renderLoop = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState === 4 && canvas) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        ctx.save();
        if (cameraMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);
        ctx.restore();

        // 1. Image Quality Check
        const brightness = calculateBrightness(ctx, canvas.width, canvas.height);
        const lowLight = brightness < 50; // Lowered threshold to be more forgiving
        setIsLowLight(lowLight);

        // AI Logic
        if (model && status !== 'manual' && currentStep.target) {
          try {
            const predictions = await model.estimateFaces(video, false);
            
            if (predictions.length > 0) {
              const face = predictions[0];
              const { yaw, pitch } = calculatePose(face);
              
              // 2. Pose History
              const now = Date.now();
              poseHistoryRef.current.push({ yaw, pitch, timestamp: now });
              if (poseHistoryRef.current.length > 15) poseHistoryRef.current.shift();
              
              const variance = calculateVariance(poseHistoryRef.current);
              const isStable = variance < 0.008; // Increased threshold (more forgiving)

              // 3. Distance Check
              const faceWidth = (face.bottomRight[0] - face.topLeft[0]);
              const faceRatio = faceWidth / canvas.width;
              const isTooFar = faceRatio < 0.20;
              const isTooClose = faceRatio > 0.80;

              const checkYaw = cameraMode === 'user' ? yaw * -1 : yaw;
              const { minYaw, maxYaw, minPitch, maxPitch } = currentStep.target;

              let newGuidance: typeof guidance = null;
              let newStatus: CaptureStatus = 'searching';
              let newMsg = "";

              if (lowLight) {
                 newStatus = 'wrong-pose';
                 newMsg = "Too Dark";
              } else if (isTooFar) {
                 newGuidance = 'closer';
                 newStatus = 'wrong-pose';
                 newMsg = "Move Closer";
              } else if (isTooClose) {
                 newGuidance = 'farther';
                 newStatus = 'wrong-pose';
                 newMsg = "Move Back";
              } else if (!isStable) {
                 newGuidance = 'stable';
                 newStatus = 'wrong-pose';
                 newMsg = "Hold Still";
              } else {
                 if (checkYaw < minYaw) {
                    newGuidance = 'left';
                    newStatus = 'wrong-pose';
                    newMsg = "Turn Left";
                 } else if (checkYaw > maxYaw) {
                    newGuidance = 'right';
                    newStatus = 'wrong-pose';
                    newMsg = "Turn Right";
                 } else if (minPitch && pitch < minPitch) {
                    newGuidance = 'up';
                    newStatus = 'wrong-pose';
                    newMsg = "Look Up";
                 } else if (maxPitch && pitch > maxPitch) {
                    newGuidance = 'down';
                    newStatus = 'wrong-pose';
                    newMsg = "Look Down";
                 } else {
                    newGuidance = null;
                    newStatus = 'perfect';
                    newMsg = "Perfect";
                 }
              }

              setGuidance(newGuidance);
              setMsg(newMsg);
              
              if (newStatus === 'perfect') {
                  setStatus('perfect');
                  setStability(prev => {
                      const val = prev + 5; 
                      if (val >= 100) triggerAutoCapture();
                      return Math.min(100, val);
                  });
              } else {
                  setStatus('wrong-pose');
                  setStability(prev => Math.max(0, prev - 2)); // Reduced decay rate (more forgiving)
              }

            } else {
              setStatus('searching');
              setGuidance(null);
              setMsg("Looking for face...");
              setStability(0);
            }
          } catch (err) {}
        }
      }
      requestRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [stream, model, status, currentStep, stability, cameraMode, capturedImage]);

  const triggerAutoCapture = () => {
    setStatus(prev => {
        if (prev === 'capturing') return prev;
        let count = 3;
        setCountdown(count);
        const interval = setInterval(() => {
          count--;
          setCountdown(count);
          if (count === 0) {
            clearInterval(interval);
            takePhoto();
            setCountdown(null);
          }
        }, 1000);
        return 'capturing';
    });
  };

  const takePhoto = () => {
    if (canvasRef.current) {
      playFeedback('shutter');
      setCapturedImage(canvasRef.current.toDataURL('image/jpeg', 0.9));
      if (navigator.vibrate) navigator.vibrate(200);
    }
  };

  const handleNext = () => {
    if (!capturedImage) return;
    setImages({...images, [currentStep.id]: capturedImage});
    setCapturedImage(null);
    setStability(0);
    poseHistoryRef.current = [];
    
    if (step < steps.length - 1) {
        setStep(step + 1);
        setStatus(steps[step + 1].id === 'back' ? 'manual' : 'searching');
    } else {
        onAnalyze();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-black relative">
       {/* FLOATING PILL */}
       <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-sm px-4">
          <div className={`
             backdrop-blur-md px-6 py-4 rounded-2xl flex items-center justify-center text-center shadow-2xl border transition-colors duration-300
             ${isLowLight ? 'bg-red-900/80 border-red-500 text-white' : 
               status === 'perfect' ? 'bg-emerald-600/90 border-emerald-400 text-white' : 
               'bg-black/70 border-white/10 text-white'}
          `}>
              {isLowLight && <AlertTriangle className="mr-2 animate-pulse" />}
              <span className="text-lg font-semibold">
                {capturedImage ? "Photo captured!" : (msg || currentStep.label)}
              </span>
          </div>
       </div>

       {/* VIEWPORT */}
       <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
         <video ref={videoRef} className="hidden" autoPlay muted playsInline />
         
         {capturedImage ? (
           <div className="relative w-full h-full">
              <img src={capturedImage} className="w-full h-full object-cover" />
              <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-4 z-50">
                  <button onClick={() => setCapturedImage(null)} className="bg-white text-black px-8 py-3 rounded-full font-bold shadow-lg">Retake</button>
                  <button onClick={handleNext} className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg">Next Step</button>
              </div>
           </div>
         ) : (
           <div className="relative w-full h-full">
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
              
              <div className={`absolute inset-0 z-10 p-6 pointer-events-none transition-all duration-300 ${status === 'perfect' ? 'opacity-40' : 'opacity-100'}`}>
                 {getOverlay()}
              </div>

              {!countdown && status !== 'manual' && (
                 <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                     {guidance === 'left' && <ChevronLeft size={100} className="text-white drop-shadow-lg animate-pulse absolute left-8" />}
                     {guidance === 'right' && <ChevronRight size={100} className="text-white drop-shadow-lg animate-pulse absolute right-8" />}
                     {guidance === 'up' && <ChevronUp size={100} className="text-white drop-shadow-lg animate-pulse absolute top-24" />}
                     {guidance === 'down' && <ChevronDown size={100} className="text-white drop-shadow-lg animate-pulse absolute bottom-24" />}
                     {guidance === 'closer' && (
                       <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                          <Move size={80} className="text-white animate-pulse mb-2" />
                          <span className="text-white font-bold bg-black/50 px-2 rounded">Move Closer</span>
                       </div>
                     )}
                     {guidance === 'farther' && (
                       <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                          <Move size={80} className="text-white animate-pulse mb-2" />
                          <span className="text-white font-bold bg-black/50 px-2 rounded">Move Back</span>
                       </div>
                     )}
                     {guidance === 'stable' && (
                       <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                          <AlertTriangle size={80} className="text-yellow-400 animate-bounce mb-2" />
                          <span className="text-white font-bold bg-black/50 px-2 rounded">Hold Still</span>
                       </div>
                     )}
                 </div>
              )}

              {countdown && (
                 <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <span className="text-9xl font-black text-white">{countdown}</span>
                 </div>
              )}

              {status === 'manual' && !capturedImage && (
                 <div className="absolute bottom-8 left-0 right-0 flex justify-center z-50">
                    <button onClick={takePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-xl active:scale-95 transition-transform"></button>
                 </div>
              )}
           </div>
         )}
       </div>

       {/* BOTTOM PROGRESS */}
       <div className="bg-slate-900 px-4 py-4 pb-8 border-t border-gray-800 z-50">
          <div className="flex justify-between items-center max-w-lg mx-auto">
             {steps.map((s, idx) => {
               const isCompleted = idx < step || (idx === step && capturedImage);
               const isActive = idx === step && !capturedImage;
               return (
                 <div key={idx} className="flex flex-col items-center gap-2">
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                        ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 
                          isActive ? 'bg-white text-slate-900 border-white' : 'bg-transparent border-slate-600 text-slate-500'}
                    `}>
                        {isCompleted ? <CheckCircle size={18} /> : (idx + 1)}
                    </div>
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-600'}`}>
                      {s.shortLabel}
                    </span>
                 </div>
               );
             })}
          </div>
       </div>
    </div>
  );
};
