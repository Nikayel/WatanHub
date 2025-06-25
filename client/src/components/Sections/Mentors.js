import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Heart, Users, GraduationCap, Sparkles,
  Calendar, MapPin, Star, ArrowRight, Zap, Award,
  Target, BookOpen, Lightbulb, Rocket, Shield, Briefcase
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const TypewriterText = ({ text, className, delay = 0 }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 80);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return (
    <span className={className}>
      {displayText}
      {currentIndex < text.length && <span className="animate-pulse">|</span>}
    </span>
  );
};

const GetToKnowUs = () => {
  const [activeTab, setActiveTab] = useState('mentors');
  const [fellowshipInfo, setFellowshipInfo] = useState({
    start_date: 'August 1st, 2024',
    description: 'An intensive 8-week program designed to empower Afghan students with skills, mentorship, and opportunities for academic and professional success.'
  });

  useEffect(() => {
    fetchFellowshipInfo();
  }, []);

  const fetchFellowshipInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('fellowship_settings')
        .select('*')
        .single();

      if (!error && data) {
        setFellowshipInfo(data);
      }
    } catch (error) {
      console.log('Using default fellowship info');
    }
  };

  const tabs = [
    { id: 'mentors', label: 'Mentors & About', icon: Heart },
    { id: 'mission', label: 'What We Do', icon: Users },
    { id: 'fellowship', label: 'Fellowship', icon: GraduationCap },
    { id: 'impact', label: 'Our Impact', icon: Target },
    { id: 'team', label: 'Meet Us', icon: Star }
  ];

  const missionItems = [
    {
      title: 'Cultural Preservation',
      description: 'We organize cultural and social events to preserve and celebrate Afghan heritage and values, ensuring our rich traditions continue to flourish.',
      icon: Globe,
      color: 'from-blue-400 to-indigo-600',
      details: ['Traditional festivals', 'Cultural workshops', 'Heritage documentation', 'Language preservation']
    },
    {
      title: 'Humanitarian Support',
      description: 'We raise funds and provide support to help those in need in Kabul and across Afghanistan, making real impact in communities.',
      icon: Heart,
      color: 'from-pink-400 to-red-600',
      details: ['Emergency relief', 'Educational supplies', 'Healthcare support', 'Community development']
    },
    {
      title: 'Educational Mentorship',
      description: 'Our biggest mission is mentoring Afghan girls and helping them apply to colleges in the United States, opening doors to bright futures.',
      icon: GraduationCap,
      color: 'from-green-400 to-emerald-600',
      details: ['College counseling', 'Application support', 'Scholarship guidance', 'Career planning']
    }
  ];

  const impactStats = [
    { number: '500+', label: 'Students Mentored', icon: Users },
    { number: '150+', label: 'College Acceptances', icon: GraduationCap },
    { number: '$2M+', label: 'Scholarships Secured', icon: Award },
    { number: '25+', label: 'Cultural Events', icon: Globe }
  ];

  const visionPoints = [
    {
      title: 'Global Network',
      description: 'Building a worldwide community of Afghan professionals and students',
      icon: Globe
    },
    {
      title: 'Innovation Hub',
      description: 'Creating technology solutions for education and cultural preservation',
      icon: Lightbulb
    },
    {
      title: 'Leadership Development',
      description: 'Empowering the next generation of Afghan leaders',
      icon: Shield
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 relative">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-100 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-purple-100 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-indigo-100 rounded-full opacity-30 blur-3xl"></div>
      </div>

      {/* Header with Typewriter Effect */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-slate-800">
              <TypewriterText
                text="Our Mentors"
                className=""
              />
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed"
            >
              Empowering Afghan youth through education, culture, and community
            </motion.p>
          </motion.div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-2 border border-gray-200 shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex flex-col items-center space-y-2 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="font-medium text-xs md:text-sm">{tab.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Tab Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <AnimatePresence mode="wait">
            {activeTab === 'story' && (
              <motion.div
                key="story"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="space-y-12"
              >
                <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/10">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-12"
                  >
                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-cyan-400 to-purple-400 rounded-full flex items-center justify-center mb-6 relative">
                      <Sparkles className="h-16 w-16 text-white animate-pulse" />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 opacity-50 animate-ping"></div>
                    </div>
                    <h2 className="text-4xl font-bold mb-8">
                      <TypewriterText
                        text="Our Journey Begins"
                        className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
                      />
                    </h2>
                  </motion.div>

                  <div className="max-w-4xl mx-auto space-y-8 text-lg text-gray-300 leading-relaxed">
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      Born from a vision to bridge cultures and create opportunities, WatanHub stands as a beacon of hope
                      for Afghan youth worldwide. Our story began with a simple belief: education and mentorship can
                      transform lives and communities.
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      We are a community of passionate individuals dedicated to preserving Afghan heritage while
                      empowering the next generation to thrive in a global society. Through technology, innovation,
                      and human connection, we create pathways to success.
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      Every mentor, every student, every cultural event, and every act of kindness contributes to
                      a larger tapestry of hope, resilience, and progress. This is more than an organization –
                      it's a movement that spans continents and touches hearts.
                    </motion.p>
                  </div>
                </div>

                {/* Timeline Section */}
                <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
                  <h3 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Our Timeline
                  </h3>
                  <div className="space-y-8">
                    {[
                      { year: '2020', title: 'Foundation', desc: 'WatanHub was founded with a vision to empower Afghan youth' },
                      { year: '2021', title: 'First Mentorship Program', desc: 'Launched our inaugural mentorship initiative' },
                      { year: '2022', title: 'Cultural Events', desc: 'Began organizing cultural preservation events' },
                      { year: '2023', title: 'Humanitarian Aid', desc: 'Started fundraising for Afghanistan relief efforts' },
                      { year: '2024', title: 'Fellowship Launch', desc: 'Introducing our comprehensive fellowship program' }
                    ].map((milestone, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className="flex items-center space-x-6"
                      >
                        <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-lg">
                          {milestone.year}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-white mb-2">{milestone.title}</h4>
                          <p className="text-gray-300">{milestone.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'mentors' && (
              <motion.div
                key="mentors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="space-y-12"
              >
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-200 shadow-lg">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-12"
                  >
                    <div className="w-32 h-32 mx-auto bg-blue-600 rounded-full flex items-center justify-center mb-6">
                      <Users className="h-16 w-16 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold mb-8 text-slate-800">
                      Our Mentors & Mission
                    </h2>
                  </motion.div>

                  <div className="grid md:grid-cols-2 gap-12">
                    {/* About Our Mentors */}
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-6">About Our Mentors</h3>
                      <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                        <p>
                          Our mentors are passionate Afghan professionals, students, and alumni from top universities
                          worldwide. They volunteer their time to guide the next generation of Afghan leaders through
                          personalized mentorship, academic support, and career guidance.
                        </p>
                        <p>
                          Each mentor brings unique expertise in fields ranging from engineering and medicine to
                          business and the arts. Together, they form a supportive community dedicated to empowering
                          Afghan youth to achieve their dreams and make meaningful contributions to society.
                        </p>
                      </div>
                    </div>

                    {/* About WatanHub */}
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-6">About WatanHub</h3>
                      <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
                        <p>
                          Born from a vision to bridge cultures and create opportunities, WatanHub stands as a beacon of hope
                          for Afghan youth worldwide. Our story began with a simple belief: education and mentorship can
                          transform lives and communities.
                        </p>
                        <p>
                          We are a community of passionate individuals dedicated to preserving Afghan heritage while
                          empowering the next generation to thrive in a global society. Through technology, innovation,
                          and human connection, we create pathways to success.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mentor Benefits & Values */}
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border border-gray-200 shadow-lg">
                  <h3 className="text-3xl font-bold text-center mb-12 text-slate-800">What Our Mentors Provide</h3>
                  <div className="grid md:grid-cols-3 gap-8">
                    {[
                      {
                        title: 'Academic Guidance',
                        desc: 'Help with college applications, essay writing, and academic planning for success',
                        icon: GraduationCap
                      },
                      {
                        title: 'Career Mentorship',
                        desc: 'Professional development, networking opportunities, and industry insights',
                        icon: Briefcase
                      },
                      {
                        title: 'Personal Support',
                        desc: 'Emotional support, cultural guidance, and personal development coaching',
                        icon: Heart
                      }
                    ].map((benefit, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.2 }}
                        className="text-center"
                      >
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <benefit.icon className="h-8 w-8 text-blue-600" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-800 mb-2">{benefit.title}</h4>
                        <p className="text-slate-600">{benefit.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'mission' && (
              <motion.div
                key="mission"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="space-y-12"
              >
                <h2 className="text-4xl font-bold text-center mb-12 text-slate-800">
                  What We Do
                </h2>

                <div className="grid lg:grid-cols-3 gap-8">
                  {missionItems.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 }}
                      className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 group"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <item.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-4">{item.title}</h3>
                      <p className="text-slate-600 leading-relaxed mb-6">{item.description}</p>

                      <ul className="space-y-2">
                        {item.details.map((detail, idx) => (
                          <li key={idx} className="flex items-center text-sm text-slate-500">
                            <ArrowRight className="h-3 w-3 text-blue-600 mr-2" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'fellowship' && (
              <motion.div
                key="fellowship"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="space-y-12"
              >
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-200 shadow-lg">
                  <div className="text-center mb-12">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-24 h-24 mx-auto bg-blue-600 rounded-full flex items-center justify-center mb-6"
                    >
                      <GraduationCap className="h-12 w-12 text-white" />
                    </motion.div>

                    <h2 className="text-4xl font-bold mb-4 text-slate-800">
                      Fellowship Program
                    </h2>

                    <div className="flex items-center justify-center space-x-4 text-blue-600 mb-8">
                      <Calendar className="h-6 w-6" />
                      <span className="text-xl font-semibold">Starting {fellowshipInfo.start_date}</span>
                    </div>
                  </div>

                  <div className="max-w-4xl mx-auto">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-lg text-slate-600 leading-relaxed text-center mb-12"
                    >
                      {fellowshipInfo.description}
                    </motion.p>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                      <div className="bg-gray-50 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                          <Zap className="h-6 w-6 text-blue-600 mr-2" />
                          Program Highlights
                        </h3>
                        <ul className="space-y-3 text-slate-600">
                          {['Personalized mentorship', 'College application guidance', 'Professional development', 'Cultural preservation activities', 'Networking opportunities', 'Scholarship support'].map((item, idx) => (
                            <motion.li
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.7 + idx * 0.1 }}
                              className="flex items-center"
                            >
                              <ArrowRight className="h-4 w-4 text-blue-600 mr-2" />
                              {item}
                            </motion.li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                          <Star className="h-6 w-6 text-blue-600 mr-2" />
                          Who Can Apply
                        </h3>
                        <ul className="space-y-3 text-slate-600">
                          {['Afghan students worldwide', 'Committed to academic excellence', 'Passionate about community impact', 'Ready for transformation', 'Age 16-25', 'Strong English proficiency'].map((item, idx) => (
                            <motion.li
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.7 + idx * 0.1 }}
                              className="flex items-center"
                            >
                              <ArrowRight className="h-4 w-4 text-green-600 mr-2" />
                              {item}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="text-center">
                      <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center space-x-2 mx-auto shadow-lg"
                      >
                        <span>Apply Now</span>
                        <ArrowRight className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'impact' && (
              <motion.div
                key="impact"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="space-y-12"
              >
                <h2 className="text-4xl font-bold text-center mb-12 text-slate-800">
                  Our Impact
                </h2>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {impactStats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.2 }}
                      className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 text-center border border-gray-200 shadow-lg hover:shadow-xl transition-all group"
                    >
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <stat.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-slate-800 mb-2">{stat.number}</div>
                      <div className="text-slate-600 text-sm">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 border border-gray-200 shadow-lg">
                  <h3 className="text-2xl font-bold text-center mb-8 text-slate-800">Success Stories</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    {[
                      {
                        quote: "WatanHub changed my life. I'm now studying at Harvard University thanks to their mentorship.",
                        author: "Fatima A.",
                        achievement: "Harvard University Student"
                      },
                      {
                        quote: "The fellowship program gave me the tools and confidence to pursue my dreams in STEM.",
                        author: "Ahmad K.",
                        achievement: "MIT Engineering Student"
                      }
                    ].map((story, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.3 }}
                        className="bg-gray-50 rounded-2xl p-6"
                      >
                        <p className="text-slate-600 italic mb-4">"{story.quote}"</p>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <Star className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{story.author}</div>
                            <div className="text-sm text-blue-600">{story.achievement}</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'team' && (
              <motion.div
                key="team"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-12"
              >
                <h2 className="text-4xl font-bold mb-8 text-slate-800">
                  Meet Our Team
                </h2>

                <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-12 border border-gray-200 shadow-lg">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="w-32 h-32 mx-auto bg-blue-600 rounded-full flex items-center justify-center mb-8"
                  >
                    <Users className="h-16 w-16 text-white" />
                  </motion.div>

                  <h3 className="text-2xl font-bold text-slate-800 mb-6">Coming Soon</h3>
                  <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
                    We're preparing an amazing team showcase with detailed profiles, LinkedIn connections,
                    and role descriptions. Stay tuned to meet the incredible people making WatanHub possible.
                  </p>

                  <div className="flex justify-center">
                    <div className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold">
                      Team Profiles Coming Soon
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default GetToKnowUs;