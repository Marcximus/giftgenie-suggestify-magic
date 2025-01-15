import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Gift, Home } from "lucide-react";
import { Helmet } from "react-helmet";

const NotFound = () => {
  return (
    <>
      <Helmet>
        <title>404 - Page Not Found | Get The Gift</title>
        <meta name="description" content="The page you're looking for cannot be found. Return to Get The Gift to discover perfect gift ideas with our AI-powered suggestion engine." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl mx-auto">
          <div className="mb-8">
            <Gift className="h-24 w-24 mx-auto text-primary animate-bounce" />
          </div>
          
          <h1 className="text-4xl font-bold mb-4">Oops! Page Not Found</h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            Looks like this gift has been misplaced! Don't worry though, we have plenty more gift ideas waiting for you on our home page.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/">
                <Home className="mr-2 h-5 w-5" />
                Back to Home
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg">
              <Link to="/blog">
                <Gift className="mr-2 h-5 w-5" />
                Gift Ideas Blog
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;