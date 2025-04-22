import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner'; // for notifications

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Reusable safe fetch for SELECT
export async function safeSelect(table, columns = '*', filters = {}) {
  let query = supabase.from(table).select(columns);

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { data, error } = await query;

  if (error) {
    console.error(`❌ Error selecting from ${table}:`, error);
    toast.error(`Failed to fetch ${table}.`);
    return null;
  }

  return data;
}

// Reusable safe INSERT
export async function safeInsert(table, payload) {
  const { data, error } = await supabase.from(table).insert(payload);

  if (error) {
    console.error(`❌ Error inserting into ${table}:`, error);
    toast.error(`Failed to insert into ${table}.`);
    return null;
  }

  return data;
}

// Reusable safe UPDATE
export async function safeUpdate(table, updates, matchKey, matchValue) {
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq(matchKey, matchValue);

  if (error) {
    console.error(`❌ Error updating ${table}:`, error);
    toast.error(`Failed to update ${table}.`);
    return null;
  }

  return data;
}

// Reusable safe DELETE
export async function safeDelete(table, matchKey, matchValue) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq(matchKey, matchValue);

  if (error) {
    console.error(`❌ Error deleting from ${table}:`, error);
    toast.error(`Failed to delete from ${table}.`);
    return false;
  }

  return true;
}

export { supabase };
