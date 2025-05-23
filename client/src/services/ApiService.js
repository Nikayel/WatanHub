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
            return await fn();
        } catch (error) {
            console.error(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error);
            lastError = error;
            // Wait before retrying with exponential backoff
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
            }
        }
    }
    throw lastError; // Rethrow the last error if all attempts fail
};

// Gemini API Service
export const geminiService = {
    // Get AI feedback on school choices
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
                throw error;
            }
        });
    },

    // Get school-specific insights
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
                throw error;
            }
        });
    },

    // Get response to school-related chat queries
    getSchoolChatResponse: async (query) => {
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
                throw error;
            }
        });
    },

    // Scan user profile for completeness and provide recommendations
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
                throw error;
            }
        });
    }
};

// Fix the export to avoid eslint warning
const apiService = {
    geminiService
};

export default apiService; 