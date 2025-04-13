import logo from './logo.svg';
import './App.css';
import './components/Auth/Login';
import './components/Auth/SignUp';
import './components/HomePage';
import { Route } from 'lucide-react';
function App() {
  return(
    <Router>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/login' element={<Login />} />
        <Route path='/signup' element={<SignUp />} />
        </Routes>
    </Router>
  )
}

export default App;
