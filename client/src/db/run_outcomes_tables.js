// Run this script to create the student outcomes tables in your Supabase database
// Usage: node run_outcomes_tables.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Create Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    try {
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'student_outcomes_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Creating student outcomes tables...');

        // Execute the SQL
        const { data, error } = await supabase.rpc('pgmoon_execute_sql', {
            query_text: sql
        });

        if (error) {
            console.error('Error executing SQL:', error);
            return;
        }

        console.log('Student outcomes tables created successfully!');
        console.log('Tables created:');
        console.log('- college_admissions');
        console.log('- scholarship_awards');
        console.log('- student_employment');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

main(); 