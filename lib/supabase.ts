import { createClient } from '@supabase/supabase-js';
// import { Database } from '@/types/database.types'; // On va générer ce type bientôt, mais mets-le en commentaire pour l'instant si ça rougeoie

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client simple pour le frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey);