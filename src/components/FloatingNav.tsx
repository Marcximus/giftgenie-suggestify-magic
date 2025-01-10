import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

export const FloatingNav = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  
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
        <nav className="flex items-center justify-around gap-1 px-2 py-1.5 rounded-full backdrop-blur-md bg-white/10 border border-white/20 shadow-lg">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative px-3 py-1.5 rounded-full text-xs font-medium transition-colors text-center w-[90px]",
                "hover:text-primary hover:bg-white/20",
                "active:scale-95",
                "focus:outline-none focus:ring-2 focus:ring-primary/20",
                location.pathname === item.path 
                  ? "text-primary bg-white/20" 
                  : "text-foreground/70"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </motion.div>
    </div>
  );
};