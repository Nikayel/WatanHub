// src/components/StudentSchoolChoicesViewer.jsx

import React, {
    useState,
    useEffect,
    useCallback,
    useRef
} from 'react';
import { supabase } from '../lib/supabase';
import { geminiService } from '../services/ApiService';
import {
    School,
    GraduationCap,
    Building,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    XCircle,
    ArrowRight,
    Clock,
    AlertCircle,
    Globe,
    Loader,
    Info,
    HelpCircle,
    MessageSquare,
    X,
    ChevronLeft,
    ChevronRight,
    FileText,
    Edit,
    Users
} from 'lucide-react';
import { toast } from 'sonner';

// Translations for Farsi (fa) and Dari (dr) support
const translations = {
    en: {
        targetSchools: 'Target Schools',
        safetySchools: 'Safety Schools',
        stretchSchool: 'Stretch School',
        schools: 'Schools',
        school: 'School',
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
        chatPlaceholder: 'Choose a topic or type your question...',
        chatButton: 'Send',
        chatIntro:
            "Hello! I can provide insights about colleges or universities you’re interested in. Please select one of the topics below or ask me something directly.",
        aiTyping: 'AI is thinking...',
        hidePanel: 'Hide Guide',
        showPanel: 'Show Guide',
        aiGuide: 'AI College Guide',
        welcomeToGuide:
            'Welcome to your personal AI college application assistant! I can help you understand school choices, application strategies, and more.'
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
        updated: 'به‌روزرسانی:',
        language: 'English/دری',
        changeTo: 'تغییر به انگلیسی/دری',
        tutorial: 'راهنمای انتخاب دانشگاه',
        tutorialDesc: 'درباره انواع مختلف انتخاب‌های دانشگاه بیاموزید',
        closeChat: 'بستن گفتگو',
        chatTitle: 'مشاور هوش مصنوعی دانشگاه',
        chatPlaceholder: 'موضوعی را انتخاب کنید یا سوال خود را تایپ کنید...',
        chatButton: 'ارسال',
        chatIntro:
            'سلام! من می‌توانم اطلاعاتی درباره کالج‌ها یا دانشگاه‌هایی که به آنها علاقه دارید ارائه دهم. لطفاً یکی از موضوعات زیر را انتخاب کنید یا مستقیماً سؤالتان را بنویسید.',
        aiTyping: 'هوش مصنوعی در حال تایپ...',
        hidePanel: 'پنهان کردن راهنما',
        showPanel: 'نمایش راهنما',
        aiGuide: 'راهنمای هوش مصنوعی کالج',
        welcomeToGuide:
            'به دستیار شخصی درخواست کالج هوش مصنوعی خود خوش آمدید! من می‌توانم به شما در درک انتخاب‌های دانشگاه، استراتژی‌های درخواست و موارد دیگر کمک کنم.'
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
        chatPlaceholder: 'یک موضوع را انتخاب کنید یا سوال خود را بنویسید...',
        chatButton: 'ارسال',
        chatIntro:
            'سلام! من می‌توانم معلوماتی در مورد کالج‌ها یا پوهنتون‌هایی که به آنها علاقه دارید ارائه دهم. لطفاً یکی از موضوعات زیر را انتخاب کنید یا مستقیماً سؤالتان را بنویسید.',
        aiTyping: 'هوش مصنوعی در حال نوشتن...',
        hidePanel: 'پنهان کردن رهنما',
        showPanel: 'نمایش رهنما',
        aiGuide: 'رهنمای هوش مصنوعی پوهنتون',
        welcomeToGuide:
            'به دستیار شخصی درخواست پوهنتون هوش مصنوعی خود خوش آمدید! من می‌توانم به شما در درک انتخاب‌های پوهنتون، استراتژی‌های درخواست و موارد دیگر کمک کنم.'
    }
};

