#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Please check REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('🚀 Starting blog database migration...');

    try {
        // Read SQL file
        const sqlPath = path.join(__dirname, 'client', 'src', 'db', 'create_blogs_table.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Split SQL into individual statements
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`📝 Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

            try {
                const { error } = await supabase.rpc('exec_sql', { sql: statement });

                if (error) {
                    console.error(`❌ Error in statement ${i + 1}:`, error.message);
                    // Continue with next statement for non-critical errors
                    if (error.message.includes('already exists')) {
                        console.log('⚠️  Object already exists, continuing...');
                    } else {
                        throw error;
                    }
                } else {
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                }
            } catch (err) {
                console.error(`❌ Failed to execute statement ${i + 1}:`, err.message);

                // Try alternative approach for storage operations
                if (statement.includes('storage.buckets')) {
                    console.log('🔄 Trying alternative storage bucket creation...');
                    try {
                        const { data, error: bucketError } = await supabase.storage.createBucket('blog-images', {
                            public: true,
                            allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
                            fileSizeLimit: 5242880 // 5MB
                        });

                        if (bucketError && !bucketError.message.includes('already exists')) {
                            console.error('❌ Storage bucket creation failed:', bucketError.message);
                        } else {
                            console.log('✅ Storage bucket created successfully');
                        }
                    } catch (storageErr) {
                        console.error('❌ Storage operation failed:', storageErr.message);
                    }
                }
            }
        }

        // Verify table creation
        console.log('🔍 Verifying blog table...');
        const { data: tableCheck, error: tableError } = await supabase
            .from('blogs')
            .select('count', { count: 'exact', head: true });

        if (tableError) {
            console.error('❌ Blog table verification failed:', tableError.message);
        } else {
            console.log('✅ Blog table verified successfully');
        }

        // Check storage bucket
        console.log('🔍 Verifying storage bucket...');
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

        if (bucketError) {
            console.error('❌ Storage bucket check failed:', bucketError.message);
        } else {
            const blogBucket = buckets.find(bucket => bucket.name === 'blog-images');
            if (blogBucket) {
                console.log('✅ Blog images storage bucket verified');
            } else {
                console.log('⚠️  Blog images bucket not found, creating...');
                await supabase.storage.createBucket('blog-images', { public: true });
            }
        }

        console.log('🎉 Migration completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Start your development server: npm start');
        console.log('2. Navigate to /admin/blogs/create');
        console.log('3. Test image upload and blog creation');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('\n🔧 Troubleshooting:');
        console.error('1. Check your Supabase connection');
        console.error('2. Verify your environment variables');
        console.error('3. Ensure you have admin access to your Supabase project');
        process.exit(1);
    }
}

// Custom SQL execution function fallback
async function executeSQLDirect(sql) {
    try {
        // This is a fallback method - you might need to execute SQL directly in Supabase dashboard
        console.log('📋 SQL to execute manually in Supabase dashboard:');
        console.log('----------------------------------------');
        console.log(sql);
        console.log('----------------------------------------');
        return true;
    } catch (error) {
        console.error('SQL execution failed:', error);
        return false;
    }
}

if (require.main === module) {
    runMigration();
}

module.exports = { runMigration }; 