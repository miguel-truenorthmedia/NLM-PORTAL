import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Eye, Database, FileText, Users, Mail } from "lucide-react";
import NortherLeadsVideo from "@/assets/trueNorthVideo.mp4";

const PrivacyPolicy = () => {
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
                <Shield className="w-4 h-4" />
                Legal Information
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-white mb-6 leading-tight">
                Privacy Policy
              </h1>
              <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                Your privacy is important to us. Learn how we collect, use, and
                protect your personal information.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
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
                      <Eye className="w-6 h-6 text-accent" />
                      Information We Collect
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      We collect information you provide directly to us, such as
                      when you create an account, contact us, or use our
                      services. This may include:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                      <li>
                        Name and contact information (email, phone number)
                      </li>
                      <li>Business information and marketing goals</li>
                      <li>Communication preferences</li>
                      <li>
                        Payment information (processed securely through
                        third-party providers)
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <Database className="w-6 h-6 text-accent" />
                      How We Use Your Information
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      We use the information we collect to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                      <li>
                        Provide, maintain, and improve our performance marketing
                        services
                      </li>
                      <li>Process transactions and send related information</li>
                      <li>
                        Send technical notices, updates, and support messages
                      </li>
                      <li>Respond to your comments and questions</li>
                      <li>Develop new products and services</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <Shield className="w-6 h-6 text-accent" />
                      Information Sharing
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      We do not sell, trade, or otherwise transfer your personal
                      information to third parties without your consent, except
                      in the following circumstances:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                      <li>With your explicit consent</li>
                      <li>To comply with legal obligations</li>
                      <li>To protect our rights and prevent fraud</li>
                      <li>
                        With trusted service providers who assist in our
                        operations
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <Shield className="w-6 h-6 text-accent" />
                      Data Security
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      We implement appropriate security measures to protect your
                      personal information against unauthorized access,
                      alteration, disclosure, or destruction. However, no method
                      of transmission over the internet is 100% secure.
                    </p>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <Users className="w-6 h-6 text-accent" />
                      Your Rights
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      You have the right to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                      <li>Access and update your personal information</li>
                      <li>Request deletion of your personal information</li>
                      <li>Opt-out of marketing communications</li>
                      <li>Request a copy of your data</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <Mail className="w-6 h-6 text-accent" />
                      Contact Us
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      If you have any questions about this Privacy Policy,
                      please contact us at:
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

export default PrivacyPolicy;
