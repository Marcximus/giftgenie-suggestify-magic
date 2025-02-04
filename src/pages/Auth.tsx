import { Helmet } from "react-helmet";
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  return (
    <>
      <Helmet>
        <title>Login - Get The Gift</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://getthegift.ai/auth" />
      </Helmet>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
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