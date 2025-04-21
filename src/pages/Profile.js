import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
        setEditForm(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    const { error } = await supabase
      .from('profiles')
      .update(editForm)
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully!');
      setProfile(editForm);
      setEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center text-gray-500 py-12">No profile found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm transition"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Page Title */}
      <h1 className="text-4xl font-bold text-center mb-8">My Profile</h1>

      <div className="bg-white p-8 rounded-xl shadow space-y-6">

        {/* Info Fields */}
        {[
          { label: 'First Name', key: 'first_name' },
          { label: 'Last Name', key: 'last_name' },
          { label: 'Email', key: 'email' },
          { label: 'Education Level', key: 'education_level' },
          { label: 'English Level', key: 'english_level' },
          { label: 'TOEFL Score', key: 'toefl_score' },
          { label: 'Interests', key: 'interests' },
          { label: 'Bio', key: 'bio' },
          { label: 'Date of Birth', key: 'date_of_birth' },
        ].map((field) => (
          <div key={field.key}>
            <label className="text-gray-600 font-medium">{field.label}</label>
            {editing ? (
              <input
                type="text"
                className="w-full mt-1 border rounded px-3 py-2"
                value={editForm[field.key] || ''}
                onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
              />
            ) : (
              <p className="mt-1 text-gray-800">{profile[field.key] || 'N/A'}</p>
            )}
          </div>
        ))}

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-8">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
              >
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
