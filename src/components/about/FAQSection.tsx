import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const FAQSection = () => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm mb-12">
      <h2 className="text-xl font-bold mb-4 text-[#9b87f5]">❓ FAQ</h2>
      <p className="text-xs text-[#403E43] mb-6 leading-relaxed">
        Find the Perfect Gift, Best Gift Ideas, and Present Inspiration
      </p>
      
      <p className="text-xs text-[#403E43] mb-8 leading-relaxed">
        Below you'll find answers to some of the most common questions about Get The Gift, covering everything from how we help you uncover the best gift ideas to where our gift inspiration comes from. If you're looking for that perfect gift or a thoughtful present, we've got you covered.
      </p>

      <Accordion type="single" collapsible className="space-y-4">
        <AccordionItem value="item-1" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              🎁 What is Get The Gift, and how does it help me find the perfect gift?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            Get The Gift is an online platform designed to provide customized gift ideas and gift inspiration for any occasion. Our system analyzes your recipient's interests to suggest the best gift or perfect present, saving you time and guesswork.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              🎂 Do you offer gift inspiration for birthdays, anniversaries, and other occasions?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            Absolutely! Whether you need gift ideas for birthdays, holidays, anniversaries, or last-minute presents, Get The Gift has you covered. We specialize in finding the perfect gift for all ages and preferences.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              🤖 How does your recommendation process work?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            Our gift inspiration engine takes into account factors like your recipient's age, interests, and budget. We then generate a curated list of the best gift options, ensuring you find the ideal present without endless scrolling.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              👥 Are your gift ideas suitable for all age groups and interests?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            Yes! We cater to everyone—from tech-savvy teens to cozy homebodies and adventurous grandparents. Our database covers an extensive range of categories, ensuring you'll always discover a present that fits each unique personality.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              💰 Can I filter gift suggestions by price or category?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            Certainly. After you receive initial gift ideas, you can refine the results by price range, interest, or event. This way, you're more likely to land on the perfect gift that aligns with both your budget and your recipient's tastes.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-6" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              ⏰ How up-to-date are your gift recommendations and prices?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            We strive to provide real-time deals and the latest gift inspiration. However, prices may change without notice. Always check the current price on the retailer's website before finalizing your present purchase.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-7" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              💎 Do you earn commissions from the gifts you suggest?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            Some of our links may be affiliate links. If you click on them and make a purchase, we might earn a small commission at no extra cost to you. This helps us keep providing fresh gift ideas and new gift inspiration, but we're not affiliated with these retailers beyond that.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-8" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              🎯 What if the gift suggestions are too quirky or don't match my needs?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            Our system can occasionally serve up off-the-wall or unconventional present suggestions. We recommend browsing multiple ideas or adjusting filters until you find the best gift that truly resonates with your recipient.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-9" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              ✨ Do you guarantee a perfect gift every time?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            While we do our best to generate the perfect gift or best gift ideas, we can't guarantee absolute satisfaction in every scenario. Personal preferences can be unpredictable, so we encourage you to use your own judgement before purchasing any present.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-10" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              💡 How can I get more help finding the best gift ideas?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            If you have additional questions, need more gift inspiration, or want extra help choosing the best gift, feel free to reach out to us. Our team is always happy to provide further guidance!
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-11" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              🌟 How do you ensure the quality of recommended gifts?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            We carefully analyze product ratings, reviews, and customer feedback to ensure we only recommend high-quality gifts. Our system also considers factors like product durability, brand reputation, and overall value for money when making suggestions.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-12" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              🎨 Can I find personalized or custom gift ideas?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            Yes! Our platform includes suggestions for personalized and custom gifts. Whether you're looking for monogrammed items, custom artwork, or specially crafted presents, we can help you find unique and meaningful gift options that add a personal touch.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-13" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              🌍 Do you offer international shipping information?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            While we primarily focus on gift recommendations, most products we suggest are available through major retailers that offer international shipping. We recommend checking the specific retailer's shipping policies and delivery timeframes for your location.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-14" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              📅 How often do you update your gift suggestions?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            Our gift database is continuously updated to include the latest products, trending items, and seasonal recommendations. We regularly refresh our suggestions to ensure you have access to current and relevant gift ideas throughout the year.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-15" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              🎊 Do you have special recommendations for milestone events?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            Absolutely! We offer specialized gift suggestions for milestone events like graduations, weddings, anniversaries, and significant birthdays. Our recommendations take into account the significance of these special occasions to help you find truly memorable presents.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <p className="text-xs text-[#403E43] mt-8 leading-relaxed italic text-center">
        We hope this FAQ clarifies how Get The Gift can simplify your hunt for the perfect present. From quirky treasures to timeless classics, we'll keep the gift ideas flowing so you can make every occasion unforgettable. ✨
      </p>
    </div>
  );
};