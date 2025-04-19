import {BrowserRouter as Router,Routes} from 'react-router-dom';
import './App.css';
import Login from './components/Auth/Login';
import BlogList from './pages/BlogList';
import AdminCreateBlog from './pages/AdminCreateBlog';
import SignUp from './components/Auth/SignUp';
import HomePage from './components/HomePage';
import TimelineDemo from './components/ui/timeline-demo';
import { Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return(
    <Router>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/login' element={<Login />} />
        <Route path="/signup" element={<SignUp isOpen={true} onClose={() => {}} />} />
        <Route path="/timeline" element={<TimelineDemo />} />
        <Route
          path="/admin-create-blog"
          element={
          <AdminRoute>
         <AdminCreateBlog />
         </AdminRoute>
      }
      />

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
        </Routes>
    </Router>
  )
}

export default App;
