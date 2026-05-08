import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from '../assets/noternal-logo.png'
import { createResetOtp, getResetOtp } from "../utils/storage";

const PasscodeAu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const resetOtp = getResetOtp();
  const initialEmail = location.state?.email || resetOtp?.email || "";
  const initialCode = location.state?.code || resetOtp?.code || "";
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [demoCode, setDemoCode] = useState(initialCode);
  const [error, setError] = useState("");

  const canProceed = useMemo(() => email.trim() && otp.length === 6, [email, otp]);

  const handleOtpChange = (value) => {
    setOtp(value.replace(/\D/g, "").slice(0, 6));
    setError("");
  };

  const handleResend = () => {
    if (!email.trim()) {
      setError("Enter your email before resending a code.");
      return;
    }

    setDemoCode(createResetOtp(email));
    setError("");
  };

  const handleProceed = (e) => {
    e.preventDefault();
    const savedOtp = getResetOtp();

    if (!canProceed || !savedOtp || savedOtp.email !== email.trim().toLowerCase() || savedOtp.code !== otp) {
      setError("The OTP code does not match.");
      return;
    }

    navigate("/password_restart", {
      state: { from: "/authenticate", email: savedOtp.email, mode: "forgot" },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-[#17009b] via-[#7d32c9] to-[#e4dcf4] font-sans">
      <div className="flex items-center justify-center mb-10">
        <img src={Logo} alt="App logo" style={{ width: '400px' }}/>
      </div>

      <form onSubmit={handleProceed} className="w-full max-w-sm flex flex-col gap-5 px-6">
        <div className="flex flex-col">
          <label className="text-white font-bold mb-1 ml-1 text-base drop-shadow-sm items-center justify-center">
            Enter the 6-digit OTP
            code send to your 
            email's account
          </label>
          <input
            type="email"
            placeholder="Email ..."
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            className="w-full px-5 py-2.5 mb-3 rounded-full text-indigo-900 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-[#7d32c9]/60 shadow-sm"
            required
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter the passcode ..."
            value={otp}
            onChange={(e) => handleOtpChange(e.target.value)}
            className="w-full px-5 py-2.5 rounded-full text-indigo-900 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-[#7d32c9]/60 shadow-sm"
            required
          />

          <div className="mt-1">
            <button
              type="button"
              onClick={handleResend}
              className="text-black text-sm underline hover:text-indigo-900 transition-colors"
            >
              Resend
            </button>
          </div>
        </div>

        {demoCode && (
          <p className="bg-white/90 text-[#4a1c82] text-sm font-semibold rounded-xl px-4 py-2 text-center">
            Demo OTP: {demoCode}
          </p>
        )}

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
            Proceed
          </button>
        </div>

      </form>
    </div>
  );
};

export default PasscodeAu
