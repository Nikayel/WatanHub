import {BrowserRouter as Router,Routes} from 'react-router-dom';
import './App.css';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import HomePage from './components/HomePage';
import { Route } from 'react-router-dom';
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
