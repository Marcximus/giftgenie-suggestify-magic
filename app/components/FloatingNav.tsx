'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

export const FloatingNav = () => {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  
  const navItems = [
    { name: "Get The Gift", path: "/" },
    { name: "Ideas", path: "/blog" },
    { name: "About", path: "/about" },
  ];

  return (
    <div className="fixed bottom-4 left-0 right-0 z-[9999]">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className="container max-w-sm mx-auto px-4"
      >
        <nav className="flex items-center justify-around gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full backdrop-blur-lg bg-gradient-to-r from-purple-500/80 via-blue-500/80 to-purple-500/80 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_32px_rgba(31,34,245,0.12)]">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "relative px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300",
                "hover:text-white hover:bg-white/20 hover:shadow-lg",
                "active:scale-95",
                "focus:outline-none focus:ring-2 focus:ring-white/40",
                "flex items-center justify-center min-w-[80px] sm:min-w-[100px]", // Added min-width to ensure consistent button sizes
                pathname === item.path
                  ? "text-white bg-white/20 shadow-lg"
                  : "text-white/90"
              )}
            >
              <span className="relative z-10 text-center w-full">{item.name}</span>
            </Link>
          ))}
        </nav>
      </motion.div>
    </div>
  );
};