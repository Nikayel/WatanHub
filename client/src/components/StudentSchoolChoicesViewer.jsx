import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { geminiService } from '../services/ApiService';
import {
    School, GraduationCap, Building, ChevronDown, ChevronUp,
    CheckCircle, XCircle, ArrowRight, Clock, AlertCircle,
    Globe, Loader, Info, HelpCircle, MessageSquare, X, ChevronLeft, ChevronRight,
    FileText, Edit, Users
} from 'lucide-react';
import { toast } from 'sonner';

// Translations for Farsi support
const translations = {
    en: {
        targetSchools: 'Target Schools',
        safetySchools: 'Safety Schools',
        stretchSchool: 'Stretch School',
        schools: 'schools',
        school: 'school',
        noSchoolChoices: "This student hasn't added any school choices yet.",
        getFeedback: 'Get AI Feedback on School Choices',
        generatingFeedback: 'Generating Feedback...',
        aiFeedback: 'AI Feedback',
        notes: 'Notes:',
        updated: 'Updated:',
        language: 'فارسی',
        changeTo: 'Switch to Farsi',
        tutorial: 'School Choice Guide',
        tutorialDesc: 'Learn about the different types of school choices',
        closeChat: 'Close Chat',
        chatTitle: 'AI School Advisor',
        chatPlaceholder: 'Choose a topic below...',
        chatButton: 'Get Insights',
        chatIntro: 'Hello! I can provide insights about colleges or universities you\'re interested in. Please select one of the topics below.',
        aiTyping: 'AI is thinking...',
        hidePanel: 'Hide Guide',
        showPanel: 'Show Guide',
        aiGuide: 'AI College Guide',
        welcomeToGuide: 'Welcome to your personal AI college application assistant! I can help you understand school choices, application strategies, and more.'
    },
    fa: {
        targetSchools: 'دانشگاه‌های هدف',
        safetySchools: 'دانشگاه‌های امن',
        stretchSchool: 'دانشگاه آرزویی',
        schools: 'دانشگاه‌ها',
        school: 'دانشگاه',
        noSchoolChoices: 'این دانش‌آموز هنوز دانشگاهی انتخاب نکرده است.',
        getFeedback: 'دریافت بازخورد هوش مصنوعی',
        generatingFeedback: 'در حال تولید بازخورد...',
        aiFeedback: 'بازخورد هوش مصنوعی',
        notes: 'یادداشت‌ها:',
        updated: 'بروزرسانی:',
        language: 'English/دری',
        changeTo: 'تغییر به انگلیسی/دری',
        tutorial: 'راهنمای انتخاب دانشگاه',
        tutorialDesc: 'درباره انواع مختلف انتخاب‌های دانشگاه بیاموزید',
        closeChat: 'بستن گفتگو',
        chatTitle: 'مشاور هوش مصنوعی دانشگاه',
        chatPlaceholder: 'موضوعی را انتخاب کنید...',
        chatButton: 'دریافت اطلاعات',
        chatIntro: 'سلام! من می‌توانم اطلاعاتی درباره کالج‌ها یا دانشگاه‌هایی که به آنها علاقه دارید ارائه دهم. لطفاً یکی از موضوعات زیر را انتخاب کنید.',
        aiTyping: 'هوش مصنوعی در حال تایپ...',
        hidePanel: 'پنهان کردن راهنما',
        showPanel: 'نمایش راهنما',
        aiGuide: 'راهنمای هوش مصنوعی کالج',
        welcomeToGuide: 'به دستیار شخصی درخواست کالج هوش مصنوعی خود خوش آمدید! من می‌توانم به شما در درک انتخاب‌های مدرسه، استراتژی‌های درخواست و موارد دیگر کمک کنم.'
    },
    dr: {
        targetSchools: 'پوهنتون‌های هدف',
        safetySchools: 'پوهنتون‌های مطمئن',
        stretchSchool: 'پوهنتون آرزویی',
        schools: 'پوهنتون‌ها',
        school: 'پوهنتون',
        noSchoolChoices: 'این شاگرد هنوز پوهنتونی انتخاب نکرده است.',
        getFeedback: 'دریافت نظر هوش مصنوعی',
        generatingFeedback: 'در حال تولید نظر...',
        aiFeedback: 'نظر هوش مصنوعی',
        notes: 'یادداشت‌ها:',
        updated: 'تجدید:',
        language: 'فارسی/English',
        changeTo: 'تبدیل به فارسی/انگلیسی',
        tutorial: 'رهنمای انتخاب پوهنتون',
        tutorialDesc: 'در مورد انواع مختلف انتخاب‌های پوهنتون بیاموزید',
        closeChat: 'بستن گفتگو',
        chatTitle: 'مشاور هوش مصنوعی پوهنتون',
        chatPlaceholder: 'یک موضوع را انتخاب کنید...',
        chatButton: 'دریافت معلومات',
        chatIntro: 'سلام! من می‌توانم معلوماتی در مورد کالج‌ها یا پوهنتون‌هایی که به آنها علاقه دارید ارائه دهم. لطفاً یکی از موضوعات زیر را انتخاب کنید.',
        aiTyping: 'هوش مصنوعی در حال نوشتن...',
        hidePanel: 'پنهان کردن رهنما',
        showPanel: 'نمایش رهنما',
        aiGuide: 'رهنمای هوش مصنوعی پوهنتون',
        welcomeToGuide: 'به دستیار شخصی درخواست پوهنتون هوش مصنوعی خود خوش آمدید! من می‌توانم به شما در درک انتخاب‌های پوهنتون، استراتژی‌های درخواست و موارد دیگر کمک کنم.'
    }
};

