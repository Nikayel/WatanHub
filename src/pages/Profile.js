import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { User, ChevronLeft, Save, X, Edit2 } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingChanges, setSavingChanges] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
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
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleInputChange = (key, value) => {
    setEditForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSavingChanges(true);
    try {
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
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setSavingChanges(false);
    }
  };

  const handleCancel = () => {
    setEditForm(profile);
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <User size={64} className="text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">No Profile Found</h2>
        <p className="text-gray-500 mt-2 text-center">We couldn't find your profile information.</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const profileFields = [
    { label: 'First Name', key: 'first_name', type: 'text' },
    { label: 'Last Name', key: 'last_name', type: 'text' },
    { label: 'Email', key: 'email', type: 'email' },
    { label: 'Education Level', key: 'education_level', type: 'text' },
    { label: 'English Level', key: 'english_level', type: 'text' },
    { label: 'TOEFL Score', key: 'toefl_score', type: 'text' },
    { label: 'Date of Birth', key: 'date_of_birth', type: 'date' },
    { label: 'Interests', key: 'interests', type: 'textarea' },
    { label: 'Bio', key: 'bio', type: 'textarea' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm transition self-start"
        >
          <ChevronLeft size={16} className="mr-1" />
          Back
        </button>
        
        <h1 className="text-3xl sm:text-4xl font-bold text-center sm:text-left flex-grow">My Profile</h1>
        
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center transition-colors"
          >
            <Edit2 size={16} className="mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-24 sm:h-32 w-full relative">
          <div className="absolute -bottom-12 sm:-bottom-14 left-6 sm:left-8 bg-white rounded-full p-1 border-4 border-white shadow-md">
            <div className="bg-indigo-100 rounded-full w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center text-indigo-600">
              <User size={40} />
            </div>
          </div>
        </div>
        
        {/* Profile Content */}
        <div className="pt-14 sm:pt-16 p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 sm:gap-y-6 mt-4">
            {profileFields.map((field) => {
              const isTextarea = field.type === 'textarea';
              const colSpan = isTextarea ? "md:col-span-2" : "";
              
              return (
                <div key={field.key} className={`${colSpan}`}>
                  <label className="text-gray-600 font-medium text-sm block mb-1">
                    {field.label}
                  </label>
                  
                  {editing ? (
                    isTextarea ? (
                      <textarea
                        className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all min-h-24"
                        value={editForm[field.key] || ''}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                      />
                    ) : (
                      <input
                        type={field.type}
                        className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        value={editForm[field.key] || ''}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                      />
                    )
                  ) : (
                    <p className="mt-1 px-3 py-2 bg-gray-50 rounded-lg text-gray-800 break-words">
                      {profile[field.key] || 'Not provided'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          {editing && (
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg flex items-center justify-center transition-colors"
              >
                <X size={16} className="mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={savingChanges}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {savingChanges ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}