-- Create blogs table with comprehensive schema
CREATE TABLE IF NOT EXISTS blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  published BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to blogs table
DROP TRIGGER IF EXISTS update_blogs_updated_at ON blogs;
CREATE TRIGGER update_blogs_updated_at
    BEFORE UPDATE ON blogs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow public to read published blogs
CREATE POLICY "Allow public read published blogs" ON blogs
  FOR SELECT 
  USING (published = true);

-- Allow authenticated users to read all blogs (including drafts for admins)
CREATE POLICY "Allow authenticated read all blogs" ON blogs
  FOR SELECT 
  TO authenticated
  USING (true);

-- Allow admins to insert blogs
CREATE POLICY "Allow admin insert blogs" ON blogs
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin 
      WHERE admin.id = auth.uid()
    )
  );

-- Allow admins to update blogs
CREATE POLICY "Allow admin update blogs" ON blogs
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin 
      WHERE admin.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin 
      WHERE admin.id = auth.uid()
    )
  );

-- Allow admins to delete blogs
CREATE POLICY "Allow admin delete blogs" ON blogs
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin 
      WHERE admin.id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(published);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_views ON blogs(views DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_created_by ON blogs(created_by);
CREATE INDEX IF NOT EXISTS idx_blogs_title ON blogs USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_blogs_description ON blogs USING gin(to_tsvector('english', description));

-- Create storage bucket for blog images (if not exists)
INSERT INTO storage.buckets (id, name, public)
SELECT 'blog-images', 'blog-images', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'blog-images'
);

-- Create storage policies for blog-images bucket
-- Allow public to view images
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-images');

-- Allow users to update their own uploaded images
CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'blog-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own uploaded images
CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'blog-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Insert sample blog data (optional - for testing)
-- INSERT INTO blogs (title, description, cover_image_url, published, views) VALUES
-- ('Welcome to WatanHub Blog', 'This is our first blog post introducing the WatanHub platform and our mission to support Afghan students in their educational journey.', null, true, 0),
-- ('Educational Resources for Afghan Students', 'A comprehensive guide to online educational resources available for Afghan students seeking higher education opportunities.', null, true, 0)
-- ON CONFLICT (id) DO NOTHING; 