import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { safeSelect, safeUpdate, supabase } from '../../lib/supabase';
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
  Check,
  Trash2
} from 'lucide-react';
import '../../components/ResponsiveBlogImages.css';

export default function AdminBlogEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [contentImageUploading, setContentImageUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [coverImageMode, setCoverImageMode] = useState('landscape'); // 'landscape' or 'portrait' or 'square'

  useEffect(() => {
    if (!user) return;

    const checkAdminAndFetchBlog = async () => {
      // Check admin status
      const adminData = await safeSelect('admin', '*', { id: user.id });
      if (!adminData || adminData.length === 0) {
        toast.error('Access denied. Admins only.');
        navigate('/');
        return;
      }
      setIsAdmin(true);

      // Fetch blog
      if (!id) {
        toast.error('Invalid blog ID.');
        navigate('/admin/blogs/manage');
        return;
      }

      const blogData = await safeSelect('blogs', '*', { id });
      if (blogData && blogData.length > 0) {
        setBlog(blogData[0]);
      } else {
        toast.error('Blog not found.');
        navigate('/admin/blogs/manage');
      }
      setLoading(false);
    };

    checkAdminAndFetchBlog();
  }, [id, navigate, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBlog((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (file, isReplace = false, oldUrl = null) => {
    try {
      setImageUploading(true);

      // Delete old image if replacing
      if (isReplace && oldUrl) {
        await StorageManager.deleteImage(oldUrl);
      }

      const imageUrl = await StorageManager.uploadImage(file, 'covers');

      if (imageUrl) {
        if (isReplace) {
          // Replace in blog content
          setBlog(prev => ({
            ...prev,
            description: prev.description.replace(oldUrl, imageUrl)
          }));

          // Update uploaded images list
          setUploadedImages(prev =>
            prev.map(img => img.url === oldUrl ? { ...img, url: imageUrl } : img)
          );
        } else {
          // Add to uploaded images list
          setUploadedImages(prev => [...prev, {
            id: Date.now(),
            url: imageUrl,
            name: file.name,
            size: file.size
          }]);
        }

        toast.success('Image uploaded successfully!');
        return imageUrl;
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageDelete = async (imageUrl) => {
    try {
      const success = await StorageManager.deleteImage(imageUrl);

      if (success) {
        // Remove from uploaded images
        setUploadedImages(prev => prev.filter(img => img.url !== imageUrl));

        // Remove from blog content if present
        setBlog(prev => ({
          ...prev,
          description: prev.description.replace(new RegExp(`!\\[.*?\\]\\(${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'), ''),
          cover_image_url: prev.cover_image_url === imageUrl ? '' : prev.cover_image_url
        }));

        toast.success('Image deleted successfully!');
      } else {
        toast.error('Failed to delete image');
      }
    } catch (error) {
      console.error('Image delete error:', error);
      toast.error('Failed to delete image');
    }
  };

  const insertImageIntoContent = (imageUrl) => {
    const imageMarkdown = `![Image](${imageUrl})`;
    setBlog(prev => ({
      ...prev,
      description: prev.description + '\n\n' + imageMarkdown
    }));
    toast.success('Image inserted into content!');
  };

  const setCoverImage = (imageUrl) => {
    setBlog(prev => ({
      ...prev,
      cover_image_url: imageUrl
    }));
    toast.success('Cover image updated!');
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
          return `![Uploaded Image](${url})`;
        }).join('\n\n');

        // Insert images at cursor position or append to content
        const textarea = document.querySelector('textarea[name="description"]');
        if (textarea) {
          const cursorPos = textarea.selectionStart;
          const textBefore = blog.description.substring(0, cursorPos);
          const textAfter = blog.description.substring(cursorPos);
          const newContent = textBefore + '\n\n' + imageMarkdown + '\n\n' + textAfter;
          setBlog(prev => ({ ...prev, description: newContent }));
        } else {
          setBlog(prev => ({ ...prev, description: prev.description + '\n\n' + imageMarkdown + '\n\n' }));
        }
      }
    } catch (error) {
      console.error('Error uploading content images:', error);
      toast.error('Failed to upload some images. Please try again.');
    } finally {
      setContentImageUploading(false);
    }
  };

  const handleUpdate = async (e, isDraft = false) => {
    e.preventDefault();

    if (!blog.title.trim() || !blog.description.trim()) {
      toast.error('Title and Description are required.');
      return;
    }

    setUpdating(true);

    try {
      const updateData = {
        title: blog.title.trim(),
        cover_image_url: blog.cover_image_url ? blog.cover_image_url.trim() : null,
        description: blog.description.trim(),
        published: !isDraft
      };

      const result = await safeUpdate('blogs', updateData, 'id', id);

      if (result) {
        toast.success(`Blog ${isDraft ? 'saved as draft' : 'updated and published'} successfully!`);
        navigate('/admin/blogs/manage');
      } else {
        toast.error('Failed to update blog. Please try again.');
      }
    } catch (error) {
      console.error('Error updating blog:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this blog? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Blog deleted successfully!');
      navigate('/admin/blogs/manage');
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog. Please try again.');
    }
  };

  // Dedicated cover image upload handler
  const handleCoverImageUpload = async (file) => {
    try {
      setImageUploading(true);

      const imageUrl = await StorageManager.uploadImage(file, 'covers');

      if (imageUrl) {
        // Set as cover image
        setBlog(prev => ({
          ...prev,
          cover_image_url: imageUrl
        }));

        toast.success('Cover image uploaded successfully!');
        return imageUrl;
      }
    } catch (error) {
      console.error('Cover image upload error:', error);
      toast.error('Failed to upload cover image');
    } finally {
      setImageUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!blog || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center text-red-600 text-xl font-semibold mb-4">
          {!isAdmin ? 'Access denied. Admins only.' : 'Blog not found.'}
        </div>
        <button
          onClick={() => navigate('/admin/blogs/manage')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
        >
          Back to Blog Management
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
                  Edit Blog Post
                </h1>
                <p className="text-gray-600 mt-1">Update your blog content and settings</p>
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

              <button
                onClick={handleDelete}
                className="flex items-center px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
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

            <form onSubmit={(e) => handleUpdate(e, false)} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blog Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={blog.title || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter an engaging blog title..."
                  required
                />
              </div>

              {/* Cover Image */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cover Image
                  </label>

                  {/* Aspect Ratio Selector */}
                  <div className="flex items-center space-x-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400">Aspect:</label>
                    <select
                      value={coverImageMode}
                      onChange={(e) => setCoverImageMode(e.target.value)}
                      className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="landscape">Landscape (16:9)</option>
                      <option value="portrait">Portrait (9:16)</option>
                      <option value="square">Square (1:1)</option>
                    </select>
                  </div>
                </div>

                {blog.cover_image_url ? (
                  <div className="relative group">
                    <div className={`
                      rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800
                      ${coverImageMode === 'landscape' ? 'aspect-video' : ''}
                      ${coverImageMode === 'portrait' ? 'aspect-[9/16] max-w-sm mx-auto' : ''}
                      ${coverImageMode === 'square' ? 'aspect-square max-w-sm mx-auto' : ''}
                    `}>
                      <img
                        src={blog.cover_image_url}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleImageDelete(blog.cover_image_url)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <div className="space-y-4">
                        <div className="flex justify-center space-x-4">
                          {/* Upload Button */}
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleCoverImageUpload(e.target.files[0])}
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

                    {/* URL Input - Only show when no cover image */}
                    <div className="mt-3">
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="url"
                          name="cover_image_url"
                          value={blog.cover_image_url || ''}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Enhanced Image Gallery */}
              {uploadedImages.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Uploaded Images ({uploadedImages.length})
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Image Actions */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex space-x-2">
                            {/* Set as Cover */}
                            <button
                              type="button"
                              onClick={() => setCoverImage(image.url)}
                              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                              title="Set as cover image"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </button>

                            {/* Insert into Content */}
                            <button
                              type="button"
                              onClick={() => insertImageIntoContent(image.url)}
                              className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                              title="Insert into content"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>

                            {/* Replace Image */}
                            <label className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors cursor-pointer" title="Replace image">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e.target.files[0], true, image.url)}
                              />
                            </label>

                            {/* Delete Image */}
                            <button
                              type="button"
                              onClick={() => handleImageDelete(image.url)}
                              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              title="Delete image"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Image Info */}
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={image.name}>
                            {image.name}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {(image.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  value={blog.description || ''}
                  onChange={handleChange}
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
                  type="submit"
                  disabled={updating}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {updating ? 'Updating...' : 'Update & Publish'}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleUpdate(e, true)}
                  disabled={updating}
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
              {blog.cover_image_url && (
                <div className={`
                  relative overflow-hidden
                  ${coverImageMode === 'landscape' ? 'aspect-video' : ''}
                  ${coverImageMode === 'portrait' ? 'aspect-[9/16] max-w-sm mx-auto' : ''}
                  ${coverImageMode === 'square' ? 'aspect-square max-w-sm mx-auto' : ''}
                `}>
                  <img
                    src={blog.cover_image_url}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Preview Content */}
              <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {blog.title || 'Your Blog Title Here'}
                </h1>

                <div className="prose prose-sm max-w-none blog-content">
                  {blog.description ? (
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
                      {blog.description}
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
