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
              👩 What are your best gift ideas for women and moms?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            We offer a wide range of thoughtful gift suggestions for women and moms, from luxurious self-care items to practical home gadgets. Our AI considers personal interests, hobbies, and lifestyle to recommend perfect presents for birthdays, Christmas, or just because. Whether she's a busy mom, career woman, or both, we'll help you find a meaningful gift she'll love.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              👨 How do you curate gift ideas for men and dads?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            Our gift suggestions for men and dads range from tech gadgets to outdoor gear and unique hobby-related items. We understand that finding the right gift for men can be challenging, so we focus on their interests, whether they're tech enthusiasts, sports fans, or DIY lovers, to suggest meaningful and practical presents they'll actually use.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-3" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              💝 What makes your Christmas gift recommendations special?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            Our Christmas gift suggestions are carefully curated for both him and her, considering seasonal trends and holiday spirit. We help you find those perfect Christmas presents that bring joy and surprise, whether you're shopping for your spouse, parents, or friends. Our recommendations range from cozy winter essentials to festive luxury items.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-4" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              💑 How do you handle romantic gift suggestions for couples?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            For romantic gifts, we focus on creating memorable experiences and meaningful presents for couples. Whether you're shopping for your girlfriend, boyfriend, wife, or husband, we suggest thoughtful gifts that show your love and appreciation. From romantic date night ideas to personalized keepsakes, we help you find the perfect way to express your feelings.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-5" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              👧 What about gift ideas for teenagers?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            Finding gifts for teens can be tricky, but we stay up-to-date with the latest trends and interests. For teen girls and boys, we recommend age-appropriate gifts that align with their hobbies, from gaming accessories to fashion items, tech gadgets, and creative supplies. We ensure our suggestions are both cool and practical.
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

        <AccordionItem value="item-16" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              👥 Do you have suggestions for workplace gift exchanges?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            Yes! We understand the unique challenges of finding appropriate gifts for coworkers and workplace exchanges. Our suggestions include professional, thoughtful items that maintain workplace boundaries while showing appreciation. We consider various budget ranges and office environments to ensure suitable gift options.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-17" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              🎁 What makes your birthday gift suggestions unique?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            Our birthday gift recommendations are personalized based on age, gender, and interests. Whether you're looking for birthday gifts for him or her, we focus on making each suggestion special and memorable. We consider current trends, personal hobbies, and unique preferences to help you find that perfect birthday surprise.
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-18" className="border rounded-lg px-4 hover:bg-slate-50 transition-colors">
          <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
            <span className="flex items-center gap-2">
              🌟 How do you find unique and creative gift ideas?
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-[#403E43]">
            We constantly research emerging trends, artisanal products, and unique offerings to provide fresh and creative gift ideas. Our suggestions go beyond conventional presents, including handcrafted items, personalized experiences, and innovative products that stand out from typical gift options.
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <p className="text-xs text-[#403E43] mt-8 leading-relaxed italic text-center">
        We hope this FAQ clarifies how Get The Gift can simplify your hunt for the perfect present. From quirky treasures to timeless classics, we'll keep the gift ideas flowing so you can make every occasion unforgettable. ✨
      </p>
    </div>
  );
};
