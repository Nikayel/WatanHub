// src/services/blogsService.js
import { supabase } from '../lib/supabase';

// Get all blogs
export async function getAllBlogs() {
  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  return data;
}

// Create a new blog
export async function createBlog({ title, description, coverImageUrl }) {
  const { data, error } = await supabase
    .from('blogs')
    .insert([
      {
        title,
        description,
        cover_image_url: coverImageUrl,
      }
    ]);

  if (error) {
    throw error;
  }
  return data;
}
