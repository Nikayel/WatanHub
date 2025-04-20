import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('admin')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setIsAdmin(true);
      }
      setLoading(false);
    };

    checkAdmin();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="p-4 text-center text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">Admin Dashboard</h1>

      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/admin/blogs/create"
          className="p-6 border rounded-lg hover:shadow-lg transition flex flex-col items-center bg-white"
        >
          <h2 className="text-2xl font-semibold mb-4">Create New Blog</h2>
          <p className="text-gray-600 text-center">Write and publish a new blog post.</p>
        </Link>

        <Link
          to="/admin/blogs/manage"
          className="p-6 border rounded-lg hover:shadow-lg transition flex flex-col items-center bg-white"
        >
          <h2 className="text-2xl font-semibold mb-4">Manage Blogs</h2>
          <p className="text-gray-600 text-center">Edit or delete existing blog posts.</p>
        </Link>

        {/* Future: Manage Users or Settings */}
      </div>
    </div>
  );
};

export default AdminDashboard;
