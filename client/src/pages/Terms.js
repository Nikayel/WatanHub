import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Terms = () => {
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">WatanHub Terms of Service & Privacy Policy</h1>
                <p className="text-gray-500 mb-8">Effective Date: {new Date().toLocaleDateString()}</p>

                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Terms of Service</h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">1. Acceptance of Terms</h3>
                            <p className="text-gray-600">
                                By signing up for WatanHub, you agree to these Terms of Service and our Privacy Policy. If you do not agree, you may not use our services.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">2. Purpose of Service</h3>
                            <p className="text-gray-600">
                                WatanHub connects Afghan students with volunteer mentors to support their academic and professional journeys. All users are expected to behave with respect and integrity.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">3. Eligibility</h3>
                            <p className="text-gray-600">
                                You must be at least 13 years old to use WatanHub. Students under 18 must have parental consent.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">4. Code of Conduct</h3>
                            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                                <li>Mentors and students must communicate respectfully.</li>
                                <li>No harassment, discrimination, or inappropriate behavior is tolerated.</li>
                                <li>Any violation can result in immediate suspension.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">5. Volunteer Responsibilities</h3>
                            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                                <li>Mentors are volunteers, not licensed advisors.</li>
                                <li>WatanHub is not responsible for the accuracy of advice given.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">6. Data Accuracy</h3>
                            <p className="text-gray-600">
                                Users agree to provide accurate information. Misrepresentation may result in removal.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">7. Termination</h3>
                            <p className="text-gray-600">
                                We reserve the right to suspend or terminate accounts for violations of these terms.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">8. Changes to Terms</h3>
                            <p className="text-gray-600">
                                We may update these terms at any time. Continued use of WatanHub constitutes agreement to the latest version.
                            </p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Privacy Policy</h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">1. What Data We Collect</h3>
                            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                                <li>Name, email, country, education level</li>
                                <li>Communication records (e.g., messages, meeting logs)</li>
                                <li>Submitted documents (resumes, essays)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">2. How We Use Your Data</h3>
                            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                                <li>To match mentors and students</li>
                                <li>To improve mentorship quality</li>
                                <li>To track impact for internal reports and fundraising</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">3. Who Has Access</h3>
                            <ul className="list-disc pl-5 text-gray-600 space-y-2">
                                <li>WatanHub staff and admins</li>
                                <li>Assigned mentors/mentees</li>
                                <li>Never sold to third parties</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">4. Data Security</h3>
                            <p className="text-gray-600">
                                We use Supabase and encrypted tools to protect your information. However, no system is 100% secure.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">5. Cookies & Analytics</h3>
                            <p className="text-gray-600">
                                We may collect anonymous usage data to improve the site.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">6. Parental Rights (for minors)</h3>
                            <p className="text-gray-600">
                                Parents may request access to or deletion of their child's data by emailing us.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">7. Data Deletion</h3>
                            <p className="text-gray-600">
                                You may request account deletion by contacting <a href="mailto:support@watanhub.org" className="text-indigo-600 hover:underline">support@watanhub.org</a>.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">8. Contact</h3>
                            <p className="text-gray-600">
                                For any questions, contact us at <a href="mailto:support@watanhub.org" className="text-indigo-600 hover:underline">support@watanhub.org</a>.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Terms; 