// Generated from the Supabase schema (public). Regenerate after migrations.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" };
  public: {
    Tables: {
      watchlist_items: {
        Row: { created_at: string; id: string; symbol: string; user_id: string };
        Insert: { created_at?: string; id?: string; symbol: string; user_id?: string };
        Update: { created_at?: string; id?: string; symbol?: string; user_id?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
