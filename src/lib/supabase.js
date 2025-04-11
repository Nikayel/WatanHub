import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://exvlmriyxeownzwmmwkr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4dmxtcml5eGVvd256d21td2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDcwOTgsImV4cCI6MjA1OTk4MzA5OH0.shlPmOhn1xB7bagWY5d9vbOvHPZC01aQv27rrTFjfsg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 