import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Privacy = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
            <div className="mb-8">
                <Link
                    to="/"
                    className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg transition"
                >
                    <ArrowLeft size={16} className="mr-2" /> Back to Home
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">WatanHub Privacy Policy</h1>
                <p className="text-gray-500 mb-8">Effective Date: {new Date().toLocaleDateString()}</p>

                <section>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">1. What Data We Collect</h3>
                            <p className="text-gray-600 mb-2">At WatanHub, we collect the following types of information:</p>
                            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                                <li>Personal identifiers such as name, email address, and location</li>
                                <li>Educational information including institution, degree, and academic records</li>
                                <li>Communication records from our platform and other channels</li>
                                <li>Documents you share (resumes, essays, applications)</li>
                                <li>Mentorship preferences and goals</li>
                                <li>Usage data from your interactions with our platform</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">2. How We Use Your Data</h3>
                            <p className="text-gray-600 mb-2">We use the collected information to:</p>
                            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                                <li>Match students with appropriate mentors based on goals and background</li>
                                <li>Provide personalized scholarship and educational opportunities</li>
                                <li>Improve the quality of our mentorship program and platform</li>
                                <li>Track impact metrics for our nonprofit mission</li>
                                <li>Conduct research to better understand educational challenges in Afghanistan</li>
                                <li>Communicate with you about program updates and opportunities</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">3. Who Has Access To Your Data</h3>
                            <p className="text-gray-600 mb-2">Your data may be accessed by:</p>
                            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                                <li>WatanHub staff and administrators</li>
                                <li>Your assigned mentor (for student data) or mentees (for mentor data)</li>
                                <li>Technical support providers who help maintain our platform</li>
                            </ul>
                            <p className="text-gray-600 mt-3">We <strong>never</strong> sell your personal information to third parties. We may share anonymized and aggregated data for research and impact reporting purposes.</p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">4. Data Security</h3>
                            <p className="text-gray-600 mb-2">
                                We implement appropriate technical and organizational measures to protect your personal information:
                            </p>
                            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                                <li>We use Supabase, a secure database platform with encryption at rest</li>
                                <li>Access to user data is restricted to authorized personnel only</li>
                                <li>Regular security assessments and updates are performed</li>
                                <li>All data transfers are secured with HTTPS/TLS</li>
                            </ul>
                            <p className="text-gray-600 mt-3">
                                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee its absolute security.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">5. Data Retention</h3>
                            <p className="text-gray-600">
                                We retain your personal information for as long as your account is active or as needed to provide services. If you request account deletion, we will remove or anonymize your personal information within 30 days, except where we need to retain certain information for legitimate business or legal purposes.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">6. Your Rights</h3>
                            <p className="text-gray-600 mb-2">
                                Depending on your location, you may have rights to:
                            </p>
                            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                                <li>Access the personal information we hold about you</li>
                                <li>Correct inaccurate or incomplete information</li>
                                <li>Request deletion of your personal information</li>
                                <li>Receive your data in a portable format</li>
                                <li>Restrict or object to certain processing of your data</li>
                            </ul>
                            <p className="text-gray-600 mt-3">
                                To exercise these rights, please contact us at <a href="mailto:support@watanhub.org" className="text-indigo-600 hover:underline">support@watanhub.org</a>.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">7. Children's Privacy</h3>
                            <p className="text-gray-600">
                                WatanHub is intended for users 13 years of age and older. If you are under 18, you must have parental consent to use our services. Parents or guardians of users under 18 may review or request deletion of their child's personal information by contacting us.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">8. Changes to This Policy</h3>
                            <p className="text-gray-600">
                                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the effective date. We encourage you to review this Privacy Policy periodically.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">9. Contact Us</h3>
                            <p className="text-gray-600">
                                If you have any questions about this Privacy Policy or our data practices, please contact us at <a href="mailto:support@watanhub.org" className="text-indigo-600 hover:underline">support@watanhub.org</a>.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Privacy; 