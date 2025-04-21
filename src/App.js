//UI
import { Toaster } from 'sonner';

// React and Routing
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Context and Protection
import ProtectedRoute from './components/Routes/ProtectedRoute';
import AdminRoute from './components/adminRoute';

// Public Pages
import HomePage from './components/HomePage';
import TimelineDemo from './components/ui/timeline-demo';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetails';

// Auth Pages
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminBlogManage from './pages/admin/AdminBlogManage';
import AdminBlogCreate from './pages/admin/AdminBlogCreate';
import AdminBlogEdit from './pages/admin/AdminBlogEdit';

// User Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
          <Toaster position="top-center" richColors /> {/* <- here */}
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/timeline" element={<TimelineDemo />} />
        <Route path="/blogs" element={<BlogList />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp isOpen={true} onClose={() => {}} />} />

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

        <Route path="/admin/blog/edit/:id" element={
          <AdminRoute>
            <AdminBlogEdit />
          </AdminRoute>
        } />

      </Routes>
    </Router>
  );
}

export default App;
