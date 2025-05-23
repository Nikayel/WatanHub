// Follow the Deno Deploy runtime docs: https://deno.com/deploy/docs/runtime-api
// This Supabase Edge Function securely proxies requests to the Gemini API
// without exposing the API key to the client

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, {
            headers: CORS_HEADERS,
            status: 204,
        });
    }

    try {
        // Parse request data
        const requestData = await req.json();
        const { prompt, maxTokens = 500, temperature = 0.7 } = requestData;

        if (!prompt) {
            return new Response(
                JSON.stringify({ error: "Prompt is required" }),
                {
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                    status: 400,
                }
            );
        }

        // Get the API key from environment variables
        const API_KEY = Deno.env.get("GEMINI_API_KEY");
        if (!API_KEY) {
            return new Response(
                JSON.stringify({ error: "API key not configured" }),
                {
                    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                    status: 500,
                }
            );
        }

        // Initialize Google GenAI
        const genAI = new GoogleGenerativeAI(API_KEY);

        // Configure the model
        const model = genAI.getGenerativeModel({
            model: "gemini-pro",
            generationConfig: {
                temperature: temperature,
                maxOutputTokens: maxTokens,
            }
        });

        // Generate the content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Return the result
        return new Response(
            JSON.stringify({ text }),
            {
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error) {
        console.error("Error processing request:", error);

        return new Response(
            JSON.stringify({ error: error.message || "An unknown error occurred" }),
            {
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
                status: 500,
            }
        );
    }
}); 