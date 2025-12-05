import { WelcomeSection } from "@/components/about/WelcomeSection";
import { MissionSection } from "@/components/about/MissionSection";
import { FeaturesSection } from "@/components/about/FeaturesSection";
import { WhyChooseUsSection } from "@/components/about/WhyChooseUsSection";
import { TeamSection } from "@/components/about/TeamSection";
import { ContactForm } from "@/components/about/ContactForm";
import { DisclaimerSection } from "@/components/about/DisclaimerSection";
import { FAQSection } from "@/components/about/FAQSection";
import { AboutMeta } from "@/components/AboutMeta";

const About = () => {
  return (
    <>
      <AboutMeta />
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl bg-[#F1F0FB] mb-24">
      <div className="prose prose-sm sm:prose-base max-w-none">
        <div className="space-y-8">
          <WelcomeSection />
          <MissionSection />
          <FeaturesSection />
          <WhyChooseUsSection />
          <TeamSection />
          <FAQSection />
          <ContactForm />
          <DisclaimerSection />
        </div>
      </div>
      </div>
    </>
  );
};

export default About;