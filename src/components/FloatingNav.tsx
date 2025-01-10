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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-border/50 px-4 py-2">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link to="/" className={navigationMenuTriggerStyle()}>
              Home
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to="/blog" className={navigationMenuTriggerStyle()}>
              Gift Ideas
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to="/about" className={navigationMenuTriggerStyle()}>
              About
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link to="/auth" className={navigationMenuTriggerStyle()}>
              Login
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};