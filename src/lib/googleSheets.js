import { google } from 'googleapis';
import { supabase } from './supabase';
import dotenv from 'dotenv';

dotenv.config();

// Google Sheets credentials using environment variables
const credentials = {
    "type": "service_account",
    "project_id": process.env.GOOGLE_PROJECT_ID,
    "private_key_id": process.env.GOOGLE_PRIVATE_KEY_ID, // You might also move this to the .env if needed
    "private_key": process.env.GOOGLE_PRIVATE_KEY,
    "client_email": process.env.GOOGLE_CLIENT_EMAIL,
    "client_id": "101393061589231124716", // Optional: move to env if desired
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/watanhub%40noble-catcher-456521-a0.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
};

// Configure Google Sheets API
const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

/* 
  IMPORTANT: Replace the SPREADSHEET_ID below with your actual Google Sheet ID
  
  How to find your spreadsheet ID:
  1. Create a new Google Sheet or use an existing one
  2. Look at the URL in your browser when viewing the sheet. It will look like:
     https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID_HERE/edit
  3. Copy the YOUR_SPREADSHEET_ID_HERE part and paste it below
  
  Setting up your sheet:
  1. Create a sheet called "Users" with the following column headers in row 1:
     "ID", "Email", "Full Name", "Phone", "Education Level", "Field of Study", 
     "Institution", "Location", "Created Date"
  2. Share your spreadsheet with the service account email:
     watanhub@noble-catcher-456521-a0.iam.gserviceaccount.com
     and give it "Editor" permissions
*/
const SPREADSHEET_ID = 'your-spreadsheet-id-here'; // REPLACE THIS WITH YOUR ACTUAL SPREADSHEET ID

/**
 * Add a user to the Google Sheet
 * @param {Object} userData - User data to add
 * @returns {Promise<Object>} - API response
 */
export const addUserToSheet = async (userData) => {
    try {
        // Format user data for the sheet
        const values = [
            [
                userData.id || '',
                userData.email || '',
                userData.full_name || '',
                userData.phone || '',
                userData.education_level || '',
                userData.field_of_study || '',
                userData.institution || '',
                userData.location || '',
                new Date().toISOString() // timestamp
            ]
        ];

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Users!A:I', // Adjust range as needed
            valueInputOption: 'RAW',
            resource: { values },
        });

        console.log('User added to Google Sheet:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error adding user to Google Sheet:', error);
        throw error;
    }
};

/**
 * Sync all users from Supabase to Google Sheets
 */
export const syncUsersToSheet = async () => {
    try {
        // Get all users from Supabase
        const { data: users, error } = await supabase
            .from('users')
            .select('*');

        if (error) throw error;

        if (!users || users.length === 0) {
            console.log('No users found to sync');
            return;
        }

        // Format all users for the sheet
        const values = users.map(user => [
            user.id || '',
            user.email || '',
            user.full_name || '',
            user.phone || '',
            user.education_level || '',
            user.field_of_study || '',
            user.institution || '',
            user.location || '',
            user.created_at || new Date().toISOString()
        ]);

        // First, clear existing data
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Users!A2:I', // Clear everything except headers
        });

        // Then, add all users
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Users!A:I',
            valueInputOption: 'RAW',
            resource: { values },
        });

        console.log('Users synced to Google Sheet:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error syncing users to Google Sheet:', error);
        throw error;
    }
};

/**
 * Get all users from the Google Sheet
 */
export const getUsersFromSheet = async () => {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Users!A:I',
        });

        const rows = response.data.values;

        if (!rows || rows.length <= 1) {
            // No data or only headers
            return [];
        }

        // Convert rows to objects with proper keys
        const headers = rows[0];
        const users = rows.slice(1).map(row => {
            const user = {};
            headers.forEach((header, index) => {
                user[header.toLowerCase().replace(' ', '_')] = row[index] || '';
            });
            return user;
        });

        return users;
    } catch (error) {
        console.error('Error getting users from Google Sheet:', error);
        throw error;
    }
};

export default {
    addUserToSheet,
    syncUsersToSheet,
    getUsersFromSheet
};
