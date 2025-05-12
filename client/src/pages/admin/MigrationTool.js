import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { verifyDatabaseSchema } from '../../lib/UserRoles';
import { useAuth } from '../../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';

export default function MigrationTool() {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [migrationLoading, setMigrationLoading] = useState(false);
    const [migrationResult, setMigrationResult] = useState(null);

    useEffect(() => {
        // Redirect if not admin
        if (user && !isAdmin) {
            navigate('/dashboard');
        }
    }, [user, isAdmin, navigate]);

    useEffect(() => {
        async function checkStatus() {
            setLoading(true);
            const result = await verifyDatabaseSchema();
            setStatus(result);
            setLoading(false);
        }

        checkStatus();
    }, []);

    const runMigration = async () => {
        try {
            setMigrationLoading(true);
            setMigrationResult(null);

            // Read the migration SQL file
            const response = await fetch('/src/db/user_role_migration.sql');
            const sqlText = await response.text();

            // Execute the migration SQL with the Supabase PostgreSQL extension
            const { data, error } = await supabase.rpc('exec_sql', { sql: sqlText });

            if (error) {
                console.error('Migration error:', error);
                setMigrationResult({
                    success: false,
                    message: `Migration failed: ${error.message}`,
                    details: error
                });
            } else {
                setMigrationResult({
                    success: true,
                    message: 'Migration completed successfully',
                    details: data
                });

                // Refresh the status
                const result = await verifyDatabaseSchema();
                setStatus(result);
            }
        } catch (error) {
            console.error('Error running migration:', error);
            setMigrationResult({
                success: false,
                message: `An error occurred: ${error.message}`,
                error
            });
        } finally {
            setMigrationLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="bg-white rounded-lg shadow-sm p-8 flex flex-col items-center">
                    <Loader className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                    <p className="text-gray-600">Checking database schema...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Database Migration Tool</h1>
                <p className="text-gray-600 mt-2">
                    This tool helps you check and run the database migration to the new role-based schema.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">Schema Status</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <SchemaStatusCard
                            title="Users Table"
                            exists={status?.usersTable?.exists}
                            count={status?.usersTable?.count}
                            error={status?.usersTable?.error}
                        />
                        <SchemaStatusCard
                            title="Students Table"
                            exists={status?.studentsTable?.exists}
                            count={status?.studentsTable?.count}
                            error={status?.studentsTable?.error}
                        />
                        <SchemaStatusCard
                            title="Student Profiles View"
                            exists={status?.studentProfilesView?.exists}
                            count={status?.studentProfilesView?.count}
                            error={status?.studentProfilesView?.error}
                        />
                    </div>

                    <div className="mt-6">
                        <h3 className="text-lg font-medium mb-2">Sample Data</h3>

                        {status?.usersTable?.sample?.length > 0 ? (
                            <div className="overflow-x-auto">
                                <h4 className="text-md font-medium mb-2">Users</h4>
                                <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-40">
                                    {JSON.stringify(status.usersTable.sample, null, 2)}
                                </pre>
                            </div>
                        ) : (
                            <p className="text-amber-700">No users found in the database.</p>
                        )}

                        {status?.studentsTable?.sample?.length > 0 ? (
                            <div className="overflow-x-auto mt-4">
                                <h4 className="text-md font-medium mb-2">Students</h4>
                                <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-40">
                                    {JSON.stringify(status.studentsTable.sample, null, 2)}
                                </pre>
                            </div>
                        ) : (
                            <p className="text-amber-700 mt-4">No students found in the database.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4">Run Migration</h2>
                    <p className="text-gray-600 mb-4">
                        This will execute the SQL migration script to set up the new schema and migrate existing data.
                    </p>

                    <button
                        onClick={runMigration}
                        disabled={migrationLoading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {migrationLoading ? (
                            <span className="flex items-center">
                                <Loader className="w-4 h-4 mr-2 animate-spin" />
                                Running Migration...
                            </span>
                        ) : (
                            'Run Migration'
                        )}
                    </button>

                    {migrationResult && (
                        <div className={`mt-4 p-4 rounded-md ${migrationResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            <div className="font-medium">{migrationResult.message}</div>
                            {migrationResult.success ? (
                                <p className="text-sm mt-2">Refresh the page to see the updated schema status.</p>
                            ) : (
                                <pre className="text-xs mt-2 overflow-auto max-h-40">
                                    {JSON.stringify(migrationResult.details, null, 2)}
                                </pre>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SchemaStatusCard({ title, exists, count, error }) {
    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900">{title}</h3>
            <div className="mt-2">
                <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${exists ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>{exists ? 'Available' : 'Not Available'}</span>
                </div>
                {exists && (
                    <div className="mt-1 text-sm text-gray-600">
                        Records: <span className="font-medium">{count}</span>
                    </div>
                )}
                {error && (
                    <div className="mt-1 text-sm text-red-600">
                        Error: {error}
                    </div>
                )}
            </div>
        </div>
    );
} 