// Preference types for school categories
const PREFERENCE_TYPES = {
    target: {
        name: 'Target Schools',
        nameFa: 'دانشگاه‌های هدف',
        description:
            'Schools that match your academic profile where you have a good chance of being accepted (40-70% chance).',
        descriptionFa:
            'دانشگاه‌هایی که با پروفایل تحصیلی شما مطابقت دارند و شانس خوبی برای پذیرش در آنها دارید (شانس 40-70 درصد).',
        color: 'bg-green-100 text-green-800 border-green-200',
        iconColor: 'text-green-600',
        icon: Building
    },
    safety: {
        name: 'Safety Schools',
        nameFa: 'دانشگاه‌های امن',
        description:
            'Schools where you have a high probability of being accepted based on your academic profile (70-90% chance).',
        descriptionFa:
            'دانشگاه‌هایی که بر اساس پروفایل تحصیلی شما احتمال پذیرش بالایی در آنها دارید (شانس 70-90 درصد).',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        iconColor: 'text-blue-600',
        icon: School
    },
    stretch: {
        name: 'Stretch School',
        nameFa: 'دانشگاه آرزویی',
        description:
            'Your dream schools that may be challenging to get into based on your profile (less than 30% chance).',
        descriptionFa:
            'دانشگاه‌های رویایی شما که ممکن است بر اساس پروفایل شما دشوار باشد (کمتر از 30٪ شانس).',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        iconColor: 'text-purple-600',
        icon: GraduationCap
    }
};

// Standard chat topics (and their translations)
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

// Follow-up questions for each topic, in each language
const followupQuestions = {
    en: {
        school_types: [
            'What GPA do I need for target schools?',
            'How many safety schools should I apply to?',
            'Examples of good stretch schools'
        ],
        application_tips: [
            'When should I start my applications?',
            'How important are extracurriculars?',
            'Tips for recommendation letters'
        ],
        school_selection: [
            'Factors to consider in school selection',
            'How to research colleges effectively',
            'Balancing location and program quality'
        ],
        essays: [
            'Common essay mistakes to avoid',
            'How to choose an essay topic',
            'Tips for personal statement structure'
        ],
        interviews: [
            'Common interview questions',
            'What to wear to college interviews',
            'How to follow up after interviews'
        ]
    },
    fa: {
        school_types: [
            'برای دانشگاه‌های هدف به چه معدلی نیاز دارم؟',
            'به چه تعداد دانشگاه امن باید درخواست دهم؟',
            'نمونه‌هایی از دانشگاه‌های آرزویی مناسب'
        ],
        application_tips: [
            'چه زمانی باید درخواست‌هایم را شروع کنم؟',
            'فعالیت‌های فوق برنامه چقدر اهمیت دارند؟',
            'نکاتی برای توصیه‌نامه‌ها'
        ],
        school_selection: [
            'عوامل مهم در انتخاب دانشگاه',
            'چگونه درباره دانشگاه‌ها تحقیق کنیم',
            'تعادل بین مکان و کیفیت برنامه'
        ],
        essays: [
            'اشتباهات رایج مقاله که باید از آنها اجتناب کرد',
            'چگونه یک موضوع مقاله انتخاب کنیم',
            'نکاتی برای ساختار بیانیه شخصی'
        ],
        interviews: [
            'سوالات رایج مصاحبه',
            'چه لباسی برای مصاحبه‌های دانشگاه بپوشیم',
            'چگونه پس از مصاحبه پیگیری کنیم'
        ]
    },
    dr: {
        school_types: [
            'برای پوهنتون‌های هدف به چه نمراتی نیاز دارم؟',
            'به چه تعداد پوهنتون مطمئن باید درخواست دهم؟',
            'نمونه‌هایی از پوهنتون‌های آرزویی مناسب'
        ],
        application_tips: [
            'چه زمانی باید درخواست‌هایم را شروع کنم؟',
            'فعالیت‌های فوق برنامه چقدر مهم هستند؟',
            'نکاتی برای توصیه‌نامه‌ها'
        ],
        school_selection: [
            'عوامل مهم در انتخاب پوهنتون',
            'چگونه درباره پوهنتون‌ها تحقیق کنیم',
            'تعادل بین مکان و کیفیت برنامه'
        ],
        essays: [
            'اشتباهات رایج مقاله که باید از آنها پرهیز کرد',
            'چگونه یک موضوع مقاله انتخاب کنیم',
            'نکاتی برای ساختار بیانیه شخصی'
        ],
        interviews: [
            'سوالات رایج مصاحبه',
            'چه لباسی برای مصاحبه‌های پوهنتون بپوشیم',
            'چگونه پس از مصاحبه پیگیری کنیم'
        ]
    }
};

