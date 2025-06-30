import React, { Suspense } from 'react';
import { Toaster } from 'sonner';
import { Analytics } from "@vercel/analytics/react"
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Production optimizations
import ErrorBoundary from './components/ErrorBoundary';
import AuthErrorBoundary from './components/AuthErrorBoundary';
import config from './config/environment';
import Logger from './utils/logger';
import StorageManager from './utils/storageSetup';

// Context and Protection (keep these as regular imports for faster auth checks)
import ProtectedRoute from './components/Routes/ProtectedRoute';
import AdminRoute from './components/adminRoute';

// User Terms (keep as regular import for immediate loading)
import TermsChecker from './components/TermsChecker';

// Profile Tutorial Modal (keep as regular import for immediate access)
import ProfileTutorial from './components/ProfileTutorial';

// Lazy load all major page components
const HomePage = React.lazy(() => import('./components/HomePage'));
const MentorsPage = React.lazy(() => import('./pages/MentorsPage'));
const GetInvolvedPage = React.lazy(() => import('./pages/GetInvolvedPage'));
const OurVisionPage = React.lazy(() => import('./pages/OurVisionPage'));
const TimelineDemo = React.lazy(() => import('./components/ui/timeline-demo'));
const BlogList = React.lazy(() => import('./pages/BlogList'));
const BlogDetail = React.lazy(() => import('./pages/BlogDetails'));

// Auth Pages
const Login = React.lazy(() => import('./components/Auth/Login'));
const SignUp = React.lazy(() => import('./components/Auth/SignUp'));

// Admin Pages (lazy loaded - only for admins)
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const AdminBlogManage = React.lazy(() => import('./pages/admin/AdminBlogManage'));
const AdminBlogCreate = React.lazy(() => import('./pages/admin/AdminBlogCreate'));
const AdminBlogEdit = React.lazy(() => import('./pages/admin/AdminBlogEdit'));
const AdminAnnouncementSend = React.lazy(() => import('./pages/admin/AdminAnnouncementSend'));
const MigrationTool = React.lazy(() => import('./pages/admin/MigrationTool'));
const FellowshipSettingsAdmin = React.lazy(() => import('./pages/admin/FellowshipSettingsAdmin'));

// Mentor section
const MentorApplicationPage = React.lazy(() => import('./pages/MentorApplicationPage'));
const MentorRoute = React.lazy(() => import('./components/Routes/MentorRoute'));
const MentorDashboard = React.lazy(() => import('./pages/mentor/mentor_dashboard'));

// User Pages (lazy loaded)
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Profile = React.lazy(() => import('./pages/Profile'));
const OnboardingSurvey = React.lazy(() => import('./pages/OnboardingSurvey'));

// Static Pages (lazy loaded)
const Terms = React.lazy(() => import('./pages/Terms'));
const Privacy = React.lazy(() => import('./pages/Privacy'));

// PWA Components
const PWAInstallPrompt = React.lazy(() => import('./components/PWAInstallPrompt'));
const PWAStatus = React.lazy(() => import('./components/PWAStatus'));
const PWARefreshPrompt = React.lazy(() => import('./components/PWARefreshPrompt'));

// Loading component for Suspense
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-white text-lg font-medium">Loading WatanHub...</p>
    </div>
  </div>
);

function App() {
  // Initialize performance monitoring and storage in development
  React.useEffect(() => {
    if (config.isDevelopment) {
      Logger.info('WatanHub App initialized', {
        version: config.app.version,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    }

    // Initialize storage bucket
    StorageManager.initializeBucket().catch(error => {
      Logger.error('Failed to initialize storage bucket:', error);
    });
  }, []);

  return (
    <ErrorBoundary>
      <AuthErrorBoundary>
        <Toaster position="top-center" richColors />
        <ProfileTutorial />
        <TermsChecker />
        <PWAInstallPrompt />
        <PWAStatus />
        <PWARefreshPrompt />

        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/mentors" element={<MentorsPage />} />
            <Route path="/get-involved" element={<GetInvolvedPage />} />
            <Route path="/our-vision" element={<OurVisionPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/timeline" element={<TimelineDemo />} />
            <Route path="/blogs" element={<BlogList />} />
            <Route path="/blog/:id" element={<BlogDetail />} />
            <Route path="/blogs/:id" element={<BlogDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/mentor-application" element={<MentorApplicationPage />} />
            <Route path="/signup" element={<SignUp isOpen={true} onClose={() => { }} />} />

            {/* Protected Routes (Logged-in Users Only) */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            <Route path="/onboarding-survey" element={
              <ProtectedRoute>
                <OnboardingSurvey />
              </ProtectedRoute>
            } />

            {/* Mentor Routes */}
            <Route path="/mentor/dashboard" element={
              <Suspense fallback={<LoadingSpinner />}>
                <MentorRoute>
                  <MentorDashboard />
                </MentorRoute>
              </Suspense>
            } />

            {/* Admin Routes (Admins Only) */}
            <Route path="/admin/dashboard" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />

            <Route path="/admin/blogs/manage" element={
              <AdminRoute>
                <AdminBlogManage />
              </AdminRoute>
            } />

            <Route path="/admin/blogs/create" element={
              <AdminRoute>
                <AdminBlogCreate />
              </AdminRoute>
            } />

            <Route path="/admin/blogs/edit/:id" element={
              <AdminRoute>
                <AdminBlogEdit />
              </AdminRoute>
            } />

            <Route path="/admin/announcements/send" element={
              <AdminRoute>
                <AdminAnnouncementSend />
              </AdminRoute>
            } />

            {/* Migration Tool Route */}
            <Route path="/admin/migration" element={
              <AdminRoute>
                <MigrationTool />
              </AdminRoute>
            } />

            {/* Fellowship Settings Admin Route */}
            <Route path="/admin/fellowship-settings" element={
              <AdminRoute>
                <FellowshipSettingsAdmin />
              </AdminRoute>
            } />

            {/* Static Pages */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </Suspense>

        <Analytics />
      </AuthErrorBoundary>
    </ErrorBoundary>
  );
}

export default App;
