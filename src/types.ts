export interface Photo {
  id: string;
  angle: 'front' | 'left' | 'right' | 'top' | 'back';
  preview: string;
  processed?: {
    densityScore: number;
    densityHeatmap: string;
    segmentationMask: string;
  };
}

export interface FormData {
  fullName: string;
  email: string;
  phone: string;
  age: string;
  gender: 'male' | 'female' | 'other';
}

export interface AnalysisResult {
  norwood_scale: string;
  density_score: number;
  estimated_grafts_min: number;
  estimated_grafts_max: number;
  donor_quality: 'excellent' | 'good' | 'fair' | 'poor';
  ai_summary: string;
}
