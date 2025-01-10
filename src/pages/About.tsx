import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const About = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: { name, email, message },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your message has been sent successfully!",
      });

      // Clear form
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl bg-[#F1F0FB]">
      <div className="prose prose-sm sm:prose-base max-w-none">
        <div className="text-center mb-8 bg-white rounded-xl p-6 shadow-sm">
          <span className="text-base text-gray-600 block">👋 Welcome to</span>
          <Link to="/" className="text-3xl sm:text-4xl font-bold text-[#1EAEDB] hover:text-[#0FA0CE] transition-colors block my-2">
            Get The Gift
          </Link>
          <span className="text-base text-gray-600 block">🎁 The Only Gift-Giving Sidekick You'll Ever Need!</span>
        </div>
        
        <div className="space-y-8">
          <p className="text-sm sm:text-base text-justify leading-relaxed text-[#403E43]">
            🤔 Are you tired of giving the same ol' scented candle or novelty mug every year? We thought so. That's why Get The Gift was created: to help you discover the perfect present for everyone on your list without the stress, guesswork, or frantic 3 A.M. Google searches for "best birthday gift ideas."
          </p>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-[#9b87f5] flex items-center gap-2">
              🎯 Our Mission: No More Meh Presents
            </h2>
            <p className="text-sm text-justify leading-relaxed text-[#403E43]">
              We're on a mission to banish boring gifts from planet Earth. With our smart gift selection tool, you can wow your recipient with a unique, thoughtful item that actually fits their personality.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-[#9b87f5]">✨ How We Work Our Gift-Giving Magic</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#7E69AB] mb-2">🤖 AI-Powered Gift Suggestions</h3>
                <p className="text-sm text-justify leading-relaxed text-[#403E43]">
                  Our advanced algorithms evaluate your recipient's likes, dislikes, and that time they couldn't stop talking about alpaca socks (hey, it happens).
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-[#7E69AB] mb-2">🔍 Handpicked from Top Retailers</h3>
                <p className="text-sm text-justify leading-relaxed text-[#403E43]">
                  We scour all corners of the web—like ninjas in slippers—to bring you the best deals and delivery choices.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-[#7E69AB] mb-2">📚 Expertly Curated Gift Guides</h3>
                <p className="text-sm text-justify leading-relaxed text-[#403E43]">
                  From "Unicorn-Loving Teens" to "World-Traveler Grandmas," we've got themed gift guides to inspire your creative side.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4 text-[#9b87f5]">💫 Why Get The Gift?</h2>
            <ul className="list-none space-y-3 pl-0">
              <li className="text-sm text-justify leading-relaxed text-[#403E43] flex items-start gap-2">
                <span className="text-[#9b87f5] mt-1">✓</span>
                <span>Stress-Free Experience: No more aimless online browsing.</span>
              </li>
              <li className="text-sm text-justify leading-relaxed text-[#403E43] flex items-start gap-2">
                <span className="text-[#9b87f5] mt-1">✓</span>
                <span>Personal Touch: Our suggestions feel tailor-made because they practically are.</span>
              </li>
              <li className="text-sm text-justify leading-relaxed text-[#403E43] flex items-start gap-2">
                <span className="text-[#9b87f5] mt-1">✓</span>
                <span>Time-Saving: Spend less time hunting and more time celebrating.</span>
              </li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-sm mb-8 sm:mb-12 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm sm:text-base">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-10 sm:h-12 text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 sm:h-12 text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm sm:text-base">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                className="min-h-[100px] sm:min-h-[120px] text-base"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-10 sm:h-12 text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </form>
          
          <h2 className="text-xl sm:text-2xl font-bold mt-8 sm:mt-12 mb-3 sm:mb-4 text-primary">Get The Gift: Your Ticket to Gift-Giving Greatness</h2>
          <p className="text-base sm:text-lg mb-8">
            No more fruitcakes, mismatched socks, or re-gifted fiascos. At Get The Gift, we aim to transform every celebration into a story worth telling—complete with gasps of delight, big smiles, and maybe even happy tears. After all, the perfect gift is the key to anyone's heart (or at least their fridge magnets).
          </p>
          
          <div className="bg-blue-50 p-4 sm:p-6 rounded-lg mb-6 sm:mb-8">
            <p className="text-base sm:text-lg font-medium mb-0">
              Pro Tip: Bookmark us now. Future you will thank present you when those last-minute gift needs pop up!
            </p>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold mt-8 sm:mt-12 mb-3 sm:mb-4 text-primary">Disclaimer</h2>
          
          <h3 className="text-lg sm:text-xl font-semibold mt-8 mb-3">Affiliate Links</h3>
          <p className="text-base sm:text-lg mb-6">
            We may include affiliate links to Amazon or other third-party retailers. If you click on one of these links and make a purchase, we may receive a small commission—at no additional cost to you. Aside from these affiliate relationships, we are not endorsed by, nor officially affiliated with, Amazon or any other external websites.
          </p>
          
          <h3 className="text-lg sm:text-xl font-semibold mt-8 mb-3">No Price Guarantees</h3>
          <p className="text-base sm:text-lg mb-6">
            While we strive to provide the most accurate information and deals available, we cannot guarantee that the prices suggested or found through our platform will remain the same at the time of your purchase. All external links, prices, and availability are subject to change without notice.
          </p>
          
          <h3 className="text-lg sm:text-xl font-semibold mt-8 mb-3">Potentially Quirky Suggestions</h3>
          <p className="text-base sm:text-lg mb-6">
            Our AI-driven gift recommendations are designed to be fun, creative, and sometimes a little unconventional. As a result, you may occasionally encounter suggestions that are out of the ordinary. Please use your own discretion before making a purchase.
          </p>
          
          <p className="text-base sm:text-lg mb-12 italic">
            By using our website and its services, you acknowledge that you understand and agree to this disclaimer in its entirety.
          </p>
          
          <div className="text-center italic text-[#9b87f5] font-medium p-4 bg-white rounded-lg shadow-sm">
            🌟 Get The Gift — Because mediocre gifts belong in the distant galaxy, far, far away. 🚀
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;