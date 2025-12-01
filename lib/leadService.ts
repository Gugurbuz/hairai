import { supabase } from './supabase';
import type { LeadData } from '../types';

export interface CreateLeadParams {
  leadData: LeadData;
  images: Record<string, string>;
  analysisData?: {
    norwood_scale?: string;
    hair_density?: Record<string, number>;
    donor_area_score?: number;
    estimated_grafts_min?: number;
    estimated_grafts_max?: number;
    recommended_technique?: string;
    temperature_score?: number;
  };
}

export async function createLead(params: CreateLeadParams) {
  const { leadData, images, analysisData } = params;

  try {
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        full_name: leadData.fullName,
        email: leadData.email,
        phone: leadData.phone || '',
        gender: leadData.gender,
        age: parseInt(leadData.age) || null,
        country: null,
        budget_range: null,
        status: 'new',
        temperature_score: analysisData?.temperature_score || 50,
        anonymous_id: crypto.randomUUID(),
        locked_by_clinic_id: null,
        locked_at: null,
        refund_requested: false,
        refund_reason: null,
        ad_source: null,
        utm_params: {},
      })
      .select()
      .single();

    if (leadError) throw leadError;

    if (analysisData && lead) {
      await supabase.from('analysis_results').insert({
        lead_id: lead.id,
        norwood_scale: analysisData.norwood_scale || null,
        hair_density: analysisData.hair_density || {},
        donor_area_score: analysisData.donor_area_score || null,
        estimated_grafts_min: analysisData.estimated_grafts_min || null,
        estimated_grafts_max: analysisData.estimated_grafts_max || null,
        recommended_technique: analysisData.recommended_technique || null,
        hair_characteristics: {},
        ai_summary: null,
        ai_model_version: 'demo-v1',
        processing_time_ms: null,
      });
    }

    if (lead) {
      const imageInserts = Object.entries(images).map(([angle, dataUrl]) => ({
        lead_id: lead.id,
        angle: angle as 'front' | 'left' | 'right' | 'top' | 'back',
        image_url: dataUrl,
        thumbnail_url: null,
        metadata: {},
      }));

      if (imageInserts.length > 0) {
        await supabase.from('lead_images').insert(imageInserts);
      }
    }

    return { success: true, leadId: lead?.id };
  } catch (error) {
    console.error('Error creating lead:', error);
    return { success: false, error };
  }
}
