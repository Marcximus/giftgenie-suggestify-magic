import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const FloatingNav = () => {
  const navItems = [
    { name: "Get The Gift", path: "/" },
    { name: "Ideas", path: "/blog" },
    { name: "About", path: "/about" },
  ];

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
    >
      <nav className="flex items-center gap-1 px-3 py-2 rounded-full backdrop-blur-md bg-white/30 border border-white/20 shadow-lg">
        {navItems.map((item, index) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "relative px-4 py-2 rounded-full text-sm font-medium transition-colors",
              "hover:text-primary hover:bg-white/40",
              "active:scale-95",
              "focus:outline-none focus:ring-2 focus:ring-primary/20",
              index === 0 && "text-primary"
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </motion.div>
  );
};