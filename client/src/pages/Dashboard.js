import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Link } from 'react-router-dom';

import { Loader, Bell, MessageSquare, User, Calendar, ChevronRight } from 'lucide-react';
//For our students dashbaord
export default function Dashboard() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch announcements
        const { data: announcementsData, error: announcementsError } = await supabase
          .from('announcements')
          .select('*')
          .order('created_at', { ascending: false });

        if (!announcementsError) {
          setAnnouncements(announcementsData);
        }

        // Fetch basic profile info if user exists
        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', user.id)
            .single();

          if (!profileError) {
            setProfileData(profileData);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-white rounded-lg shadow-sm p-8 flex flex-col items-center">
          <Loader className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-md p-6 sm:p-8 mb-8 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
          <div className="mb-8">
  <Link
    to="/"
    className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg transition duration-300"
  >
    ← Back to Home
  </Link>
</div>
            <h1 className="text-3xl sm:text-4xl font-bold">Welcome{profileData ? `, ${profileData.first_name}` : ''}!</h1>
            <p className="mt-2 text-indigo-100">Here's what's happening today</p>
          </div>
          <Link 
            to="/profile" 
            className="mt-4 sm:mt-0 flex items-center bg-white bg-opacity-20 hover:bg-opacity-30 transition px-4 py-2 rounded-lg"
          >
            <User size={18} className="mr-2" />
            <span>My Profile</span>
          </Link>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar size={20} className="mr-2 text-indigo-600" />
              Quick Stats
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Announcements</div>
                <div className="text-2xl font-semibold text-gray-800">{announcements.length}</div>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="text-sm text-indigo-700">Today's Date</div>
                <div className="text-xl font-semibold text-indigo-900">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric'
                  })}
                </div>
              </div>

              <Link 
                to="/resources" 
                className="block mt-4 bg-gray-50 hover:bg-gray-100 p-4 rounded-lg flex justify-between items-center transition"
              >
                <span className="font-medium text-gray-800">Resources</span>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* Announcements Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Bell size={20} className="mr-2 text-indigo-600" />
              Announcements
            </h2>
            
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <MessageSquare size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No announcements yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Check back later for updates.</p>
                </div>
              ) : (
                announcements.map((announcement) => (
                  <div 
                    key={announcement.id}
                    className="bg-white border border-gray-100 hover:border-indigo-200 rounded-lg p-5 shadow-sm hover:shadow transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-indigo-700 group-hover:text-indigo-800 transition-colors">
                        {announcement.title}
                      </h3>
                      <div className="text-xs text-gray-400 mt-1 sm:mt-0 flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {formatDate(announcement.created_at)} at {formatTime(announcement.created_at)}
                      </div>
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700">{announcement.message}</p>
                    </div>
                    
                    {/* CTA - for FUTURE scaleing */}
                    {announcement.cta_link && (
                      <div className="mt-3 text-right">
                        <Link 
                          to={announcement.cta_link}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center justify-end"
                        >
                          <span>Learn more</span>
                          <ChevronRight size={16} className="ml-1" />
                        </Link>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Content Area */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Links - These could be customized based on user role or preferences */}
          {['Courses', 'Assignments', 'Resources'].map((item, index) => (
            <Link 
              key={index}
              to={`/${item.toLowerCase()}`}
              className="bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 rounded-xl p-6 text-center transition-all shadow-sm hover:shadow flex flex-col items-center justify-center"
            >
              <div className="bg-white rounded-full p-3 shadow-sm mb-3">
                <div className="bg-indigo-100 rounded-full w-10 h-10 flex items-center justify-center text-indigo-600">
                  {index === 0 && <Calendar size={20} />}
                  {index === 1 && <MessageSquare size={20} />}
                  {index === 2 && <User size={20} />}
                </div>
              </div>
              <h3 className="font-semibold text-gray-800">{item}</h3>
              <p className="text-sm text-gray-500 mt-1">View your {item.toLowerCase()}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}