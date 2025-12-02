import React, { useState } from 'react';
import { Camera } from './components/Camera';
import { PhotoReview } from './components/PhotoReview';
import { ContactForm } from './components/ContactForm';
import { ResultsReport } from './components/ResultsReport';
import { processHairPhoto } from './lib/ai-processor';
import { submitAnalysis } from './lib/database';
import { Sparkles } from 'lucide-react';
import type { Photo, FormData, AnalysisResult } from './types';

type Step = 'welcome' | 'capture' | 'review' | 'form' | 'processing' | 'results';

const photoAngles = [
  { angle: 'front', label: 'Front View', instruction: 'Look straight at the camera' },
  { angle: 'left', label: 'Left Side', instruction: 'Turn your head to the left' },
  { angle: 'right', label: 'Right Side', instruction: 'Turn your head to the right' },
  { angle: 'top', label: 'Crown Area', instruction: 'Tilt your head down slightly' },
  { angle: 'back', label: 'Back View', instruction: 'Show the back of your head' },
] as const;

export default function App() {
  const [step, setStep] = useState<Step>('welcome');
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleCapture = (imageData: string) => {
    const angle = photoAngles[currentAngleIndex].angle;
    const newPhoto: Photo = {
      id: crypto.randomUUID(),
      angle,
      preview: imageData,
    };

    setPhotos((prev) => [...prev.filter((p) => p.angle !== angle), newPhoto]);

    if (currentAngleIndex < photoAngles.length - 1) {
      setCurrentAngleIndex((prev) => prev + 1);
    } else {
      setStep('review');
    }
  };

  const handleRetake = (angle: string) => {
    const index = photoAngles.findIndex((p) => p.angle === angle);
    setCurrentAngleIndex(index);
    setStep('capture');
  };

  const handleFormSubmit = async (formData: FormData) => {
    setStep('processing');

    const processedPhotos = await Promise.all(
      photos.map((photo) => processHairPhoto(photo))
    );
    setPhotos(processedPhotos);

    const avgDensity = Math.round(
      processedPhotos.reduce((sum, p) => sum + (p.processed?.densityScore || 0), 0) /
        processedPhotos.length
    );

    const analysis: AnalysisResult = {
      norwood_scale: avgDensity > 70 ? 'Type II' : avgDensity > 50 ? 'Type III' : 'Type IV',
      density_score: avgDensity,
      estimated_grafts_min: Math.max(1000, (100 - avgDensity) * 30),
      estimated_grafts_max: Math.max(2000, (100 - avgDensity) * 50),
      donor_quality:
        avgDensity > 75 ? 'excellent' : avgDensity > 60 ? 'good' : avgDensity > 40 ? 'fair' : 'poor',
      ai_summary: `Based on AI analysis of ${processedPhotos.length} photos, your hair shows ${
        avgDensity > 70 ? 'minimal' : avgDensity > 50 ? 'moderate' : 'significant'
      } thinning patterns. The donor area appears ${
        avgDensity > 70 ? 'excellent' : avgDensity > 50 ? 'suitable' : 'adequate'
      } for transplant procedures. We recommend consulting with our partner clinics for a detailed treatment plan.`,
    };

    setAnalysisResult(analysis);

    await submitAnalysis(formData, processedPhotos, analysis);

    setTimeout(() => setStep('results'), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {step === 'welcome' && (
          <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 rounded-full mb-4">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              AI Hair Analysis
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Get a professional hair loss assessment using advanced AI technology.
              Take 5 photos and receive your personalized analysis instantly.
            </p>
            <button
              onClick={() => setStep('capture')}
              className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              Start Analysis
            </button>
          </div>
        )}

        {step === 'capture' && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {photoAngles[currentAngleIndex].label}
                </h2>
                <span className="text-gray-600 font-medium">
                  {currentAngleIndex + 1} / {photoAngles.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentAngleIndex + 1) / photoAngles.length) * 100}%` }}
                />
              </div>
            </div>
            <Camera
              onCapture={handleCapture}
              angle={photoAngles[currentAngleIndex].label}
              instruction={photoAngles[currentAngleIndex].instruction}
            />
          </div>
        )}

        {step === 'review' && (
          <PhotoReview
            photos={photos}
            onRetake={handleRetake}
            onContinue={() => setStep('form')}
          />
        )}

        {step === 'form' && (
          <ContactForm onSubmit={handleFormSubmit} isProcessing={false} />
        )}

        {step === 'processing' && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 rounded-full mb-6 animate-pulse">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Processing Your Analysis</h2>
            <p className="text-gray-600 text-lg">
              Our AI is analyzing your photos using MediaPipe technology...
            </p>
          </div>
        )}

        {step === 'results' && analysisResult && (
          <ResultsReport analysis={analysisResult} photos={photos} />
        )}
      </div>
    </div>
  );
}
