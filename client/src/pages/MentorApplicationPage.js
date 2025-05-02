import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { safeInsert, safeSelect } from '../lib/supabase';
import { toast } from 'sonner';
import {supabase} from '../lib/supabase';
import { useEffect} from 'react';

export default function MentorApplication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    school: '',
    dob: '',
    nationality: '',
    languages: '',
    education: '',
    expertise: '',
    motivation: '',
    available_hours_per_week: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    async function checkAuthUid() {
      const { data, error } = await supabase.rpc('get_my_uid');
      if (error) {
        console.error('❌ Failed to fetch auth.uid() from Supabase:', error);
      } else {
        console.log('🧠 Supabase auth.uid() from server:', data);
        console.log('🧠 Local user.id from useAuth():', user?.id);
      }
    }

    if (user) checkAuthUid();
  }, [user]);
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="mb-6 text-gray-600">You must be logged in to apply as a mentor.</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition"
        >
          Login
        </button>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!form.full_name || !form.email || !form.phone || !form.school || !form.dob || !form.languages || !form.bio) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    // ✅ Check if user already applied
    const existing = await safeSelect('mentorapplications', '*', {
      user_id: user.id
    });

    if (existing && existing.length > 0) {
      toast.error('You have already submitted an application.');
      setLoading(false);
      return;
    }

    const result = await safeInsert('mentorapplications', {
      ...form,
      user_id: user.id,
      status: 'pending',
      languages: form.languages.split(',').map(lang => lang.trim()),
    });
    
    if (result) {
      toast.success('Application submitted successfully!');
      setSubmitted(true);
    } else {
      toast.error('Failed to submit application. Please try again.');
      
      // 🔍 Log what we're inserting and comparing
      console.log("🧠 Authenticated user ID:", user?.id);
      console.log("📦 Insert payload:", {
        ...form,
        user_id: user.id,
        status: 'pending',
        languages: form.languages.split(',').map(lang => lang.trim()),
      });
    
      console.error("❌ Failed to submit application from MentorApplication.js:", {
        error: result,
        formData: form,
        userId: user.id,
      });
    }
    
    

    setLoading(false);
  };
  

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <h2 className="text-3xl font-bold mb-4 text-primary">Thank you for applying!</h2>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          Your mentor application has been received. Our team will review it shortly.
          You will be notified via email once approved or rejected.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 py-12">
      <h1 className="text-4xl font-bold mb-8 text-center">Mentor Application</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {[
          { label: 'Full Name', name: 'full_name', type: 'text' },
          { label: 'Email Address', name: 'email', type: 'email' },
          { label: 'Phone Number', name: 'phone', type: 'tel' },
          { label: 'School', name: 'school', type: 'text' },
          { label: 'Date of Birth', name: 'dob', type: 'date' },
          { label: 'Nationality', name: 'nationality', type: 'text' },
          { label: 'Languages (comma separated)', name: 'languages', type: 'text' },
          { label: 'Education', name: 'education', type: 'text' },
          { label: 'Expertise', name: 'expertise', type: 'text' },
          { label: 'Why do you want to be a mentor?', name: 'motivation', type: 'textarea' },
          { label: 'Available hours per week', name: 'available_hours_per_week', type: 'number' },
          { label: 'Short Bio', name: 'bio', type: 'textarea' },
        ].map(({ label, name, type }) => (
          <div key={name}>
            <label className="block text-gray-700 font-semibold mb-2">{label}</label>
            {type === 'textarea' ? (
              <textarea
                name={name}
                value={form[name]}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring focus:border-blue-300"
                rows="4"
                required
              />
            ) : (
              <input
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring focus:border-blue-300"
                required
              />
            )}
          </div>
        ))}

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-primary text-white rounded-full hover:bg-primary-dark transition disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
}
