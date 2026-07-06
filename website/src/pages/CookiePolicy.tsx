import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import {
  Cookie,
  Settings,
  Eye,
  Database,
  Clock,
  FileText,
  Mail,
} from "lucide-react";
import NortherLeadsVideo from "@/assets/trueNorthVideo.mp4";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 bg-hero-gradient overflow-hidden">
          {/* Background Video */}
          <div className="absolute inset-0">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            >
              <source src={NortherLeadsVideo} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-hero-gradient opacity-60" />
          </div>

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
                <Cookie className="w-4 h-4" />
                Cookie Information
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-white mb-6 leading-tight">
                Cookie Policy
              </h1>
              <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                Learn about how we use cookies and similar technologies to
                enhance your experience on our website.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>Last updated: December 2024</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <Cookie className="w-6 h-6 text-accent" />
                      What Are Cookies?
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Cookies are small text files that are placed on your
                      computer or mobile device when you visit our website. They
                      help us provide you with a better experience by
                      remembering your preferences and understanding how you use
                      our site.
                    </p>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <Settings className="w-6 h-6 text-accent" />
                      Types of Cookies We Use
                    </h2>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Essential Cookies
                        </h3>
                        <p className="text-muted-foreground mb-2">
                          These cookies are necessary for the website to
                          function properly. They enable basic functions like
                          page navigation and access to secure areas of the
                          website.
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                          <li>Session management</li>
                          <li>Security features</li>
                          <li>Load balancing</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Analytics Cookies
                        </h3>
                        <p className="text-muted-foreground mb-2">
                          These cookies help us understand how visitors interact
                          with our website by collecting and reporting
                          information anonymously.
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                          <li>Google Analytics</li>
                          <li>Page views and user behavior</li>
                          <li>Performance metrics</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Functional Cookies
                        </h3>
                        <p className="text-muted-foreground mb-2">
                          These cookies enable enhanced functionality and
                          personalization, such as remembering your preferences
                          and settings.
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                          <li>Language preferences</li>
                          <li>User interface settings</li>
                          <li>Form data retention</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <Eye className="w-6 h-6 text-accent" />
                      How We Use Cookies
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      We use cookies to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                      <li>Improve website performance and user experience</li>
                      <li>Analyze website traffic and user behavior</li>
                      <li>Remember your preferences and settings</li>
                      <li>Provide personalized content and recommendations</li>
                      <li>Ensure website security and prevent fraud</li>
                      <li>
                        Measure the effectiveness of our marketing campaigns
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <Database className="w-6 h-6 text-accent" />
                      Third-Party Cookies
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      We may also use third-party cookies from trusted partners
                      to enhance our services:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                      <li>
                        <strong>Google Analytics:</strong> Website analytics and
                        performance tracking
                      </li>
                      <li>
                        <strong>Google Ads:</strong> Advertising and conversion
                        tracking
                      </li>
                      <li>
                        <strong>Meta (Facebook):</strong> Social media
                        integration and advertising
                      </li>
                      <li>
                        <strong>LinkedIn:</strong> Professional networking and
                        lead generation
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <Settings className="w-6 h-6 text-accent" />
                      Managing Your Cookie Preferences
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      You can control and manage cookies in several ways:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                      <li>
                        <strong>Browser Settings:</strong> Most browsers allow
                        you to refuse or delete cookies
                      </li>
                      <li>
                        <strong>Cookie Consent:</strong> Use our cookie consent
                        banner to manage preferences
                      </li>
                      <li>
                        <strong>Opt-out Links:</strong> Use provided opt-out
                        links for specific services
                      </li>
                      <li>
                        <strong>Contact Us:</strong> Reach out to us directly to
                        discuss your preferences
                      </li>
                    </ul>
                    <div className="mt-4 p-4 bg-surface-subtle rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> Disabling certain cookies may
                        affect the functionality of our website and your user
                        experience.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <Clock className="w-6 h-6 text-accent" />
                      Cookie Retention
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Different cookies have different retention periods:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                      <li>
                        <strong>Session Cookies:</strong> Deleted when you close
                        your browser
                      </li>
                      <li>
                        <strong>Persistent Cookies:</strong> Remain on your
                        device for a set period (typically 1-2 years)
                      </li>
                      <li>
                        <strong>Analytics Cookies:</strong> Usually retained for
                        24-26 months
                      </li>
                      <li>
                        <strong>Marketing Cookies:</strong> Typically retained
                        for 13 months
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <FileText className="w-6 h-6 text-accent" />
                      Updates to This Policy
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      We may update this Cookie Policy from time to time to
                      reflect changes in our practices or for other operational,
                      legal, or regulatory reasons. We will notify you of any
                      material changes by posting the updated policy on our
                      website.
                    </p>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <Mail className="w-6 h-6 text-accent" />
                      Contact Us
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      If you have any questions about our use of cookies or this
                      Cookie Policy, please contact us:
                    </p>
                    <div className="bg-surface-subtle p-4 rounded-lg">
                      <p className="text-foreground font-medium">
                        Northern Leads Media LLC
                      </p>
                      <p className="text-muted-foreground">
                        Email: hello@northernleadsmedia.com
                      </p>
                      <p className="text-muted-foreground">
                        Phone: +1 833 6627956
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CookiePolicy;
