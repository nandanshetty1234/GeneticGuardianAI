import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../logo.png";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("✅ Login successful!");
      localStorage.setItem("username", username); // ✅ store username
      navigate("/home"); // redirect to home page
    } else {
      setMessage(`❌ ${data.error}`);
    }
  } catch (err) {
    setMessage("⚠️ Error logging in. Try again.");
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

      {/* Login Form */}
      <div className="flex-grow flex items-center justify-center w-full">
        <div className="bg-gray-800 p-10 rounded-2xl shadow-lg w-full max-w-md">
          <h2 className="text-3xl font-bold text-center mb-6">Login</h2>

          <form className="space-y-6" onSubmit={handleLogin}>
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

            {/* Password */}
            <div>
              <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-lg font-semibold transition"
            >
              Login
            </button>
          </form>

          {/* Show message */}
          {message && (
            <p className="mt-4 text-center text-yellow-400 font-medium">{message}</p>
          )}

          {/* Redirect to Sign Up */}
          <p className="mt-6 text-center text-gray-400">
            Not Registered?{" "}
            <Link to="/signup" className="text-blue-400 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
