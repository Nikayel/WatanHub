import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Heart, Target, Globe, ArrowRight, BookOpen, GraduationCap, Award, Star, Briefcase, ChevronDown, Mail, Instagram } from 'lucide-react';

const TypewriterText = ({ text, className, delay = 0 }) => {
    const [displayText, setDisplayText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const startTimeout = setTimeout(() => {
            if (currentIndex < text.length) {
                const timeout = setTimeout(() => {
                    setDisplayText(text.slice(0, currentIndex + 1));
                    setCurrentIndex(currentIndex + 1);
                }, 10);
                return () => clearTimeout(timeout);
            }
        }, delay);

        return () => clearTimeout(startTimeout);
    }, [currentIndex, text, delay]);

    return (
        <span className={className}>
            {displayText}
            {currentIndex < text.length && <span className="animate-pulse">|</span>}
        </span>
    );
};

const GetInvolvedWYG = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-green-50/20 relative overflow-hidden">
            {/* Subtle background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/3 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 pb-24 sm:pb-16">

                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center mb-20"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="w-24 h-24 mx-auto mb-8 backdrop-blur-lg bg-white/20 rounded-2xl border border-white/30 shadow-xl flex items-center justify-center"
                    >
                        <img
                            src="/web-app-manifest-192x192.png"
                            alt="WatanHub Logo"
                            className="h-12 w-12"
                        />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-slate-800 mb-6 leading-tight px-4"
                    >
                        Join Us & Be Part of <br className="hidden sm:block" />
                        <span className="font-semibold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                            <TypewriterText text="Something Bigger" delay={200} />
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light px-4"
                    >
                        Connect with the global Afghan community through <span className="font-medium text-emerald-700">Watan Youth Group</span> -
                        a platform for growth, mentorship, and meaningful impact.
                    </motion.p>

                    {/* Scroll Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 3, duration: 0.6 }}
                        className="mt-12 flex flex-col items-center"
                    >
                        <span className="text-emerald-600 text-sm font-medium mb-3">Scroll down to apply</span>
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-6 h-10 border-2 border-emerald-400 rounded-full flex justify-center"
                        >
                            <motion.div
                                animate={{ y: [0, 12, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-1 h-3 bg-emerald-400 rounded-full mt-2"
                            ></motion.div>
                        </motion.div>
                        <ChevronDown className="h-5 w-5 text-emerald-500 mt-2 animate-bounce" />
                    </motion.div>
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-12 mb-20">

                    {/* Left Column - What We Offer */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="backdrop-blur-xl bg-white/40 rounded-3xl border border-white/50 shadow-xl p-8">
                            <h2 className="text-3xl font-light text-slate-800 mb-8">What We Offer</h2>

                            <div className="space-y-6">
                                {[
                                    {
                                        icon: GraduationCap,
                                        title: 'Academic Excellence',
                                        description: 'Personalized guidance through college applications and academic planning',
                                        color: 'emerald'
                                    },
                                    {
                                        icon: Briefcase,
                                        title: 'Career Development',
                                        description: 'Professional mentorship and industry connections for your future',
                                        color: 'green'
                                    },
                                    {
                                        icon: Heart,
                                        title: 'Cultural Connection',
                                        description: 'Preserve heritage while building bridges across communities',
                                        color: 'red'
                                    },
                                    {
                                        icon: Globe,
                                        title: 'Global Network',
                                        description: 'Connect with Afghan professionals and students worldwide',
                                        color: 'emerald'
                                    }
                                ].map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1 + index * 0.1, duration: 0.6 }}
                                        className="group flex items-start space-x-4 p-4 rounded-2xl hover:bg-white/30 transition-all duration-300"
                                    >
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${item.color}-500/20 to-${item.color}-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                            <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-slate-800 mb-2">{item.title}</h3>
                                            <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column - Requirements & Stats */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="space-y-8"
                    >
                        {/* Requirements */}
                        <div className="backdrop-blur-xl bg-white/40 rounded-3xl border border-white/50 shadow-xl p-8">
                            <h2 className="text-3xl font-light text-slate-800 mb-8">Application Details</h2>

                            <div className="space-y-6">
                                <div className="flex items-center space-x-3 text-slate-700">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    <span>Ages 15-28, passionate about community impact</span>
                                </div>
                                <div className="flex items-center space-x-3 text-slate-700">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Multilingual support: English, Dari, Pashto</span>
                                </div>
                                <div className="flex items-center space-x-3 text-slate-700">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span>Commitment to personal and community growth</span>
                                </div>
                            </div>
                        </div>

                        {/* Impact Stats */}
                        <div className="backdrop-blur-xl bg-white/40 rounded-3xl border border-white/50 shadow-xl p-8">
                            <h3 className="text-2xl font-light text-slate-800 mb-6">Community Impact</h3>

                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { number: '150+', label: 'College Applications', color: 'emerald' },
                                    { number: '15+', label: 'Community Leaders', color: 'green' },
                                    { number: '25+', label: 'Career Mentors', color: 'red' },
                                    { number: '∞', label: 'Investment in Your Future', color: 'emerald' }
                                ].map((stat, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 1.2 + index * 0.1, duration: 0.6 }}
                                        className="text-center p-4 rounded-xl hover:bg-white/30 transition-all duration-300"
                                    >
                                        <div className={`text-2xl font-semibold text-${stat.color}-600 mb-1`}>{stat.number}</div>
                                        <div className="text-sm text-slate-600">{stat.label}</div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Application Process */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4, duration: 0.8 }}
                    className="backdrop-blur-xl bg-white/40 rounded-3xl border border-white/50 shadow-xl p-8 mb-16"
                >
                    <h2 className="text-3xl font-light text-slate-800 text-center mb-12">Simple Application Process</h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '01',
                                title: 'Complete Form',
                                description: 'Fill out our comprehensive application form with your background and aspirations'
                            },
                            {
                                step: '02',
                                title: 'Review Process',
                                description: 'Our team carefully reviews your application and matches you with suitable mentors'
                            },
                            {
                                step: '03',
                                title: 'Welcome Aboard',
                                description: 'Join our community and begin your journey of growth and meaningful connections'
                            }
                        ].map((process, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.6 + index * 0.2, duration: 0.6 }}
                                className="text-center group"
                            >
                                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-xl font-semibold text-emerald-600">{process.step}</span>
                                </div>
                                <h3 className="text-xl font-medium text-slate-800 mb-3">{process.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{process.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA Section - Enhanced for Mobile */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8, duration: 0.8 }}
                    className="text-center relative"
                >
                    {/* Main CTA Button - Enhanced for mobile */}
                    <motion.a
                        href="https://docs.google.com/forms/d/e/1FAIpQLSfJ32GfxZeBkEOsyPs9tnFleZTeGVLBCUx75M8-LAReFcDyLw/viewform?usp=sf_link"
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center space-x-4 backdrop-blur-xl bg-gradient-to-r from-emerald-500/90 to-green-600/90 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20 w-full sm:w-auto justify-center"
                    >
                        <img
                            src="/web-app-manifest-192x192.png"
                            alt="WatanHub Logo"
                            className="h-6 w-6 sm:h-7 sm:w-7"
                        />
                        <span className="text-center">Apply to Watan Youth Group</span>
                        <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
                    </motion.a>

                    {/* Mobile Quick Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.2, duration: 0.6 }}
                        className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto sm:hidden"
                    >
                        <a
                            href="mailto:watan8681@gmail.com"
                            className="flex items-center justify-center space-x-2 bg-white/80 backdrop-blur-sm text-emerald-700 px-4 py-3 rounded-xl font-medium shadow-lg border border-emerald-200 hover:bg-emerald-50 transition-all duration-300"
                        >
                            <Mail className="h-4 w-4" />
                            <span>Email Us</span>
                        </a>
                        <a
                            href="https://www.instagram.com/watan.youth.group"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center space-x-2 bg-white/80 backdrop-blur-sm text-emerald-700 px-4 py-3 rounded-xl font-medium shadow-lg border border-emerald-200 hover:bg-emerald-50 transition-all duration-300"
                        >
                            <Instagram className="h-4 w-4" />
                            <span>Instagram</span>
                        </a>
                    </motion.div>

                    {/* Contact fallback information */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2, duration: 0.6 }}
                        className="mt-6 text-center"
                    >
                        <p className="text-slate-600 text-sm sm:text-base mb-2 px-4">
                            🇦🇫 Empowering Afghan youth worldwide through education, mentorship, and community
                        </p>
                        <p className="text-slate-500 text-xs sm:text-sm px-4">
                            Having trouble with the form? Email us at{" "}
                            <a href="mailto:watan8681@gmail.com" className="text-emerald-600 hover:text-emerald-700 underline font-medium">
                                watan8681@gmail.com
                            </a>{" "}
                            or{" "}
                            <a href="mailto:watanyouthgp@gmail.com" className="text-emerald-600 hover:text-emerald-700 underline font-medium">
                                watanyouthgp@gmail.com
                            </a>
                        </p>
                    </motion.div>
                </motion.div>

                {/* Sticky Mobile CTA Bar - Only shows on mobile */}
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 3, duration: 0.8 }}
                    className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-500 to-green-600 p-4 shadow-2xl border-t-4 border-yellow-400"
                >
                    <div className="flex items-center justify-between">
                        <div className="text-white">
                            <p className="font-bold text-sm">Ready to Join?</p>
                            <p className="text-xs text-green-100">Tap to apply now!</p>
                        </div>
                        <motion.a
                            href="https://docs.google.com/forms/d/e/1FAIpQLSfJ32GfxZeBkEOsyPs9tnFleZTeGVLBCUx75M8-LAReFcDyLw/viewform?usp=sf_link"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileTap={{ scale: 0.95 }}
                            className="bg-white text-emerald-600 px-6 py-3 rounded-full font-bold text-sm shadow-lg flex items-center space-x-2 active:bg-gray-100 transition-all duration-200"
                        >
                            <span>Apply Now</span>
                            <ArrowRight className="h-4 w-4" />
                        </motion.a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default GetInvolvedWYG; 