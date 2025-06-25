import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Globe, Heart, GraduationCap, Briefcase, Users, Target,
    ArrowRight, Calendar, Sparkles, Star, Award, Zap, Home,
    Building, Lightbulb, Laptop, BookOpen, School
} from 'lucide-react';

const OurVisionPage = () => {
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Hero Section with OurVision.png Background */}
            <div className="relative min-h-screen flex items-center justify-center">
                {/* Background Image with Overlays */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(15, 23, 42, 0.7)), url('/OurVision.png')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundAttachment: isMobile ? 'scroll' : 'fixed'
                    }}
                ></div>

                {/* Additional Gradient Overlay for Afghan Theme */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/70 via-green-900/60 to-slate-900/80"></div>



                {/* Go Back Home Button */}
                <Link to="/">
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="absolute top-8 left-8 z-20 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-medium hover:bg-white/30 transition-all duration-300 border border-white/30 flex items-center space-x-2"
                    >
                        <Home className="h-5 w-5" />
                        <span>Back to Home</span>
                    </motion.button>
                </Link>

                {/* Hero Content */}
                <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        {/* Afghan Flag Emoji and Title */}
                        <div className="space-y-4">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                                className="text-6xl sm:text-7xl"
                            >
                                🇦🇫
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="text-4xl sm:text-6xl lg:text-8xl font-bold leading-tight"
                            >
                                <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-cyan-400 bg-clip-text text-transparent">
                                    Our Vision
                                </span>
                                <br />
                                <span className="text-white">for 2030+</span>
                            </motion.h1>
                        </div>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.6 }}
                            className="text-xl sm:text-2xl lg:text-3xl text-emerald-100 max-w-5xl mx-auto leading-relaxed font-light"
                        >
                            The change we all deserve
                        </motion.p>

                        {/* Scroll Indicator */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2, duration: 0.6 }}
                            className="mt-16"
                        >
                            <div className="flex flex-col items-center space-y-3">
                                <span className="text-emerald-200 text-sm font-medium">Discover Our Journey</span>
                                <motion.div
                                    animate={{ y: [0, 10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-6 h-10 border-2 border-emerald-300 rounded-full flex justify-center"
                                >
                                    <motion.div
                                        animate={{ y: [0, 12, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="w-1 h-3 bg-emerald-300 rounded-full mt-2"
                                    ></motion.div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Vision Pillars Section */}
            <div className="bg-white py-16 sm:py-24 lg:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-16 lg:mb-24"
                    >
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 mb-6">
                            Six Pillars of Change
                        </h2>
                        <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
                            Our strategic roadmap to transform the global Afghan community through innovation, education, and unity
                        </p>
                    </motion.div>

                    {/* Vision Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {[
                            {
                                icon: Users,
                                title: 'Second Fellowship Cohort 🎓',
                                description: 'Hold our second cohort of fellowship teaching mentizeable skills to Afghan girls, expanding our impact and reach.',
                                timeline: '2026',
                                color: 'from-emerald-500 to-green-500',
                                delay: 0.1
                            },
                            {
                                icon: Award,
                                title: 'Certification & Credibility 📜',
                                description: 'Making our program certified, building credibility and creating recognized opportunities for our participants.',
                                timeline: '2028',
                                color: 'from-green-500 to-cyan-500',
                                delay: 0.2
                            },
                            {
                                icon: Globe,
                                title: 'Nationwide Expansion 🌍',
                                description: 'Expanding access and trust from Kabul to all cities by partnering with the Ministry of Education in Afghanistan.',
                                timeline: '2028',
                                color: 'from-cyan-500 to-blue-500',
                                delay: 0.3
                            },
                            {
                                icon: Laptop,
                                title: 'Hybrid Learning Centers 💻',
                                description: 'Launch blended learning centers in communities where online access is limited, combining mentorship with digital curriculum.',
                                timeline: '2030',
                                color: 'from-blue-500 to-indigo-500',
                                delay: 0.4
                            },
                            {
                                icon: Lightbulb,
                                title: 'Local Pilots & Innovation 🚀',
                                description: 'WatanHub will be piloted with local educators and NGOs, creating proof-of-concept for broader adoption.',
                                timeline: '2030',
                                color: 'from-indigo-500 to-purple-500',
                                delay: 0.5
                            },
                            {
                                icon: School,
                                title: 'Physical School & Technology 🏫',
                                description: 'Helping Afghan education ministry adopt real-world skills, technology, and establishing our own standalone physical school.',
                                timeline: '2030+',
                                color: 'from-purple-500 to-emerald-500',
                                delay: 0.6
                            }
                        ].map((vision, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: vision.delay, duration: 0.6 }}
                                viewport={{ once: true }}
                                className="group"
                            >
                                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
                                    {/* Icon */}
                                    <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${vision.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                        <vision.icon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">{vision.title}</h3>
                                        <p className="text-slate-600 leading-relaxed mb-6 text-sm sm:text-base">{vision.description}</p>
                                    </div>

                                    {/* Timeline Badge */}
                                    <div className="mt-auto">
                                        <div className="inline-flex items-center space-x-2 bg-gray-50 rounded-full px-4 py-2">
                                            <Calendar className="h-4 w-4 text-emerald-600" />
                                            <span className="text-xs sm:text-sm font-medium text-slate-700">Target: {vision.timeline}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Impact Timeline Section */}
            <div className="bg-gradient-to-br from-slate-900 via-emerald-900 to-green-900 py-16 sm:py-24 lg:py-32 text-white relative overflow-hidden">
                {/* Futuristic Chess Pattern Background */}
                <div className="absolute inset-0">
                    <div className="h-full w-full opacity-30" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2310b981' fill-opacity='0.6'%3E%3Cpath d='M30 30l30-30v60L30 30zm0 0L0 0v60l30-30z'/%3E%3C/g%3E%3C/svg%3E")`,
                        backgroundSize: '60px 60px'
                    }}></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="text-center mb-16 lg:mb-24"
                    >
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                            🚀 Journey to 2030+
                        </h2>
                        <p className="text-lg sm:text-xl text-emerald-100 max-w-3xl mx-auto">
                            A strategic roadmap to empower Afghan education and build a global impact network
                        </p>
                    </motion.div>

                    {/* Timeline */}
                    <div className="space-y-8 sm:space-y-12">
                        {[
                            { year: '2026', title: '🎓 Second Fellowship', desc: 'Launch our second cohort with enhanced mentorship programs and expanded reach' },
                            { year: '2028', title: '📜 Certification Era', desc: 'Achieve official certification and partner with Afghanistan\'s Ministry of Education nationwide' },
                            { year: '2030', title: '💻 Hybrid Revolution', desc: 'Establish blended learning centers and launch innovative pilot programs with local NGOs' },
                            { year: '2030+', title: '🏫 Physical Impact', desc: 'Open our standalone school and integrate technology-driven real-world skills into Afghan education' }
                        ].map((milestone, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.2, duration: 0.8 }}
                                viewport={{ once: true }}
                                className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8"
                            >
                                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center font-bold text-sm sm:text-base shadow-2xl">
                                    {milestone.year}
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <h4 className="text-xl sm:text-2xl font-bold text-white mb-2">{milestone.title}</h4>
                                    <p className="text-emerald-100 text-sm sm:text-base">{milestone.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Call to Action Section */}
            <div className="bg-white py-16 sm:py-24 lg:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800">
                            Join Us in Building This Vision
                        </h2>
                        <p className="text-lg sm:text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
                            Together, we can create a future where every Afghan youth has the opportunity to thrive,
                            contribute, and preserve their heritage while building bridges across cultures.
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
                            <Link to="/get-involved">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 sm:px-12 py-4 rounded-2xl font-bold text-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-xl flex items-center justify-center space-x-2"
                                >
                                    <span>Get Involved Today</span>
                                    <ArrowRight className="h-5 w-5" />
                                </motion.button>
                            </Link>

                            <Link to="/mentors">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full sm:w-auto bg-white text-emerald-600 px-8 sm:px-12 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 border-2 border-emerald-600 flex items-center justify-center space-x-2"
                                >
                                    <span>Learn More</span>
                                    <Sparkles className="h-5 w-5" />
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default OurVisionPage; 