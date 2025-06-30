import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { safeInsert, safeSelect } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import StorageManager from '../../utils/storageSetup';
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Eye,
  Save,
  FileText,
  Link as LinkIcon,
  X,
  Check
} from 'lucide-react';
import '../../components/ResponsiveBlogImages.css';

export default function AdminBlogCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [title, setTitle] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [contentImageUploading, setContentImageUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkAdmin = async () => {
      const adminData = await safeSelect('admin', '*', { id: user.id });
      if (adminData && adminData.length > 0) {
        setIsAdmin(true);
      } else {
        toast.error('Access denied. Admins only.');
        navigate('/');
      }
      setLoading(false);
    };

    checkAdmin();
  }, [user, navigate]);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImageUploading(true);

    try {
      const publicUrl = await StorageManager.uploadImage(file, 'covers');

      if (publicUrl) {
        setCoverImageUrl(publicUrl);
        toast.success('Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e, saveAsDraft = false) => {
    e.preventDefault();

    console.log('🔄 Starting blog creation process...');
    console.log('📝 Form data:', {
      title: title?.trim(),
      coverImageUrl: coverImageUrl?.trim(),
      description: description?.trim(),
      saveAsDraft,
      published: !saveAsDraft,
      userId: user?.id
    });

    if (!title.trim() || !description.trim()) {
      console.error('❌ Validation failed: Missing required fields');
      toast.error('Title and Description are required.');
      return;
    }

    setCreating(true);

    try {
      const payload = [{
        title: title.trim(),
        cover_image_url: coverImageUrl ? coverImageUrl.trim() : null,
        description: description.trim(),
        created_by: user.id,
        published: !saveAsDraft,
        views: 0
      }];

      console.log('📦 Insert payload:', payload);
      console.log('🔧 Calling safeInsert...');

      const result = await safeInsert('blogs', payload);

      console.log('📊 safeInsert result:', result);
      console.log('📊 Result type:', typeof result);
      console.log('📊 Result length:', result?.length);

      if (result && result.length > 0) {
        console.log('✅ Creation successful!');
        toast.success(`Blog ${saveAsDraft ? 'saved as draft' : 'published'} successfully!`);
        navigate('/admin/blogs/manage');
      } else {
        console.error('❌ Creation failed: safeInsert returned empty result');
        console.error('❌ Result details:', { result, type: typeof result });
        toast.error('Failed to create blog. Please try again.');
      }
    } catch (error) {
      console.error('💥 Exception during creation:', error);
      console.error('💥 Error stack:', error.stack);
      console.error('💥 Error message:', error.message);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      console.log('🏁 Creation process completed');
      setCreating(false);
    }
  };

  const removeCoverImage = () => {
    setCoverImageUrl('');
    toast.success('Cover image removed');
  };

  const handleContentImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setContentImageUploading(true);

    try {
      const uploadedUrls = await StorageManager.uploadMultipleImages(files, 'content');

      if (uploadedUrls.length > 0) {
        // Generate markdown for uploaded images
        const imageMarkdown = uploadedUrls.map(url => {
          // Detect if image is likely landscape or portrait based on filename or add responsive classes
          return `![Uploaded Image](${url})`;
        }).join('\n\n');

        // Insert images at cursor position or append to content
        const textarea = document.querySelector('textarea[name="description"]');
        if (textarea) {
          const cursorPos = textarea.selectionStart;
          const textBefore = description.substring(0, cursorPos);
          const textAfter = description.substring(cursorPos);
          const newContent = textBefore + '\n\n' + imageMarkdown + '\n\n' + textAfter;
          setDescription(newContent);
        } else {
          setDescription(prev => prev + '\n\n' + imageMarkdown + '\n\n');
        }
      }
    } catch (error) {
      console.error('Error uploading content images:', error);
      toast.error('Failed to upload some images. Please try again.');
    } finally {
      setContentImageUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center text-red-600 text-xl font-semibold mb-4">Access denied. Admins only.</div>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/blogs/manage')}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Management
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FileText className="w-7 h-7 text-blue-600 mr-3" />
                  Create New Blog Post
                </h1>
                <p className="text-gray-600 mt-1">Share insights and updates with your community</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${previewMode
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <Eye className="w-4 h-4 mr-2" />
                {previewMode ? 'Edit Mode' : 'Preview'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Side */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Blog Editor</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blog Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter an engaging blog title..."
                  required
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image
                </label>

                {coverImageUrl ? (
                  <div className="relative">
                    <img
                      src={coverImageUrl}
                      alt="Cover preview"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeCoverImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <div className="space-y-4">
                      <div className="flex justify-center space-x-4">
                        {/* Upload Button */}
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={imageUploading}
                          />
                          <div className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            {imageUploading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
                            {imageUploading ? 'Uploading...' : 'Upload Image'}
                          </div>
                        </label>
                      </div>

                      <div className="text-center">
                        <p className="text-gray-500 text-sm">Or enter image URL below</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* URL Input */}
                <div className="mt-3">
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="url"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Blog Content * <span className="text-gray-500">(Markdown supported)</span>
                  </label>

                  {/* Content Image Upload Button */}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleContentImageUpload}
                      className="hidden"
                      disabled={contentImageUploading}
                    />
                    <div className="flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50">
                      {contentImageUploading ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                      ) : (
                        <ImageIcon className="w-3 h-3 mr-2" />
                      )}
                      {contentImageUploading ? 'Uploading...' : 'Add Images'}
                    </div>
                  </label>
                </div>

                <textarea
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono text-sm"
                  rows="16"
                  placeholder="Write your blog content here... You can use Markdown formatting:

# Heading 1
## Heading 2
**Bold text**
*Italic text*
- Bullet points
[Link text](URL)
![Image alt text](Image URL)

💡 Tip: Use the 'Add Images' button above to upload multiple images at once!"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={creating}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {creating ? 'Publishing...' : 'Publish Blog'}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={creating}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </button>
              </div>
            </form>
          </div>

          {/* Preview Side */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Live Preview</h2>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Preview Header */}
              {coverImageUrl && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={coverImageUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Preview Content */}
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {title || 'Your Blog Title Here'}
                </h1>

                <div className="prose prose-sm max-w-none blog-content">
                  {description ? (
                    <ReactMarkdown
                      components={{
                        img: ({ src, alt, ...props }) => (
                          <img
                            src={src}
                            alt={alt}
                            {...props}
                            onLoad={(e) => {
                              // Detect image orientation
                              const img = e.target;
                              const isLandscape = img.naturalWidth > img.naturalHeight;
                              img.setAttribute('data-orientation', isLandscape ? 'landscape' : 'portrait');
                            }}
                            onError={(e) => {
                              e.target.setAttribute('data-error', 'true');
                            }}
                            style={{
                              maxWidth: '100%',
                              height: 'auto',
                              display: 'block',
                              margin: '1.5rem auto'
                            }}
                          />
                        )
                      }}
                    >
                      {description}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-gray-500 italic">
                      Your blog content will appear here as you type...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
