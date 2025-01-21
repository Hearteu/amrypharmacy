// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// src/lib/supabase.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);  // Check if the URL is loaded
console.log("Supabase Key:", supabaseKey);  // Check if the Key is loaded

export const supabase = createClient(supabaseUrl, supabaseKey);

