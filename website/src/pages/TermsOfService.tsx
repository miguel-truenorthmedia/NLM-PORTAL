import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Scale,
  AlertTriangle,
  Shield,
  CreditCard,
  X,
  Mail,
} from "lucide-react";
import NortherLeadsVideo from "@/assets/trueNorthVideo.mp4";

const TermsOfService = () => {
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
                <Scale className="w-4 h-4" />
                Legal Terms
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-white mb-6 leading-tight">
                Terms of Service
              </h1>
              <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                Please read these terms carefully before using our performance
                marketing services.
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
                      <FileText className="w-6 h-6 text-accent" />
                      Acceptance of Terms
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      By accessing and using Northern Leads Media LLC's
                      services, you accept and agree to be bound by the terms
                      and provision of this agreement. If you do not agree to
                      abide by the above, please do not use this service.
                    </p>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <Scale className="w-6 h-6 text-accent" />
                      Services Description
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Northern Leads Media LLC is a performance marketing agency
                      focused on generating high-quality leads and calls through
                      data-driven ad campaigns. Our services include:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                      <li>Performance marketing and affiliate marketing</li>
                      <li>
                        Google Ads campaign design, launch, and optimization
                      </li>
                      <li>Facebook and Instagram advertising campaigns</li>
                      <li>Lead generation and call tracking</li>
                      <li>Landing page design and optimization</li>
                      <li>ROI-focused marketing strategies</li>
                      <li>
                        Industry-specific marketing for Insurance, Debt Relief,
                        and Home Improvements
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-6 h-6 text-accent" />
                      User Responsibilities
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      As a client, you agree to:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                      <li>Provide accurate and complete information</li>
                      <li>Comply with all applicable laws and regulations</li>
                      <li>Not engage in fraudulent or deceptive practices</li>
                      <li>Respect intellectual property rights</li>
                      <li>
                        Maintain confidentiality of proprietary information
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <CreditCard className="w-6 h-6 text-accent" />
                      Payment Terms
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Payment terms will be specified in individual service
                      agreements. Generally:
                    </p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-2">
                      <li>Fees are due according to the agreed schedule</li>
                      <li>Late payments may incur additional charges</li>
                      <li>Refunds are subject to our refund policy</li>
                      <li>All prices are subject to change with notice</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-6 h-6 text-accent" />
                      Limitation of Liability
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Northern Leads Media LLC shall not be liable for any
                      indirect, incidental, special, consequential, or punitive
                      damages, including without limitation, loss of profits,
                      data, use, goodwill, or other intangible losses, resulting
                      from your use of our services.
                    </p>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <Shield className="w-6 h-6 text-accent" />
                      Intellectual Property
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      All content, trademarks, and intellectual property on our
                      website and in our services are owned by Norther Leads
                      Media LLC or our licensors. You may not use, reproduce, or
                      distribute any content without our written permission.
                    </p>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <X className="w-6 h-6 text-accent" />
                      Termination
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      Either party may terminate this agreement at any time with
                      written notice. Upon termination, all rights and
                      obligations will cease, except for those that by their
                      nature should survive termination.
                    </p>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <Scale className="w-6 h-6 text-accent" />
                      Governing Law
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      These terms shall be governed by and construed in
                      accordance with the laws of the United States, without
                      regard to conflict of law principles.
                    </p>
                  </CardContent>
                </Card>

                <Card className="mb-8">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <Mail className="w-6 h-6 text-accent" />
                      Contact Information
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      If you have any questions about these Terms of Service,
                      please contact us:
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

export default TermsOfService;
