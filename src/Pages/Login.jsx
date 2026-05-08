import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from '../assets/noternal-logo.png'
import { findUser, setCurrentUser, normalizeEmail } from "../utils/storage";

const LoginScreen = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const user = findUser(form.email);

    if (!user || user.password !== form.password) {
      setError("Email or password is incorrect.");
      return;
    }

    setCurrentUser(normalizeEmail(form.email));
    navigate("/home");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-[#17009b] via-[#7d32c9] to-[#e4dcf4] font-sans">
      <div className="flex items-center justify-center mb-10">
        <img src={Logo} alt="App logo" style={{ width: '400px' }}/>
      </div>

      <h2 className="text-2xl font-bold text-white mb-8 tracking-wide drop-shadow-md">
        Welcome
      </h2>

      <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-5 px-6">
        <div className="flex flex-col">
          <label className="text-white font-bold mb-1 ml-1 text-base drop-shadow-sm">
            Email
          </label>
          <input
            type="email"
            placeholder="Email ..."
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="w-full px-5 py-2.5 rounded-full text-indigo-900 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-[#7d32c9]/60 shadow-sm"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-white font-bold mb-1 ml-1 text-base drop-shadow-sm">
            Password
          </label>
          <input
            type="password"
            placeholder="Password ..."
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            className="w-full px-5 py-2.5 rounded-full text-indigo-900 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-[#7d32c9]/60 shadow-sm"
            required
          />

          <div className="mt-1">
            <Link 
              to="/forgot-password"
              className="text-black text-sm underline hover:text-indigo-900 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {error && (
          <p className="bg-white/90 text-red-600 text-sm font-semibold rounded-xl px-4 py-2 text-center">
            {error}
          </p>
        )}

        <div className="flex justify-between gap-4 mt-4">
          <Link to="/register">
            <button type="button" className="flex bg-white text-[#4a1c82] text-lg font-semibold py-2 px-6 rounded-full hover:bg-[#7a7a7a] hover:text-[#f1f1f1] hover:shadow-lg transition-all duration-300 shadow-md">
              Don't have account?
            </button>
          </Link>

          <button type="submit" className="flex bg-white text-[#4a1c82] text-lg font-semibold py-2 px-6 rounded-full hover:bg-[#7a7a7a] hover:text-[#f1f1f1] hover:shadow-lg transition-all duration-300 shadow-md">
            Login
          </button>
        </div>

      </form>
    </div>
  );
};

export default LoginScreen
