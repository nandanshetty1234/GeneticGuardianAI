import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../logo.png";
import { Eye, EyeOff } from "lucide-react";

// Use REACT_APP_API_URL at build time; fallback to your deployed backend
const API = process.env.REACT_APP_API_URL || "https://geneticguardianai.onrender.com";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("❌ Passwords do not match");
      return;
    }

    try {
      const res = await fetch(`${API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      setMessage(data.message || "Signup successful ✅");
    } catch (err) {
      console.error("Signup error:", err);
      setMessage("⚠️ Error signing up. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex flex-col items-center px-6 relative">
      
      {/* Header with logo and title */}
      <div className="w-full relative mt-6 max-w-8xl flex items-start">
        <img src={logo} alt="Genetic GuardianAI Logo" className="h-64 w-64 object-contain" />
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center top-20">
          <h1 className="text-5xl font-extrabold tracking-wide">
            Genetic <span className="text-blue-400">GuardianAI</span>
          </h1>
          <p className="mt-2 text-lg text-white-300 max-w-2xl mx-auto">
            AI-powered platform that predicts hereditary disease risks and provides
            preventive health recommendations.
          </p>
        </div>
      </div>

      {/* Signup Form */}
      <div className="flex-grow flex items-center justify-center w-full">
        <div className="bg-gray-800 p-10 rounded-2xl shadow-lg w-full max-w-md">
          <h2 className="text-3xl font-bold text-center mb-6">Sign Up</h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username */}
            <div>
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-lg font-semibold transition"
            >
              Sign Up
            </button>
          </form>

          {/* Show Response */}
          {message && (
            <p className="mt-4 text-center text-yellow-400 font-medium">{message}</p>
          )}

          {/* Redirect to Login */}
          <p className="mt-6 text-center text-gray-400">
            Already Registered?{" "}
            <Link to="/login" className="text-blue-400 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
