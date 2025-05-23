# Supabase Edge Functions

This directory contains Edge Functions for the WatanHub application. Edge Functions are server-side JavaScript/TypeScript functions that run close to your users, providing a secure way to execute sensitive operations.

## Available Functions

### `gemini-proxy`

A secure proxy for Google's Gemini API that keeps your API key safe on the server side. This function handles:

- School choice feedback generation
- School-specific insights
- Profile completeness analysis

## Local Development

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Start the local development server:
   ```bash
   supabase start
   ```

3. Serve your Edge Functions locally:
   ```bash
   supabase functions serve
   ```

4. Test locally with curl:
   ```bash
   curl -i --location --request POST 'http://localhost:54321/functions/v1/gemini-proxy' \
   --header 'Authorization: Bearer YOUR_ANON_KEY' \
   --header 'Content-Type: application/json' \
   --data '{"prompt":"Give me a brief summary of Harvard University","maxTokens":150}'
   ```

## Deployment

To deploy an Edge Function to your Supabase project:

1. Link to your Supabase project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

2. Set up the required secrets:
   ```bash
   supabase secrets set GEMINI_API_KEY=your_actual_gemini_api_key
   ```

3. Deploy the function:
   ```bash
   supabase functions deploy gemini-proxy
   ```

4. Test the deployed function:
   ```bash
   curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/gemini-proxy' \
   --header 'Authorization: Bearer YOUR_ANON_KEY' \
   --header 'Content-Type: application/json' \
   --data '{"prompt":"Give me a brief summary of Harvard University","maxTokens":150}'
   ```

## Security Considerations

- Your API keys are stored as secrets in Supabase and are not exposed to clients
- The Edge Function handles CORS and proper response formatting
- Rate limiting should be implemented in production to prevent abuse

## Troubleshooting

If you encounter errors:

1. Check the function logs:
   ```bash
   supabase functions logs gemini-proxy --project-ref YOUR_PROJECT_REF
   ```

2. Verify your secrets are set correctly:
   ```bash
   supabase secrets list
   ```

3. Make sure your Supabase client is configured to use the correct URL in production 