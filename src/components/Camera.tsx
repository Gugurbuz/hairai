import React, { useRef, useEffect, useState } from 'react';
import { Camera as CameraIcon } from 'lucide-react';

interface CameraProps {
  onCapture: (imageData: string) => void;
  angle: string;
  instruction: string;
}

export const Camera: React.FC<CameraProps> = ({ onCapture, angle, instruction }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        videoRef.current.onloadedmetadata = () => setIsReady(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d')!;
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    onCapture(imageData);
  };

  return (
    <div className="relative w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover scale-x-[-1]"
      />
      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent">
        <div className="text-center">
          <p className="text-white text-lg font-semibold mb-1">{angle}</p>
          <p className="text-white/80 text-sm">{instruction}</p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex justify-center">
          <button
            onClick={capturePhoto}
            disabled={!isReady}
            className="w-20 h-20 rounded-full bg-white border-4 border-white/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl"
          >
            <CameraIcon className="w-10 h-10 text-gray-900" />
          </button>
        </div>
      </div>
    </div>
  );
};
