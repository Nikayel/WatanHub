import { supabase } from '../lib/supabase';

// Always use the gemini-proxy Supabase function for security
// This avoids exposing API keys in the client-side code

// Cache for AI responses to save on API calls
const responseCache = new Map();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Helper function to create cache key
const createCacheKey = (prompt, context = '') => {
    return `${context}_${prompt.slice(0, 100)}`.toLowerCase().replace(/\s+/g, '_');
};

// Helper function to check and get cached response
const getCachedResponse = (key) => {
    const cached = responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
        console.log('Using cached response for:', key);
        return cached.response;
    }
    return null;
};

// Helper function to cache response
const setCachedResponse = (key, response) => {
    responseCache.set(key, {
        response,
        timestamp: Date.now()
    });
};

// Helper function for retry logic
const withRetry = async (fn, maxRetries = 2) => {
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            console.log(`API attempt ${attempt + 1}/${maxRetries + 1}`);
            const result = await fn();
            console.log(`API call successful on attempt ${attempt + 1}`);
            return result;
        } catch (error) {
            console.error(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error);
            lastError = error;
            // Wait before retrying with exponential backoff
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 500;
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
    console.error('All API attempts failed');
    throw lastError; // Rethrow the last error if all attempts fail
};

// School data cache for detailed information
const schoolDataCache = new Map();

// Comprehensive school database with detailed information
const SCHOOL_DATABASE = {
    'harvard university': {
        acceptanceRate: 3.4,
        location: 'Cambridge, MA',
        type: 'Private',
        founded: 1636,
        ranking: 2,
        tuition: 54269,
        internationalStudentRate: 11.3,
        averageGPA: 4.18,
        averageSAT: 1520,
        averageACT: 34,
        strongPrograms: ['Business', 'Medicine', 'Law', 'Engineering'],
        internationalTips: 'Exceptional academic record required, strong leadership experience, unique personal story'
    },
    'stanford university': {
        acceptanceRate: 3.9,
        location: 'Stanford, CA',
        type: 'Private',
        founded: 1885,
        ranking: 6,
        tuition: 56169,
        internationalStudentRate: 8.7,
        averageGPA: 4.17,
        averageSAT: 1505,
        averageACT: 33,
        strongPrograms: ['Computer Science', 'Engineering', 'Business', 'Medicine'],
        internationalTips: 'Strong STEM background preferred, entrepreneurial spirit, innovation mindset'
    },
    'massachusetts institute of technology': {
        acceptanceRate: 6.7,
        location: 'Cambridge, MA',
        type: 'Private',
        founded: 1861,
        ranking: 2,
        tuition: 53790,
        internationalStudentRate: 9.6,
        averageGPA: 4.17,
        averageSAT: 1535,
        averageACT: 35,
        strongPrograms: ['Engineering', 'Computer Science', 'Physics', 'Mathematics'],
        internationalTips: 'Exceptional math/science skills, research experience, maker mentality'
    },
    'university of california berkeley': {
        acceptanceRate: 14.5,
        location: 'Berkeley, CA',
        type: 'Public',
        founded: 1868,
        ranking: 22,
        tuition: 14254,
        internationalStudentRate: 15.2,
        averageGPA: 4.0,
        averageSAT: 1420,
        averageACT: 32,
        strongPrograms: ['Engineering', 'Computer Science', 'Business', 'Public Policy'],
        internationalTips: 'Strong academics, diverse experiences, social impact focus'
    },
    'university of california los angeles': {
        acceptanceRate: 12.3,
        location: 'Los Angeles, CA',
        type: 'Public',
        founded: 1919,
        ranking: 20,
        tuition: 13258,
        internationalStudentRate: 11.8,
        averageGPA: 4.0,
        averageSAT: 1405,
        averageACT: 31,
        strongPrograms: ['Film', 'Business', 'Engineering', 'Medicine'],
        internationalTips: 'Well-rounded profile, creative pursuits, leadership in community'
    }
    // Add more schools as needed
};

// Get detailed school information
const getSchoolData = (schoolName) => {
    const key = schoolName.toLowerCase().trim();
    return SCHOOL_DATABASE[key] || null;
};

