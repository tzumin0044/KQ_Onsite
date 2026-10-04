import { createClient } from '@supabase/supabase-js';

// ============================================================
// Supabase 雲端即時連線設定 (Supabase Realtime Config)
// 請填入您在 Supabase 專案建立後的 Project URL 與 anon key：
// (或在專案根目錄的 .env 檔案中設定 VITE_SUPABASE_URL 與 VITE_SUPABASE_ANON_KEY)
// ============================================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== "YOUR_SUPABASE_URL" &&
  supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY"
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 20
        }
      }
    })
  : null;
