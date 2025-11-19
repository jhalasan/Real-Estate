import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://osywaesdozykwhupydzy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zeXdhZXNkb3p5a3dodXB5ZHp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5ODE0OTYsImV4cCI6MjA3ODU1NzQ5Nn0.8Yb5tNAMsPkqoWPvsMsqSf6migp6BA5d9dbOdHyG-dE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
