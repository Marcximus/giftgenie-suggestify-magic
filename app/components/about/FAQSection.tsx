import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


export const FAQSection = () => {
  const faqItems = [
    {
      question: "What are your best gift ideas for women and moms?",
      answer: "We offer a wide range of thoughtful gift suggestions for women and moms, from luxurious self-care items to practical home gadgets. Our AI considers personal interests, hobbies, and lifestyle to recommend perfect presents for birthdays, Christmas, or just because. Whether she's a busy mom, career woman, or both, we'll help you find a meaningful gift she'll love."
    },
    {
      question: "How do you curate gift ideas for men and dads?",
      answer: "Our gift suggestions for men and dads range from tech gadgets to outdoor gear and unique hobby-related items. We understand that finding the right gift for men can be challenging, so we focus on their interests, whether they're tech enthusiasts, sports fans, or DIY lovers, to suggest meaningful and practical presents they'll actually use."
    },
    {
      question: "What makes your Christmas gift recommendations special?",
      answer: "Our Christmas gift suggestions are carefully curated for both him and her, considering seasonal trends and holiday spirit. We help you find those perfect Christmas presents that bring joy and surprise, whether you're shopping for your spouse, parents, or friends. Our recommendations range from cozy winter essentials to festive luxury items."
    },
    {
      question: "How do you handle romantic gift suggestions for couples?",
      answer: "For romantic gifts, we focus on creating memorable experiences and meaningful presents for couples. Whether you're shopping for your girlfriend, boyfriend, wife, or husband, we suggest thoughtful gifts that show your love and appreciation. From romantic date night ideas to personalized keepsakes, we help you find the perfect way to express your feelings."
    },
    {
      question: "What about gift ideas for teenagers?",
      answer: "Finding gifts for teens can be tricky, but we stay up-to-date with the latest trends and interests. For teen girls and boys, we recommend age-appropriate gifts that align with their hobbies, from gaming accessories to fashion items, tech gadgets, and creative supplies. We ensure our suggestions are both cool and practical."
    },
    {
      question: "How up-to-date are your gift recommendations and prices?",
      answer: "We strive to provide real-time deals and the latest gift inspiration. However, prices may change without notice. Always check the current price on the retailer's website before finalizing your present purchase."
    },
    {
      question: "Do you earn commissions from the gifts you suggest?",
      answer: "Some of our links may be affiliate links. If you click on them and make a purchase, we might earn a small commission at no extra cost to you. This helps us keep providing fresh gift ideas and new gift inspiration, but we're not affiliated with these retailers beyond that."
    },
    {
      question: "What if the gift suggestions are too quirky or don't match my needs?",
      answer: "Our system can occasionally serve up off-the-wall or unconventional present suggestions. We recommend browsing multiple ideas or adjusting filters until you find the best gift that truly resonates with your recipient."
    },
    {
      question: "Do you guarantee a perfect gift every time?",
      answer: "While we do our best to generate the perfect gift or best gift ideas, we can't guarantee absolute satisfaction in every scenario. Personal preferences can be unpredictable, so we encourage you to use your own judgement before purchasing any present."
    },
    {
      question: "How can I get more help finding the best gift ideas?",
      answer: "If you have additional questions, need more gift inspiration, or want extra help choosing the best gift, feel free to reach out to us. Our team is always happy to provide further guidance!"
    },
    {
      question: "How do you ensure the quality of recommended gifts?",
      answer: "We carefully analyze product ratings, reviews, and customer feedback to ensure we only recommend high-quality gifts. Our system also considers factors like product durability, brand reputation, and overall value for money when making suggestions."
    },
    {
      question: "Can I find personalized or custom gift ideas?",
      answer: "Yes! Our platform includes suggestions for personalized and custom gifts. Whether you're looking for monogrammed items, custom artwork, or specially crafted presents, we can help you find unique and meaningful gift options that add a personal touch."
    },
    {
      question: "Do you offer international shipping information?",
      answer: "While we primarily focus on gift recommendations, most products we suggest are available through major retailers that offer international shipping. We recommend checking the specific retailer's shipping policies and delivery timeframes for your location."
    },
    {
      question: "How often do you update your gift suggestions?",
      answer: "Our gift database is continuously updated to include the latest products, trending items, and seasonal recommendations. We regularly refresh our suggestions to ensure you have access to current and relevant gift ideas throughout the year."
    },
    {
      question: "Do you have special recommendations for milestone events?",
      answer: "Absolutely! We offer specialized gift suggestions for milestone events like graduations, weddings, anniversaries, and significant birthdays. Our recommendations take into account the significance of these special occasions to help you find truly memorable presents."
    },
    {
      question: "Do you have suggestions for workplace gift exchanges?",
      answer: "Yes! We understand the unique challenges of finding appropriate gifts for coworkers and workplace exchanges. Our suggestions include professional, thoughtful items that maintain workplace boundaries while showing appreciation. We consider various budget ranges and office environments to ensure suitable gift options."
    },
    {
      question: "What makes your birthday gift suggestions unique?",
      answer: "Our birthday gift recommendations are personalized based on age, gender, and interests. Whether you're looking for birthday gifts for him or her, we focus on making each suggestion special and memorable. We consider current trends, personal hobbies, and unique preferences to help you find that perfect birthday surprise."
    },
    {
      question: "How do you find unique and creative gift ideas?",
      answer: "We constantly research emerging trends, artisanal products, and unique offerings to provide fresh and creative gift ideas. Our suggestions go beyond conventional presents, including handcrafted items, personalized experiences, and innovative products that stand out from typical gift options."
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <>
      
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      
      
      <div className="bg-white rounded-lg p-6 shadow-sm mb-12">
        <h2 className="text-xl font-bold mb-4 text-[#9b87f5]">❓ FAQ</h2>
        <p className="text-xs text-[#403E43] mb-6 leading-relaxed">
          Find the Perfect Gift, Best Gift Ideas, and Present Inspiration
        </p>
        
        <p className="text-xs text-[#403E43] mb-8 leading-relaxed">
          Below you'll find answers to some of the most common questions about Get The Gift, covering everything from how we help you uncover the best gift ideas to where our gift inspiration comes from. If you're looking for that perfect gift or a thoughtful present, we've got you covered.
        </p>

        <Accordion type="single" collapsible className="space-y-4">
          {faqItems.map((item, index) => (
            <AccordionItem 
              key={`item-${index + 1}`} 
              value={`item-${index + 1}`} 
              className="border rounded-lg px-4 hover:bg-slate-50 transition-colors"
            >
              <AccordionTrigger className="text-[#7E69AB] hover:no-underline text-sm">
                <span className="flex items-center gap-2">
                  {item.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-[#403E43]">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="text-xs text-[#403E43] mt-8 leading-relaxed italic text-center">
          We hope this FAQ clarifies how Get The Gift can simplify your hunt for the perfect present. From quirky treasures to timeless classics, we'll keep the gift ideas flowing so you can make every occasion unforgettable. ✨
        </p>
      </div>
    </>
  );
};