// School choice types with descriptions for tutorial
const PREFERENCE_TYPES = {
    target: {
        name: 'Target Schools',
        nameFa: 'دانشگاه‌های هدف',
        description: 'Schools that match your academic profile where you have a good chance of being accepted (40-70% chance).',
        descriptionFa: 'دانشگاه‌هایی که با پروفایل تحصیلی شما مطابقت دارند و شانس خوبی برای پذیرش در آنها دارید (شانس 40-70 درصد).',
        color: 'bg-green-100 text-green-800 border-green-200',
        iconColor: 'text-green-600',
        icon: Building
    },
    safety: {
        name: 'Safety Schools',
        nameFa: 'دانشگاه‌های امن',
        description: 'Schools where you have a high probability of being accepted based on your academic profile (70-90% chance).',
        descriptionFa: 'دانشگاه‌هایی که بر اساس پروفایل تحصیلی شما احتمال پذیرش بالایی در آنها دارید (شانس 70-90 درصد).',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        iconColor: 'text-blue-600',
        icon: School
    },
    stretch: {
        name: 'Stretch School',
        nameFa: 'دانشگاه آرزویی',
        description: 'Your dream schools that may be challenging to get into based on your profile (less than 30% chance).',
        descriptionFa: 'دانشگاه‌های رویایی شما که ممکن است بر اساس پروفایل شما دشوار باشد (کمتر از 30٪ شانس).',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        iconColor: 'text-purple-600',
        icon: GraduationCap
    }
};

const APPLICATION_STATUS_INFO = {
    planning: {
        label: 'Planning',
        labelFa: 'در حال برنامه‌ریزی',
        color: 'bg-gray-100 text-gray-800',
        icon: Clock
    },
    applied: {
        label: 'Applied',
        labelFa: 'اعمال شده',
        color: 'bg-blue-100 text-blue-800',
        icon: ArrowRight
    },
    accepted: {
        label: 'Accepted',
        labelFa: 'پذیرفته شده',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle
    },
    rejected: {
        label: 'Rejected',
        labelFa: 'رد شده',
        color: 'bg-red-100 text-red-800',
        icon: XCircle
    },
    waitlisted: {
        label: 'Waitlisted',
        labelFa: 'در لیست انتظار',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock
    },
    deferred: {
        label: 'Deferred',
        labelFa: 'به تعویق افتاده',
        color: 'bg-indigo-100 text-indigo-800',
        icon: Clock
    },
    enrolled: {
        label: 'Enrolled',
        labelFa: 'ثبت‌نام شده',
        color: 'bg-emerald-100 text-emerald-800',
        icon: CheckCircle
    }
};

// Define the standard chat topics for guided chat
const chatTopics = {
    en: [
        {
            id: 'school_types',
            title: 'School Types',
            description: 'Learn about target, safety, and stretch schools',
            icon: School
        },
        {
            id: 'application_tips',
            title: 'Application Tips',
            description: 'General advice for college applications',
            icon: FileText
        },
        {
            id: 'school_selection',
            title: 'School Selection',
            description: 'How to choose the right schools for you',
            icon: CheckCircle
        },
        {
            id: 'essays',
            title: 'Essay Writing',
            description: 'Tips for writing compelling essays',
            icon: Edit
        },
        {
            id: 'interviews',
            title: 'Interview Preparation',
            description: 'How to prepare for college interviews',
            icon: Users
        }
    ],
    fa: [
        {
            id: 'school_types',
            title: 'انواع دانشگاه‌ها',
            description: 'آشنایی با دانشگاه‌های هدف، امن و آرزویی',
            icon: School
        },
        {
            id: 'application_tips',
            title: 'نکات درخواست',
            description: 'توصیه‌های کلی برای درخواست‌های دانشگاهی',
            icon: FileText
        },
        {
            id: 'school_selection',
            title: 'انتخاب دانشگاه',
            description: 'چگونگی انتخاب دانشگاه‌های مناسب برای شما',
            icon: CheckCircle
        },
        {
            id: 'essays',
            title: 'نوشتن مقاله',
            description: 'نکاتی برای نوشتن مقالات متقاعدکننده',
            icon: Edit
        },
        {
            id: 'interviews',
            title: 'آمادگی مصاحبه',
            description: 'نحوه آمادگی برای مصاحبه‌های دانشگاهی',
            icon: Users
        }
    ],
    dr: [
        {
            id: 'school_types',
            title: 'انواع پوهنتون‌ها',
            description: 'آشنایی با پوهنتون‌های هدف، مطمئن و آرزویی',
            icon: School
        },
        {
            id: 'application_tips',
            title: 'نکات درخواست',
            description: 'توصیه‌های کلی برای درخواست‌های پوهنتونی',
            icon: FileText
        },
        {
            id: 'school_selection',
            title: 'انتخاب پوهنتون',
            description: 'چگونگی انتخاب پوهنتون‌های مناسب برای شما',
            icon: CheckCircle
        },
        {
            id: 'essays',
            title: 'نوشتن مقاله',
            description: 'نکاتی برای نوشتن مقالات متقاعدکننده',
            icon: Edit
        },
        {
            id: 'interviews',
            title: 'آمادگی مصاحبه',
            description: 'نحوه آمادگی برای مصاحبه‌های پوهنتونی',
            icon: Users
        }
    ]
};

