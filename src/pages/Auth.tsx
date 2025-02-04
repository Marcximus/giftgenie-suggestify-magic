import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Helmet } from "react-helmet";

const Auth = () => {
  return (
    <>
      <Helmet>
        <title>Sign In - Get The Gift</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
          <SupabaseAuth 
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
          />
        </div>
      </div>
    </>
  );
};

export default Auth;