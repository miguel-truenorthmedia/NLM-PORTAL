import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  User,
  ArrowRight,
  BookOpen,
  TrendingUp,
  Phone,
  Scale,
  Building,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import NortherLeadsVideo from "@/assets/trueNorthVideo.mp4";
import LeadGenerationImg from "@/assets/lead-generation.jpg";
import SalesObjectionsImg from "@/assets/Essential-tips-for-handling-sales-obejections-over-the-phone.jpg";
import PhoneLeadsImg from "@/assets/phone-lead-5.jpg";
import SoloLawFirmImg from "@/assets/solo-law-firm.jpg";
import BottomFunnelImg from "@/assets/bottom-of-funnel-content-for-lawyers.jpg";
import CallCenterTrendsImg from "@/assets/call-center-trends-for-2024.jpg";
import CallCenterSentimentImg from "@/assets/call-center-sentiment-analysis.jpg";
import MiddleFunnelImg from "@/assets/middle-of-funnel-content-for-lawyers.jpg";
import VirtualQueuingImg from "@/assets/what-is-virtual-queuing-in-a-call-center.jpg";
import CallCenterProblemsImg from "@/assets/common-call-center-problems-and-their-solutions.jpg";

const Blog = () => {
  const blogRoutes = {
    "Local Lead Generation": "/blog/local-lead-generation",
    "Essential Tips for Handling Sales Objections Over the Phone":
      "/blog/sales-objections-phone",
    "Phone Leads: 5 Most Overlooked Channels That Drive Quality Phone Leads":
      "/blog/phone-leads-channels",
    "Solo Law Firm Marketing Strategies That Work":
      "/blog/solo-law-firm-marketing",
    "Bottom of Funnel Content for Lawyers":
      "/blog/bottom-funnel-content-lawyers",
    "Call Center Trends for 2024": "/blog/call-center-trends-2024",
    "Call Center Sentiment Analysis": "/blog/call-center-sentiment-analysis",
    "Middle of Funnel Content for Lawyers":
      "/blog/middle-funnel-content-lawyers",
    "What Is Virtual Queuing in a Call Center?":
      "/blog/virtual-queuing-call-center",
    "Common Call Center Problems and Their Solutions":
      "/blog/call-center-problems-solutions",
  };

  const blogPosts = [
    {
      title: "Local Lead Generation",
      excerpt:
        "Discover the most effective strategies for generating high-quality local leads that convert into paying customers.",
      category: "Lead Generation",
      date: "Dec 15, 2024",
      author: "Northern Leads Media Team",
      readTime: "5 min read",
      image: LeadGenerationImg,
    },
    {
      title: "Essential Tips for Handling Sales Objections Over the Phone",
      excerpt:
        "Master the art of phone sales by learning how to effectively handle common objections and close more deals.",
      category: "Sales Strategy",
      date: "Dec 10, 2024",
      author: "Northern Leads Media Team",
      readTime: "7 min read",
      image: SalesObjectionsImg,
    },
    {
      title:
        "Phone Leads: 5 Most Overlooked Channels That Drive Quality Phone Leads",
      excerpt:
        "Explore untapped channels that can dramatically increase your phone lead volume and quality.",
      category: "Marketing Channels",
      date: "Dec 5, 2024",
      author: "Northern Leads Media Team",
      readTime: "6 min read",
      image: PhoneLeadsImg,
    },
    {
      title: "Solo Law Firm Marketing Strategies That Work",
      excerpt:
        "Proven marketing strategies specifically designed for solo practitioners to grow their legal practice.",
      category: "Legal Marketing",
      date: "Nov 28, 2024",
      author: "Northern Leads Media Team",
      readTime: "8 min read",
      image: SoloLawFirmImg,
    },
    {
      title: "Bottom of Funnel Content for Lawyers",
      excerpt:
        "Create compelling bottom-funnel content that converts prospects into clients for your law firm.",
      category: "Content Marketing",
      date: "Nov 20, 2024",
      author: "Northern Leads Media Team",
      readTime: "6 min read",
      image: BottomFunnelImg,
    },
    {
      title: "Call Center Trends for 2024",
      excerpt:
        "Stay ahead of the curve with the latest call center trends and technologies shaping the industry.",
      category: "Industry Trends",
      date: "Nov 15, 2024",
      author: "Northern Leads Media Team",
      readTime: "9 min read",
      image: CallCenterTrendsImg,
    },
    {
      title: "Call Center Sentiment Analysis",
      excerpt:
        "Learn how sentiment analysis can improve call center performance and customer satisfaction.",
      category: "Technology",
      date: "Nov 8, 2024",
      author: "Northern Leads Media Team",
      readTime: "7 min read",
      image: CallCenterSentimentImg,
    },
    {
      title: "Middle of Funnel Content for Lawyers",
      excerpt:
        "Develop effective middle-funnel content that nurtures prospects and builds trust in your legal services.",
      category: "Content Marketing",
      date: "Nov 1, 2024",
      author: "Northern Leads Media Team",
      readTime: "5 min read",
      image: MiddleFunnelImg,
    },
    {
      title: "What Is Virtual Queuing in a Call Center?",
      excerpt:
        "Understanding virtual queuing technology and how it can improve customer experience and operational efficiency.",
      category: "Technology",
      date: "Oct 25, 2024",
      author: "Northern Leads Media Team",
      readTime: "6 min read",
      image: VirtualQueuingImg,
    },
    {
      title: "Common Call Center Problems and Their Solutions",
      excerpt:
        "Identify and solve the most common call center challenges that impact productivity and customer satisfaction.",
      category: "Operations",
      date: "Oct 18, 2024",
      author: "Northern Leads Media Team",
      readTime: "8 min read",
      image: CallCenterProblemsImg,
    },
  ];

  const categories = [
    "All Posts",
    "Lead Generation",
    "Sales Strategy",
    "Marketing Channels",
    "Legal Marketing",
    "Content Marketing",
    "Industry Trends",
    "Technology",
    "Operations",
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
              Our{" "}
              <span className="bg-gradient-to-r from-accent to-accent-glow-light bg-clip-text text-transparent">
                Blog
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              News, events, comments and much more…
            </p>
          </div>
        </section>

        {/* Categories Filter */}
        <section className="py-12 bg-surface-subtle">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {categories.map((category, index) => (
                <Button
                  key={index}
                  variant={index === 0 ? "default" : "nav"}
                  size="sm"
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {blogPosts.map((post, index) => {
                return (
                  <Link key={index} to={blogRoutes[post.title]}>
                    <Card className="overflow-hidden bg-surface-elevated border-border hover:border-accent/30 transition-all duration-300 group cursor-pointer">
                      {/* Image */}
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        {/* Category & Date */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full">
                            {post.category}
                          </span>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 mr-1" />
                            {post.date}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-heading font-semibold text-foreground mb-3 line-clamp-2 group-hover:text-accent transition-colors">
                          {post.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>

                        {/* Author & Read Time */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <User className="w-3 h-3 mr-1" />
                            {post.author}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {post.readTime}
                          </span>
                        </div>

                        {/* Read More */}
                        <div className="mt-4 pt-4 border-t border-border">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full group-hover:text-accent transition-colors"
                          >
                            Read More
                            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Load More Button */}
            <div className="text-center mt-12">
              <Button variant="nav" size="lg">
                Load More Posts
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="py-24 bg-surface-subtle">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="max-w-4xl mx-auto p-12 text-center bg-gradient-to-r from-surface-elevated to-surface-subtle border-accent/20">
              <BookOpen className="w-16 h-16 mx-auto mb-6 text-accent" />
              <h2 className="text-3xl font-heading font-bold text-foreground mb-6">
                Stay Updated with Our Latest Insights
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Subscribe to our newsletter and get the latest performance
                marketing tips, industry insights, and growth strategies
                delivered straight to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 w-full sm:w-auto px-4 py-3 rounded-lg bg-surface-elevated border border-border focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 text-foreground placeholder-muted-foreground transition-all duration-200"
                />
                <Button variant="hero" size="lg">
                  Subscribe
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-heading font-bold text-foreground mb-6">
                Are You Ready to Get Started?
              </h2>
              <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
                Whether you're new to performance marketing or looking to
                optimize your current campaigns, we're here to help you succeed.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="hero" size="xl">
                  I'm Not an Affiliate Yet!
                </Button>
                <Button
                  variant="nav"
                  size="xl"
                  onClick={() =>
                    (window.location.href =
                      "mailto:hello@northerleadsmedia.com")
                  }
                >
                  I'm Already an Approved Affiliate
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
