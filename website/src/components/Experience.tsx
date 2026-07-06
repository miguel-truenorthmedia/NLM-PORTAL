import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Calendar,
  Users,
  Building,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import NortherLeadsHappyCEO from "@/assets/trueNorth-happy-ceo.jpg";

const Experience = () => {
  const milestones = [
    {
      year: "2022",
      title: "Foundation",
      description:
        "Started as a SaaS company specializing in SEO and web design, helping businesses establish their online presence.",
    },
    {
      year: "2023",
      title: "Transition",
      description:
        "Pivoted to affiliate marketing, developing performance-based strategies that deliver measurable results for our clients.",
    },
    {
      year: "2025",
      title: "Growth",
      description:
        "Evolved into a comprehensive performance marketing agency, leveraging Google and Meta platforms to drive ROI for business owners and CEOs.",
    },
  ];

  const achievements = [
    {
      icon: Calendar,
      metric: "3+",
      label: "Years in Business",
      description: "Rapid growth and innovation",
    },
    {
      icon: Users,
      metric: "100+",
      label: "Happy Clients",
      description: "Businesses we've helped scale",
    },
    {
      icon: Building,
      metric: "3",
      label: "Industries",
      description: "Insurance, Debt Relief, Home Improvements",
    },
    {
      icon: TrendingUp,
      metric: "250%",
      label: "Average ROI",
      description: "Typical return on investment",
    },
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-accent font-medium uppercase tracking-wide text-sm mb-4">
            Know More About Us
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6">
            The Northern Leads Media Experience
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            How we rose up to become leaders in the performance marketing
            industry.
          </p>
        </div>

        {/* Hero Image */}
        <div className="relative mb-16 rounded-2xl overflow-hidden">
          <img
            src={NortherLeadsHappyCEO}
            alt="Northern Leads Media CEO"
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-16">
          <div>
            <h3 className="text-2xl font-heading font-bold text-foreground mb-8">
              Our Journey
            </h3>
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="relative pl-8">
                  <div className="absolute left-0 top-1 w-3 h-3 bg-accent rounded-full shadow-glow" />
                  {index < milestones.length - 1 && (
                    <div className="absolute left-1.5 top-6 w-px h-16 bg-border" />
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-accent bg-accent/10 px-3 py-1 rounded-full">
                        {milestone.year}
                      </span>
                      <h4 className="font-semibold text-foreground">
                        {milestone.title}
                      </h4>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements Grid */}
          <div>
            <h3 className="text-2xl font-heading font-bold text-foreground mb-8">
              By the Numbers
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {achievements.map((achievement, index) => {
                const IconComponent = achievement.icon;
                return (
                  <Card
                    key={index}
                    className="p-6 text-center bg-surface-elevated border-border hover:border-accent/30 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <IconComponent className="w-6 h-6 text-accent" />
                    </div>
                    <div className="text-2xl font-bold text-accent mb-1">
                      {achievement.metric}
                    </div>
                    <div className="text-sm font-semibold text-foreground mb-2">
                      {achievement.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {achievement.description}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-3xl mx-auto p-8 bg-gradient-to-r from-surface-elevated to-surface-subtle border-accent/20">
            <h3 className="text-2xl font-heading font-bold text-foreground mb-4">
              Ready to Write Your Success Story?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Join hundreds of businesses that have transformed their growth
              trajectory with Northern Leads Media. Let's discuss how we can
              help you achieve your goals.
            </p>
            <Button
              variant="default"
              size="lg"
              className="group bg-orange-500 hover:bg-orange-600 text-white border-0 font-semibold tracking-wide transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              asChild
            >
              <Link to="/contact">
                Start Your Partnership
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </Card>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-accent/3 rounded-full blur-2xl" />
      </div>
    </section>
  );
};

export default Experience;
