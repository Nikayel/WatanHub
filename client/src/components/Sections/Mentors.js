import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, MapPin, Briefcase, Languages } from 'lucide-react';

// Simulated supabase data for demonstration
const supabaseData = [
  {
    id: 1,
    full_name: "Sarah Johnson",
    email: "sarah@example.com",
    bio: "Frontend developer with 8 years of experience specializing in React and modern JavaScript frameworks.",
    languages: ["JavaScript", "TypeScript", "HTML/CSS"],
    position: "Senior Frontend Developer",
    location: "San Francisco, CA",
    avatar_url: "/api/placeholder/300/300"
  },
  {
    id: 2,
    full_name: "Michael Chen",
    email: "michael@example.com",
    bio: "Data scientist passionate about machine learning and AI applications in business.",
    languages: ["Python", "R", "SQL"],
    position: "Lead Data Scientist",
    location: "New York, NY",
    avatar_url: "/api/placeholder/300/300"
  },
  {
    id: 3,
    full_name: "Priya Patel",
    email: "priya@example.com",
    bio: "UX/UI designer focused on creating accessible and intuitive user experiences.",
    languages: ["Figma", "Sketch", "Adobe XD"],
    position: "Senior UX Designer",
    location: "London, UK",
    avatar_url: "/api/placeholder/300/300"
  },
  {
    id: 4,
    full_name: "Carlos Rodriguez",
    email: "carlos@example.com",
    bio: "Backend developer specialized in scalable cloud architecture and microservices.",
    languages: ["Java", "Go", "Node.js"],
    position: "Cloud Architect",
    location: "Berlin, Germany",
    avatar_url: "/api/placeholder/300/300"
  },
  {
    id: 5,
    full_name: "Aisha Williams",
    email: "aisha@example.com",
    bio: "Marketing strategist with expertise in growth hacking and digital campaigns.",
    languages: ["English", "French", "Arabic"],
    position: "Growth Marketing Lead",
    location: "Toronto, Canada",
    avatar_url: "/api/placeholder/300/300"
  }
];

const MentorCard = ({ mentor, index }) => {
  // Generate a consistent color based on mentor id or index
  const colorClasses = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-purple-500 to-violet-600'
  ];
  
  const colorClass = colorClasses[index % colorClasses.length];
  
  return (
    <div className="relative bg-white rounded-xl shadow-lg overflow-hidden min-w-[300px] w-80 snap-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
      <div className={`absolute top-0 left-0 w-full h-3 bg-gradient-to-r ${colorClass}`} />
      
      <div className="relative">
        <div className="w-full h-48 bg-gray-200 overflow-hidden">
          <img
            src={mentor.avatar_url || "/api/placeholder/300/300"}
            alt={mentor.full_name}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow-md">
          <Star className="h-5 w-5 text-amber-400" fill="#fbbf24" />
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold">{mentor.full_name}</h3>
        <div className="flex items-center mt-1 text-gray-600">
          <Briefcase className="h-4 w-4 mr-1" />
          <p className="text-primary font-medium">{mentor.position || 'Mentor'}</p>
        </div>
        
        {mentor.location && (
          <div className="flex items-center mt-1 text-gray-600">
            <MapPin className="h-4 w-4 mr-1" />
            <p className="text-sm">{mentor.location}</p>
          </div>
        )}
        
        {mentor.languages && (
          <div className="flex items-center mt-1 text-gray-600">
            <Languages className="h-4 w-4 mr-1" />
            <p className="text-sm">{Array.isArray(mentor.languages) ? mentor.languages.join(', ') : mentor.languages}</p>
          </div>
        )}
        
        <p className="text-gray-600 mt-3 line-clamp-3">{mentor.bio || 'No bio available yet.'}</p>
        
        <div className="mt-4">
          <button className={`px-4 py-2 rounded-md text-sm font-medium text-white bg-gradient-to-r ${colorClass} hover:opacity-90 transition-opacity`}>
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
};

