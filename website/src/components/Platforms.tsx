import { Card } from "@/components/ui/card";

const Platforms = () => {
  const platforms = [
    {
      name: "Google",
      logo: "Google",
      description: "Search & Display Advertising",
    },
    {
      name: "Meta",
      logo: "Meta",
      description: "Social Media Advertising",
    },
    {
      name: "Yahoo!",
      logo: "Yahoo!",
      description: "Search & Native Advertising",
    },
    {
      name: "Taboola",
      logo: "Taboola",
      description: "Content Discovery Platform",
    },
    {
      name: "TikTok",
      logo: "TikTok",
      description: "Short-Form Video Advertising",
    },
    {
      name: "Outbrain",
      logo: "Outbrain",
      description: "Content Recommendation Engine",
    },
    {
      name: "Snap Inc.",
      logo: "Snap Inc.",
      description: "AR & Social Advertising",
    },
    {
      name: "Pinterest",
      logo: "Pinterest",
      description: "Visual Discovery Platform",
    },
  ];

  return (
    <section className="py-24 bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6">
            We leverage our strong partner relationships along with new and
            emerging platforms
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Our extensive network of platform partnerships ensures we can reach
            your target audience wherever they are, across the most effective
            advertising channels in the digital landscape.
          </p>
        </div>

        {/* Platforms Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {platforms.map((platform, index) => (
            <Card
              key={index}
              className="p-8 bg-card border-border hover:border-accent/30 transition-all duration-300 hover:shadow-card-elevated group"
            >
              <div className="flex flex-col items-center space-y-4">
                {/* Platform Logo/Name */}
                <div>
                  {platform.name === "Google" && (
                    <div className="text-4xl font-bold">
                      <span className="text-blue-500">G</span>
                      <span className="text-red-500">o</span>
                      <span className="text-yellow-500">o</span>
                      <span className="text-blue-500">g</span>
                      <span className="text-green-500">l</span>
                      <span className="text-red-500">e</span>
                    </div>
                  )}
                  {platform.name === "Meta" && (
                    <div className="text-4xl font-bold text-blue-600">
                      ∞ Meta
                    </div>
                  )}
                  {platform.name === "Yahoo!" && (
                    <div className="text-4xl font-bold text-purple-600">
                      yahoo!
                    </div>
                  )}
                  {platform.name === "Taboola" && (
                    <div className="text-4xl font-bold text-blue-600">
                      Taboola
                    </div>
                  )}
                  {platform.name === "TikTok" && (
                    <div className="text-4xl font-bold text-black">
                      🎵 TikTok
                    </div>
                  )}
                  {platform.name === "Outbrain" && (
                    <div className="text-4xl font-bold text-orange-600">
                      👁️ outbrain
                    </div>
                  )}
                  {platform.name === "Snap Inc." && (
                    <div className="text-3xl font-bold text-black">
                      Snap Inc.
                    </div>
                  )}
                  {platform.name === "Pinterest" && (
                    <div
                      className="text-4xl font-bold text-red-600"
                      style={{ fontFamily: "cursive" }}
                    >
                      Pinterest
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            Ready to leverage these powerful platforms for your business?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/contact"
              className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl inline-block"
            >
              Start Your Campaign
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Platforms;
