import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from '../assets/noternal_logo.png'
import { cleanDisplayName, findUser, normalizeEmail, setCurrentUser, upsertUser } from "../utils/storage";

const RegistrationScreen = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    displayName: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    const nextValue = field === "displayName"
      ? cleanDisplayName(value)
      : value;
    setForm(prev => ({ ...prev, [field]: nextValue }));
    setError("");
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const email = normalizeEmail(form.email);
    const displayName = cleanDisplayName(form.displayName).trim();

    if (!displayName) {
      setError("Display name can only use letters and spaces.");
      return;
    }

    if (findUser(email)) {
      setError("This email already has an account.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must have at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    upsertUser({ email, displayName, password: form.password });
    setCurrentUser(email);
    navigate("/Home");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-[#17009b] via-[#7d32c9] to-[#e4dcf4] font-sans py-10">
      <div className="flex items-center justify-center mb-10">
        <img src={Logo} alt="App logo" style={{ width: '400px' }}/>
      </div>

      <h2 className="text-2xl font-bold text-white mb-6 tracking-wide drop-shadow-md">
        Registration
      </h2>

      <form onSubmit={handleRegister} className="w-full max-w-sm flex flex-col gap-4 px-6">
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
            Display name
          </label>
          <input
            type="text"
            placeholder="Display name..."
            value={form.displayName}
            onChange={(e) => handleChange("displayName", e.target.value)}
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
        </div>

        <div className="flex flex-col">
          <label className="text-white font-bold mb-1 ml-1 text-base drop-shadow-sm">
            Confirm password
          </label>
          <input
            type="password"
            placeholder="Password ..."
            value={form.confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            className="w-full px-5 py-2.5 rounded-full text-indigo-900 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-[#7d32c9]/60 shadow-sm"
            required
          />
        </div>

        {error && (
          <p className="bg-white/90 text-red-600 text-sm font-semibold rounded-xl px-4 py-2 text-center">
            {error}
          </p>
        )}

        <div className="flex justify-between gap-4 mt-6">
          <button type="submit" className="flex bg-white text-[#4a1c82] text-lg font-semibold py-2 px-6 rounded-full hover:bg-[#7a7a7a] hover:text-[#f1f1f1] hover:shadow-lg transition-all duration-300 shadow-md">
            Sign-up
          </button>

          <Link to="/Login">
            <button type="button" className="flex bg-white text-[#4a1c82] text-lg font-semibold py-2 px-6 rounded-full hover:bg-[#7a7a7a] hover:text-[#f1f1f1] hover:shadow-lg transition-all duration-300 shadow-md">
              Have an account?
            </button>
          </Link>
        </div>

      </form>
    </div>
  );
};

export default RegistrationScreen;