// Gemini API Service
export const geminiService = {
    // Common predefined responses for fallbacks
    fallbackResponses: {
        schoolTypes: `Here's information about school types for your college application strategy:

🎯 **Target Schools** are schools where your academic profile (GPA, test scores, etc.) matches their typical admitted student profile. You have a reasonable chance (40-70%) of being accepted.

🔒 **Safety Schools** are schools where your academic credentials exceed their typical requirements, giving you a high probability (70-90%) of acceptance. These provide a backup option.

⭐ **Stretch Schools** (sometimes called "reach schools") are more selective institutions where your profile may be below their typical admitted student. Acceptance chances are lower (less than 30%), but still possible.

A balanced application portfolio typically includes:
- 4-5 Target Schools
- 2-3 Safety Schools
- 1-2 Stretch Schools`,

        applicationTips: `Here are some general college application tips:

1. Start early - begin preparing applications at least 6 months before deadlines
2. Research each school thoroughly to customize your applications
3. Request recommendation letters well in advance
4. Craft a compelling personal statement that showcases your unique qualities
5. Highlight extracurricular activities that demonstrate leadership and commitment
6. Prepare thoroughly for interviews
7. Keep track of all deadlines and requirements in an organized system
8. Proofread everything multiple times before submitting`,

        welcomeMessage: `Welcome to your AI college advisor! I can help you with:
- Understanding different types of schools
- Application strategies
- College selection advice
- Preparing for interviews and essays
- And much more!

What would you like to know about today?`
    },

    // Enhanced school-specific insights with detailed information for students
    getSchoolInsight: async (school, isForMentor = false, studentProfile = null) => {
        return withRetry(async () => {
            try {
                const cacheKey = createCacheKey(`school_insight_${school.school_name}_${school.preference_type}_${school.major_name}`, isForMentor ? 'mentor' : 'student');
                const cachedResponse = getCachedResponse(cacheKey);
                if (cachedResponse) return cachedResponse;

                const schoolData = getSchoolData(school.school_name);

                let profileContext = '';
                if (studentProfile) {
                    profileContext = `
Student Profile Context:
- GPA: ${studentProfile.gpa || 'Not provided'}
- TOEFL Score: ${studentProfile.toefl_score || 'Not provided'}
- Extracurriculars: ${studentProfile.extracurricular_activities || 'Not provided'}
- Academic Interests: ${studentProfile.interests || 'Not provided'}
- Year in School: ${studentProfile.year_in_school || 'Not provided'}
- Education Level: ${studentProfile.education_level || 'Not provided'}`;
                }

                if (isForMentor) {
                    // Mentor-focused prompt - guidance and strategy
                    const prompt = `As an experienced college counselor reviewing a student's school choice, provide specific guidance about ${school.school_name} as a ${school.preference_type} school choice for ${school.major_name} major.

${profileContext}

School Information: ${school.school_name}
- Preference Type: ${school.preference_type}
- Major: ${school.major_name}
- Application Status: ${school.application_status || 'Planning'}

Please provide:
1. Assessment of whether this is appropriately categorized as a ${school.preference_type} school
2. Specific mentoring advice for this application
3. Key discussion points for mentor-student conversations
4. Red flags or concerns to address
5. One specific strategy tip for success at this school

Keep response under 200 words, actionable and mentor-focused.`;

                    const response = await this.callGeminiAPI(prompt, 300);
                    setCachedResponse(cacheKey, response);
                    return response;
                } else {
                    // Student-focused prompt - detailed information with school data if available
                    let schoolInfo = '';
                    if (schoolData) {
                        schoolInfo = `
Known School Data for ${school.school_name}:
- Location: ${schoolData.location}
- Type: ${schoolData.type} university
- Acceptance Rate: ${schoolData.acceptanceRate}%
- International Student Rate: ${schoolData.internationalStudentRate}%
- Average GPA: ${schoolData.averageGPA}
- Average SAT: ${schoolData.averageSAT}
- Strong Programs: ${schoolData.strongPrograms.join(', ')}
- Annual Tuition: $${schoolData.tuition.toLocaleString()}
- International Tips: ${schoolData.internationalTips}`;
                    }

                    const prompt = `Provide comprehensive, personalized information about ${school.school_name} for a student interested in ${school.major_name} as a ${school.preference_type} school choice.

${profileContext}
${schoolInfo}

Student's School Choice:
- School: ${school.school_name}
- Major: ${school.major_name}
- Preference Type: ${school.preference_type}

Based on the student's profile and this being a ${school.preference_type} school, provide:
1. Honest assessment of their admission chances
2. Specific program strengths in ${school.major_name}
3. What makes a competitive applicant for this school
4. Application tips specific to this institution
5. Campus culture and student life insights
6. Financial considerations (if relevant)

Be honest, specific, and encouraging while providing realistic expectations. Keep under 300 words.`;

                    const response = await this.callGeminiAPI(prompt, 400);
                    setCachedResponse(cacheKey, response);
                    return response;
                }
            } catch (error) {
                console.error(`Error getting insight for ${school.school_name}:`, error);

                // Provide more specific fallbacks that acknowledge we can't make API calls
                if (isForMentor) {
                    return `I'm unable to provide AI analysis right now. Please discuss with your student:
• Whether ${school.school_name} is appropriately categorized as ${school.preference_type}
• Research specific admission requirements for ${school.major_name}
• Review application deadlines and requirements
• Consider visiting the school's website or attending information sessions
• Help them connect with current students or alumni if possible`;
                } else {
                    const schoolData = getSchoolData(school.school_name);
                    if (schoolData) {
                        return `**${school.school_name} - ${school.major_name}**

**School Information:**
• Location: ${schoolData.location}
• Acceptance Rate: ${schoolData.acceptanceRate}%
• Type: ${schoolData.type} university
• Strong Programs: ${schoolData.strongPrograms.join(', ')}
• Average GPA: ${schoolData.averageGPA}
• International Student Rate: ${schoolData.internationalStudentRate}%

**For Your ${school.preference_type.charAt(0).toUpperCase() + school.preference_type.slice(1)} School:**
${schoolData.internationalTips}

I recommend researching their specific ${school.major_name} program, connecting with admissions counselors, and discussing this choice with your mentor for personalized guidance.`;
                    } else {
                        return `I'm unable to provide detailed AI analysis for ${school.school_name} right now. Please:
• Research their ${school.major_name} program thoroughly
• Check admission requirements and deadlines
• Contact their admissions office directly
• Discuss this choice with your mentor
• Consider attending virtual information sessions

Your mentor can provide personalized guidance based on your profile and goals.`;
                    }
                }
            }
        });
    },

    // Enhanced mentor-focused chat with caching and professional guidance
    getMentorChatResponse: async (query, studentContext = '') => {
        const cacheKey = createCacheKey(query, 'mentor');
        const cachedResponse = getCachedResponse(cacheKey);
        if (cachedResponse) return cachedResponse;

        return withRetry(async () => {
            try {
                const prompt = `You are an AI assistant helping a college mentor guide their student. 

${studentContext ? `Student Context: ${studentContext}` : ''}

Mentor Question: "${query}"

Provide professional mentoring guidance focusing on:
1. Actionable advice for the mentor
2. Strategies to help their student succeed
3. How to have productive conversations with the student
4. Specific next steps or resources

Keep response practical and mentor-focused, under 200 words.`;

                const response = await this.callGeminiAPI(prompt, 300);
                setCachedResponse(cacheKey, response);
                return response;
            } catch (error) {
                console.error('Error getting mentor chat response:', error);

                const lowerQuery = query.toLowerCase();
                if (lowerQuery.includes('school') && lowerQuery.includes('choice')) {
                    return "Help your student create a balanced list with safety, target, and stretch schools. Review their academic profile together and research each school's requirements. Encourage them to visit campuses when possible and connect with current students.";
                }

                if (lowerQuery.includes('application') || lowerQuery.includes('essay')) {
                    return "Guide your student to start applications early. Help them brainstorm essay topics that showcase their unique experiences. Review their drafts together and ensure each application is tailored to the specific school.";
                }

                return "Focus on building a supportive relationship with your student. Listen to their concerns, provide encouragement, and help them break down complex tasks into manageable steps. Regular check-ins are key to successful mentoring.";
            }
        });
    },

    // Enhanced student chat with detailed school information
    getStudentChatResponse: async (query, studentProfile = null) => {
        const cacheKey = createCacheKey(query, 'student');
        const cachedResponse = getCachedResponse(cacheKey);
        if (cachedResponse) return cachedResponse;

        return withRetry(async () => {
            try {
                let contextInfo = '';
                if (studentProfile) {
                    contextInfo = `Student Background: GPA: ${studentProfile.gpa || 'Not specified'}, Year: ${studentProfile.year_in_school || 'Not specified'}, Interests: ${studentProfile.extracurricular_activities || 'Not specified'}`;
                }

                const prompt = `You are helping a college-bound student with their questions.

${contextInfo}

Student Question: "${query}"

If asking about a specific school, include:
- Acceptance rate and competitiveness
- Location and campus culture
- Strong academic programs
- Tips for international students (if applicable)
- Application strategies
- What makes a strong candidate

If asking about general topics:
- Provide clear, helpful information
- Include actionable next steps
- Be encouraging and supportive

Keep response informative but concise, under 250 words.`;

                const response = await this.callGeminiAPI(prompt, 350);
                setCachedResponse(cacheKey, response);
                return response;
            } catch (error) {
                console.error('Error getting student chat response:', error);
                return this.getSchoolChatResponse(query); // Fallback to existing method
            }
        });
    },

    // Common API call function
    callGeminiAPI: async (prompt, maxTokens = 300) => {
        // In production, call a secure serverless function
        const { data, error } = await supabase.functions.invoke('gemini-proxy', {
            body: { prompt, maxTokens }
        });
        if (error) throw new Error(error.message);
        return data.text;
    },

    // Get AI feedback on school choices with enhanced mentor/student context
    getSchoolChoicesFeedback: async (schoolChoices, isForMentor = true, studentProfile = null) => {
        return withRetry(async () => {
            try {
                const cacheKey = createCacheKey(`school_choices_${schoolChoices.length}_${schoolChoices.map(s => s.preference_type).join('_')}`, isForMentor ? 'mentor' : 'student');
                const cachedResponse = getCachedResponse(cacheKey);
                if (cachedResponse) return cachedResponse;

                const schoolData = schoolChoices.map(school => (
                    `${school.preference_type.toUpperCase()} SCHOOL: ${school.school_name} - ${school.major_name} (Status: ${school.application_status})`
                )).join('\n');

                let prompt;
                if (isForMentor) {
                    prompt = `As a college mentor reviewing a student's school choices:

STUDENT'S CURRENT CHOICES:
${schoolData}

Provide mentoring guidance on:
1. Balance of target/safety/stretch schools
2. Specific recommendations for improvement
3. Conversation starters with the student
4. Red flags or missing elements
5. Next mentoring steps

Keep response actionable and mentor-focused, under 300 words.`;
                } else {
                    let profileContext = '';
                    if (studentProfile) {
                        profileContext = `Your Profile: GPA: ${studentProfile.gpa || 'N/A'}, Year: ${studentProfile.year_in_school || 'N/A'}`;
                    }

                    prompt = `Here are your current school choices:
${schoolData}

${profileContext}

Provide personalized feedback on:
1. Balance of your school list (safety/target/stretch)
2. Specific schools you might consider adding
3. Application strategy for your current choices
4. Timeline and next steps
5. Questions to discuss with your mentor

Be encouraging and specific. Under 350 words.`;
                }

                const response = await this.callGeminiAPI(prompt, isForMentor ? 400 : 450);
                setCachedResponse(cacheKey, response);
                return response;
            } catch (error) {
                console.error('Error getting AI feedback:', error);

                if (isForMentor) {
                    return "Review the student's school balance - ensure they have adequate safety schools, realistic targets, and not too many reach schools. Help them research each school's specific requirements and encourage campus visits when possible.";
                } else {
                    return "Your school choices look good! Make sure you have a balanced list with safety schools (70-90% acceptance chance), target schools (40-70% chance), and 1-2 stretch schools. Research each school thoroughly and visit if possible.";
                }
            }
        });
    },

    // Legacy method for backward compatibility
    getSchoolChatResponse: async (query) => {
        return this.getStudentChatResponse(query);
    },

    // Scan user profile for completeness with better fallbacks
    analyzeProfileCompleteness: async (profile) => {
        return withRetry(async () => {
            try {
                const cacheKey = createCacheKey(`profile_analysis_${Object.keys(profile).length}`, 'profile');
                const cachedResponse = getCachedResponse(cacheKey);
                if (cachedResponse) return cachedResponse;

                // Convert profile to a string representation
                const profileData = Object.entries(profile)
                    .map(([key, value]) => {
                        if (value === null || value === undefined || value === '') {
                            return `${key}: MISSING`;
                        }
                        return `${key}: ${value}`;
                    })
                    .join('\n');

                const prompt = `I need to evaluate a user profile for completeness. Here is the profile data:\n\n${profileData}\n\nPlease:
1. Identify which important fields are missing or incomplete
2. Explain why these fields are important for college applications
3. Prioritize the missing information (High/Medium/Low importance)
4. Give specific tips on what information to provide
Format your response as a structured list of recommendations.`;

                const response = await this.callGeminiAPI(prompt, 500);
                setCachedResponse(cacheKey, response);
                return response;
            } catch (error) {
                console.error('Error analyzing profile completeness:', error);

                // Generate a fallback based on common missing fields
                let missingFields = [];
                const criticalFields = ['first_name', 'last_name', 'email', 'date_of_birth'];
                const importantFields = ['high_school', 'gpa', 'year_in_school', 'extracurricular_activities'];

                for (const field of criticalFields) {
                    if (!profile[field]) {
                        missingFields.push(`- ${field.replace('_', ' ')} (Critical): This is essential information for your application.`);
                    }
                }

                for (const field of importantFields) {
                    if (!profile[field]) {
                        missingFields.push(`- ${field.replace('_', ' ')} (Important): This helps colleges understand your academic background.`);
                    }
                }

                if (missingFields.length === 0) {
                    return "Your profile is quite complete! Consider adding any additional achievements or extracurricular activities to further strengthen your profile.";
                } else {
                    return "Here are some recommendations to complete your profile:\n\n" + missingFields.join('\n');
                }
            }
        });
    }
};

// Fix the export to avoid eslint warning
const apiService = {
    geminiService
};

export default apiService; 