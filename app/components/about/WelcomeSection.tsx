import Link from "next/link";

export const WelcomeSection = () => {
  return (
    <div className="text-center mb-8 bg-white rounded-xl p-6 shadow-sm">
      <span className="text-[0.7rem] sm:text-xs md:text-sm text-muted-foreground block">👋 Welcome to</span>
      <Link href="/" className="hover:opacity-80 transition-opacity">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500/80 via-blue-500/80 to-purple-500/80 inline-block text-transparent bg-clip-text my-2">
          Get The Gift
        </h1>
      </Link>
      <span className="text-[0.7rem] sm:text-xs md:text-sm text-muted-foreground block">🎁 The Only Gift-Giving Sidekick You'll Ever Need!</span>
    </div>
  );
};