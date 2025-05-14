import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { toast } from 'sonner';
import {
    User, BookOpen, GraduationCap, Globe,
    MessageCircle, Calendar, X, ArrowRight,
    ArrowLeft, CheckCircle, Save, AlertCircle,
    Home, DollarSign, Briefcase, Wifi
} from 'lucide-react';

// Income range options
const INCOME_RANGES = [
    'Less than $10,000',
    '$10,000 - $30,000',
    '$30,000 - $50,000',
    '$50,000 - $70,000',
    '$70,000 - $100,000',
    'More than $100,000',
    'Prefer not to say'
];

// School types
const SCHOOL_TYPES = [
    'Public School',
    'Private School',
    'Charter School',
    'Home School',
    'Religious School',
    'Online School',
    'Other'
];

// Parental education levels
const EDUCATION_LEVELS = [
    'Less than high school',
    'High school graduate',
    'Some college',
    'Associate degree',
    'Bachelor\'s degree',
    'Master\'s degree',
    'Doctoral degree',
    'Professional degree',
    'Unknown'
];

// Internet speed options
const INTERNET_SPEEDS = [
    'No regular access',
    'Dial-up/Very slow',
    'Basic broadband',
    'High-speed',
    'Very high-speed fiber',
    'Unsure'
];

// List of provinces
const PROVINCES = [
    'Badakhshan', 'Badghis', 'Baghlan', 'Balkh', 'Bamyan',
    'Daykundi', 'Farah', 'Faryab', 'Ghazni', 'Ghor',
    'Helmand', 'Herat', 'Jowzjan', 'Kabul', 'Kandahar',
    'Kapisa', 'Khost', 'Kunar', 'Kunduz', 'Laghman',
    'Logar', 'Nangarhar', 'Nimruz', 'Nuristan', 'Paktia',
    'Paktika', 'Panjshir', 'Parwan', 'Samangan', 'Sar-e Pol',
    'Takhar', 'Uruzgan', 'Wardak', 'Zabul'
];

