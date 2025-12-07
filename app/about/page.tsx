import { WelcomeSection } from "@/components/about/WelcomeSection";
import { MissionSection } from "@/components/about/MissionSection";
import { FeaturesSection } from "@/components/about/FeaturesSection";
import { WhyChooseUsSection } from "@/components/about/WhyChooseUsSection";
import { TeamSection } from "@/components/about/TeamSection";
import { ContactForm } from "@/components/about/ContactForm";
import { DisclaimerSection } from "@/components/about/DisclaimerSection";
import { FAQSection } from "@/components/about/FAQSection";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us - Get The Gift',
  description: 'Learn about Get The Gift, the AI-powered gift recommendation platform that helps you find the perfect presents for any occasion.',
  alternates: {
    canonical: 'https://getthegift.ai/about',
  },
  openGraph: {
    title: 'About Get The Gift - AI-Powered Gift Finder',
    description: 'Learn about Get The Gift, the AI-powered gift recommendation platform that helps you find the perfect presents for any occasion.',
    url: 'https://getthegift.ai/about',
    type: 'website',
    images: [{
      url: 'https://getthegift.ai/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png',
      width: 1200,
      height: 630,
      alt: 'About Get The Gift',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Get The Gift - AI-Powered Gift Finder',
    description: 'Learn about Get The Gift, the AI-powered gift recommendation platform that helps you find the perfect presents for any occasion.',
    images: ['https://getthegift.ai/lovable-uploads/89d8ebcd-a5f6-4614-a505-80ed3d467943.png'],
  },
};

export default function About() {
  return (
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
  );
}
