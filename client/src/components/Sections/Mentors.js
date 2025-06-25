import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Heart, Users, GraduationCap, Sparkles,
  Calendar, MapPin, Star, ArrowRight, Zap, Award,
  Target, BookOpen, Lightbulb, Rocket, Shield, Briefcase,
  Mail, Phone, Linkedin, Twitter, Github, ChevronLeft, ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import performanceUtils, { useCleanup, useStableCallback } from '../../utils/performanceUtils';
import Logger from '../../utils/logger';

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

const PartnershipImageCarousel = ({ images, partnershipName }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [enlargedImageIndex, setEnlargedImageIndex] = useState(0);
  const cleanup = useCleanup();

  useEffect(() => {
    const interval = cleanup.setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [images.length, cleanup]);

  const nextImage = useStableCallback(() => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const prevImage = useStableCallback(() => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images.length]);

  const openEnlarged = useStableCallback((index) => {
    setEnlargedImageIndex(index);
    setIsEnlarged(true);
  }, []);

  const closeEnlarged = useStableCallback(() => {
    setIsEnlarged(false);
  }, []);

  const nextEnlargedImage = useStableCallback(() => {
    setEnlargedImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const prevEnlargedImage = useStableCallback(() => {
    setEnlargedImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images.length]);

  return (
    <div className="relative">
      {/* Image carousel display */}
      <div className="relative h-64 bg-gray-100 rounded-2xl overflow-hidden shadow-lg">
        {/* Images */}
        <div className="relative w-full h-full">
          {images.map((image, index) => {
            const isActive = index === currentImageIndex;
            const isNext = index === (currentImageIndex + 1) % images.length;
            const isPrev = index === (currentImageIndex - 1 + images.length) % images.length;

            let position = 'translate-x-full opacity-0';
            if (isActive) position = 'translate-x-0 opacity-100 scale-100';
            else if (isNext) position = 'translate-x-full opacity-30 scale-95';
            else if (isPrev) position = '-translate-x-full opacity-30 scale-95';

            return (
              <motion.div
                key={index}
                className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${position}`}
                onClick={() => openEnlarged(index)}
              >
                <img
                  src={image}
                  alt={`${partnershipName} ${index + 1}`}
                  className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                  <div className="text-white opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                    <span className="text-sm font-medium">Click to enlarge</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prevImage}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 z-10"
        >
          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextImage}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 z-10"
        >
          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Image counter */}
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          {currentImageIndex + 1} / {images.length}
        </div>
      </div>

      {/* Image indicators */}
      <div className="flex justify-center space-x-2 mt-4">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${index === currentImageIndex
              ? 'bg-blue-600 w-8'
              : 'bg-gray-300 hover:bg-gray-400 w-2'
              }`}
          />
        ))}
      </div>

      {/* Enlarged view modal */}
      <AnimatePresence>
        {isEnlarged && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={closeEnlarged}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-7xl max-h-[95vh] bg-white rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Main enlarged image */}
              <div className="relative">
                <img
                  src={images[enlargedImageIndex]}
                  alt={`${partnershipName} enlarged view`}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />

                {/* Navigation arrows for enlarged view */}
                <button
                  onClick={prevEnlargedImage}
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center shadow-xl transition-all duration-200"
                >
                  <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextEnlargedImage}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center shadow-xl transition-all duration-200"
                >
                  <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Close button */}
              <button
                onClick={closeEnlarged}
                className="absolute top-6 right-6 w-12 h-12 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center text-gray-800 hover:text-black transition-all duration-200 shadow-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Info bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent p-8">
                <div className="flex justify-between items-center text-white">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{partnershipName}</h3>
                    <p className="text-gray-300">These brave students returned to education after surviving the 2022 terrorist attack</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-medium">{enlargedImageIndex + 1} of {images.length}</p>
                    <p className="text-gray-300 text-sm">Use arrow keys or click arrows to navigate</p>
                  </div>
                </div>

                {/* Thumbnail navigation */}
                <div className="flex justify-center space-x-2 mt-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setEnlargedImageIndex(index)}
                      className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 ${index === enlargedImageIndex
                        ? 'border-white scale-110'
                        : 'border-gray-500 hover:border-gray-300 opacity-70 hover:opacity-100'
                        }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard navigation */}
      {isEnlarged && (
        <div
          className="fixed inset-0 pointer-events-none"
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') prevEnlargedImage();
            if (e.key === 'ArrowRight') nextEnlargedImage();
            if (e.key === 'Escape') closeEnlarged();
          }}
          tabIndex={0}
        />
      )}
    </div>
  );
};