// Add followup questions for each topic
const followupQuestions = {
    en: {
        'school_types': [
            'What GPA do I need for target schools?',
            'How many safety schools should I apply to?',
            'Examples of good stretch schools'
        ],
        'application_tips': [
            'When should I start my applications?',
            'How important are extracurriculars?',
            'Tips for recommendation letters'
        ],
        'school_selection': [
            'Factors to consider in school selection',
            'How to research colleges effectively',
            'Balancing location and program quality'
        ],
        'essays': [
            'Common essay mistakes to avoid',
            'How to choose an essay topic',
            'Tips for personal statement structure'
        ],
        'interviews': [
            'Common interview questions',
            'What to wear to college interviews',
            'How to follow up after interviews'
        ]
    },
    fa: {
        'school_types': [
            'برای دانشگاه‌های هدف به چه معدلی نیاز دارم؟',
            'به چه تعداد دانشگاه امن باید درخواست دهم؟',
            'نمونه‌هایی از دانشگاه‌های آرزویی مناسب'
        ],
        'application_tips': [
            'چه زمانی باید درخواست‌هایم را شروع کنم؟',
            'فعالیت‌های فوق برنامه چقدر اهمیت دارند؟',
            'نکاتی برای توصیه‌نامه‌ها'
        ],
        'school_selection': [
            'عوامل مهم در انتخاب دانشگاه',
            'چگونه درباره دانشگاه‌ها تحقیق کنیم',
            'تعادل بین مکان و کیفیت برنامه'
        ],
        'essays': [
            'اشتباهات رایج مقاله که باید از آنها اجتناب کرد',
            'چگونه یک موضوع مقاله انتخاب کنیم',
            'نکاتی برای ساختار بیانیه شخصی'
        ],
        'interviews': [
            'سوالات رایج مصاحبه',
            'چه لباسی برای مصاحبه‌های دانشگاه بپوشیم',
            'چگونه پس از مصاحبه پیگیری کنیم'
        ]
    },
    dr: {
        'school_types': [
            'برای پوهنتون‌های هدف به چه نمراتی نیاز دارم؟',
            'به چه تعداد پوهنتون مطمئن باید درخواست دهم؟',
            'نمونه‌هایی از پوهنتون‌های آرزویی مناسب'
        ],
        'application_tips': [
            'چه زمانی باید درخواست‌هایم را شروع کنم؟',
            'فعالیت‌های فوق برنامه چقدر مهم هستند؟',
            'نکاتی برای توصیه‌نامه‌ها'
        ],
        'school_selection': [
            'عوامل مهم در انتخاب پوهنتون',
            'چگونه درباره پوهنتون‌ها تحقیق کنیم',
            'تعادل بین مکان و کیفیت برنامه'
        ],
        'essays': [
            'اشتباهات رایج مقاله که باید از آنها پرهیز کرد',
            'چگونه یک موضوع مقاله انتخاب کنیم',
            'نکاتی برای ساختار بیانیه شخصی'
        ],
        'interviews': [
            'سوالات رایج مصاحبه',
            'چه لباسی برای مصاحبه‌های پوهنتون بپوشیم',
            'چگونه پس از مصاحبه پیگیری کنیم'
        ]
    }
};

