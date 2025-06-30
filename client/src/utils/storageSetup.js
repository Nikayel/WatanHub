// Storage setup and management utility
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

let bucketInitialized = false;

export const checkBucketExists = async () => {
    if (bucketInitialized) return true;

    try {
        // Just check if bucket exists, don't try to create it
        const { data: buckets, error } = await supabase.storage.listBuckets();

        if (error) {
            console.warn('⚠️ Could not check storage buckets:', error.message);
            return false;
        }

        const blogImagesBucket = buckets?.find(bucket => bucket.id === 'blog-images');

        if (blogImagesBucket) {
            console.log('✅ blog-images bucket exists');
            bucketInitialized = true;
            return true;
        } else {
            console.warn('⚠️ blog-images bucket not found. Please create it manually in Supabase Dashboard > Storage');
            return false;
        }
    } catch (error) {
        console.warn('⚠️ Storage check failed:', error.message);
        return false;
    }
};

export const initializeBucket = checkBucketExists;

export class StorageManager {
    static BUCKET_NAME = 'blog-images';
    static MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    static ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    // Initialize storage bucket with better error handling
    static async initializeBucket() {
        try {
            // Just check if bucket exists, don't try to create it
            const { data: buckets, error: listError } = await supabase.storage.listBuckets();

            if (listError) {
                console.warn('⚠️ Could not check storage buckets:', listError.message);
                return false;
            }

            const bucketExists = buckets.some(bucket => bucket.name === this.BUCKET_NAME);

            if (!bucketExists) {
                console.warn('⚠️ blog-images bucket not found. Please create it manually in Supabase Dashboard > Storage');
                return false;
            } else {
                console.log('✅ Blog images bucket exists');
            }

            return true;
        } catch (error) {
            console.warn('⚠️ Storage check failed:', error.message);
            return false;
        }
    }

    // Validate file before upload
    static validateFile(file) {
        if (!file) {
            toast.error('No file selected');
            return false;
        }

        if (!this.ALLOWED_TYPES.includes(file.type)) {
            toast.error('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
            return false;
        }

        if (file.size > this.MAX_FILE_SIZE) {
            toast.error('Image size must be less than 5MB');
            return false;
        }

        return true;
    }

    // Upload image with proper error handling
    static async uploadImage(file, folder = 'covers') {
        if (!this.validateFile(file)) {
            return null;
        }

        try {
            // Ensure bucket exists (but don't fail if it doesn't)
            await this.initializeBucket();

            // Create unique filename
            const fileExt = file.name.split('.').pop().toLowerCase();
            const fileName = `${folder}/blog-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

            // Upload file
            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Upload error:', error);

                // Handle specific errors with helpful messages
                if (error.message.includes('Bucket not found')) {
                    toast.error('Storage bucket not set up. Please contact administrator or set up manually.');
                    console.log('📋 Manual setup: Go to Supabase Dashboard > Storage > Create bucket "blog-images"');
                } else if (error.message.includes('row-level security')) {
                    toast.error('Storage permissions not configured. Please contact administrator.');
                } else if (error.message.includes('File size')) {
                    toast.error('File too large. Maximum size is 5MB.');
                } else if (error.message.includes('File type')) {
                    toast.error('Invalid file type. Please use JPEG, PNG, WebP, or GIF.');
                } else {
                    toast.error('Failed to upload image. Please try again.');
                }
                return null;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (error) {
            console.error('Unexpected upload error:', error);
            toast.error('Unexpected error during upload. Please try again.');
            return null;
        }
    }

    // Upload multiple images
    static async uploadMultipleImages(files, folder = 'content') {
        const uploadPromises = Array.from(files).map(file => this.uploadImage(file, folder));
        const results = await Promise.allSettled(uploadPromises);

        const successful = results
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value);

        const failed = results.filter(result => result.status === 'rejected' || !result.value).length;

        if (failed > 0) {
            toast.warning(`${successful.length} images uploaded successfully, ${failed} failed.`);
        } else if (successful.length > 0) {
            toast.success(`All ${successful.length} images uploaded successfully!`);
        }

        return successful;
    }

    // Delete image from storage
    static async deleteImage(url) {
        try {
            if (!url || !url.includes(this.BUCKET_NAME)) {
                return true; // Not our image, nothing to delete
            }

            // Extract filename from URL
            const urlParts = url.split('/');
            const fileName = urlParts[urlParts.length - 1];

            const { error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .remove([fileName]);

            if (error) {
                console.error('Error deleting image:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Unexpected error deleting image:', error);
            return false;
        }
    }

    // Get optimized image URL with transformations
    static getOptimizedUrl(url, options = {}) {
        if (!url) return '';

        const {
            width = null,
            height = null,
            quality = 80,
            format = 'webp'
        } = options;

        // If it's not a Supabase storage URL, return as-is
        if (!url.includes('supabase') || !url.includes(this.BUCKET_NAME)) {
            return url;
        }

        // Add transformation parameters
        const params = new URLSearchParams();
        if (width) params.append('width', width);
        if (height) params.append('height', height);
        if (quality) params.append('quality', quality);
        if (format) params.append('format', format);

        const queryString = params.toString();
        return queryString ? `${url}?${queryString}` : url;
    }

    // Manual setup instructions
    static getSetupInstructions() {
        return {
            title: 'Storage Setup Required',
            message: 'Please set up the blog-images storage bucket manually',
            steps: [
                '1. Go to your Supabase Dashboard',
                '2. Navigate to Storage section',
                '3. Create a new bucket named "blog-images"',
                '4. Set it as Public',
                '5. Set file size limit to 5MB',
                '6. Allow image MIME types: jpeg, png, webp, gif'
            ]
        };
    }
}

// Initialize storage on app start (but don't fail if it doesn't work)
StorageManager.initializeBucket().catch(error => {
    console.log('Storage initialization failed, manual setup may be required:', error.message);
});

export default StorageManager; 