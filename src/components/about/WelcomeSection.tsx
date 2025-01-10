import { Link } from "react-router-dom";

export const WelcomeSection = () => {
  return (
    <div className="text-center mb-8 bg-white rounded-xl p-6 shadow-sm">
      <span className="text-base text-gray-600 block">👋 Welcome to</span>
      <Link to="/" className="text-3xl sm:text-4xl font-bold text-primary hover:text-primary/80 transition-colors block my-2">
        Get The Gift
      </Link>
      <span className="text-base text-gray-600 block">🎁 The Only Gift-Giving Sidekick You'll Ever Need!</span>
    </div>
  );
};