const MentorSkeleton = () => (
  <div className="bg-white rounded-xl shadow min-w-[300px] w-80 animate-pulse">
    <div className="w-full h-48 bg-gray-200" />
    <div className="p-6">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded w-4/5" />
      <div className="mt-4 h-10 bg-gray-200 rounded w-1/3" />
    </div>
  </div>
);

const Mentors = () => {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const carouselRef = useRef(null);
  
  // Simulate categories for filtering
  const categories = ['All', 'Programming', 'Design', 'Business', 'Marketing'];
  
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        // Simulate API call with timeout
        setTimeout(() => {
          setMentors(supabaseData);
          setLoading(false);
        }, 1000);
        
        /* In real implementation, use this:
        const { data, error } = await supabase
          .from('mentors')
          .select('id, full_name, email, bio, languages, position, location');

        if (error) {
          console.error('Error fetching mentors:', error.message);
        } else {
          setMentors(data || []);
        }
        setLoading(false);
        */
      } catch (err) {
        console.error('Failed to fetch mentors:', err);
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  const handlePrevClick = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const handleNextClick = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };
  
  const filteredMentors = mentors.filter(mentor => {
    const matchesCategory = currentCategory === 'All' || 
      (mentor.category && mentor.category === currentCategory);
    
    const matchesSearch = !searchTerm || 
      mentor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mentor.bio && mentor.bio.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="py-16 bg-gradient-to-r from-gray-50 to-gray-100 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Animation elements - background gradients */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-50">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
        </div>

        {/* Title with animated underline */}
        <div className="relative text-center mb-12">
          <h2 className="text-4xl font-bold mb-2 inline-block">Our Mentors</h2>
          <div className="h-1 bg-indigo-600 mt-1 mx-auto w-16 md:w-24 animate-pulse" />
          <p className="text-gray-600 max-w-2xl mx-auto mt-4">
            Connect with industry experts who are passionate about sharing their knowledge
            and helping you succeed in your journey.
          </p>
        </div>
        
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search mentors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x max-w-full">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setCurrentCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                  currentCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Mentors Carousel */}
        <div className="relative group">
          {!loading && filteredMentors.length > 0 && (
            <>
              <button 
                onClick={handlePrevClick}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg z-10 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                aria-label="Previous mentors"
              >
                <ChevronLeft className="h-6 w-6 text-gray-700" />
              </button>
              
              <button 
                onClick={handleNextClick}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg z-10 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                aria-label="Next mentors"
              >
                <ChevronRight className="h-6 w-6 text-gray-700" />
              </button>
            </>
          )}
          
          <div 
            ref={carouselRef}
            className="flex space-x-6 overflow-x-auto snap-x snap-mandatory pb-8 scrollbar-hide scroll-smooth"
            style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
          >
            {loading ? (
              // Loading skeletons
              Array(4).fill().map((_, index) => (
                <MentorSkeleton key={index} />
              ))
            ) : filteredMentors.length > 0 ? (
              filteredMentors.map((mentor, index) => (
                <div key={mentor.id} className="opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]" style={{animationDelay: `${index * 0.1}s`}}>
                  <MentorCard mentor={mentor} index={index} />
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center w-full py-12">
                <p className="text-center text-gray-500">No mentors found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { count: '20+', label: 'Expert Mentors' },
            { count: '500+', label: 'Mentoring Hours' },
            { count: '97%', label: 'Satisfaction Rate' }
          ].map((stat, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl p-6 text-center shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-3xl font-bold text-indigo-600 mb-2">{stat.count}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Become a Mentor CTA */}
        <div className="mt-20 text-center bg-gradient-to-r from-indigo-600 to-blue-700 rounded-2xl p-10 shadow-xl">
          <h2 className="text-3xl font-bold mb-4 text-white">Become a Mentor</h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Inspire and guide the next generation. If you have valuable experience to share, 
            join our growing community of mentors and make a lasting impact!
          </p>
          <a href="/mentor-application">
            <button className="px-8 py-3 bg-white hover:bg-gray-100 text-indigo-700 font-medium rounded-full shadow-lg transition transform hover:scale-105">
              Apply to Become a Mentor
            </button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Mentors;