// Translation content
const translations = {
    en: {
        // Basic information
        basicInfoTitle: "Complete Your Basic Information",
        basicInfoDesc: "Help us get to know you better with these basic details.",
        firstName: "First Name",
        lastName: "Last Name",
        dateOfBirth: "Date of Birth",
        dateOfBirthDesc: "(must be at least 13 years old)",
        ageError: "You must be at least 13 years old",
        gender: "Gender",
        genderOptions: {
            male: "Male",
            female: "Female",
            // nonBinary: "Non-binary",
            preferNotToSay: "Prefer not to say"
        },
        placeOfBirth: "Place of Birth",
        placeOfResidence: "Place of Residence",
        religion: "Religion (optional)",

        // Educational background
        educationTitle: "Educational Background",
        educationDesc: "Share your educational experience to help us match you with relevant content.",
        educationLevel: "Education Level",
        educationOptions: {
            highSchool: "High School",
            bachelors: "Bachelor's Degree",
            masters: "Master's Degree",
            phd: "PhD",
            other: "Other"
        },
        englishProficiency: "English Proficiency",
        englishOptions: {
            beginner: "Beginner",
            intermediate: "Intermediate",
            advanced: "Advanced",
            native: "Native Speaker"
        },
        toeflScore: "TOEFL Score (if applicable)",

        // Interests & Goals
        interestsTitle: "Interests & Goals",
        interestsDesc: "Tell us about your interests so we can connect you with relevant opportunities.",
        areasOfInterest: "Areas of Interest",
        interestsPlaceholder: "What subjects or areas are you most interested in? (e.g. Computer Science, Literature, Medicine)",
        aboutMe: "About Me",
        bioPlaceholder: "Share a bit about yourself, your background, and your educational goals...",

        // Socioeconomic background
        backgroundTitle: "Background Information",
        backgroundDesc: "This information helps us assign you the right mentor and tailor scholarship opportunities. Your responses are confidential.",
        province: "Province",
        schoolType: "School Type",
        income: "Household Income Range",
        parentalEducation: "Parental Education",
        internetSpeed: "Internet Access Quality",

        // Review
        reviewTitle: "Complete Your Profile!",
        reviewDesc: "You're all set! Review your information below and click \"Save Profile\" to finish.",

        // UI Elements
        select: "Select...",
        selectProvince: "Select province...",
        selectSchoolType: "Select school type...",
        selectIncome: "Select income range...",
        selectEducation: "Select education level...",
        selectInternet: "Select internet quality...",

        // Buttons & Headers
        back: "Back",
        next: "Next",
        save: "Save Profile",
        saving: "Saving...",
        profileTitle: "Complete Your Profile",
        readyTitle: "Ready to Finish!"
    },
    fa: {
        // Basic information - Farsi
        basicInfoTitle: "تکمیل اطلاعات اولیه",
        basicInfoDesc: "به ما کمک کنید تا با این جزئیات اولیه بهتر شما را بشناسیم.",
        firstName: "نام",
        lastName: "نام خانوادگی",
        dateOfBirth: "تاریخ تولد",
        dateOfBirthDesc: "(باید حداقل 13 سال داشته باشید)",
        ageError: "شما باید حداقل 13 سال داشته باشید",
        gender: "جنسیت",
        genderOptions: {
            male: "مرد",
            female: "زن",
            // nonBinary: "غیر دوگانه",
            preferNotToSay: "ترجیح می‌دهم نگویم"
        },
        placeOfBirth: "محل تولد",
        placeOfResidence: "محل سکونت",
        religion: "دین (اختیاری)",

        // Educational background - Farsi
        educationTitle: "سابقه تحصیلی",
        educationDesc: "تجربه‌های تحصیلی خود را به اشتراک بگذارید تا به ما کمک کند محتوای مناسب برای شما پیدا کنیم.",
        educationLevel: "سطح تحصیلات",
        educationOptions: {
            highSchool: "لیسه/صنف ده - دوازده",
            bachelors: "لیسانس",
            masters: "کارشناسی ارشد",
            phd: "دکترا",
            other: "دیگر"
        },
        englishProficiency: "مهارت زبان انگلیسی",
        englishOptions: {
            beginner: "مبتدی",
            intermediate: "متوسط",
            advanced: "پیشرفته",
            native: "زبان مادری"
        },
        toeflScore: "نمره تافل (در صورت وجود)",

        // Interests & Goals - Farsi
        interestsTitle: "علایق و اهداف",
        interestsDesc: "درباره علایق خود به ما بگویید تا بتوانیم شما را با فرصت‌های مناسب آشنا کنیم.",
        areasOfInterest: "حوزه‌های مورد علاقه",
        interestsPlaceholder: "چه موضوعات یا حوزه‌هایی برای شما جالب هستند؟ (مثلاً علوم کامپیوتر، ادبیات، پزشکی)",
        aboutMe: "درباره من",
        bioPlaceholder: "کمی درباره خودتان، پیشینه‌تان و اهداف تحصیلی‌تان بنویسید...",

        // Socioeconomic background - Farsi
        backgroundTitle: "اطلاعات",
        backgroundDesc: "این اطلاعات به ما کمک می‌کند تا مربی مناسب برای شما تعیین کنیم و فرصت‌های بورسیه را متناسب با شما کنیم. پاسخ‌های شما محرمانه باقی می‌ماند.",
        province: "ولایت",
        schoolType: "نوع مکتب",
        income: " درآمد خانوار",
        parentalEducation: "سطح تحصیلات والدین",
        internetSpeed: "کیفیت دسترسی به اینترنت",

        // Review - Farsi
        reviewTitle: "تکمیل نمایه شما!",
        reviewDesc: "همه چیز آماده است! اطلاعات خود را در زیر بررسی کنید و برای پایان روی «ذخیره نمایه» کلیک کنید.",

        // UI Elements - Farsi
        select: "انتخاب کنید...",
        selectProvince: "استان را انتخاب کنید...",
        selectSchoolType: "نوع مدرسه را انتخاب کنید...",
        selectIncome: "محدوده درآمد را انتخاب کنید...",
        selectEducation: "سطح تحصیلات را انتخاب کنید...",
        selectInternet: "کیفیت اینترنت را انتخاب کنید...",

        // Buttons & Headers - Farsi
        back: "بازگشت",
        next: "بعدی",
        save: "ذخیره نمایه",
        saving: "در حال ذخیره...",
        profileTitle: "تکمیل نمایه شما",
        readyTitle: "آماده برای پایان!"
    },
    ps: {
        // Basic information - Pashto
        basicInfoTitle: "خپل اساسي معلومات بشپړ کړئ",
        basicInfoDesc: "موږ سره مرسته وکړئ چې د دې اساسي تفصیلاتو سره ستاسو په اړه ډیر معلومات ترلاسه کړو.",
        firstName: "لومړی نوم",
        lastName: "تخلص",
        dateOfBirth: "د زیږیدنې نیټه",
        dateOfBirthDesc: "(باید لږترلږه 13 کاله عمر ولري)",
        ageError: "تاسو باید لږ تر لږه 13 کاله عمر ولرئ",
        gender: "جنسیت",
        genderOptions: {
            male: "نارینه",
            female: "ښځینه",
            // nonBinary: "غیر دوه ګونی",
            preferNotToSay: "غوره ګڼم چې ونه وایم"
        },
        placeOfBirth: "د زیږیدنې ځای",
        placeOfResidence: "د اوسیدو ځای",
        religion: "دین (اختیاري)",

        // Educational background - Pashto
        educationTitle: "تعلیمي شالید",
        educationDesc: "خپل تعلیمي تجربه شریکه کړئ ترڅو موږ سره مرسته وکړي چې تاسو د اړونده منځپانګې سره سمون ومومو.",
        educationLevel: "د زده کړې کچه",
        educationOptions: {
            highSchool: "لیسه",
            bachelors: "لیسانس",
            masters: "ماسټر",
            phd: "دوکتورا",
            other: "نور"
        },
        englishProficiency: "د انګلیسي ژبې مهارت",
        englishOptions: {
            beginner: "پیل کونکی",
            intermediate: "منځنۍ کچه",
            advanced: "پرمختللی",
            native: "مورنۍ ژبه"
        },
        toeflScore: "د ټوفل نمره (که تطبیق کیږي)",

        // Interests & Goals - Pashto
        interestsTitle: "علایق او موخې",
        interestsDesc: "موږ ته د خپلو علایقو په اړه ووایاست ترڅو موږ تاسو د اړونده فرصتونو سره وصل کړو.",
        areasOfInterest: "د علاقې ساحې",
        interestsPlaceholder: "کوم موضوعات یا ساحې تاسو ته تر ټولو زیات په زړه پورې دي؟ (لکه د کمپیوټر ساینس، ادبیات، طب)",
        aboutMe: "زما په اړه",
        bioPlaceholder: "د ځان، خپل شالید، او تعلیمي موخو په اړه یو څه شریک کړئ...",

        // Socioeconomic background - Pashto
        backgroundTitle: "د شالید معلومات",
        backgroundDesc: "دا معلومات موږ سره مرسته کوي چې تاسو ته مناسب لارښود وټاکو او د بورسونو فرصتونه ستاسو سره برابر کړو. ستاسو ځوابونه به محرم وي.",
        province: "ولایت",
        schoolType: "د ښوونځي ډول",
        income: "د کورنۍ د عاید کچه",
        parentalEducation: "د والدینو تعلیم",
        internetSpeed: "د انټرنټ د لاسرسي کیفیت",

        // Review - Pashto
        reviewTitle: "خپل پروفایل بشپړ کړئ!",
        reviewDesc: "تاسو بشپړ تیار یاست! لاندې خپل معلومات وګورئ او د بشپړولو لپاره پر \"پروفایل خوندي کړئ\" کلیک وکړئ.",

        // UI Elements - Pashto
        select: "غوره کړئ...",
        selectProvince: "ولایت غوره کړئ...",
        selectSchoolType: "د ښوونځي ډول غوره کړئ...",
        selectIncome: "د عاید حد غوره کړئ...",
        selectEducation: "د زده کړې کچه غوره کړئ...",
        selectInternet: "د انټرنټ کیفیت غوره کړئ...",

        // Buttons & Headers - Pashto
        back: "شاته",
        next: "راتلونکی",
        save: "پروفایل خوندي کړئ",
        saving: "خوندي کول...",
        profileTitle: "خپل پروفایل بشپړ کړئ",
        readyTitle: "د پای لپاره چمتو!"
    }
};