const AboutUs = () => {
  const [activeTab, setActiveTab] = useState('mentors');
  const [fellowshipInfo, setFellowshipInfo] = useState({
    title: 'WatanHub Fellowship Program',
    description: 'Join our comprehensive fellowship program designed to empower Afghan youth through mentorship, education, and community engagement.',
    start_date: '2024-09-01',
    application_deadline: '2024-08-15',
    program_duration: '12 months',
    benefits: [
      'One-on-one mentorship with industry professionals',
      'College application guidance and support',
      'Leadership development workshops',
      'Cultural preservation activities',
      'Networking opportunities with Afghan professionals',
      'Scholarship and funding assistance'
    ]
  });

  useEffect(() => {
    fetchFellowshipInfo();
  }, []);

  const fetchFellowshipInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('fellowship_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.log('Fellowship settings table not found, using defaults:', error.message);
        // Use fallback values when table doesn't exist
        setFellowshipInfo({
          start_date: 'January 2025',
          description: 'Our comprehensive fellowship program is designed to empower Afghan students with the skills, knowledge, and connections needed to succeed in their academic and professional journeys.',
          program_highlights: ['Personalized mentorship', 'College application guidance', 'Professional development', 'Cultural preservation activities', 'Networking opportunities', 'Scholarship support'],
          who_can_apply: ['Afghan students worldwide', 'Committed to academic excellence', 'Passionate about community impact', 'Ready for transformation', 'Age 16-25', 'Strong English proficiency'],
          application_deadline: 'Applications are currently closed. Please check back soon or fill out our waitlist form.',
          application_status: 'locked',
          application_link: ''
        });
        return;
      }

      if (data) {
        // Ensure we have default values if arrays are empty
        const processedData = {
          ...data,
          program_highlights: (data.program_highlights && data.program_highlights.length > 0)
            ? data.program_highlights
            : ['Personalized mentorship', 'College application guidance', 'Professional development', 'Cultural preservation activities', 'Networking opportunities', 'Scholarship support'],
          who_can_apply: (data.who_can_apply && data.who_can_apply.length > 0)
            ? data.who_can_apply
            : ['Afghan students worldwide', 'Committed to academic excellence', 'Passionate about community impact', 'Ready for transformation', 'Age 16-25', 'Strong English proficiency'],
          application_status: data.application_status || 'locked',
          application_link: data.application_link || ''
        };
        setFellowshipInfo(processedData);
      } else {
        // Default fallback values
        setFellowshipInfo({
          start_date: 'January 2025',
          description: 'Our comprehensive fellowship program is designed to empower Afghan students with the skills, knowledge, and connections needed to succeed in their academic and professional journeys.',
          program_highlights: ['Personalized mentorship', 'College application guidance', 'Professional development', 'Cultural preservation activities', 'Networking opportunities', 'Scholarship support'],
          who_can_apply: ['Afghan students worldwide', 'Committed to academic excellence', 'Passionate about community impact', 'Ready for transformation', 'Age 16-25', 'Strong English proficiency'],
          application_deadline: 'Applications are currently closed. Please check back soon or fill out our waitlist form.',
          application_status: 'locked',
          application_link: ''
        });
      }
    } catch (error) {
      console.log('Using default fellowship info due to error:', error.message);
      // Use fallback values
      setFellowshipInfo({
        start_date: 'January 2025',
        description: 'Our comprehensive fellowship program is designed to empower Afghan students with the skills, knowledge, and connections needed to succeed in their academic and professional journeys.',
        program_highlights: ['Personalized mentorship', 'College application guidance', 'Professional development', 'Cultural preservation activities', 'Networking opportunities', 'Scholarship support'],
        who_can_apply: ['Afghan students worldwide', 'Committed to academic excellence', 'Passionate about community impact', 'Ready for transformation', 'Age 16-25', 'Strong English proficiency'],
        application_deadline: 'Applications are currently closed. Please check back soon or fill out our waitlist form.',
        application_status: 'locked',
        application_link: ''
      });
    }
  };

  const tabs = [
    { id: 'mentors', label: 'About Us', icon: Heart },
    { id: 'mission', label: 'What We Do', icon: Users },
    { id: 'fellowship', label: 'Fellowship', icon: GraduationCap },
    { id: 'impact', label: 'Our Impact', icon: Target },
    { id: 'team', label: 'Meet Us', icon: Star }
  ];

  const missionItems = [
    {
      title: 'Educational Mentorship',
      description: 'Our biggest mission is mentoring Afghan girls and helping them apply to colleges in the United States, opening doors to bright futures.',
      icon: GraduationCap,
      color: 'from-green-400 to-emerald-600',
      details: ['College counseling', 'Application support', 'Scholarship guidance', 'Career planning'],
      partnerships: [
        {
          name: 'Kaaj School Partnership',
          description: 'In March 2023, we partnered with Kaaj School to organize a transformative book reading contest that promoted literacy and educational excellence among students. These brave girls were targets of a terrorist attack in 2022 but courageously returned to continue their education.',
          impact: 'Engaged 150+ students in reading initiatives',
          images: ['/kaajpartnership/IMG_2608.jpg', '/kaajpartnership/IMG_2606 (1).PNG', '/kaajpartnership/IMG_2607.PNG'],
          articleLink: 'https://www.aljazeera.com/news/2022/10/1/kabul-attack-death-toll-rises-to-35-mostly-girls-young-women',
          articleTitle: 'Kabul attack: Death toll rises to 35 mostly girls, young women - Al Jazeera'
        }
      ]
    },
    {
      title: 'Humanitarian Support',
      description: 'We raise funds and provide support to help those in need in Kabul and across Afghanistan, making real impact in communities.',
      icon: Heart,
      color: 'from-pink-400 to-red-600',
      details: ['Emergency relief', 'Educational supplies', 'Healthcare support', 'Community development']
    },
    {
      title: 'Cultural Preservation',
      description: 'We organize cultural and social events to preserve and celebrate Afghan heritage and values, ensuring our rich traditions continue to flourish.',
      icon: Globe,
      color: 'from-blue-400 to-indigo-600',
      details: ['Traditional festivals', 'Cultural workshops', 'Heritage documentation', 'Language preservation']
    }
  ];

  const impactStats = [
    { number: '2', label: 'Mentorship Cohorts Held', icon: Users },
    { number: '100+', label: 'College Applications Helped', icon: GraduationCap },
    { number: '10+', label: 'Cultural Events', icon: Globe },
    { number: '25+', label: 'Active Mentors', icon: Award }
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
        {/* Enhanced Tab Navigation - Moved Higher */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 mb-16">
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
            {activeTab === 'mentors' && (
              <motion.div
                key="mentors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5 }}
                className="space-y-12"
              >
                <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-gray-200 shadow-lg text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-24 h-24 mx-auto bg-blue-600 rounded-full flex items-center justify-center mb-6"
                  >
                    <Heart className="h-12 w-12 text-white" />
                  </motion.div>

                  <h2 className="text-4xl font-bold mb-6 text-slate-800">
                    Our Mentors
                  </h2>

                  <div className="bg-blue-50 rounded-2xl p-6 mb-8">
                    <h3 className="text-2xl font-bold text-blue-800 mb-3 italic">
                      "Her Future, My Mission"
                    </h3>
                    <p className="text-blue-700 font-medium">Our Mentor Motto</p>
                  </div>

                  <div className="max-w-4xl mx-auto space-y-6 text-lg text-slate-600 leading-relaxed">
                    <p>
                      We are a dedicated community of Afghan professionals and educators committed to empowering the next generation of Afghan women through mentorship, education, and cultural preservation.
                    </p>
                    <p>
                      Our mentors work tirelessly to guide Afghan girls through their college application journey, helping them navigate the complex process of applying to universities in the United States while preserving their cultural identity and values.
                    </p>
                    <p>
                      Beyond education, we organize cultural events, provide humanitarian support, and create a strong network of support for Afghan youth worldwide.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mt-12">
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-bold text-slate-800 mb-2">Academic Guidance</h4>
                      <p className="text-sm text-slate-600">Personalized college counseling and application support</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-bold text-slate-800 mb-2">Career Mentorship</h4>
                      <p className="text-sm text-slate-600">Professional development and career planning guidance</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Heart className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-bold text-slate-800 mb-2">Personal Support</h4>
                      <p className="text-sm text-slate-600">Emotional support and cultural connection</p>
                    </div>
                  </div>
                </div>
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
                          We started from helping the Afghan community in Sacramento to helping Afghan girls learn,
                          then supporting them to study abroad, and now teaching them monetizable skills by partnering
                          with different NGOs and nonprofits.
                        </p>
                        <p>
                          Our journey reflects our commitment to adapting and growing with our community's needs.
                          Through strategic partnerships and innovative programs, we continue expanding our impact
                          to empower Afghan youth worldwide with practical skills and opportunities.
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
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold text-slate-800 mb-4">What We Do</h2>
                  <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                    Empowering Afghan youth through strategic partnerships, mentorship, and community impact
                  </p>
                </div>

                {/* Strategic Layout: Educational Mentorship First with Prominent Partnership Display */}
                <div className="space-y-16">
                  {missionItems.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 }}
                      className={`${index === 0 ? 'bg-gradient-to-br from-blue-50 via-white to-green-50' : 'bg-white'} rounded-3xl p-8 lg:p-12 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300`}
                    >
                      {/* Header Section */}
                      <div className="flex flex-col lg:flex-row gap-8 items-start">
                        <div className="lg:w-2/3">
                          <div className="flex items-center space-x-4 mb-6">
                            <div className={`w-16 h-16 rounded-2xl ${index === 0 ? 'bg-blue-600' : index === 1 ? 'bg-red-500' : 'bg-green-600'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <item.icon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <h3 className="text-2xl lg:text-3xl font-bold text-slate-800">{item.title}</h3>
                              {index === 0 && (
                                <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mt-2">
                                  🎯 Our Primary Focus
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-lg text-slate-600 leading-relaxed mb-6">{item.description}</p>

                          {/* Key Details */}
                          <div className="grid grid-cols-2 gap-4 mb-8">
                            {item.details.map((detail, idx) => (
                              <div key={idx} className="flex items-center text-sm text-slate-600">
                                <ArrowRight className={`h-4 w-4 mr-2 ${index === 0 ? 'text-blue-600' : index === 1 ? 'text-red-500' : 'text-green-600'}`} />
                                {detail}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Visual Impact Stats for First Item */}
                        {index === 0 && (
                          <div className="lg:w-1/3">
                            <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-sm">
                              <h4 className="text-lg font-bold text-slate-800 mb-4 text-center">Our Impact</h4>
                              <div className="space-y-4">
                                <div className="text-center">
                                  <div className="text-3xl font-bold text-blue-600">150+</div>
                                  <div className="text-sm text-slate-600">Students Mentored</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-3xl font-bold text-green-600">25+</div>
                                  <div className="text-sm text-slate-600">Active Mentors</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-3xl font-bold text-purple-600">5+</div>
                                  <div className="text-sm text-slate-600">Partner Organizations</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Partnership Section - Prominently Featured */}
                      {item.partnerships && (
                        <div className="mt-12 border-t border-gray-200 pt-8">
                          <div className="flex items-center mb-8">
                            <Users className="h-6 w-6 text-blue-600 mr-3" />
                            <h4 className="text-2xl font-bold text-slate-800">Strategic Partnerships</h4>
                            <div className="ml-auto">
                              <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                                ✅ Active Partnership
                              </span>
                            </div>
                          </div>

                          {item.partnerships.map((partnership, pIdx) => (
                            <div key={pIdx} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 mb-6 border border-gray-200">
                              <div className="lg:flex lg:gap-8 lg:items-start">
                                {/* Partnership Content */}
                                <div className="lg:w-2/3 mb-6 lg:mb-0">
                                  <div className="flex items-center justify-between mb-4">
                                    <h5 className="text-xl font-bold text-slate-800">{partnership.name}</h5>
                                    <div className="flex items-center text-green-600 text-sm font-medium">
                                      <Award className="h-4 w-4 mr-1" />
                                      {partnership.impact}
                                    </div>
                                  </div>

                                  <p className="text-slate-600 leading-relaxed mb-4">{partnership.description}</p>

                                  {partnership.articleLink && (
                                    <a
                                      href={partnership.articleLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-blue-600 hover:text-blue-800 underline font-medium"
                                    >
                                      <BookOpen className="h-4 w-4 mr-2" />
                                      Read the full story →
                                    </a>
                                  )}
                                </div>

                                {/* Partnership Images - More Prominent */}
                                <div className="lg:w-1/3">
                                  {partnership.images && (
                                    <div className="bg-white rounded-xl p-4 shadow-sm">
                                      <PartnershipImageCarousel images={partnership.images} partnershipName={partnership.name} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Call to Action */}
                <div className="text-center bg-gradient-to-r from-blue-600 to-green-600 rounded-3xl p-8 text-white">
                  <h3 className="text-2xl font-bold mb-4">Ready to Join Our Mission?</h3>
                  <p className="text-blue-100 mb-6">
                    Be part of our growing network of partners, mentors, and change-makers
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                      Partner With Us
                    </button>
                    <button className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-400 transition-colors">
                      Get Involved
                    </button>
                  </div>
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
                          {fellowshipInfo.program_highlights?.map((item, idx) => (
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
                          {fellowshipInfo.who_can_apply?.map((item, idx) => (
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
                        onClick={() => {
                          if (fellowshipInfo.application_status === 'unlocked' && fellowshipInfo.application_link) {
                            window.open(fellowshipInfo.application_link, '_blank');
                          }
                        }}
                        disabled={fellowshipInfo.application_status === 'locked' || !fellowshipInfo.application_link}
                        className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 flex items-center space-x-2 mx-auto shadow-lg ${fellowshipInfo.application_status === 'unlocked' && fellowshipInfo.application_link
                          ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        {fellowshipInfo.application_status === 'locked' ? (
                          <>
                            <span>🔒</span>
                            <span>Applications are closed right now - please check back or fill out our waitlist form</span>
                          </>
                        ) : fellowshipInfo.application_link ? (
                          <>
                            <span>Apply Now</span>
                            <ArrowRight className="h-5 w-5" />
                          </>
                        ) : (
                          <>
                            <span>⚙️</span>
                            <span>Application Link Not Set</span>
                          </>
                        )}
                      </motion.button>

                      {fellowshipInfo.application_status === 'unlocked' && fellowshipInfo.application_link && (
                        <p className="text-sm text-slate-500 mt-3">
                          Applications are now open! Click to apply via Google Forms.
                        </p>
                      )}

                      {fellowshipInfo.application_status === 'locked' && (
                        <p className="text-sm text-slate-500 mt-3">
                          {fellowshipInfo.application_deadline || 'Applications are currently closed. Please check back soon or fill out our waitlist form.'}
                        </p>
                      )}
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

export default AboutUs;