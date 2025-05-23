import { supabase } from '../lib/supabase';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Configure to use either direct API calls (development) or serverless functions (production)
const isProduction = process.env.NODE_ENV === 'production';

// Initialize the Google GenAI SDK (only for development)
let genAI = null;
if (!isProduction) {
    const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
    if (API_KEY) {
        genAI = new GoogleGenerativeAI(API_KEY);
        console.log("Gemini API initialized with API key");
    } else {
        console.warn("Gemini API key not found. AI features will use the serverless function.");
    }
}

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

    // Get AI feedback on school choices with better error handling
    getSchoolChoicesFeedback: async (schoolChoices, isForMentor = true) => {
        return withRetry(async () => {
            try {
                const schoolData = schoolChoices.map(school => (
                    `${school.preference_type.toUpperCase()} SCHOOL: ${school.school_name} - ${school.major_name} (Status: ${school.application_status})`
                )).join('\n');

                const prompt = `I'm ${isForMentor ? 'a mentor helping a student' : 'a student'} with college applications. Here are the current school choices:\n${schoolData}\n\nPlease provide brief, actionable feedback on:
1. The balance of target/safety/stretch schools
2. Any suggestions for specific schools to add or reconsider
3. Next steps for application preparation
4. Any potential areas of concern or opportunities
${isForMentor ? '5. How to guide the student in making better choices' : '5. What to discuss with my mentor about these choices'}

Please structure your response in bullet points or short paragraphs for easy readability.`;

                // In production, call a secure serverless function
                if (isProduction) {
                    // Use Supabase Edge Function
                    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
                        body: { prompt, maxTokens: 800 }
                    });

                    if (error) throw new Error(error.message);
                    return data.text;
                } else {
                    // Use Google GenAI SDK in development
                    if (!genAI) {
                        // If SDK not initialized, try using the edge function as fallback
                        const { data, error } = await supabase.functions.invoke('gemini-proxy', {
                            body: { prompt, maxTokens: 800 }
                        });
                        if (error) throw new Error(error.message);
                        return data.text;
                    }

                    const model = genAI.getGenerativeModel({
                        model: "gemini-pro",
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 800,
                        }
                    });

                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    return response.text();
                }
            } catch (error) {
                console.error('Error getting AI feedback:', error);

                // Use pre-defined fallback response based on school choices
                let fallbackResponse = "Based on your school choices, I'd recommend ensuring you have a good balance of target, safety, and stretch schools. Consider discussing with your mentor which categories might need more options.";

                if (schoolChoices.length === 0) {
                    fallbackResponse = "You haven't added any schools yet. I recommend adding 4-5 target schools, 2-3 safety schools, and 1-2 stretch schools for a balanced application strategy.";
                }

                return fallbackResponse;
            }
        });
    },

    // Get school-specific insights with more reliable fallbacks
    getSchoolInsight: async (school) => {
        return withRetry(async () => {
            try {
                const prompt = `Provide a brief, helpful insight about ${school.school_name} for a ${school.preference_type} school choice with intended major ${school.major_name}.
Include (if possible):
1. Approximate acceptance rate
2. Strong programs or reputation in ${school.major_name}
3. One brief tip for application success
Keep response very concise, under 100 words.`;

                // In production, call a secure serverless function
                if (isProduction) {
                    // Use Supabase Edge Function
                    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
                        body: { prompt, maxTokens: 150 }
                    });

                    if (error) throw new Error(error.message);
                    return data.text;
                } else {
                    // Use Google GenAI SDK in development
                    if (!genAI) {
                        // If SDK not initialized, try using the edge function as fallback
                        const { data, error } = await supabase.functions.invoke('gemini-proxy', {
                            body: { prompt, maxTokens: 150 }
                        });
                        if (error) throw new Error(error.message);
                        return data.text;
                    }

                    const model = genAI.getGenerativeModel({
                        model: "gemini-pro",
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 150,
                        }
                    });

                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    return response.text();
                }
            } catch (error) {
                console.error(`Error getting insight for ${school.school_name}:`, error);

                // Use pre-defined fallback response based on school type
                const fallbackResponses = {
                    target: `${school.school_name} is a solid target school for your profile with the ${school.major_name} program. Focus on showcasing your relevant experiences and academic achievements in your application.`,
                    safety: `${school.school_name} is a good safety option with your qualifications. Their ${school.major_name} program would likely be accessible to you. Still put effort into your application to maximize scholarship opportunities.`,
                    stretch: `${school.school_name} is a competitive stretch school. Their ${school.major_name} program is selective, but with a strong application emphasizing your unique qualities and achievements, you have a chance.`
                };

                return fallbackResponses[school.preference_type] ||
                    `${school.school_name} with a ${school.major_name} major is a good choice. Make sure to research specific program requirements and application deadlines.`;
            }
        });
    },

    // Enhanced chat response function with local fallbacks
    getSchoolChatResponse: async (query) => {
        // Define common queries and their responses
        const localResponses = {
            schoolTypes: geminiService.fallbackResponses.schoolTypes,
            applicationTips: geminiService.fallbackResponses.applicationTips,
            welcome: geminiService.fallbackResponses.welcomeMessage
        };

        // Check if query matches any of our predefined responses
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes('type') && (lowerQuery.includes('school') || lowerQuery.includes('college'))) {
            console.log("Using local response for school types");
            return localResponses.schoolTypes;
        }

        if ((lowerQuery.includes('tip') || lowerQuery.includes('advice')) &&
            (lowerQuery.includes('application') || lowerQuery.includes('apply'))) {
            console.log("Using local response for application tips");
            return localResponses.applicationTips;
        }

        // For other queries, try the API
        return withRetry(async () => {
            try {
                const prompt = `Please provide a helpful, informative response to this question about a college or university: "${query}"
                
If this is about a specific school:
1. Include location, founding year, and type (public/private)
2. Mention acceptance rate and notable programs if relevant
3. Share 1-2 interesting facts about the school
4. If appropriate, provide brief application advice

If this is a general question about college applications or school types:
1. Provide clear, factual information
2. Include relevant context and considerations
3. Be educational and helpful

Keep your response concise (under 150 words) and focus on being informative rather than promotional.`;

                // In production, call a secure serverless function
                if (isProduction) {
                    // Use Supabase Edge Function
                    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
                        body: { prompt, maxTokens: 300 }
                    });

                    if (error) throw new Error(error.message);
                    return data.text;
                } else {
                    // Use Google GenAI SDK in development
                    if (!genAI) {
                        // If SDK not initialized, try using the edge function as fallback
                        const { data, error } = await supabase.functions.invoke('gemini-proxy', {
                            body: { prompt, maxTokens: 300 }
                        });
                        if (error) throw new Error(error.message);
                        return data.text;
                    }

                    const model = genAI.getGenerativeModel({
                        model: "gemini-pro",
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 300,
                        }
                    });

                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    return response.text();
                }
            } catch (error) {
                console.error('Error getting school chat response:', error);

                // Return a generic response based on query keywords
                if (lowerQuery.includes('how') && lowerQuery.includes('apply')) {
                    return "To apply to colleges, start by researching schools that match your academic profile and interests. Create a balanced list of safety, target, and reach schools. Complete the Common App or school-specific applications, write compelling essays, gather recommendation letters, and submit before deadlines. Consider financial aid and scholarship applications as well.";
                }

                if (lowerQuery.includes('essay') || lowerQuery.includes('personal statement')) {
                    return "College essays should tell your unique story in an authentic voice. Focus on specific experiences that shaped you, avoid clichés, be reflective rather than descriptive, and have others review your writing. Start early and revise multiple times for the best results.";
                }

                // Default generic response
                return "I'd be happy to help with your college application questions. For specific school information, you might want to check the university's official website or contact their admissions office directly for the most accurate information.";
            }
        });
    },

    // Scan user profile for completeness with better fallbacks
    analyzeProfileCompleteness: async (profile) => {
        return withRetry(async () => {
            try {
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

                // In production, call a secure serverless function
                if (isProduction) {
                    // Use Supabase Edge Function
                    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
                        body: { prompt, maxTokens: 500 }
                    });

                    if (error) throw new Error(error.message);
                    return data.text;
                } else {
                    // Use Google GenAI SDK in development
                    if (!genAI) {
                        // If SDK not initialized, try using the edge function as fallback
                        const { data, error } = await supabase.functions.invoke('gemini-proxy', {
                            body: { prompt, maxTokens: 500 }
                        });
                        if (error) throw new Error(error.message);
                        return data.text;
                    }

                    const model = genAI.getGenerativeModel({
                        model: "gemini-pro",
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 500,
                        }
                    });

                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    return response.text();
                }
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