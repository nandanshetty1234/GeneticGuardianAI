import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../logo.png";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" | "error"
  const [loading, setLoading] = useState(false);

  // REMOVE API_BASE — use API variable
  const API = process.env.REACT_APP_API_URL || "https://geneticguardianai.onrender.com";

  const validate = () => {
    if (!username.trim() || !password) {
      setMessageType("error");
      setMessage("Please enter both username and password.");
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setMessageType("error");
        setMessage(errData?.error || errData?.message || `Login failed (${res.status})`);
        setLoading(false);
        return;
      }

      const data = await res.json().catch(() => ({}));
      setMessageType("success");
      setMessage(data.message || "Login successful ✅");

      localStorage.setItem("username", username.trim());

      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }

      setTimeout(() => navigate("/home"), 800);
    } catch (err) {
      console.error("Login error:", err);
      setMessageType("error");
      setMessage("⚠️ Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex flex-col items-center px-6 relative">

      {/* Header */}
      <div className="w-full relative mt-6 max-w-8xl flex items-start">
        <img src={logo} alt="Genetic GuardianAI Logo" className="h-64 w-64 object-contain" />
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center top-20">
          <h1 className="text-5xl font-extrabold tracking-wide">
            Genetic <span className="text-blue-400">GuardianAI</span>
          </h1>
          <p className="mt-2 text-lg text-gray-300 max-w-2xl mx-auto">
            AI-powered platform that predicts hereditary disease risks and provides preventive health recommendations.
          </p>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-grow flex items-center justify-center w-full py-10">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h2 className="text-3xl font-bold text-center mb-6">Login</h2>

          <form className="space-y-4" onSubmit={handleLogin}>

            {/* Username */}
            <div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-lg font-semibold transition 
                ${loading ? "bg-blue-400/50 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Message */}
          {message && (
            <p
              className={`mt-4 text-center font-medium ${
                messageType === "success" ? "text-green-400" : "text-red-400"
              }`}
            >
              {message}
            </p>
          )}

          <p className="mt-6 text-center text-gray-400">
            Not registered?{" "}
            <Link to="/signup" className="text-blue-400 hover:underline">Sign Up</Link>
          </p>

        </div>
      </div>
    </div>
  );
}
