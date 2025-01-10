const About = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">About GiftGenie</h1>
      
      <div className="prose prose-lg">
        <p>
          Welcome to GiftGenie, your AI-powered gift suggestion platform. We're here to take the stress out of gift-giving by providing personalized recommendations based on your recipient's interests, age, and preferences.
        </p>
        
        <h2>Our Mission</h2>
        <p>
          Our mission is to make gift-giving a delightful experience. We believe that finding the perfect gift shouldn't be a challenge, which is why we've developed an intelligent system that understands individual preferences and suggests thoughtful, personalized gifts.
        </p>
        
        <h2>How It Works</h2>
        <p>
          GiftGenie uses advanced AI technology to analyze various factors including age, interests, occasion, and budget to generate tailored gift suggestions. Our platform connects with major retailers to ensure you get the best prices and reliable delivery options.
        </p>
        
        <h2>Contact Us</h2>
        <p>
          Have questions or suggestions? We'd love to hear from you! Reach out to us at support@giftgenie.com
        </p>
      </div>
    </div>
  );
};

export default About;