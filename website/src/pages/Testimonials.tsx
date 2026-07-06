import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Quote, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";
import NortherLeadsVideo from "@/assets/trueNorthVideo.mp4";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Chen",
      company: "TechStart Solutions",
      role: "CEO",
      image: "/api/placeholder/80/80",
      quote:
        "Northern Leads Media transformed our lead generation strategy completely. Their data-driven approach helped us increase our qualified leads by 300% in just 6 months. The team's expertise in performance marketing is unmatched, and they truly understand how to scale businesses like ours.",
      rating: 5,
    },
    {
      name: "Michael Rodriguez",
      company: "Growth Partners LLC",
      role: "Founder",
      image: "/api/placeholder/80/80",
      quote:
        "Working with Northern Leads Media has been a game-changer for our business. Their campaigns on Google and Meta have consistently delivered high-quality leads that convert. The ROI has been exceptional, and their team is always available to optimize and improve our results.",
      rating: 5,
    },
    {
      name: "Jennifer Walsh",
      company: "Premier Insurance Group",
      role: "Marketing Director",
      image: "/api/placeholder/80/80",
      quote:
        "Northern Leads Media's performance marketing strategies have revolutionized how we acquire customers. Their targeted campaigns and optimized landing pages have significantly improved our conversion rates. We've seen a 250% increase in qualified leads since partnering with them.",
      rating: 5,
    },
    {
      name: "David Kim",
      company: "Elite Home Services",
      role: "Owner",
      image: "/api/placeholder/80/80",
      quote:
        "The results speak for themselves. Northern Leads Media's data-driven campaigns have helped us scale our home improvement business faster than we ever thought possible. Their expertise in performance marketing and lead generation is exactly what we needed to grow.",
      rating: 5,
    },
    {
      name: "Lisa Thompson",
      company: "Financial Advisory Group",
      role: "Managing Partner",
      image: "/api/placeholder/80/80",
      quote:
        "Northern Leads Media understands the unique challenges of our industry. Their performance marketing campaigns have delivered high-quality leads that actually convert into clients. The team's professionalism and results-driven approach make them an invaluable partner.",
      rating: 5,
    },
    {
      name: "Robert Martinez",
      company: "Healthcare Solutions Inc",
      role: "VP of Marketing",
      image: "/api/placeholder/80/80",
      quote:
        "Northern Leads Media's expertise in performance marketing has been instrumental in our growth. Their campaigns consistently deliver measurable ROI, and their team's attention to detail and optimization strategies have exceeded our expectations.",
      rating: 5,
    },
  ];

  const stats = [
    { number: "100+", label: "Businesses Helped" },
    { number: "98%", label: "Client Satisfaction" },
    { number: "250%", label: "Average ROI" },
    { number: "3+", label: "Industries Served" },
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
              <span className="bg-gradient-to-r from-accent to-accent-glow-light bg-clip-text text-transparent">
                Testimonials
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              What Our Clients Say
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-surface-subtle">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
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
          </div>
        </section>

        {/* Testimonials Grid */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-12">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={index}
                  className={`p-8 lg:p-12 bg-surface-elevated border-border hover:border-accent/30 transition-all duration-300 ${
                    index % 2 === 0 ? "lg:ml-0 lg:mr-12" : "lg:ml-12 lg:mr-0"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start gap-6">
                    {/* Quote Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                        <Quote className="w-8 h-8 text-accent" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      {/* Stars */}
                      <div className="flex items-center mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-5 h-5 fill-accent text-accent"
                          />
                        ))}
                      </div>

                      {/* Quote */}
                      <blockquote className="text-muted-foreground leading-relaxed mb-6 text-lg italic">
                        "{testimonial.quote}"
                      </blockquote>

                      {/* Author Info */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden">
                          <Users className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {testimonial.name}
                          </div>
                          {testimonial.company && (
                            <div className="text-sm text-accent">
                              {testimonial.company}
                            </div>
                          )}
                          {testimonial.role && (
                            <div className="text-sm text-muted-foreground">
                              {testimonial.role}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-16 bg-surface-subtle">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-heading font-bold text-foreground mb-6">
                Trusted by Industry Leaders
              </h2>
              <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
                Join hundreds of satisfied clients who have transformed their
                business with Northern Leads Media's performance marketing
                solutions.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center opacity-60">
                {[
                  "Insurance",
                  "Healthcare",
                  "Finance",
                  "Real Estate",
                  "Legal",
                  "Technology",
                ].map((industry, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-lg bg-surface-elevated border border-border flex items-center justify-center">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {industry.slice(0, 3).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      {industry}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="max-w-4xl mx-auto p-12 text-center bg-gradient-to-r from-surface-elevated to-surface-subtle border-accent/20">
              <Quote className="w-16 h-16 mx-auto mb-6 text-accent" />
              <h2 className="text-3xl font-heading font-bold text-foreground mb-6">
                Ready to Join Our Success Stories?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Experience the Northern Leads Media difference and see why our
                clients trust us as their strategic growth partner. Let's write
                your success story together.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  variant="default"
                  size="xl"
                  className="bg-orange-500 hover:bg-orange-600 text-white border-0 font-semibold tracking-wide transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  asChild
                >
                  <Link to="/contact">Get Started Today</Link>
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

export default Testimonials;