const StudentSchoolChoicesViewer = ({ studentId, forMentor = true }) => {
    const [schoolChoices, setSchoolChoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState({
        target: true,
        safety: true,
        stretch: true
    });
    const [expandedSchools, setExpandedSchools] = useState({});
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [aiFeedback, setAiFeedback] = useState(null);
    const [schoolSpecificFeedback, setSchoolSpecificFeedback] = useState({});
    const [language, setLanguage] = useState('en');
    const [insightLoading, setInsightLoading] = useState({});

    // New state for tutorial and chat functionality
    const [showTutorial, setShowTutorial] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [tutorialStep, setTutorialStep] = useState(0);
    const chatEndRef = useRef(null);

    // State to track selected followup question
    const [selectedFollowup, setSelectedFollowup] = useState(null);

    // New state for the collapsible right panel
    const [showRightPanel, setShowRightPanel] = useState(true);

    const fetchSchoolChoices = useCallback(async () => {
        if (!studentId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('student_school_choices')
                .select('*')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSchoolChoices(data || []);

            // If there are schools, fetch individual feedback for each
            if (data && data.length > 0 && forMentor) {
                data.forEach(school => {
                    getSchoolSpecificFeedback(school);
                });
            }
        } catch (error) {
            console.error('Error fetching student school choices:', error);
            toast.error('Failed to load school choices');
        } finally {
            setLoading(false);
        }
    }, [studentId, forMentor]);

    useEffect(() => {
        fetchSchoolChoices();
    }, [fetchSchoolChoices]);

    // Scroll to the bottom of chat when messages change
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    // Initialize chat with welcome message and guidance information
    useEffect(() => {
        if (showChat && chatMessages.length === 0) {
            setChatMessages([
                {
                    role: 'ai',
                    content: `${translations[language].chatIntro}\n\nI can help with:\n1. Information about specific colleges or universities\n2. Understanding target, safety, and stretch schools\n3. Application strategies for different types of schools\n4. Evaluating school fit for your profile`
                }
            ]);
        }
    }, [showChat, chatMessages.length, language]);

    // Show the right panel by default for non-mentors (students)
    useEffect(() => {
        if (!forMentor) {
            setShowRightPanel(true);
        }
    }, [forMentor]);

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const toggleSchoolExpansion = (schoolId) => {
        setExpandedSchools(prev => ({
            ...prev,
            [schoolId]: !prev[schoolId]
        }));
    };

    const toggleLanguage = () => {
        setLanguage(prev => {
            if (prev === 'en') return 'fa';
            if (prev === 'fa') return 'dr';
            return 'en';
        });
    };

    const getSchoolSpecificFeedback = async (school) => {
        try {
            // Only fetch if we don't already have feedback for this school
            if (schoolSpecificFeedback[school.id]) return;

            // Set loading state for this specific school
            setInsightLoading(prev => ({ ...prev, [school.id]: true }));

            // Use our API service
            const feedback = await geminiService.getSchoolInsight(school);

            setSchoolSpecificFeedback(prev => ({
                ...prev,
                [school.id]: feedback
            }));
        } catch (error) {
            console.error(`Error getting feedback for ${school.school_name}:`, error);
            toast.error(`Failed to get insights for ${school.school_name}`);
        } finally {
            setInsightLoading(prev => ({ ...prev, [school.id]: false }));
        }
    };

    const getGeminiAIFeedback = async () => {
        if (!schoolChoices.length) return;

        setFeedbackLoading(true);
        try {
            // Use our API service
            const feedback = await geminiService.getSchoolChoicesFeedback(schoolChoices, forMentor);
            setAiFeedback(feedback);
        } catch (error) {
            console.error('Error getting AI feedback:', error);
            setAiFeedback('Unable to generate feedback at this time. Please try again later.');
            toast.error('Failed to generate AI feedback');
        } finally {
            setFeedbackLoading(false);
        }
    };

    const getCategorySchools = (category) => {
        return schoolChoices.filter(school => school.preference_type === category);
    };

    // Count schools by category
    const counts = {
        target: schoolChoices.filter(sc => sc.preference_type === 'target').length,
        safety: schoolChoices.filter(sc => sc.preference_type === 'safety').length,
        stretch: schoolChoices.filter(sc => sc.preference_type === 'stretch').length
    };

    const t = translations[language];

    // Tutorial content
    const renderTutorial = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
                <div className="p-5 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {language === 'en' ? 'School Selection Guide' : 'راهنمای انتخاب دانشگاه'}
                        </h3>
                        <button
                            onClick={() => setShowTutorial(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-5 max-h-[70vh] overflow-y-auto">
                    {tutorialStep === 0 && (
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                {language === 'en'
                                    ? 'When applying to colleges, it\'s important to have a balanced list of schools. Let\'s understand the three types of schools you should consider:'
                                    : 'هنگام درخواست برای دانشگاه‌ها، داشتن لیست متعادلی از دانشگاه‌ها مهم است. بیایید سه نوع دانشگاه را که باید در نظر بگیرید بشناسیم:'}
                            </p>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center mb-2">
                                    <div className="p-2 bg-green-100 rounded-full mr-3">
                                        <Building className="text-green-600 h-5 w-5" />
                                    </div>
                                    <h4 className="font-medium text-green-800">
                                        {language === 'en' ? PREFERENCE_TYPES.target.name : PREFERENCE_TYPES.target.nameFa}
                                    </h4>
                                </div>
                                <p className="text-sm text-green-700 ml-12">
                                    {language === 'en' ? PREFERENCE_TYPES.target.description : PREFERENCE_TYPES.target.descriptionFa}
                                </p>
                            </div>

                            <button
                                onClick={() => setTutorialStep(1)}
                                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            >
                                {language === 'en' ? 'Next: Safety Schools' : 'بعدی: دانشگاه‌های امن'}
                            </button>
                        </div>
                    )}

                    {tutorialStep === 1 && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center mb-2">
                                    <div className="p-2 bg-blue-100 rounded-full mr-3">
                                        <School className="text-blue-600 h-5 w-5" />
                                    </div>
                                    <h4 className="font-medium text-blue-800">
                                        {language === 'en' ? PREFERENCE_TYPES.safety.name : PREFERENCE_TYPES.safety.nameFa}
                                    </h4>
                                </div>
                                <p className="text-sm text-blue-700 ml-12">
                                    {language === 'en' ? PREFERENCE_TYPES.safety.description : PREFERENCE_TYPES.safety.descriptionFa}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTutorialStep(0)}
                                    className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                                >
                                    {language === 'en' ? 'Back' : 'بازگشت'}
                                </button>
                                <button
                                    onClick={() => setTutorialStep(2)}
                                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                >
                                    {language === 'en' ? 'Next: Stretch School' : 'بعدی: دانشگاه آرزویی'}
                                </button>
                            </div>
                        </div>
                    )}

                    {tutorialStep === 2 && (
                        <div className="space-y-4">
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center mb-2">
                                    <div className="p-2 bg-purple-100 rounded-full mr-3">
                                        <GraduationCap className="text-purple-600 h-5 w-5" />
                                    </div>
                                    <h4 className="font-medium text-purple-800">
                                        {language === 'en' ? PREFERENCE_TYPES.stretch.name : PREFERENCE_TYPES.stretch.nameFa}
                                    </h4>
                                </div>
                                <p className="text-sm text-purple-700 ml-12">
                                    {language === 'en' ? PREFERENCE_TYPES.stretch.description : PREFERENCE_TYPES.stretch.descriptionFa}
                                </p>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center">
                                    <AlertCircle className="text-yellow-600 h-5 w-5 mr-2 flex-shrink-0" />
                                    <p className="text-sm text-yellow-700">
                                        {language === 'en'
                                            ? 'A balanced college application list typically includes 4-5 target schools, 2-3 safety schools, and 1-2 stretch schools.'
                                            : 'یک لیست متعادل درخواست دانشگاه معمولاً شامل 4-5 دانشگاه هدف، 2-3 دانشگاه امن و 1-2 دانشگاه آرزویی است.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTutorialStep(1)}
                                    className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                                >
                                    {language === 'en' ? 'Back' : 'بازگشت'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowTutorial(false);
                                        setTutorialStep(0);
                                    }}
                                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                >
                                    {language === 'en' ? 'Got it!' : 'متوجه شدم!'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Chat interface component
    const renderChatInterface = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden flex flex-col h-[80vh]">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center">
                        <div className="p-2 bg-indigo-100 rounded-full mr-2">
                            <MessageSquare className="text-indigo-600 h-5 w-5" />
                        </div>
                        <h3 className="font-medium text-gray-800">
                            {translations[language].chatTitle}
                        </h3>
                    </div>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            console.log("Closing chat interface");
                            setSelectedTopic(null);
                            setSelectedFollowup(null);
                            setShowChat(false);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    <div className="space-y-4">
                        {/* AI welcome message */}
                        <div className="flex justify-start">
                            <div className="max-w-[80%] rounded-lg p-3 bg-white border border-gray-200 text-gray-800">
                                <p>{translations[language].chatIntro}</p>
                            </div>
                        </div>

                        {/* Display chat message history */}
                        {chatMessages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white border border-gray-200 text-gray-800'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}

                        {/* Show AI is thinking indicator */}
                        {isChatLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-[80%] rounded-lg p-3 bg-white border border-gray-200">
                                    <div className="flex items-center">
                                        <Loader className="h-4 w-4 animate-spin mr-2" />
                                        <p className="text-gray-500">{translations[language].aiTyping}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-white">
                    {/* Show topic selection if no topic selected */}
                    {!selectedTopic && (
                        <div className="grid grid-cols-1 gap-2">
                            <p className="text-sm text-gray-500 mb-2">{translations[language].chatPlaceholder}</p>
                            {chatTopics[language].map((topic) => (
                                <button
                                    key={topic.id}
                                    onClick={() => {
                                        console.log("Selected topic:", topic.id);
                                        setSelectedTopic(topic.id);
                                        const userMessage = topic.title;

                                        // Add user message
                                        setChatMessages(prev => [...prev, {
                                            role: 'user',
                                            content: userMessage
                                        }]);

                                        // Show loading indicator
                                        setIsChatLoading(true);

                                        // Get AI response based on topic
                                        setTimeout(() => {
                                            let aiResponse;
                                            // Use the predefined responses from API service
                                            if (topic.id === 'school_types') {
                                                aiResponse = geminiService.fallbackResponses.schoolTypes;
                                            } else if (topic.id === 'application_tips') {
                                                aiResponse = geminiService.fallbackResponses.applicationTips;
                                            } else {
                                                // For other topics, we'll use the API service
                                                geminiService.getSchoolChatResponse(userMessage)
                                                    .then(response => {
                                                        setChatMessages(prev => [...prev, {
                                                            role: 'ai',
                                                            content: response
                                                        }]);
                                                        setIsChatLoading(false);
                                                    })
                                                    .catch(error => {
                                                        console.error("Error getting response:", error);
                                                        setChatMessages(prev => [...prev, {
                                                            role: 'ai',
                                                            content: "I'm sorry, I couldn't retrieve information about this topic. Please try again later."
                                                        }]);
                                                        setIsChatLoading(false);
                                                    });
                                                return; // Exit early for API calls
                                            }

                                            // Add AI response for predefined topics
                                            setChatMessages(prev => [...prev, {
                                                role: 'ai',
                                                content: aiResponse
                                            }]);
                                            setIsChatLoading(false);
                                        }, 1000);
                                    }}
                                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition"
                                >
                                    <div className="p-2 rounded-full bg-indigo-100 mr-3">
                                        <topic.icon className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-gray-800">{topic.title}</p>
                                        <p className="text-xs text-gray-500">{topic.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Show followup questions if a topic is selected */}
                    {selectedTopic && !selectedFollowup && (
                        <div className="grid grid-cols-1 gap-2">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm text-gray-500">Follow-up questions</p>
                                <button
                                    onClick={() => setSelectedTopic(null)}
                                    className="text-xs text-indigo-600 hover:underline"
                                >
                                    Back to topics
                                </button>
                            </div>

                            {followupQuestions[language][selectedTopic].map((question, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        console.log("Selected followup question:", question);
                                        setSelectedFollowup(question);

                                        // Add user message
                                        setChatMessages(prev => [...prev, {
                                            role: 'user',
                                            content: question
                                        }]);

                                        // Show loading indicator
                                        setIsChatLoading(true);

                                        // Use API to get answer
                                        geminiService.getSchoolChatResponse(question)
                                            .then(response => {
                                                setChatMessages(prev => [...prev, {
                                                    role: 'ai',
                                                    content: response
                                                }]);
                                                setIsChatLoading(false);
                                            })
                                            .catch(error => {
                                                console.error("Error getting response:", error);
                                                setChatMessages(prev => [...prev, {
                                                    role: 'ai',
                                                    content: "I'm sorry, I couldn't retrieve information about this question. Please try again later."
                                                }]);
                                                setIsChatLoading(false);
                                            });
                                    }}
                                    className="text-left p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition"
                                >
                                    <p className="text-gray-800">{question}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Show reset button if we're in a followup */}
                    {selectedFollowup && (
                        <div className="flex justify-between">
                            <button
                                onClick={() => {
                                    setSelectedFollowup(null);
                                }}
                                className="px-4 py-2 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition"
                            >
                                More questions
                            </button>

                            <button
                                onClick={() => {
                                    setSelectedTopic(null);
                                    setSelectedFollowup(null);
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            >
                                New topic
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Right panel with AI guidance content
    const renderRightPanel = () => {
        return (
            <div className={`fixed top-16 bottom-8 right-0 w-72 bg-white border-l border-gray-200 shadow-lg transition-all duration-300 ease-in-out ${showRightPanel ? 'translate-x-0' : 'translate-x-full'} z-10`}>
                {/* Panel toggle button */}
                <button
                    onClick={() => setShowRightPanel(!showRightPanel)}
                    className="absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-l-lg shadow"
                >
                    {showRightPanel ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>

                {/* Panel content */}
                <div className="h-full flex flex-col overflow-hidden">
                    <div className="bg-indigo-600 text-white p-3 flex items-center justify-between">
                        <div className="flex items-center">
                            <MessageSquare className="mr-2" size={18} />
                            <h3 className="font-medium">{t.aiGuide}</h3>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-indigo-50">
                        {/* Welcome message */}
                        <div className="mb-4">
                            <div className="flex items-start">
                                <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center mr-3 flex-shrink-0">AI</div>
                                <div className="bg-white p-3 rounded-lg shadow-sm">
                                    <p className="text-sm">{t.welcomeToGuide}</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Options - Simplified */}
                        <div className="space-y-4 mb-4">
                            {/* Chat interface button - Fixed with direct function */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    console.log("Chat button clicked");

                                    // Force the chat to open
                                    setShowChat(true);

                                    // Prepare default messages if needed
                                    if (chatMessages.length <= 1) {
                                        console.log("Setting up initial chat messages");
                                        const schoolTypesInfo = `Here's a brief overview of school types:

🎯 **Target Schools** are schools where your academic profile (GPA, test scores, etc.) matches their typical admitted student profile. You have a reasonable chance (40-70%) of being accepted.

🔒 **Safety Schools** are schools where your academic credentials exceed their typical requirements, giving you a high probability (70-90%) of acceptance. These provide a backup option.

⭐ **Stretch Schools** (sometimes called "reach schools") are more selective institutions where your profile may be below their typical admitted student. Acceptance chances are lower (less than 30%), but still possible.

A balanced application portfolio typically includes:
- 4-5 Target Schools
- 2-3 Safety Schools
- 1-2 Stretch Schools

Would you like specific advice about any of these categories?`;

                                        setChatMessages([
                                            {
                                                role: 'ai',
                                                content: `${translations[language].chatIntro}\n\nI can help with:\n1. Information about specific colleges or universities\n2. Understanding target, safety, and stretch schools\n3. Application strategies for different types of schools\n4. Evaluating school fit for your profile`
                                            },
                                            {
                                                role: 'user',
                                                content: 'Tell me about different types of schools'
                                            },
                                            {
                                                role: 'ai',
                                                content: schoolTypesInfo
                                            }
                                        ]);
                                    }

                                    // Use toast to confirm click for debugging
                                    toast.success("Opening chat interface");
                                }}
                                className="w-full bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition flex items-center justify-between"
                            >
                                <div className="flex items-center">
                                    <div className="p-2 bg-green-100 rounded-full mr-3">
                                        <MessageSquare className="text-green-600" size={20} />
                                    </div>
                                    <span className="text-base font-medium">Chat with AI Advisor</span>
                                </div>
                                <ChevronRight size={16} />
                            </button>

                            {/* Tutorial button */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    console.log("Tutorial button clicked");
                                    setShowTutorial(true);
                                    toast.success("Opening tutorial");
                                }}
                                className="w-full bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition flex items-center justify-between"
                            >
                                <div className="flex items-center">
                                    <div className="p-2 bg-blue-100 rounded-full mr-3">
                                        <HelpCircle className="text-blue-600" size={20} />
                                    </div>
                                    <span className="text-base font-medium">{t.tutorial}</span>
                                </div>
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        {/* AI Feedback section - Keep this but remove the button since feedback is available when schools are expanded */}
                        {aiFeedback && (
                            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                                <div className="flex items-center mb-3">
                                    <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center mr-2 flex-shrink-0">AI</div>
                                    <h4 className="font-medium">{t.aiFeedback}</h4>
                                </div>
                                <div className="text-sm whitespace-pre-line">
                                    {aiFeedback}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // Fix the "Show AI Panel" button when panel is hidden
    const renderShowAIPanelButton = () => {
        if (!showRightPanel) {
            return (
                <div className="mt-4">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            console.log("Show AI Panel button clicked");
                            setShowRightPanel(true);
                            toast.success("Opening AI Advisor panel");
                        }}
                        className="mb-3 w-full py-3 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center transition-colors"
                    >
                        <MessageSquare size={18} className="mr-2" />
                        Show AI Advisor
                    </button>
                </div>
            );
        }
        return null;
    };

    // Add a more explicit showRightPanel button when panel is collapsed
    const renderMainContent = () => (
        <div className={`transition-all duration-300 ${showRightPanel ? 'pr-80' : ''}`}>
            {/* Language toggle */}
            <div className="flex flex-wrap justify-between items-center mb-4">
                <button
                    onClick={toggleLanguage}
                    className="flex items-center text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 transition"
                >
                    <Globe size={14} className="mr-1" />
                    <span>{translations[language].language}</span>
                </button>

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        console.log("Toggle right panel button clicked");
                        setShowRightPanel(!showRightPanel);
                    }}
                    className="flex items-center text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-md hover:bg-indigo-200 transition"
                >
                    {showRightPanel ? (
                        <>
                            <ChevronRight size={14} className="mr-1" />
                            <span>{t.hidePanel}</span>
                        </>
                    ) : (
                        <>
                            <ChevronLeft size={14} className="mr-1" />
                            <span>{t.showPanel}</span>
                        </>
                    )}
                </button>
            </div>

            {/* Overview stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                {Object.entries(PREFERENCE_TYPES).map(([type, info]) => {
                    const Icon = info.icon;
                    const name = language === 'en' ? info.name : info.nameFa;

                    return (
                        <div
                            key={type}
                            className={`p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer ${info.color}`}
                            onClick={() => toggleCategory(type)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <Icon className={info.iconColor} size={16} />
                                    <div className="font-semibold text-sm ml-2">{counts[type]}</div>
                                </div>
                                <div className="text-xs">{name}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* School lists by category */}
            {Object.entries(PREFERENCE_TYPES).map(([type, info]) => {
                const categorySchools = getCategorySchools(type);
                if (categorySchools.length === 0) return null;

                const Icon = info.icon;
                const name = language === 'en' ? info.name : info.nameFa;

                return (
                    <div key={type} className={`border rounded-lg overflow-hidden mb-3 transition-all ${expandedCategories[type] ? 'shadow-sm' : ''}`}>
                        <div
                            className={`${info.color} p-3 flex justify-between items-center cursor-pointer transition-colors hover:shadow-inner`}
                            onClick={() => toggleCategory(type)}
                        >
                            <div className="flex items-center">
                                <Icon className={info.iconColor} size={16} />
                                <span className="ml-2 font-medium">{name}</span>
                                <span className="ml-2 text-xs opacity-75">({categorySchools.length})</span>
                            </div>
                            {expandedCategories[type] ?
                                <ChevronUp size={16} /> :
                                <ChevronDown size={16} />
                            }
                        </div>

                        {expandedCategories[type] && (
                            <div className="divide-y">
                                {categorySchools.map(school => {
                                    const statusInfo = APPLICATION_STATUS_INFO[school.application_status] || APPLICATION_STATUS_INFO.planning;
                                    const StatusIcon = statusInfo.icon;
                                    const statusLabel = language === 'en' ? statusInfo.label : statusInfo.labelFa;
                                    const notesLabel = t.notes;
                                    const updatedLabel = t.updated;
                                    const isExpanded = expandedSchools[school.id] === true;

                                    return (
                                        <div key={school.id} className="overflow-hidden transition-all duration-200">
                                            <div
                                                className="p-3 bg-white hover:bg-gray-50 flex justify-between items-center cursor-pointer"
                                                onClick={() => toggleSchoolExpansion(school.id)}
                                            >
                                                <div className="flex items-center">
                                                    <StatusIcon size={14} className={`${statusInfo.color.split(' ')[1]} mr-2 p-0.5 rounded-full`} />
                                                    <div>
                                                        <h4 className="font-medium text-sm flex items-center">
                                                            {school.school_name}
                                                            {insightLoading[school.id] && (
                                                                <Loader size={12} className="ml-2 animate-spin text-indigo-600" />
                                                            )}
                                                        </h4>
                                                        <p className="text-xs text-gray-500">{school.major_name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className={`${statusInfo.color} px-2 py-0.5 rounded-md text-xs font-medium mr-2`}>
                                                        {statusLabel}
                                                    </span>
                                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="p-3 pt-0 bg-gray-50">
                                                    {school.notes && (
                                                        <div className="mt-2 text-xs bg-white p-2 rounded-md border border-gray-200">
                                                            <span className="font-medium">{notesLabel}</span> {school.notes}
                                                        </div>
                                                    )}

                                                    {/* AI Insight card - Chat-like style */}
                                                    <div className="mt-2">
                                                        {insightLoading[school.id] ? (
                                                            <div className="flex items-center justify-center bg-indigo-50 border border-indigo-100 p-2 rounded-md h-16">
                                                                <Loader size={16} className="mr-2 animate-spin text-indigo-600" />
                                                                <span className="text-xs text-indigo-700">Loading insights...</span>
                                                            </div>
                                                        ) : schoolSpecificFeedback[school.id] ? (
                                                            <div className="flex mt-3">
                                                                <div className="bg-white rounded-lg rounded-bl-none border border-indigo-100 p-3 max-w-[90%] shadow-sm">
                                                                    <div className="flex items-center mb-1">
                                                                        <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs mr-2">AI</div>
                                                                        <span className="text-xs font-medium text-indigo-700">School Insight</span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-700 whitespace-pre-line">{schoolSpecificFeedback[school.id]}</p>
                                                                </div>
                                                            </div>
                                                        ) : forMentor && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    getSchoolSpecificFeedback(school);
                                                                }}
                                                                className="w-full text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-100 p-2 rounded-md text-center"
                                                            >
                                                                Get AI insights for {school.school_name}
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="mt-2 text-xs text-gray-500 flex justify-between">
                                                        <span>{updatedLabel} {new Date(school.updated_at).toLocaleDateString(language === 'en' ? 'en-US' : 'fa-IR')}</span>
                                                        {forMentor && !schoolSpecificFeedback[school.id] && !insightLoading[school.id] && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    getSchoolSpecificFeedback(school);
                                                                }}
                                                                className="text-indigo-600 hover:text-indigo-800"
                                                            >
                                                                Generate Insight
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Show AI Panel button if needed */}
            {renderShowAIPanelButton()}
        </div>
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!schoolChoices.length) {
        return (
            <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-200">
                <School className="mx-auto text-gray-400 mb-2" size={24} />
                <p className="text-gray-600">{t.noSchoolChoices}</p>
                {renderRightPanel()}
            </div>
        );
    }

    return (
        <div className={`${language === 'fa' ? 'rtl' : 'ltr'} relative`}>
            {renderMainContent()}

            {/* Render the right panel */}
            {renderRightPanel()}

            {/* Render tutorial and chat modals */}
            {showTutorial && renderTutorial()}
            {showChat && renderChatInterface()}
        </div>
    );
};

export default StudentSchoolChoicesViewer; 