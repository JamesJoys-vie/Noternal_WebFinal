import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from '../assets/noternal_logo.png'
import { createResetOtp, findUser, normalizeEmail } from "../utils/storage";

const ResetPW = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const normalizedEmail = normalizeEmail(email);

    if (!findUser(normalizedEmail)) {
      setError("No account was found for that email.");
      return;
    }

    const code = createResetOtp(normalizedEmail);
    navigate("/authenticate", { state: { email: normalizedEmail, code } });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-[#17009b] via-[#7d32c9] to-[#e4dcf4] font-sans">
      <div className="flex items-center justify-center mb-10">
        <img src={Logo} alt="App logo" style={{ width: '400px' }}/>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-5 px-6">
        <div className="flex flex-col">
          <label className="text-white font-bold mb-1 ml-1 text-base drop-shadow-sm">
            Account email
          </label>
          <input
            type="email"
            placeholder="Email ..."
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            className="w-full px-5 py-2.5 rounded-full text-indigo-900 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-[#7d32c9]/60 shadow-sm"
            required
          />
        </div>

        {error && (
          <p className="bg-white/90 text-red-600 text-sm font-semibold rounded-xl px-4 py-2 text-center">
            {error}
          </p>
        )}

        <div className="flex justify-between gap-4 mt-4">
          <Link to="/login">
            <button type="button" className="flex bg-white text-[#4a1c82] text-lg font-semibold py-2 px-6 rounded-full hover:bg-[#7a7a7a] hover:text-[#f1f1f1] hover:shadow-lg transition-all duration-300 shadow-md">
              Back
            </button>
          </Link>

          <button type="submit" className="flex bg-white text-[#4a1c82] text-lg font-semibold py-2 px-6 rounded-full hover:bg-[#7a7a7a] hover:text-[#f1f1f1] hover:shadow-lg transition-all duration-300 shadow-md">
            Send code
          </button>
        </div>

      </form>
    </div>
  );
};

export default ResetPW
