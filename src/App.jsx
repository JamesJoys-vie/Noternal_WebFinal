import { Routes, Route} from 'react-router-dom'
import LoginScreen from './Pages/Login'
import RenewPW from './Pages/PasswordRestart'
import RegistrationScreen from './Pages/Register'
import NoternalApp from './Pages/Home'
import ResetPW from './Pages/ForgotPassword'
import PasscodeAu from './Pages/Authenticate'

function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<LoginScreen />}/>
        <Route path="/Login" element={<LoginScreen />}/>
        <Route path="/Authenticate" element={<PasscodeAu />} />
        <Route path="/ForgotPassword" element={<ResetPW />} />
        <Route path="/PasswordRestart" element={<RenewPW />} />
        <Route path="/Register" element={<RegistrationScreen />} />
        <Route path="/Home" element={<NoternalApp />} />
      </Routes>
    </main>
  )
}

export default App
