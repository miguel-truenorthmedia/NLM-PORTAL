import { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  User,
  ArrowLeft,
  LucideIcon,
  Share2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface BlogPostProps {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  author: string;
  readTime: string;
  content: ReactNode;
  icon: LucideIcon;
  backgroundImage?: string;
}

const BlogPost = ({
  title,
  excerpt,
  category,
  date,
  author,
  readTime,
  content,
  icon: Icon,
  backgroundImage,
}: BlogPostProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-hero-gradient overflow-hidden">
          {/* Background Image */}
          {backgroundImage && (
            <div className="absolute inset-0">
              <img
                src={backgroundImage}
                alt={title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60" />
            </div>
          )}
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

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium mb-6">
                <Icon className="w-4 h-4" />
                {category}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-white mb-6 leading-tight">
                {title}
              </h1>
              <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                {excerpt}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{readTime}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="space-y-8">{content}</div>
            </div>
          </div>
        </section>

        {/* Share Section */}
        <section className="py-8 bg-surface-subtle">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                      Found this article helpful?
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Share it with your network and help others grow their
                      business.
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="max-w-4xl mx-auto bg-gradient-to-r from-surface-elevated to-surface-subtle border-accent/20">
              <CardContent className="p-12 text-center">
                <h3 className="text-3xl font-heading font-bold text-foreground mb-4">
                  Ready to Scale Your Business?
                </h3>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Let's discuss how our performance marketing strategies can
                  help you achieve your growth goals and drive measurable
                  results.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild size="lg" variant="hero">
                    <Link to="/contact">Get Started Today</Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/blog">Read More Articles</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Back to Blog */}
        <section className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Button variant="outline" asChild>
                <Link to="/blog" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Blog
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;
