import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from '../assets/noternal_logo.png'
import { clearCurrentUser, clearResetOtp, findUser, getCurrentUser, upsertUser } from "../utils/storage";

const RenewPW = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isForgotFlow = location.state?.mode === "forgot";
  const resetEmail = location.state?.email;
  const currentUser = getCurrentUser();
  const targetUser = isForgotFlow ? findUser(resetEmail) : currentUser;
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(isForgotFlow ? "/authenticate" : "/home");
    }
  };

  const handleConfirm = (e) => {
    e.preventDefault();

    if (!targetUser) {
      setError("No account is available for this password change.");
      return;
    }

    if (!isForgotFlow && targetUser.password !== form.currentPassword) {
      setError("Current password is incorrect.");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("New password must have at least 6 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    upsertUser({ ...targetUser, password: form.newPassword });
    clearResetOtp();
    clearCurrentUser();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-[#17009b] via-[#7d32c9] to-[#e4dcf4] font-sans">
      <div className="flex items-center justify-center mb-10">
        <img src={Logo} alt="App logo" style={{ width: '400px' }}/>
      </div>

      <form onSubmit={handleConfirm} className="w-full max-w-sm flex flex-col gap-5 px-6">

        {!isForgotFlow && (
          <div className="flex flex-col">
            <label className="text-white font-bold mb-1 ml-1 text-base drop-shadow-sm">
              Confirm the password
            </label>
            <input
              type="password"
              placeholder="Enter current password ..."
              value={form.currentPassword}
              onChange={(e) => handleChange("currentPassword", e.target.value)}
              className="w-full px-5 py-2.5 rounded-full text-indigo-900 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-[#7d32c9]/60 shadow-sm"
              required
            />
          </div>
        )}

        <div className="flex flex-col">
          <label className="text-white font-bold mb-1 ml-1 text-base drop-shadow-sm">
            New password
          </label>
          <input
            type="password"
            placeholder="Enter new password ..."
            value={form.newPassword}
            onChange={(e) => handleChange("newPassword", e.target.value)}
            className="w-full px-5 py-2.5 rounded-full text-indigo-900 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-[#7d32c9]/60 shadow-sm"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-white font-bold mb-1 ml-1 text-base drop-shadow-sm">
            Confirm new password
          </label>
          <input
            type="password"
            placeholder="Re-enter new password ..."
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

        <div className="flex justify-between gap-4 mt-4">
          <button type="button" onClick={handleBack} className="flex bg-white text-[#4a1c82] text-lg font-semibold py-2 px-6 rounded-full hover:bg-[#7a7a7a] hover:text-[#f1f1f1] hover:shadow-lg transition-all duration-300 shadow-md">
            Back
          </button>

          <button type="submit" className="flex bg-white text-[#4a1c82] text-lg font-semibold py-2 px-6 rounded-full hover:bg-[#7a7a7a] hover:text-[#f1f1f1] hover:shadow-lg transition-all duration-300 shadow-md">
            Confirm
          </button>
        </div>

      </form>
    </div>
  );
};

export default RenewPW
