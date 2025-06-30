import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import config from '../config/environment';
import Logger from '../utils/logger';

const { supabase: supabaseConfig } = config;

if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  const error = 'Supabase configuration is incomplete';
  Logger.error(error, {
    url: !!supabaseConfig.url,
    key: !!supabaseConfig.anonKey
  });
  throw new Error(error);
}

const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  supabaseConfig.options
);

// Reusable safe fetch for SELECT
export async function safeSelect(table, columns = '*', filters = {}) {
  try {
    let query = supabase.from(table).select(columns);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;

    if (error) {
      // Log the specific error for debugging
      Logger.error(`Error selecting from ${table}:`, {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        filters
      });

      // Don't show toast for certain expected errors
      if (error.code !== '42P01' && error.code !== 'PGRST116') { // Table doesn't exist, RLS policy
        toast.error(`Failed to fetch ${table}.`);
      }
      return null;
    }

    return data;
  } catch (error) {
    Logger.error(`Unexpected error selecting from ${table}:`, error);
    return null;
  }
}

// Reusable safe INSERT
export async function safeInsert(table, data) {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();

    if (error) {
      Logger.error(`Error inserting into ${table}:`, error);
      toast.error(`Failed to insert into ${table}.`);
      return null;
    }

    return result;
  } catch (exception) {
    Logger.error(`Exception in safeInsert for ${table}:`, exception);
    toast.error(`Failed to insert into ${table}.`);
    return null;
  }
}

// Reusable safe UPDATE
export async function safeUpdate(table, updates, matchKey, matchValue) {
  try {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq(matchKey, matchValue)
      .select();

    if (error) {
      Logger.error(`Error updating ${table}:`, error);
      toast.error(`Failed to update ${table}: ${error.message}`);
      return null;
    }

    // Check if data is empty array (no rows updated)
    if (Array.isArray(data) && data.length === 0) {
      console.warn(`No ${table} record found to update with ${matchKey}: ${matchValue}`);
      toast.error(`No ${table} record found to update.`);
      return null;
    }

    return data;
  } catch (exception) {
    Logger.error(`Exception in safeUpdate for ${table}:`, exception);
    toast.error(`Failed to update ${table}: ${exception.message}`);
    return null;
  }
}

// Reusable safe DELETE
export async function safeDelete(table, matchKey, matchValue) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq(matchKey, matchValue);

  if (error) {
    Logger.error(`Error deleting from ${table}:`, error);
    toast.error(`Failed to delete from ${table}.`);
    return false;
  }

  return true;
}

export { supabase };
