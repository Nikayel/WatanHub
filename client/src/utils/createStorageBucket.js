// Manual storage bucket creation utility
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export async function createBlogImagesBucket() {
    try {
        console.log('🔧 Creating blog-images storage bucket...');

        // First, check if bucket already exists
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
            console.error('Error listing buckets:', listError);
            return false;
        }

        const bucketExists = buckets.some(bucket => bucket.name === 'blog-images');

        if (bucketExists) {
            console.log('✅ blog-images bucket already exists');
            return true;
        }

        // Create the bucket
        const { data, error } = await supabase.storage.createBucket('blog-images', {
            public: true,
            allowedMimeTypes: [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/webp',
                'image/gif'
            ],
            fileSizeLimit: 5242880 // 5MB
        });

        if (error) {
            console.error('Error creating bucket:', error);

            // If it's a permission error, show user-friendly message
            if (error.message.includes('row-level security')) {
                toast.error('Storage setup required. Please contact administrator.');
                console.log('💡 Manual setup required in Supabase dashboard');
                return false;
            }

            toast.error('Failed to create storage bucket');
            return false;
        }

        console.log('✅ blog-images bucket created successfully');
        toast.success('Storage bucket created successfully!');
        return true;

    } catch (error) {
        console.error('Unexpected error creating bucket:', error);
        return false;
    }
}

// Function to set up storage policies (manual instructions)
export function getStoragePolicyInstructions() {
    return `
🔧 Manual Storage Setup Instructions:

1. Go to your Supabase Dashboard > Storage
2. Create a new bucket named "blog-images" with these settings:
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

3. Go to Storage > Policies and add these policies:

Policy 1 - "Public Access":
- Operation: SELECT
- Target roles: public
- Policy definition: bucket_id = 'blog-images'

Policy 2 - "Authenticated Upload":
- Operation: INSERT  
- Target roles: authenticated
- Policy definition: bucket_id = 'blog-images'

Policy 3 - "User Update Own":
- Operation: UPDATE
- Target roles: authenticated  
- Policy definition: bucket_id = 'blog-images' AND auth.uid()::text = (storage.foldername(name))[1]

Policy 4 - "User Delete Own":
- Operation: DELETE
- Target roles: authenticated
- Policy definition: bucket_id = 'blog-images' AND auth.uid()::text = (storage.foldername(name))[1]
`;
}

export default createBlogImagesBucket; 