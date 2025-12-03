// src/lib/database.ts
import type { FormData, Photo, AnalysisResult } from '../types';

// Supabase importunu kaldırdık
// import { supabase } from './supabase'; 

export const submitAnalysis = async (
  formData: FormData,
  photos: Photo[],
  analysis: AnalysisResult
) => {
  console.log('Supabase devre dışı. Form verileri simüle ediliyor:', {
    formData,
    photosCount: photos.length,
    analysis
  });

  // Gerçek bir veritabanı isteği yapmak yerine, yapılmış gibi bekleyip başarılı yanıt dönüyoruz.
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Sahte bir başarı yanıtı ve rastgele bir ID döndürüyoruz
  return { 
    success: true, 
    leadId: 'mock-lead-id-' + Math.random().toString(36).substr(2, 9) 
  };
};