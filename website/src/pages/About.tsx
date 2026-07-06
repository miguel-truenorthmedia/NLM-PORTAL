import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, Users, Heart, Award } from "lucide-react";
import { Link } from "react-router-dom";
import NortherLeadsVideo from "@/assets/trueNorthVideo.mp4";

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Mission Driven",
      description:
        "Founded to fill a need in the performance call marketing space with trustworthy partnerships.",
    },
    {
      icon: Users,
      title: "Culture First",
      description:
        "We're not just professionals - we're a family that believes culture helps everyone grow.",
    },
    {
      icon: Heart,
      title: "Partnership Focus",
      description:
        "We don't see ourselves as vendors but as an integral division of your company.",
    },
    {
      icon: Award,
      title: "Industry Veterans",
      description:
        "Our team consists of industry experts who understand every angle of performance marketing.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-hero-gradient overflow-hidden">
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
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-6 leading-tight">
              About{" "}
              <span className="bg-gradient-to-r from-accent to-accent-glow-light bg-clip-text text-transparent">
                Us
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Founded in 2022, Northern Leads Media is a performance marketing
              agency focused on generating high-quality leads and calls through
              data-driven ad campaigns. By leveraging platforms like Google and
              Meta, we design, launch, and optimize campaigns that drive
              measurable ROI.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-24 bg-surface-subtle">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <p className="text-accent font-medium uppercase tracking-wide text-sm mb-4">
                  Our Mission
                </p>
                <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-8">
                  Mission for Greatness
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <p className="text-muted-foreground leading-relaxed">
                    Northern Leads Media is a performance marketing agency
                    focused on generating high-quality leads and calls through
                    data-driven ad campaigns. We quickly realized that business
                    owners needed comprehensive growth solutions that deliver
                    measurable ROI.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    In 2023, we expanded into affiliate marketing, developing
                    performance-based strategies that deliver measurable
                    results. This evolution led us to become a comprehensive
                    growth partner, leveraging platforms like Google and Meta to
                    design, launch, and optimize campaigns that drive measurable
                    results.
                  </p>
                  <p className="text-foreground font-semibold">
                    Today, we help business owners and CEOs accelerate their
                    growth through proven performance marketing and affiliate
                    marketing strategies that deliver real results and directly
                    impact their bottom line.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {values.map((value, index) => {
                    const IconComponent = value.icon;
                    return (
                      <Card
                        key={index}
                        className="p-6 bg-surface-elevated border-border hover:border-accent/30 transition-all duration-300 group"
                      >
                        <div className="w-12 h-12 mb-4 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                          <IconComponent className="w-6 h-6 text-accent" />
                        </div>
                        <h3 className="font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                          {value.title}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {value.description}
                        </p>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who We Are Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-8">
                Who We Are
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                At Northern Leads Media, we're not just a team of professionals.
                We're a family that believes our culture will not only help our
                company grow but anyone we conduct business with. Culture is
                king within our organization.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-12">
                Our team consists of industry veterans, old school TV media
                buyers, a reality TV star, a former San Antonio Spurs
                cheerleader, super affiliate marketers, experienced
                copy-writers, graphic designers with a concentration on
                conversion, 2 dogs, a cat, 5 salt water fish, and jiu jitsu
                black belt. We understand every angle of the performance
                marketing industry and strive to become experts in each facet to
                ensure no matter who we work with, we fully understand their
                business.
              </p>
            </div>

            {/* Our Goal Card */}
            <Card className="max-w-3xl mx-auto p-8 bg-card border-accent/20">
              <div className="text-center">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-4">
                  Our Goal
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our goal for our clients is to allow them to succeed in pay
                  per call without the issues that come with scaling a digital
                  customer acquisition campaign. We don't just look at ourselves
                  as a vendor to our partners but a division of your company.
                  Our primary goal is to become an integral piece of your
                  business.
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-surface-subtle">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="max-w-3xl mx-auto p-12 text-center bg-gradient-to-r from-surface-elevated to-surface-subtle border-accent/20">
              <h2 className="text-3xl font-heading font-bold text-foreground mb-6">
                Any Questions? Let's Talk.
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We're here to answer any question you may have and help you
                start your journey with Northern Leads Media.
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

export default About;