const StudentSchoolChoicesViewer = ({ studentId, forMentor = true }) => {
    // ─── Local State ────────────────────────────────────────────────────────────
    const [schoolChoices, setSchoolChoices] = useState([]);
    const [loading, setLoading] = useState(true);

    const [expandedCategories, setExpandedCategories] = useState({
        target: true,
        safety: true,
        stretch: true
    });

    const [schoolSpecificFeedback, setSchoolSpecificFeedback] = useState({});
    const [insightLoading, setInsightLoading] = useState({});

    // Chat‐/Tutorial‐related state
    const [language, setLanguage] = useState('en');
    const [showTutorial, setShowTutorial] = useState(false);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [showChat, setShowChat] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [selectedFollowup, setSelectedFollowup] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [showRightPanel, setShowRightPanel] = useState(!forMentor); // students see panel by default, mentors can toggle
    const chatEndRef = useRef(null);

    // ─── Fetch School Choices from Supabase ─────────────────────────────────────
    const fetchSchoolChoices = useCallback(async () => {
        if (!studentId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('student_school_choices')
                .select('*')
                .eq('student_id', studentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSchoolChoices(data || []);

            // Pre-fetch feedback for each school if mentor view
            if (data && data.length > 0 && forMentor) {
                data.forEach((school) => {
                    getSchoolSpecificFeedback(school);
                });
            }
        } catch (err) {
            console.error('Error fetching student school choices:', err);
            toast.error('Failed to load school choices');
        } finally {
            setLoading(false);
        }
    }, [studentId, forMentor]);

    useEffect(() => {
        fetchSchoolChoices();
    }, [fetchSchoolChoices]);

    // ─── Scroll Chat to Bottom on New Messages ───────────────────────────────────
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    // ─── Initialize Chat Welcome on First Open ───────────────────────────────────
    useEffect(() => {
        if (showChat && chatMessages.length === 0) {
            setChatMessages([
                {
                    role: 'ai',
                    content: `${translations[language].chatIntro}\n\nI can help with:\n1. Info about specific colleges or universities\n2. Understanding target, safety, and stretch schools\n3. Application strategies for different schools\n4. Evaluating school fit for your profile`
                }
            ]);
        }
    }, [showChat, chatMessages.length, language]);

    // ─── Collapse Right Panel for Mentors by Default ─────────────────────────────
    useEffect(() => {
        if (!forMentor) {
            setShowRightPanel(true);
        }
    }, [forMentor]);

    // ─── Toggle category expand/collapse ───────────────────────────────────────
    const toggleCategory = (category) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // ─── Change UI language (en → fa → dr → en ...) ─────────────────────────────
    const toggleLanguage = () => {
        setLanguage((prev) => {
            if (prev === 'en') return 'fa';
            if (prev === 'fa') return 'dr';
            return 'en';
        });
    };

    // ─── Fetch AI insight for a specific school ─────────────────────────────────
    const getSchoolSpecificFeedback = async (school) => {
        if (schoolSpecificFeedback[school.id]) return;

        setInsightLoading((prev) => ({ ...prev, [school.id]: true }));
        try {
            const feedback = await geminiService.getSchoolInsight(school);
            setSchoolSpecificFeedback((prev) => ({
                ...prev,
                [school.id]: feedback
            }));
        } catch (err) {
            console.error(`Error getting feedback for ${school.school_name}:`, err);
            toast.error(`Failed to get insights for ${school.school_name}`);
        } finally {
            setInsightLoading((prev) => ({ ...prev, [school.id]: false }));
        }
    };

    // ─── Fetch AI feedback for all school choices at once ───────────────────────
    const getAllChoicesFeedback = async () => {
        if (!schoolChoices.length) return;
        setLoading(true);
        try {
            const feedback = await geminiService.getSchoolChoicesFeedback(
                schoolChoices,
                forMentor
            );
            // We can store that in a top‐level `aiFeedback` state if desired.
            toast.success('AI feedback generated!');
            console.log('All AI feedback:', feedback);
        } catch (err) {
            console.error('Error getting AI feedback for all choices:', err);
            toast.error('Failed to generate overall feedback');
        } finally {
            setLoading(false);
        }
    };

    // ─── Helper: Filter schools by category ─────────────────────────────────────
    const getCategorySchools = (category) => {
        return schoolChoices.filter(
            (school) => school.preference_type === category
        );
    };

    // ─── Handle sending a new chat message (free text) ─────────────────────────
    const sendChatMessage = () => {
        const trimmed = chatInput.trim();
        if (!trimmed) return;

        // Append user message
        setChatMessages((prev) => [
            ...prev,
            { role: 'user', content: trimmed }
        ]);
        setChatInput('');
        setIsChatLoading(true);

        // Call Gemini API
        geminiService
            .getSchoolChatResponse(trimmed)
            .then((response) => {
                setChatMessages((prev) => [
                    ...prev,
                    { role: 'ai', content: response }
                ]);
            })
            .catch((err) => {
                console.error('Error getting AI chat response:', err);
                setChatMessages((prev) => [
                    ...prev,
                    {
                        role: 'ai',
                        content:
                            "I'm sorry, I couldn't process that right now. Please try again later."
                    }
                ]);
            })
            .finally(() => {
                setIsChatLoading(false);
            });
    };

    // ─── Render the tutorial modal ──────────────────────────────────────────────
    const renderTutorial = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {language === 'en'
                            ? 'School Selection Guide'
                            : language === 'fa'
                                ? 'راهنمای انتخاب دانشگاه'
                                : 'رهنمای انتخاب پوهنتون'}
                    </h3>
                    <button
                        onClick={() => {
                            setShowTutorial(false);
                            setTutorialStep(0);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 max-h-[70vh] overflow-y-auto">
                    {tutorialStep === 0 && (
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                {language === 'en'
                                    ? "When applying to colleges, it's important to have a balanced list of schools. Let's understand the three types of schools you should consider:"
                                    : language === 'fa'
                                        ? 'هنگام درخواست برای دانشگاه‌ها، داشتن لیست متعادلی از دانشگاه‌ها مهم است. بیایید سه نوع دانشگاه را که باید در نظر بگیرید بشناسیم:'
                                        : 'هنگام درخواست برای پوهنتون‌ها، داشتن لیست متعادلی از پوهنتون‌ها مهم است. بیایید سه نوع پوهنتون را که باید در نظر بگیرید بشناسیم:'}
                            </p>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center mb-2">
                                    <div className="p-2 bg-green-100 rounded-full mr-3">
                                        <Building className="text-green-600 h-5 w-5" />
                                    </div>
                                    <h4 className="font-medium text-green-800">
                                        {language === 'en'
                                            ? PREFERENCE_TYPES.target.name
                                            : PREFERENCE_TYPES.target.nameFa}
                                    </h4>
                                </div>
                                <p className="text-sm text-green-700 ml-12">
                                    {language === 'en'
                                        ? PREFERENCE_TYPES.target.description
                                        : PREFERENCE_TYPES.target.descriptionFa}
                                </p>
                            </div>

                            <button
                                onClick={() => setTutorialStep(1)}
                                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            >
                                {language === 'en'
                                    ? 'Next: Safety Schools'
                                    : language === 'fa'
                                        ? 'بعدی: دانشگاه‌های امن'
                                        : 'بعدی: پوهنتون‌های مطمئن'}
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
                                        {language === 'en'
                                            ? PREFERENCE_TYPES.safety.name
                                            : PREFERENCE_TYPES.safety.nameFa}
                                    </h4>
                                </div>
                                <p className="text-sm text-blue-700 ml-12">
                                    {language === 'en'
                                        ? PREFERENCE_TYPES.safety.description
                                        : PREFERENCE_TYPES.safety.descriptionFa}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTutorialStep(0)}
                                    className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                                >
                                    {language === 'en'
                                        ? 'Back'
                                        : language === 'fa'
                                            ? 'بازگشت'
                                            : 'بیرون'}
                                </button>
                                <button
                                    onClick={() => setTutorialStep(2)}
                                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                >
                                    {language === 'en'
                                        ? 'Next: Stretch School'
                                        : language === 'fa'
                                            ? 'بعدی: دانشگاه آرزویی'
                                            : 'بعدی: پوهنتون آرزویی'}
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
                                        {language === 'en'
                                            ? PREFERENCE_TYPES.stretch.name
                                            : PREFERENCE_TYPES.stretch.nameFa}
                                    </h4>
                                </div>
                                <p className="text-sm text-purple-700 ml-12">
                                    {language === 'en'
                                        ? PREFERENCE_TYPES.stretch.description
                                        : PREFERENCE_TYPES.stretch.descriptionFa}
                                </p>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center">
                                    <AlertCircle className="text-yellow-600 h-5 w-5 mr-2 flex-shrink-0" />
                                    <p className="text-sm text-yellow-700">
                                        {language === 'en'
                                            ? 'A balanced college application list typically includes 4-5 target schools, 2-3 safety schools, and 1-2 stretch schools.'
                                            : language === 'fa'
                                                ? 'یک لیست متعادل درخواست دانشگاه معمولاً شامل 4-5 دانشگاه هدف، 2-3 دانشگاه امن و 1-2 دانشگاه آرزویی است.'
                                                : 'یک لیست متعادل درخواست پوهنتون معمولاً شامل 4-5 پوهنتون هدف، 2-3 پوهنتون مطمئن و 1-2 پوهنتون آرزویی است.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTutorialStep(1)}
                                    className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                                >
                                    {language === 'en'
                                        ? 'Back'
                                        : language === 'fa'
                                            ? 'بازگشت'
                                            : 'بیرون'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowTutorial(false);
                                        setTutorialStep(0);
                                    }}
                                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                >
                                    {language === 'en'
                                        ? 'Got it!'
                                        : language === 'fa'
                                            ? 'متوجه شدم!'
                                            : 'متوجه شدم!'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // ─── Render Chat Interface ─────────────────────────────────────────────────
    const renderChatInterface = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden flex flex-col h-[80vh]">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center">
                        <div className="p-2 bg-indigo-100 rounded-full mr-2">
                            <MessageSquare className="text-indigo-600" size={18} />
                        </div>
                        <h3 className="font-medium text-gray-800">
                            {translations[language].chatTitle}
                        </h3>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedTopic(null);
                            setSelectedFollowup(null);
                            setChatMessages([]);
                            setShowChat(false);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    <div className="space-y-4">
                        {chatMessages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                                    }`}
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

                        {isChatLoading && (
                            <div className="flex justify-start">
                                <div className="max-w-[80%] rounded-lg p-3 bg-white border border-gray-200">
                                    <div className="flex items-center">
                                        <Loader className="h-4 w-4 animate-spin mr-2 text-gray-500" />
                                        <p className="text-gray-500">
                                            {translations[language].aiTyping}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* Chat Input & Predefined Topics / Follow-ups */}
                <div className="p-4 border-t border-gray-200 bg-white flex flex-col gap-4">
                    {/* If no topic chosen yet, show topic buttons */}
                    {!selectedTopic && (
                        <div className="grid grid-cols-1 gap-2">
                            <p className="text-sm text-gray-500">
                                {translations[language].chatPlaceholder}
                            </p>
                            {chatTopics[language].map((topic) => (
                                <button
                                    key={topic.id}
                                    onClick={() => {
                                        setSelectedTopic(topic.id);
                                        // Add user message
                                        setChatMessages((prev) => [
                                            ...prev,
                                            { role: 'user', content: topic.title }
                                        ]);
                                        // Show AI typing
                                        setIsChatLoading(true);
                                        // If we have a fallback response for that topic:
                                        const fallback =
                                            geminiService.fallbackResponses?.[topic.id];
                                        if (fallback) {
                                            setTimeout(() => {
                                                setChatMessages((prev) => [
                                                    ...prev,
                                                    { role: 'ai', content: fallback }
                                                ]);
                                                setIsChatLoading(false);
                                            }, 800);
                                        } else {
                                            // Otherwise call API
                                            geminiService
                                                .getSchoolChatResponse(topic.title)
                                                .then((response) => {
                                                    setChatMessages((prev) => [
                                                        ...prev,
                                                        { role: 'ai', content: response }
                                                    ]);
                                                })
                                                .catch((err) => {
                                                    console.error(
                                                        'Error replying to topic:',
                                                        err
                                                    );
                                                    setChatMessages((prev) => [
                                                        ...prev,
                                                        {
                                                            role: 'ai',
                                                            content:
                                                                "I'm sorry, I couldn't retrieve information about this topic. Please try again later."
                                                        }
                                                    ]);
                                                })
                                                .finally(() => {
                                                    setIsChatLoading(false);
                                                });
                                        }
                                    }}
                                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition"
                                >
                                    <div className="p-2 rounded-full bg-indigo-100 mr-3">
                                        <topic.icon className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-gray-800">
                                            {topic.title}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {topic.description}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* If a topic is selected but no follow-up chosen, show follow-ups */}
                    {selectedTopic && !selectedFollowup && (
                        <div className="grid grid-cols-1 gap-2">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm text-gray-500">
                                    Follow-up questions
                                </p>
                                <button
                                    onClick={() => setSelectedTopic(null)}
                                    className="text-xs text-indigo-600 hover:underline"
                                >
                                    Back to topics
                                </button>
                            </div>
                            {followupQuestions[language][selectedTopic].map(
                                (question, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setSelectedFollowup(question);
                                            setChatMessages((prev) => [
                                                ...prev,
                                                { role: 'user', content: question }
                                            ]);
                                            setIsChatLoading(true);
                                            geminiService
                                                .getSchoolChatResponse(question)
                                                .then((response) => {
                                                    setChatMessages((prev) => [
                                                        ...prev,
                                                        { role: 'ai', content: response }
                                                    ]);
                                                })
                                                .catch((err) => {
                                                    console.error(
                                                        'Error getting follow-up response:',
                                                        err
                                                    );
                                                    setChatMessages((prev) => [
                                                        ...prev,
                                                        {
                                                            role: 'ai',
                                                            content:
                                                                "I'm sorry, I couldn't retrieve information about this question. Please try again later."
                                                        }
                                                    ]);
                                                })
                                                .finally(() => {
                                                    setIsChatLoading(false);
                                                });
                                        }}
                                        className="text-left p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition"
                                    >
                                        <p className="text-gray-800">{question}</p>
                                    </button>
                                )
                            )}
                        </div>
                    )}

                    {/* If in a follow-up, show “More questions” / “New topic” */}
                    {selectedFollowup && (
                        <div className="flex justify-between">
                            <button
                                onClick={() => setSelectedFollowup(null)}
                                className="px-4 py-2 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition"
                            >
                                More Questions
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedTopic(null);
                                    setSelectedFollowup(null);
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            >
                                New Topic
                            </button>
                        </div>
                    )}

                    {/* Free-form chat input */}
                    <div className="flex items-center gap-2 mt-2">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    sendChatMessage();
                                }
                            }}
                            placeholder={
                                translations[language].chatPlaceholder
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button
                            onClick={sendChatMessage}
                            disabled={isChatLoading || !chatInput.trim()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {translations[language].chatButton}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // ─── Render the AI Guidance Panel (Right Side) ─────────────────────────────
    const renderRightPanel = () => (
        <div
            className={`fixed top-16 bottom-8 right-0 w-80 bg-white border-l border-gray-200 shadow-lg transition-transform duration-300 ease-in-out ${showRightPanel ? 'translate-x-0' : 'translate-x-full'
                } z-10`}
        >
            {/* Toggle button to hide/show */}
            <button
                onClick={() => setShowRightPanel(!showRightPanel)}
                className="absolute left-0 top-1/2 transform -translate-x-full -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-l-lg shadow"
            >
                {showRightPanel ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <div className="h-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-indigo-600 text-white p-3 flex items-center justify-between">
                    <div className="flex items-center">
                        <MessageSquare className="mr-2" size={18} />
                        <h3 className="font-medium">{translations[language].aiGuide}</h3>
                    </div>
                    <button
                        onClick={() => setShowRightPanel(false)}
                        className="text-white hover:text-gray-200"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 bg-indigo-50">
                    {/* Welcome message */}
                    <div className="mb-4">
                        <div className="flex items-start">
                            <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center mr-3 flex-shrink-0">
                                AI
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                                <p className="text-sm">{translations[language].welcomeToGuide}</p>
                            </div>
                        </div>
                    </div>

                    {/* Main options */}
                    <div className="space-y-4 mb-4">
                        {/* “Chat with AI Advisor” button */}
                        <button
                            onClick={() => {
                                setShowChat(true);
                                toast.success('Opening chat interface');
                            }}
                            className="w-full bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition flex items-center justify-between"
                        >
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-full mr-3">
                                    <MessageSquare className="text-green-600" size={20} />
                                </div>
                                <span className="text-base font-medium">
                                    {translations[language].chatTitle}
                                </span>
                            </div>
                            <ChevronRight size={16} />
                        </button>

                        {/* Tutorial button */}
                        <button
                            onClick={() => {
                                setShowTutorial(true);
                                toast.success('Opening tutorial');
                            }}
                            className="w-full bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition flex items-center justify-between"
                        >
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-full mr-3">
                                    <HelpCircle className="text-blue-600" size={20} />
                                </div>
                                <span className="text-base font-medium">
                                    {translations[language].tutorial}
                                </span>
                            </div>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // ─── Render Main Content: Left = Categories, Right = School lists ─────────────
    const renderMainContent = () => (
        <div className={`${language === 'fa' ? 'rtl' : 'ltr'} relative grid grid-cols-12 gap-6`}>
            {/* Left Column: Category selectors */}
            <div className="col-span-3">
                <div className="sticky top-4 space-y-4">
                    {Object.entries(PREFERENCE_TYPES).map(([type, info]) => {
                        const categorySchools = getCategorySchools(type);
                        const Icon = info.icon;
                        const name = language === 'en' ? info.name : info.nameFa;

                        return (
                            <div
                                key={type}
                                className={`p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer ${info.color} transform hover:scale-102 motion-safe:hover:scale-105`}
                                onClick={() => {
                                    toggleCategory(type);
                                    // Scroll to that category in main panel
                                    document
                                        .getElementById(`category-${type}`)
                                        ?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Icon className={`${info.iconColor} animate-bounce-subtle`} size={20} />
                                        <div className="ml-3">
                                            <div className="font-semibold">{name}</div>
                                            <div className="text-sm opacity-75">{categorySchools.length} schools</div>
                                        </div>
                                    </div>
                                    {expandedCategories[type] ? (
                                        <ChevronUp className="text-gray-600" size={16} />
                                    ) : (
                                        <ChevronDown className="text-gray-600" size={16} />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main (Middle) Column: Lists of schools by category */}
            <div className="col-span-9">
                {Object.entries(PREFERENCE_TYPES).map(([type, info]) => {
                    const categorySchools = getCategorySchools(type);
                    if (!categorySchools.length) return null;

                    const panelName = language === 'en' ? info.name : info.nameFa;

                    return (
                        <div
                            id={`category-${type}`}
                            key={type}
                            className={`border rounded-lg overflow-hidden mb-6 transition-all ${expandedCategories[type] ? 'shadow-md' : ''
                                }`}
                        >
                            {/* Category Header */}
                            <div
                                className="bg-gray-100 px-4 py-3 flex justify-between items-center cursor-pointer"
                                onClick={() => toggleCategory(type)}
                            >
                                <div className="flex items-center">
                                    <info.icon className={`${info.iconColor} h-5 w-5`} />
                                    <h4 className="ml-2 font-semibold">{panelName}</h4>
                                </div>
                                <div className="text-sm font-medium">
                                    {categorySchools.length} {translations[language].school + (categorySchools.length > 1 ? 's' : '')}
                                </div>
                            </div>

                            {/* Expandable Content */}
                            {expandedCategories[type] && (
                                <div className="p-4 space-y-3 bg-white">
                                    {categorySchools.map((school) => (
                                        <div
                                            key={school.id}
                                            className="border rounded-lg p-3 flex justify-between items-center"
                                        >
                                            <div>
                                                <h5 className="font-medium text-gray-800">{school.school_name}</h5>
                                                <p className="text-xs text-gray-500">
                                                    {school.city || ''} {school.country ? `, ${school.country}` : ''}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => getSchoolSpecificFeedback(school)}
                                                className="text-indigo-600 text-sm hover:underline disabled:opacity-50"
                                                disabled={insightLoading[school.id]}
                                            >
                                                {insightLoading[school.id] ? 'Loading...' : 'Get Insight'}
                                            </button>
                                            {schoolSpecificFeedback[school.id] && (
                                                <div className="ml-4 max-w-xs text-sm text-gray-700">
                                                    {schoolSpecificFeedback[school.id]}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* If mentor, show “Get overall feedback” at bottom */}
                                    {forMentor && (
                                        <div className="mt-4">
                                            <button
                                                onClick={getAllChoicesFeedback}
                                                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                            >
                                                {translations[language].getFeedback}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Right panel with AI guidance */}
            {showRightPanel && (
                <div className="fixed right-4 top-4 w-80 z-10">{renderRightPanel()}</div>
            )}
        </div>
    );

    // ─── Final Render Logic ─────────────────────────────────────────────────────
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
                <p className="text-gray-600">{translations[language].noSchoolChoices}</p>
                {renderRightPanel()}
            </div>
        );
    }

    return (
        <div className={`${language === 'fa' ? 'rtl' : 'ltr'} relative`}>
            {renderMainContent()}

            {/* Chat and Tutorial modals */}
            {showTutorial && renderTutorial()}
            {showChat && renderChatInterface()}
        </div>
    );
};

export default StudentSchoolChoicesViewer;
