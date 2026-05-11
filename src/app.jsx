import { Routes, Route} from 'react-router-dom'
import LoginScreen from './pages/login'
import RenewPW from './pages/password-restart'
import RegistrationScreen from './pages/register'
import NoternalApp from './pages/home'
import ResetPW from './pages/forgot-password'
import PasscodeAu from './pages/authenticate'

function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<LoginScreen />}/>
        <Route path="/login" element={<LoginScreen />}/>
        <Route path="/authenticate" element={<PasscodeAu />} />
        <Route path="/forgot-password" element={<ResetPW />} />
        <Route path="/password-restart" element={<RenewPW />} />
        <Route path="/register" element={<RegistrationScreen />} />
        <Route path="/home" element={<NoternalApp />} />
      </Routes>
    </main>
  )
}

export default App
