import { supabase } from './supabase';
import type { FormData, Photo, AnalysisResult } from '../types';

export const submitAnalysis = async (
  formData: FormData,
  photos: Photo[],
  analysis: AnalysisResult
) => {
  try {
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        age: parseInt(formData.age) || null,
        gender: formData.gender,
        status: 'new',
      })
      .select()
      .single();

    if (leadError) throw leadError;

    const { error: analysisError } = await supabase
      .from('hair_analysis')
      .insert({
        lead_id: lead.id,
        norwood_scale: analysis.norwood_scale,
        density_score: analysis.density_score,
        estimated_grafts_min: analysis.estimated_grafts_min,
        estimated_grafts_max: analysis.estimated_grafts_max,
        donor_quality: analysis.donor_quality,
        ai_summary: analysis.ai_summary,
      });

    if (analysisError) throw analysisError;

    const photoInserts = photos.map((photo) => ({
      lead_id: lead.id,
      angle: photo.angle,
      image_data: photo.preview,
      processed_data: photo.processed || {},
    }));

    const { error: photosError } = await supabase
      .from('lead_photos')
      .insert(photoInserts);

    if (photosError) throw photosError;

    return { success: true, leadId: lead.id };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error };
  }
};
