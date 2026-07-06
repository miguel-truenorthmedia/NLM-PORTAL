import { Card } from "@/components/ui/card";
import { Users, TrendingUp, Target, Award, Zap, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Features = () => {
  const features = [
    {
      icon: Users,
      title: "We Act As Your Partner",
      description:
        "At Northern Leads Media, we're not just an external agency to your business. We look at ourselves as your partner in growth. It's not just all numbers and ROI with us, its building deep partnerships as well.",
    },
    {
      icon: TrendingUp,
      title: "We Know What True Scale Is",
      description:
        "We have 14 years of growth experience under our belt. Whether you're a marketer, brand, law firm or agency, we understand what is needed to truly scale your business based on tried and tested tactics and values.",
    },
    {
      icon: Target,
      title: "Precision Targeting",
      description:
        "Our data-driven approach ensures every campaign reaches the right audience at the right time, maximizing your return on investment and driving sustainable growth.",
    },
    {
      icon: Award,
      title: "Proven Track Record",
      description:
        "With over 500 successful campaigns and industry recognition, our results speak for themselves. We consistently deliver exceptional performance for our partners.",
    },
    {
      icon: Zap,
      title: "Lightning Fast Results",
      description:
        "Our streamlined processes and cutting-edge technology enable rapid deployment and quick wins, helping you see measurable results in weeks, not months.",
    },
    {
      icon: Shield,
      title: "Risk-Free Partnership",
      description:
        "We're so confident in our ability to deliver results that we offer performance guarantees and flexible partnership terms to minimize your risk.",
    },
  ];

  return (
    <section className="py-24 bg-surface-subtle relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-accent font-medium uppercase tracking-wide text-sm mb-4">
            Our Reputation
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6">
            Why Does the Industry Choose Northern Leads Media?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We've built our reputation on delivering exceptional results and
            forming lasting partnerships with businesses of all sizes.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card
                key={index}
                className="p-8 bg-card border-border hover:border-accent/30 transition-all duration-300 hover:shadow-card-elevated group"
              >
                <div className="flex flex-col items-start space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <IconComponent className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-foreground group-hover:text-accent transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            Ready to experience the Northern Leads Media difference?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/contact"
              className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl inline-block"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-48 h-48 bg-accent/3 rounded-full blur-2xl" />
      </div>
    </section>
  );
};

export default Features;
