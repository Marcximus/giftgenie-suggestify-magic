import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1 className="flex flex-col items-center gap-1 mb-8">
          <span className="text-lg text-gray-600">Welcome to</span>
          <Link to="/" className="text-4xl font-bold text-[#1EAEDB] hover:text-[#0FA0CE] transition-colors">
            Get The Gift
          </Link>
          <span className="text-lg text-gray-600">- The Only Gift-Giving Sidekick You'll Ever Need!</span>
        </h1>
        
        <p className="text-lg mb-8">
          Are you tired of giving the same ol' scented candle or novelty mug every year? We thought so. That's why Get The Gift was created: to help you discover the perfect present for everyone on your list without the stress, guesswork, or frantic 3 A.M. Google searches for "best birthday gift ideas." We'll be the wise (and sometimes witty) friend at your side, guiding you through the vast universe of gift-giving, one brilliant recommendation at a time.
        </p>
        
        <h2 className="text-2xl font-bold mt-12 mb-4 text-primary">Our Mission: No More Meh Presents</h2>
        <p className="text-lg mb-8">
          We're on a mission to banish boring gifts from planet Earth. With our smart gift selection tool, you can wow your recipient with a unique, thoughtful item that actually fits their personality. Whether you're shopping for birthdays, holidays, anniversaries, or the "just because" moments, we're here to ensure every gift is worthy of a "Wow, how did you know?!" reaction.
        </p>
        
        <h2 className="text-2xl font-bold mt-12 mb-4 text-primary">How We Work Our Gift-Giving Magic</h2>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">AI-Powered Gift Suggestions</h3>
        <p className="text-lg mb-6">
          Our advanced algorithms evaluate your recipient's likes, dislikes, and that time they couldn't stop talking about alpaca socks (hey, it happens). Then, we conjure up a personalized list of options that'll make their eyes sparkle brighter than tinsel.
        </p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">Handpicked from Top Retailers</h3>
        <p className="text-lg mb-6">
          We scour all corners of the web—like ninjas in slippers—to bring you the best deals and delivery choices. Thanks to our partnerships with major retailers, you can snag the perfect gift while enjoying a wallet-friendly price and reliable shipping.
        </p>
        
        <h3 className="text-xl font-semibold mt-6 mb-3">Expertly Curated Gift Guides</h3>
        <p className="text-lg mb-8">
          From "Unicorn-Loving Teens" to "World-Traveler Grandmas," we've got themed gift guides to inspire your creative side. We keep track of the latest trends, so you don't have to.
        </p>
        
        <h2 className="text-2xl font-bold mt-12 mb-4 text-primary">Why Get The Gift?</h2>
        <ul className="list-disc pl-6 mb-8 space-y-2">
          <li className="text-lg">Stress-Free Experience: No more aimless online browsing or settling for random last-minute purchases.</li>
          <li className="text-lg">Personal Touch: Our suggestions feel tailor-made because they practically are.</li>
          <li className="text-lg">Time-Saving: Spend less time hunting and more time celebrating (or binge-watching your favorite show—we won't judge).</li>
          <li className="text-lg">Ridiculously Fun: Because searching for awesome gifts should be an adventure, not a chore.</li>
        </ul>
        
        <h2 className="text-2xl font-bold mt-12 mb-4 text-primary">Meet the Gift Gurus</h2>
        <p className="text-lg mb-8">
          We're a small (yet mighty) team of innovators, data nerds, and hopeless romantics who believe in the power of a perfect gift. Whether you're celebrating your dog's "gotcha day" or your best friend's milestone birthday, we're obsessed with finding a present that hits all the right notes.
        </p>
        
        <h2 className="text-2xl font-bold mt-12 mb-4 text-primary">Ready to Make Someone's Day?</h2>
        <p className="text-lg mb-8">
          Let us handle the research, the comparisons, and the creative brainstorming. Your only job is to take all the credit (we're totally cool with that).
        </p>
        
        <h2 className="text-2xl font-bold mt-12 mb-4 text-primary">Have Questions or Need a Gift Rescue?</h2>
        <p className="text-lg mb-8">
          We're always here to help. Send us a friendly "Hello!" and we'll do everything but wrap your presents (though we're working on that, too).
        </p>
        
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg shadow-sm mb-12 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              className="min-h-[100px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </Button>
        </form>
        
        <h2 className="text-2xl font-bold mt-12 mb-4 text-primary">Get The Gift: Your Ticket to Gift-Giving Greatness</h2>
        <p className="text-lg mb-8">
          No more fruitcakes, mismatched socks, or re-gifted fiascos. At Get The Gift, we aim to transform every celebration into a story worth telling—complete with gasps of delight, big smiles, and maybe even happy tears. After all, the perfect gift is the key to anyone's heart (or at least their fridge magnets).
        </p>
        
        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <p className="text-lg font-medium mb-0">
            Pro Tip: Bookmark us now. Future you will thank present you when those last-minute gift needs pop up!
          </p>
        </div>
        
        <h2 className="text-2xl font-bold mt-12 mb-4 text-primary">Disclaimer</h2>
        
        <h3 className="text-xl font-semibold mt-8 mb-3">Affiliate Links</h3>
        <p className="text-lg mb-6">
          We may include affiliate links to Amazon or other third-party retailers. If you click on one of these links and make a purchase, we may receive a small commission—at no additional cost to you. Aside from these affiliate relationships, we are not endorsed by, nor officially affiliated with, Amazon or any other external websites.
        </p>
        
        <h3 className="text-xl font-semibold mt-8 mb-3">No Price Guarantees</h3>
        <p className="text-lg mb-6">
          While we strive to provide the most accurate information and deals available, we cannot guarantee that the prices suggested or found through our platform will remain the same at the time of your purchase. All external links, prices, and availability are subject to change without notice.
        </p>
        
        <h3 className="text-xl font-semibold mt-8 mb-3">Potentially Quirky Suggestions</h3>
        <p className="text-lg mb-6">
          Our AI-driven gift recommendations are designed to be fun, creative, and sometimes a little unconventional. As a result, you may occasionally encounter suggestions that are out of the ordinary. Please use your own discretion before making a purchase.
        </p>
        
        <p className="text-lg mb-12 italic">
          By using our website and its services, you acknowledge that you understand and agree to this disclaimer in its entirety.
        </p>
        
        <p className="text-xl font-semibold text-center italic text-primary mb-12">
          Get The Gift — Because mediocre gifts belong in the distant galaxy, far, far away.
        </p>
      </div>
    </div>
  );
};

export default About;