const ProfileTutorial = () => {
    const { user, profile, isProfileComplete, isAdmin, isMentor, isStudent } = useAuth();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasShownTutorial, setHasShownTutorial] = useState(false);
    const [ageError, setAgeError] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState('en'); // Default to English

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        education_level: '',
        english_level: '',
        toefl_score: '',
        interests: '',
        date_of_birth: '',
        place_of_birth: '',
        place_of_residence: '',
        bio: '',
        gender: '',
        religion: '',
        is_assigned: false,
        student_id: null,
        // New survey fields
        province: '',
        school_type: '',
        household_income_band: '',
        parental_education: '',
        internet_speed: ''
    });

    useEffect(() => {
        // Check if this is a new signup (higher priority)
        const isNewSignup = localStorage.getItem('newSignup') === 'true';

        // Check if we've shown the tutorial before in this browser
        const hasSeenTutorial = localStorage.getItem('hasSeenProfileTutorial') === 'true';

        // Only show tutorial if:
        // 1. User is logged in
        // 2. User is a student (not admin or mentor)
        // 3. This is a new signup OR profile is incomplete
        // 4. Tutorial hasn't been shown yet in this session
        // 5. User hasn't seen the tutorial before (unless it's a new signup)
        if (user && profile && isStudent && !isAdmin && !isMentor &&
            (!isProfileComplete || isNewSignup) && !hasShownTutorial && (!hasSeenTutorial || isNewSignup)) {

            // Clear the newSignup flag once used
            if (isNewSignup) {
                localStorage.removeItem('newSignup');
            }

            // Pre-fill with any existing data
            setFormData({
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                email: profile.email || user.email || '',
                education_level: profile.education_level || '',
                english_level: profile.english_level || '',
                toefl_score: profile.toefl_score || '',
                interests: profile.interests || '',
                date_of_birth: profile.date_of_birth || '',
                place_of_birth: profile.place_of_birth || '',
                place_of_residence: profile.place_of_residence || '',
                bio: profile.bio || '',
                gender: profile.gender || '',
                religion: profile.religion || '',
                is_assigned: profile.is_assigned || false,
                student_id: profile.student_id || null,
                // New survey fields
                province: profile.province || '',
                school_type: profile.school_type || '',
                household_income_band: profile.household_income_band || '',
                parental_education: profile.parental_education || '',
                internet_speed: profile.internet_speed || ''
            });

            // Show the tutorial
            setOpen(true);
            setHasShownTutorial(true); // Prevent showing multiple times in a session
        }
    }, [user, profile, isProfileComplete, isAdmin, isMentor, isStudent, hasShownTutorial]);

    // Close handler - optionally with confirmation for incomplete profiles
    const handleClose = () => {
        // If they're trying to close with incomplete info, show confirmation
        const requiredFields = ['education_level', 'english_level', 'interests'];
        const hasAllRequired = requiredFields.every(field =>
            formData[field] && formData[field].toString().trim() !== ''
        );

        if (!hasAllRequired) {
            if (window.confirm('Your profile is still incomplete. Are you sure you want to close? You can complete it later from your profile page.')) {
                setOpen(false);
                // Mark that they've seen the tutorial
                localStorage.setItem('hasSeenProfileTutorial', 'true');
            }
        } else {
            setOpen(false);
            // Mark that they've seen the tutorial
            localStorage.setItem('hasSeenProfileTutorial', 'true');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Special handling for date of birth to verify minimum age
        if (name === 'date_of_birth' && value) {
            const birthDate = new Date(value);
            const today = new Date();

            // Calculate age
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            // Adjust age if birthday hasn't occurred yet this year
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            // Check if user is at least 13 years old
            setAgeError(age < 13);
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!user) return;

        // Verify age before saving
        if (formData.date_of_birth) {
            const birthDate = new Date(formData.date_of_birth);
            const today = new Date();

            // Calculate age
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            // Adjust age if birthday hasn't occurred yet this year
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            // Check if user is at least 13 years old
            if (age < 13) {
                toast.error('You must be at least 13 years old to use this platform.');
                setAgeError(true);
                return;
            }
        }

        setLoading(true);
        try {
            // Format the data properly for database insertion
            const formattedData = {
                // Ensure user ID is included
                id: user.id,
                // Format all data fields properly to match database columns
                first_name: formData.first_name?.trim(),
                last_name: formData.last_name?.trim(),
                email: formData.email || user.email,
                education_level: formData.education_level,
                english_level: formData.english_level,
                toefl_score: formData.toefl_score ? parseInt(formData.toefl_score, 10) || null : null,
                interests: formData.interests?.trim(),
                date_of_birth: formData.date_of_birth || null,
                place_of_birth: formData.place_of_birth?.trim() || null,
                place_of_residence: formData.place_of_residence?.trim() || null,
                bio: formData.bio?.trim(),
                gender: formData.gender,
                religion: formData.religion?.trim(),
                is_assigned: formData.is_assigned || false,
                student_id: formData.student_id,
                // New survey fields
                province: formData.province,
                school_type: formData.school_type,
                household_income_band: formData.household_income_band,
                parental_education: formData.parental_education,
                internet_speed: formData.internet_speed
            };

            console.log("Saving profile data:", formattedData);

            // Update the profiles table directly
            const { error } = await supabase
                .from('profiles')
                .upsert(formattedData, {
                    onConflict: 'id',
                    returning: 'minimal'
                });

            if (error) {
                console.error("Full error details:", error);
                throw error;
            }

            toast.success('Profile updated successfully!');

            // Wait a moment before refreshing to ensure the toast is seen
            setTimeout(() => {
                // Force a page refresh to update the auth context with the new profile data
                window.location.reload();
            }, 1000);

            setOpen(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            // Show more specific error message if available
            const errorMessage = error.message || 'Failed to update profile';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Added language toggle
    const toggleLanguage = () => {
        if (currentLanguage === 'en') {
            setCurrentLanguage('fa');
        } else if (currentLanguage === 'fa') {
            setCurrentLanguage('ps');
        } else {
            setCurrentLanguage('en');
        }
    };

    // Get translated text helper function
    const t = (key) => {
        try {
            return translations[currentLanguage][key] || translations.en[key];
        } catch (error) {
            return translations.en[key] || key;
        }
    };

    // Add a new step for socioeconomic survey
    const TOTAL_STEPS = 5; // Now 5 steps including the socioeconomic survey

    const nextStep = () => {
        // Don't allow proceeding if there's an age error
        if (step === 1 && ageError) {
            toast.error('You must be at least 13 years old to use this platform.');
            return;
        }
        setStep(s => Math.min(s + 1, TOTAL_STEPS));
    };

    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <div className="bg-primary/5 p-4 rounded-lg flex items-start space-x-3">
                            <User className="text-primary mt-1" size={20} />
                            <div>
                                <h3 className="font-medium mb-1">{t('basicInfoTitle')}</h3>
                                <p className="text-sm text-gray-600">{t('basicInfoDesc')}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('firstName')}</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                    placeholder={t('firstName')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{t('lastName')}</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                    placeholder={t('lastName')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('dateOfBirth')}
                                    <span className="text-xs text-gray-500 ml-1">{t('dateOfBirthDesc')}</span>
                                </label>
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={handleChange}
                                    className={`w-full p-2 border rounded-md ${ageError ? 'border-red-500' : ''}`}
                                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                                />
                                {ageError && (
                                    <div className="text-red-500 text-xs mt-1 flex items-center">
                                        <AlertCircle size={12} className="mr-1" />
                                        {t('ageError')}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{t('gender')}</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">{t('select')}</option>
                                    <option value="male">{t('genderOptions').male}</option>
                                    <option value="female">{t('genderOptions').female}</option>
                                    <option value="non-binary">{t('genderOptions').nonBinary}</option>
                                    <option value="prefer-not-to-say">{t('genderOptions').preferNotToSay}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{t('placeOfBirth')}</label>
                                <input
                                    type="text"
                                    name="place_of_birth"
                                    value={formData.place_of_birth}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                    placeholder={t('placeOfBirth')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{t('placeOfResidence')}</label>
                                <input
                                    type="text"
                                    name="place_of_residence"
                                    value={formData.place_of_residence}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                    placeholder={t('placeOfResidence')}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium mb-1">{t('religion')}</label>
                                <input
                                    type="text"
                                    name="religion"
                                    value={formData.religion}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                    placeholder={t('religion')}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <div className="bg-primary/5 p-4 rounded-lg flex items-start space-x-3">
                            <GraduationCap className="text-primary mt-1" size={20} />
                            <div>
                                <h3 className="font-medium mb-1">{t('educationTitle')}</h3>
                                <p className="text-sm text-gray-600">{t('educationDesc')}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('educationLevel')}</label>
                                <select
                                    name="education_level"
                                    value={formData.education_level}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">{t('select')}</option>
                                    <option value="high_school">{t('educationOptions').highSchool}</option>
                                    <option value="bachelors">{t('educationOptions').bachelors}</option>
                                    <option value="masters">{t('educationOptions').masters}</option>
                                    <option value="phd">{t('educationOptions').phd}</option>
                                    <option value="other">{t('educationOptions').other}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{t('englishProficiency')}</label>
                                <select
                                    name="english_level"
                                    value={formData.english_level}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">{t('select')}</option>
                                    <option value="beginner">{t('englishOptions').beginner}</option>
                                    <option value="intermediate">{t('englishOptions').intermediate}</option>
                                    <option value="advanced">{t('englishOptions').advanced}</option>
                                    <option value="native">{t('englishOptions').native}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{t('toeflScore')}</label>
                                <input
                                    type="number"
                                    name="toefl_score"
                                    value={formData.toefl_score}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="e.g. 90"
                                    min="0"
                                    max="120"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-4">
                        <div className="bg-primary/5 p-4 rounded-lg flex items-start space-x-3">
                            <BookOpen className="text-primary mt-1" size={20} />
                            <div>
                                <h3 className="font-medium mb-1">{t('interestsTitle')}</h3>
                                <p className="text-sm text-gray-600">{t('interestsDesc')}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('areasOfInterest')}</label>
                                <textarea
                                    name="interests"
                                    value={formData.interests}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md h-24"
                                    placeholder={t('interestsPlaceholder')}
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{t('aboutMe')}</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md h-24"
                                    placeholder={t('bioPlaceholder')}
                                ></textarea>
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-4">
                        <div className="bg-primary/5 p-4 rounded-lg flex items-start space-x-3">
                            <DollarSign className="text-primary mt-1" size={20} />
                            <div>
                                <h3 className="font-medium mb-1">{t('backgroundTitle')}</h3>
                                <p className="text-sm text-gray-600">
                                    {t('backgroundDesc')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('province')}</label>
                                <select
                                    name="province"
                                    value={formData.province}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">{t('selectProvince')}</option>
                                    {PROVINCES.map(province => (
                                        <option key={province} value={province}>{province}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{t('schoolType')}</label>
                                <select
                                    name="school_type"
                                    value={formData.school_type}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">{t('selectSchoolType')}</option>
                                    {SCHOOL_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{t('income')}</label>
                                <input
                                    type="text"
                                    name="household_income_band"
                                    value={formData.household_income_band}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                    placeholder={t('income')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{t('parentalEducation')}</label>
                                <select
                                    name="parental_education"
                                    value={formData.parental_education}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">{t('selectEducation')}</option>
                                    {EDUCATION_LEVELS.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{t('internetSpeed')}</label>
                                <select
                                    name="internet_speed"
                                    value={formData.internet_speed}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">{t('selectInternet')}</option>
                                    {INTERNET_SPEEDS.map(speed => (
                                        <option key={speed} value={speed}>{speed}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-4">
                        <div className="bg-green-50 p-4 rounded-lg flex items-start space-x-3">
                            <CheckCircle className="text-green-500 mt-1" size={20} />
                            <div>
                                <h3 className="font-medium mb-1">{t('reviewTitle')}</h3>
                                <p className="text-sm text-gray-600">{t('reviewDesc')}</p>
                            </div>
                        </div>

                        <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                            <div className="p-3 flex">
                                <span className="font-medium w-1/3">{t('firstName')}:</span>
                                <span>{formData.first_name} {formData.last_name}</span>
                            </div>
                            {formData.date_of_birth && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">{t('dateOfBirth')}:</span>
                                    <span>{formData.date_of_birth}</span>
                                </div>
                            )}
                            {formData.gender && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">{t('gender')}:</span>
                                    <span>{formData.gender}</span>
                                </div>
                            )}
                            {formData.place_of_birth && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">{t('placeOfBirth')}:</span>
                                    <span>{formData.place_of_birth}</span>
                                </div>
                            )}
                            {formData.place_of_residence && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">{t('placeOfResidence')}:</span>
                                    <span>{formData.place_of_residence}</span>
                                </div>
                            )}
                            {formData.education_level && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">{t('educationLevel')}:</span>
                                    <span>{formData.education_level.replace('_', ' ')}</span>
                                </div>
                            )}
                            {formData.english_level && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">{t('englishProficiency')}:</span>
                                    <span>{formData.english_level}</span>
                                </div>
                            )}
                            {formData.toefl_score && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">{t('toeflScore')}:</span>
                                    <span>{formData.toefl_score}</span>
                                </div>
                            )}
                            {formData.interests && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">{t('areasOfInterest')}:</span>
                                    <span>{formData.interests}</span>
                                </div>
                            )}
                            {formData.province && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">{t('province')}:</span>
                                    <span>{formData.province}</span>
                                </div>
                            )}
                            {formData.school_type && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">{t('schoolType')}:</span>
                                    <span>{formData.school_type}</span>
                                </div>
                            )}
                            {formData.household_income_band && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">{t('income')}:</span>
                                    <span>{formData.household_income_band}</span>
                                </div>
                            )}
                            {formData.parental_education && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">{t('parentalEducation')}:</span>
                                    <span>{formData.parental_education}</span>
                                </div>
                            )}
                            {formData.internet_speed && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">{t('internetSpeed')}:</span>
                                    <span>{formData.internet_speed}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-50" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-500 w-10 h-10 rounded-full flex items-center justify-center text-white mr-3">
                            <User size={20} />
                        </div>
                        <DialogTitle className="text-xl">
                            {step === TOTAL_STEPS ? t('readyTitle') : `${t('profileTitle')} (${step}/${TOTAL_STEPS})`}
                        </DialogTitle>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Enhanced language toggle */}
                        <div className="flex border rounded-md overflow-hidden">
                            <button
                                onClick={() => setCurrentLanguage('en')}
                                className={`px-2 py-1 text-xs font-medium ${currentLanguage === 'en' ? 'bg-indigo-100 text-indigo-800' : 'text-gray-500 hover:bg-gray-100'}`}
                                title="English"
                            >
                                EN
                            </button>
                            <button
                                onClick={() => setCurrentLanguage('fa')}
                                className={`px-2 py-1 text-xs font-medium ${currentLanguage === 'fa' ? 'bg-indigo-100 text-indigo-800' : 'text-gray-500 hover:bg-gray-100'}`}
                                title="Farsi"
                            >
                                فا
                            </button>
                            <button
                                onClick={() => setCurrentLanguage('ps')}
                                className={`px-2 py-1 text-xs font-medium ${currentLanguage === 'ps' ? 'bg-indigo-100 text-indigo-800' : 'text-gray-500 hover:bg-gray-100'}`}
                                title="Pashto"
                            >
                                پښتو
                            </button>
                        </div>

                        <button
                            onClick={handleClose}
                            className="text-gray-500 hover:text-gray-800 rounded-md"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </DialogHeader>

                <div className="overflow-y-auto py-4 px-1 flex-grow">
                    {renderStep()}
                </div>

                <DialogFooter className="border-t pt-4 flex flex-row justify-between">
                    <div>
                        {step > 1 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={prevStep}
                                className="flex items-center"
                                disabled={loading}
                            >
                                <ArrowLeft size={16} className="mr-1" /> {t('back')}
                            </Button>
                        )}
                    </div>
                    <div>
                        {step < TOTAL_STEPS ? (
                            <Button
                                type="button"
                                onClick={nextStep}
                                className="flex items-center"
                                disabled={loading}
                            >
                                {t('next')} <ArrowRight size={16} className="ml-1" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSave}
                                className="flex items-center bg-green-600 hover:bg-green-700"
                                disabled={loading}
                            >
                                {loading ? t('saving') : t('save')} <Save size={16} className="ml-1" />
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>

            {/* Add a full-screen backdrop with high z-index to prevent welcome component showing through */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    aria-hidden="true"
                    onClick={(e) => e.stopPropagation()}
                />
            )}
        </Dialog>
    );
};

export default ProfileTutorial; 