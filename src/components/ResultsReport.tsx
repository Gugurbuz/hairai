import React from 'react';
import { CheckCircle, TrendingUp, Award, AlertCircle } from 'lucide-react';
import type { AnalysisResult, Photo } from '../types';

interface ResultsReportProps {
  analysis: AnalysisResult;
  photos: Photo[];
}

export const ResultsReport: React.FC<ResultsReportProps> = ({ analysis, photos }) => {
  const qualityColors = {
    excellent: 'text-green-600 bg-green-50',
    good: 'text-blue-600 bg-blue-50',
    fair: 'text-yellow-600 bg-yellow-50',
    poor: 'text-red-600 bg-red-50',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Analysis Complete!</h1>
        <p className="text-xl text-gray-600">Your personalized hair restoration assessment</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-100">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Norwood Scale</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">{analysis.norwood_scale}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-green-100">
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-gray-900">Hair Density</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">{analysis.density_score}%</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-purple-100">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Donor Quality</h3>
          </div>
          <p className={`text-lg font-bold capitalize px-3 py-1 rounded-lg inline-block ${qualityColors[analysis.donor_quality]}`}>
            {analysis.donor_quality}
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Estimated Grafts Needed</h2>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-blue-600">
            {analysis.estimated_grafts_min.toLocaleString()}
          </span>
          <span className="text-2xl text-gray-600">-</span>
          <span className="text-5xl font-bold text-blue-600">
            {analysis.estimated_grafts_max.toLocaleString()}
          </span>
          <span className="text-xl text-gray-600 ml-2">grafts</span>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Analysis Summary</h2>
        <p className="text-gray-700 leading-relaxed text-lg">{analysis.ai_summary}</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Processed Images</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {photos.slice(0, 3).map((photo) => (
            <div key={photo.id} className="space-y-2">
              <div className="relative aspect-square rounded-xl overflow-hidden">
                <img src={photo.preview} alt={photo.angle} className="w-full h-full object-cover" />
              </div>
              {photo.processed && (
                <div className="relative aspect-square rounded-xl overflow-hidden">
                  <img
                    src={photo.processed.densityHeatmap}
                    alt={`${photo.angle} heatmap`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <p className="text-sm font-medium text-gray-700 capitalize text-center">
                {photo.angle} View
                {photo.processed && ` - ${photo.processed.densityScore}% Density`}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-600 text-white p-8 rounded-2xl shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to Take the Next Step?</h2>
        <p className="text-blue-100 mb-6 text-lg">
          Our partner clinics will contact you within 24 hours to discuss your personalized treatment plan.
        </p>
        <button className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg">
          Schedule Free Consultation
        </button>
      </div>
    </div>
  );
};
