import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Search,
  CheckCircle,
  TrendingUp,
  Phone,
  Users,
  Award,
  Target,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import NortherLeadsVideo from "@/assets/trueNorthVideo.mp4";

const HomeImprovements = () => {
  const processSteps = [
    {
      icon: Search,
      title: "We find prospects",
      description:
        "We swiftly identify and engage with prospective buyers when they are in the actual process of searching for home improvement services online. From there, we connect with them and evaluate their home improvement needs.",
    },
    {
      icon: CheckCircle,
      title: "We qualify the lead",
      description:
        "We then transfer the lead to our highly experienced in-house team that verifies the prospect's information and intent to seek home improvement services. This process is done using our advanced routing technology.",
    },
    {
      icon: TrendingUp,
      title: "We deliver results",
      description:
        "Our qualified leads are delivered to your sales team in real-time, ensuring maximum conversion potential and optimal return on your marketing investment.",
    },
  ];

  const benefits = [
    {
      icon: Phone,
      title: "Qualified Calls",
      description:
        "Connect with motivated prospects actively searching for home improvement solutions.",
    },
    {
      icon: Users,
      title: "Scale & Volume",
      description:
        "Reach millions of potential customers across various platforms and publisher networks.",
    },
    {
      icon: Award,
      title: "Quality Assurance",
      description:
        "Our rigorous qualification process ensures high-intent leads ready to convert.",
    },
    {
      icon: Target,
      title: "Precise Targeting",
      description:
        "Advanced targeting capabilities to reach your ideal customer demographics.",
    },
  ];

  const stats = [
    { number: "95%", label: "Lead Quality Score" },
    { number: "3x", label: "Higher Conversion Rate" },
    { number: "50+", label: "Home Improvement Partners" },
    { number: "24/7", label: "Lead Delivery" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-hero-gradient">
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
          <div className="absolute inset-0 overflow-hidden">
            <svg
              className="absolute bottom-0 w-full h-32 text-surface-elevated opacity-20"
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              fill="currentColor"
            >
              <path d="M0,60 C300,100 600,20 900,60 C1050,80 1150,40 1200,60 L1200,120 L0,120 Z" />
            </svg>
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-accent font-medium uppercase tracking-wide text-sm mb-4">
              Home Improvements Industry
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-6 leading-tight">
              Reach Motivated Home Improvement Clients{" "}
              <span className="bg-gradient-to-r from-accent to-accent-glow-light bg-clip-text text-transparent">
                at Scale
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Target motivated users from various top brands, sites and millions
              of publisher sites with full transparency at scale.
            </p>
            <Button variant="hero" size="xl">
              Start Getting Qualified Calls Now!
            </Button>
          </div>
        </section>

        {/* Introduction Section */}
        <section className="py-16 bg-surface-subtle">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our tailored solutions encompass a diverse array of options to
                align with the capabilities of your brand. With the capacity to
                seamlessly integrate with your existing CRM platform, call
                center applications, and data providers, we are dedicated to
                collaborating with you to enhance performance and derive maximum
                value from each call, click, or lead.
              </p>
            </div>
          </div>
        </section>

        {/* Home Improvements Industry Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-accent font-medium uppercase tracking-wide text-sm mb-4">
                Home Improvements Industry
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-8">
                Data Driven Digital Distribution for the Home Improvements
                Industry
              </h2>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <Card
                  key={index}
                  className="p-6 text-center bg-surface-elevated border-border"
                >
                  <div className="text-3xl font-bold text-accent mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </Card>
              ))}
            </div>

            {/* Process Steps */}
            <div className="mb-16">
              <h3 className="text-2xl font-heading font-bold text-center text-foreground mb-12">
                Here is a preview of how our process works:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {processSteps.map((step, index) => {
                  const IconComponent = step.icon;
                  return (
                    <Card
                      key={index}
                      className="p-8 text-center bg-card border-border hover:border-accent/30 transition-all duration-300 group"
                    >
                      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                        <IconComponent className="w-8 h-8 text-accent" />
                      </div>
                      <h4 className="text-xl font-heading font-semibold text-foreground mb-4 group-hover:text-accent transition-colors">
                        {step.title}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                      <div className="mt-6 text-2xl font-bold text-accent opacity-30 group-hover:opacity-60 transition-opacity">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 bg-surface-subtle">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-6">
                Why Choose Our Home Improvements Lead Generation?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We deliver high-quality, verified leads that convert into
                profitable home improvement clients for your business.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <Card
                    key={index}
                    className="p-6 bg-card border-border hover:border-accent/30 transition-all duration-300 group text-center"
                  >
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <IconComponent className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-lg font-heading font-semibold text-foreground mb-3 group-hover:text-accent transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="max-w-4xl mx-auto p-12 text-center bg-gradient-to-r from-surface-elevated to-surface-subtle border-accent/20">
              <BarChart3 className="w-16 h-16 mx-auto mb-6 text-accent" />
              <h2 className="text-3xl font-heading font-bold text-foreground mb-6">
                Ready to Scale Your Home Improvements Business?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join hundreds of home improvement professionals who trust
                Northern Leads Media to deliver high-quality leads and drive
                sustainable growth for their business.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/contact">Get Started Today</Link>
                </Button>
                <Button variant="nav" size="xl">
                  Schedule a Demo
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomeImprovements;
