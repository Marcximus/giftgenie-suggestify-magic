import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set");
      throw new Error("Email service configuration error");
    }

    // Input validation with Zod
    const ContactSchema = z.object({
      name: z.string()
        .trim()
        .min(1, 'Name required')
        .max(100, 'Name too long')
        .regex(/^[a-zA-Z\s'-]+$/, 'Invalid characters in name'),
      email: z.string()
        .trim()
        .email('Invalid email')
        .max(255, 'Email too long'),
      message: z.string()
        .trim()
        .min(10, 'Message too short')
        .max(5000, 'Message too long')
    });

    const body = await req.json();
    const validated = ContactSchema.parse(body);
    const { name, email, message } = validated;

    console.log("Processing contact form submission");

    // HTML escape function to prevent XSS
    const escapeHtml = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    const emailContent = `
      <h2>New Contact Form Message</h2>
      <p><strong>From:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message)}</p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ms@corporateconsulting.dk",
        to: ["ms@corporateconsulting.dk"],
        subject: `New Contact Form Message from ${name}`,
        html: emailContent,
        reply_to: email
      }),
    });

    const responseData = await res.text();
    console.log("Resend API response:", responseData);

    if (!res.ok) {
      const error = JSON.parse(responseData);
      // Check if the error is related to domain verification
      if (error?.statusCode === 403 && error?.message?.includes("verify a domain")) {
        throw new Error("Domain verification required. Please try again later while we complete the setup process.");
      }
      throw new Error(`Failed to send email: ${responseData}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return new Response(
        JSON.stringify({ 
          error: 'Validation error',
          details: error.errors[0]?.message || 'Invalid input'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Please check the Edge Function logs for more information"
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);