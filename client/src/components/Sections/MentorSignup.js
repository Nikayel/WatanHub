import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

const MentorSignup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMentor, setIsMentor] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkMentor = async () => {
      const { data } = await supabase
        .from('mentors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (data) setIsMentor(true);
    };

    checkMentor();
  }, [user]);

  const handleSignupClick = () => {
    navigate('/mentor-application');
  };

  return (
    <section className="mentor-signup py-20 bg-gradient-to-r from-secondary to-primary text-center text-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold mb-4">Become a Mentor</h2>
        <p className="mb-8">Share your experience and empower the next generation. Join our team of dedicated mentors.</p>
        <button
          onClick={handleSignupClick}
          className="px-8 py-3 bg-white text-secondary rounded-full font-semibold hover:bg-gray-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isMentor}
        >
          {isMentor ? 'You are already a mentor' : 'Sign Up Today'}
        </button>
      </div>
    </section>
  );
};

export default MentorSignup;
