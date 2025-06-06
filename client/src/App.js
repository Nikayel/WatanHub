import React from 'react';
//UI
import { Toaster } from 'sonner';
import { Analytics } from "@vercel/analytics/react"
// VERCEL EXTRAS
// import { SpeedInsights } from "@vercel/speed-insights/react"
// React and Routing
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Context and Protection
import ProtectedRoute from './components/Routes/ProtectedRoute';
import AdminRoute from './components/adminRoute';

import MentorsPage from './pages/MentorsPage';

// Public Pages
import HomePage from './components/HomePage';
import TimelineDemo from './components/ui/timeline-demo';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetails';

// Auth Pages
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';

// User Terms
import TermsChecker from './components/TermsChecker';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminBlogManage from './pages/admin/AdminBlogManage';
import AdminBlogCreate from './pages/admin/AdminBlogCreate';
import AdminBlogEdit from './pages/admin/AdminBlogEdit';
import AdminAnnouncementSend from './pages/admin/AdminAnnouncementSend'; // 👈 import it
import MigrationTool from './pages/admin/MigrationTool'; // 👈 import migration tool

//mentor section
import MentorApplicationPage from './pages/MentorApplicationPage';
// User Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import OnboardingSurvey from './pages/OnboardingSurvey';
import MentorRoute from './components/Routes/MentorRoute';
import MentorDashboard from './pages/mentor/mentor_dashboard';

// Profile Tutorial Modal
import ProfileTutorial from './components/ProfileTutorial';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

function App() {
  return (
    <>
      <Toaster position="top-center" richColors /> {/* <- here */}
      <ProfileTutorial />
      <TermsChecker />
      <Routes>

        {/* Public Routes */}
        <Route path="/mentors" element={<MentorsPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/timeline" element={<TimelineDemo />} />
        <Route path="/blogs" element={<BlogList />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mentor-application" element={<MentorApplicationPage />} />
        <Route path="/admin/announcements/send" element={
          <AdminRoute>
            <AdminAnnouncementSend />
          </AdminRoute>
        } />
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
          <MentorRoute>
            <MentorDashboard />
          </MentorRoute>
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

        {/* New Migration Tool Route */}
        <Route path="/admin/migration" element={
          <AdminRoute>
            <MigrationTool />
          </AdminRoute>
        } />

        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

      </Routes>
      <Analytics />
    </>
  );
}

export default App;
