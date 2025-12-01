import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string;
          name: string;
          email: string;
          country: string | null;
          phone: string | null;
          website: string | null;
          status: 'pending' | 'verified' | 'suspended';
          credit_balance: number;
          total_leads_purchased: number;
          profile_image_url: string | null;
          description: string | null;
          specializations: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clinics']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['clinics']['Insert']>;
      };
      leads: {
        Row: {
          id: string;
          anonymous_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          gender: 'male' | 'female' | 'other' | null;
          age: number | null;
          country: string | null;
          budget_range: 'low' | 'medium' | 'high' | 'premium' | null;
          status: 'new' | 'locked' | 'contacted' | 'converted' | 'refunded';
          temperature_score: number;
          locked_by_clinic_id: string | null;
          locked_at: string | null;
          refund_requested: boolean;
          refund_reason: string | null;
          ad_source: string | null;
          utm_params: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['leads']['Insert']>;
      };
      analysis_results: {
        Row: {
          id: string;
          lead_id: string;
          norwood_scale: string | null;
          hair_density: Record<string, any>;
          donor_area_score: number | null;
          estimated_grafts_min: number | null;
          estimated_grafts_max: number | null;
          recommended_technique: string | null;
          hair_characteristics: Record<string, any>;
          ai_summary: string | null;
          ai_model_version: string | null;
          processing_time_ms: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['analysis_results']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['analysis_results']['Insert']>;
      };
      lead_images: {
        Row: {
          id: string;
          lead_id: string;
          angle: 'front' | 'left' | 'right' | 'top' | 'back';
          image_url: string;
          thumbnail_url: string | null;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['lead_images']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['lead_images']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          clinic_id: string;
          type: 'credit_purchase' | 'lead_unlock' | 'refund';
          amount: number;
          balance_after: number;
          lead_id: string | null;
          stripe_payment_id: string | null;
          status: 'pending' | 'completed' | 'failed';
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
    };
  };
};
