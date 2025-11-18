import '../App.css';
import logo from '../logo.png'; // adjust path since now inside /pages
import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex flex-col items-center px-6">
      
      {/* Header with logo and title */}
      <div className="w-full relative mt-6 max-w-8xl flex items-start">
        {/* Logo on top-left */}
        <img src={logo} alt="Genetic GuardianAI Logo" className="h-64 w-64 object-contain" />

        {/* Title & Subtitle centered at the top */}
        <div className="absolute left-1/2 transform -translate-x-1/2 text-center top-6">
          <h1 className="text-5xl font-extrabold tracking-wide">
            Genetic <span className="text-blue-400">GuardianAI</span>
          </h1>
          <p className="mt-2 text-lg text-white-300 max-w-2xl mx-auto">
            AI-powered platform that predicts hereditary disease risks and provides
            preventive health recommendations.
          </p>
        </div>
      </div>

      {/* Health Tips Section */}
      <h2 className="mt-16 text-3xl font-bold text-center">🛡️ Guardian’s Wellness Guide </h2>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
        {/* Tip 1 */}
        <div className="p-6 bg-gray-800 rounded-2xl shadow-lg hover:scale-105 transition">
          <h3 className="text-xl font-semibold text-blue-400">😴 Proper Sleep</h3>
          <p className="mt-2 text-gray-300">
            Aim for 7-8 hours of quality sleep daily to allow your body to repair and recharge.
          </p>
        </div>
        {/* Tip 2 */}
        <div className="p-6 bg-gray-800 rounded-2xl shadow-lg hover:scale-105 transition">
          <h3 className="text-xl font-semibold text-blue-400">🏃 Regular Exercise</h3>
          <p className="mt-2 text-gray-300">
            Engage in at least 30 minutes of physical activity to boost heart health and immunity.
          </p>
        </div>
        {/* Tip 3 */}
        <div className="p-6 bg-gray-800 rounded-2xl shadow-lg hover:scale-105 transition">
          <h3 className="text-xl font-semibold text-blue-400">🧘 Yoga & Meditation</h3>
          <p className="mt-2 text-gray-300">
            Practice yoga or meditation daily to reduce stress and improve mental clarity.
          </p>
        </div>
        {/* Tip 4 */}
        <div className="p-6 bg-gray-800 rounded-2xl shadow-lg hover:scale-105 transition">
          <h3 className="text-xl font-semibold text-blue-400">🥗 Balanced Diet</h3>
          <p className="mt-2 text-gray-300">
            Eat a variety of fruits, vegetables, and whole grains for essential nutrients.
          </p>
        </div>
        {/* Tip 5 */}
        <div className="p-6 bg-gray-800 rounded-2xl shadow-lg hover:scale-105 transition">
          <h3 className="text-xl font-semibold text-blue-400">💧 Stay Hydrated</h3>
          <p className="mt-2 text-gray-300">
            Drink at least 2-3 liters of water daily to keep your body hydrated and energetic.
          </p>
        </div>
        {/* Tip 6 */}
        <div className="p-6 bg-gray-800 rounded-2xl shadow-lg hover:scale-105 transition">
          <h3 className="text-xl font-semibold text-blue-400">🧠 Mental Health</h3>
          <p className="mt-2 text-gray-300">
            Take breaks, socialize, and maintain positivity to support your emotional well-being.
          </p>
        </div>
      </div>

      {/* Buttons (below tips) */}
      <div className="mt-12 flex gap-6">
        {/* ✅ Navigate to Login */}
        <Link 
          to="/login"
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-2xl shadow-lg text-lg font-semibold transition-all"
        >
          Predict My Health Risk
        </Link>

        <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-2xl shadow-lg text-lg font-semibold transition-all">
          Learn More
        </button>
      </div>
    </div>
  );
}

export default LandingPage;
