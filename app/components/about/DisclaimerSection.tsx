export const DisclaimerSection = () => {
  return (
    <>
      <div className="bg-white rounded-lg p-6 shadow-sm mb-12">
        <h2 className="text-xl font-bold mb-4 text-[#9b87f5]">⚠️ Disclaimer</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-[#7E69AB] mb-2">🔗 Affiliate Links</h3>
            <p className="text-sm text-justify leading-relaxed text-[#403E43]">
              We may include affiliate links to Amazon or other third-party retailers. If you click on one of these links and make a purchase, we may receive a small commission—at no additional cost to you. Aside from these affiliate relationships, we are not endorsed by, nor officially affiliated with, Amazon or any other external websites.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-[#7E69AB] mb-2">💰 No Price Guarantees</h3>
            <p className="text-sm text-justify leading-relaxed text-[#403E43]">
              While we strive to provide the most accurate information and deals available, we cannot guarantee that the prices suggested or found through our platform will remain the same at the time of your purchase. All external links, prices, and availability are subject to change without notice.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-[#7E69AB] mb-2">🎲 Potentially Quirky Suggestions</h3>
            <p className="text-sm text-justify leading-relaxed text-[#403E43]">
              Our AI-driven gift recommendations are designed to be fun, creative, and sometimes a little unconventional. As a result, you may occasionally encounter suggestions that are out of the ordinary. Please use your own discretion before making a purchase.
            </p>
          </div>
        </div>
        
        <p className="text-sm text-justify leading-relaxed text-[#403E43] mt-6 italic">
          By using our website and its services, you acknowledge that you understand and agree to this disclaimer in its entirety.
        </p>
      </div>
      
      <div className="text-center italic text-[#9b87f5] font-medium p-4 bg-white rounded-lg shadow-sm mb-8">
        🌟 Get The Gift — Because mediocre gifts belong in the distant galaxy, far, far away. 🚀
      </div>
    </>
  );
};