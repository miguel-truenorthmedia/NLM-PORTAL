import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Zap,
  Search,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import NortherLeadsVideo from "@/assets/trueNorthVideo.mp4";

const Services = () => {
  const services = [
    {
      icon: TrendingUp,
      title: "Performance Marketing",
      description:
        "Data-driven marketing strategies that deliver measurable results. We optimize every campaign for maximum ROI and sustainable growth.",
      features: [
        "Campaign optimization",
        "ROI tracking",
        "Performance analytics",
        "Budget management",
      ],
    },
    {
      icon: Users,
      title: "Customer Acquisition",
      description:
        "Strategic approaches to attract and convert high-quality leads. We help you build a pipeline of motivated prospects ready to buy.",
      features: [
        "Lead generation",
        "Qualification process",
        "Conversion optimization",
        "Pipeline management",
      ],
    },
    {
      icon: Target,
      title: "Growth Strategy",
      description:
        "Comprehensive growth plans tailored to your business goals. We develop scalable strategies that drive long-term success.",
      features: [
        "Market analysis",
        "Strategy development",
        "Implementation planning",
        "Growth monitoring",
      ],
    },
    {
      icon: BarChart3,
      title: "Digital Advertising",
      description:
        "Multi-platform advertising campaigns across Google, Meta, and other channels. We maximize your reach and impact.",
      features: [
        "Google Ads",
        "Meta advertising",
        "Display campaigns",
        "Retargeting strategies",
      ],
    },
    {
      icon: Zap,
      title: "Conversion Optimization",
      description:
        "Systematic improvements to your conversion funnel. We identify bottlenecks and implement solutions that boost your results.",
      features: [
        "Funnel analysis",
        "A/B testing",
        "Landing page optimization",
        "User experience improvements",
      ],
    },
    {
      icon: Search,
      title: "Analytics & Reporting",
      description:
        "Comprehensive tracking and reporting that gives you insights into your performance. Make data-driven decisions with confidence.",
      features: [
        "Performance tracking",
        "Custom reporting",
        "Data visualization",
        "Insights & recommendations",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 overflow-hidden">
          {/* Video Background */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={NortherLeadsVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-hero-gradient opacity-60" />
          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl lg:text-6xl font-heading font-bold text-foreground mb-6">
                Our <span style={{ color: "#089f72" }}>Services</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Comprehensive marketing solutions designed to drive growth and
                deliver measurable results for your business.
              </p>
            </div>
          </div>
        </section>

        {/* Services Section with Z-Pattern */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-accent font-medium uppercase tracking-wide text-sm mb-4">
                What We Do
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6">
                Services That Drive Results
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Our comprehensive suite of marketing services is designed to
                help you acquire customers, optimize performance, and scale your
                business effectively.
              </p>
            </div>

            {/* Z-Pattern Services Grid */}
            <div className="space-y-24">
              {services.map((service, index) => {
                const IconComponent = service.icon;
                const isEven = index % 2 === 0;

                return (
                  <div
                    key={index}
                    className={`flex flex-col ${
                      isEven ? "lg:flex-row" : "lg:flex-row-reverse"
                    } items-center gap-12 lg:gap-16`}
                  >
                    {/* Content */}
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                          <IconComponent className="w-8 h-8 text-accent" />
                        </div>
                        <div>
                          <h3 className="text-2xl lg:text-3xl font-heading font-bold text-foreground">
                            {service.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {service.description}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {service.features.map((feature, featureIndex) => (
                          <div
                            key={featureIndex}
                            className="flex items-center space-x-2"
                          >
                            <div className="w-2 h-2 rounded-full bg-accent" />
                            <span className="text-sm text-muted-foreground">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4">
                        <Button
                          variant="default"
                          size="lg"
                          className="bg-orange-500 hover:bg-orange-600 text-white border-0 font-semibold tracking-wide transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl group"
                          asChild
                        >
                          <Link to="/contact">
                            Learn More
                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Visual Element */}
                    <div className="flex-1">
                      <Card className="p-8 bg-gradient-to-br from-surface-elevated to-surface-subtle border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-lg">
                        <div className="aspect-video bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <IconComponent className="w-16 h-16 text-accent mx-auto mb-4" />
                            <h4 className="text-xl font-heading font-semibold text-foreground">
                              {service.title}
                            </h4>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-surface-subtle">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="max-w-4xl mx-auto p-12 text-center bg-gradient-to-r from-surface-elevated to-surface-subtle border-accent/20">
              <h2 className="text-3xl font-heading font-bold text-foreground mb-6">
                Ready to Transform Your Marketing?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Let's discuss how our services can help you achieve your growth
                goals and drive measurable results for your business.
              </p>
              <Button
                variant="default"
                size="xl"
                className="bg-orange-500 hover:bg-orange-600 text-white border-0 font-semibold tracking-wide transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                asChild
              >
                <Link to="/contact">Get Started Today</Link>
              </Button>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Services;
