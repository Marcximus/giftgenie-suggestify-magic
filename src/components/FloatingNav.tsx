import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";

export const FloatingNav = () => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white shadow-xl border border-border/50 px-6 py-3 rounded-full">
      <NavigationMenu>
        <NavigationMenuList className="space-x-2">
          <NavigationMenuItem>
            <Link 
              to="/" 
              className={navigationMenuTriggerStyle() + " bg-white hover:bg-accent"}
            >
              Home
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link 
              to="/blog" 
              className={navigationMenuTriggerStyle() + " bg-white hover:bg-accent"}
            >
              Gift Ideas
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link 
              to="/about" 
              className={navigationMenuTriggerStyle() + " bg-white hover:bg-accent"}
            >
              About
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link 
              to="/auth" 
              className={navigationMenuTriggerStyle() + " bg-white hover:bg-accent"}
            >
              Login
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};