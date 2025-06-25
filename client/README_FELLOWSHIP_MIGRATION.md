# Fellowship Settings Migration

## Quick Setup (Required)

To enable fellowship settings admin management, you need to run this SQL once in your Supabase dashboard:

### Steps:
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste this SQL below:

```sql
-- Fellowship Settings Table for Admin Management
CREATE TABLE IF NOT EXISTS fellowship_settings (
  id SERIAL PRIMARY KEY,
  start_date TEXT NOT NULL DEFAULT 'January 2025',
  description TEXT NOT NULL DEFAULT 'Our comprehensive fellowship program is designed to empower Afghan students with the skills, knowledge, and connections needed to succeed in their academic and professional journeys.',
  program_highlights JSONB NOT NULL DEFAULT '["Personalized mentorship", "College application guidance", "Professional development", "Cultural preservation activities", "Networking opportunities", "Scholarship support"]'::jsonb,
  who_can_apply JSONB NOT NULL DEFAULT '["Afghan students worldwide", "Committed to academic excellence", "Passionate about community impact", "Ready for transformation", "Age 16-25", "Strong English proficiency"]'::jsonb,
  application_deadline TEXT DEFAULT 'Applications are currently closed. Please check back soon or fill out our waitlist form.',
  application_status TEXT DEFAULT 'locked' CHECK (application_status IN ('locked', 'unlocked')),
  application_link TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist (for existing tables)
ALTER TABLE fellowship_settings 
ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'locked' CHECK (application_status IN ('locked', 'unlocked'));

ALTER TABLE fellowship_settings 
ADD COLUMN IF NOT EXISTS application_link TEXT DEFAULT '';

-- Insert default values
INSERT INTO fellowship_settings (start_date, description, program_highlights, who_can_apply, application_deadline, application_status, application_link) 
VALUES (
  'January 2025',
  'Our comprehensive fellowship program is designed to empower Afghan students with the skills, knowledge, and connections needed to succeed in their academic and professional journeys.',
  '["Personalized mentorship", "College application guidance", "Professional development", "Cultural preservation activities", "Networking opportunities", "Scholarship support"]'::jsonb,
  '["Afghan students worldwide", "Committed to academic excellence", "Passionate about community impact", "Ready for transformation", "Age 16-25", "Strong English proficiency"]'::jsonb,
  'Applications are currently closed. Please check back soon or fill out our waitlist form.',
  'locked',
  ''
) ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE fellowship_settings ENABLE ROW LEVEL SECURITY;

-- Allow public to read fellowship settings
DROP POLICY IF EXISTS "Allow public to read fellowship settings" ON fellowship_settings;
CREATE POLICY "Allow public to read fellowship settings" ON fellowship_settings FOR SELECT USING (true);

-- Allow admins to manage fellowship settings
DROP POLICY IF EXISTS "Allow admins to manage fellowship settings" ON fellowship_settings;
CREATE POLICY "Allow admins to manage fellowship settings" ON fellowship_settings 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
```

4. Click **"Run"**

## After Migration:

✅ Fellowship settings will work properly  
✅ Admin can edit at `/admin/fellowship-settings`  
✅ Website will use dynamic content instead of hardcoded values  
✅ No more "Fellowship settings table not created" errors  
✅ **Application management:** Lock/unlock applications  
✅ **Google Forms integration:** Paste application link  

## Features:

- **Real-time editing:** Changes appear immediately on the website
- **Admin-only access:** Only admins can edit fellowship settings
- **Application control:** Lock/unlock applications with toggle
- **Google Forms integration:** Paste Google Forms URL for applications
- **Dynamic apply button:** Shows locked/unlocked state to users
- **Graceful fallbacks:** Uses defaults if table isn't ready yet

## Application Status:
- **🔒 Locked:** Shows "Applications are closed right now - please check back or fill out our waitlist form" to users
- **🔓 Unlocked:** Shows "Apply Now" button linking to Google Form 