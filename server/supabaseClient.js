// server/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ SUPABASE_URL / SUPABASE_ANON_KEY が Secrets にありません');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase };
