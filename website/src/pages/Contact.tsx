import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NortherLeadsVideo from "@/assets/trueNorthVideo.mp4";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
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
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-heading font-bold text-foreground mb-6">
              Ready to <span style={{ color: "#089f72" }}>Transform</span> Your
              Business?
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Let's discuss how Northern Leads Media can help you achieve your
              customer acquisition goals. Get started with a free consultation
              today.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="bg-surface border-border shadow-elegant">
              <CardHeader>
                <CardTitle className="text-2xl font-heading text-foreground">
                  Start Your Journey Today
                </CardTitle>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get back to you within 24
                  hours to discuss your needs.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-foreground">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        required
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-foreground">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Smith"
                        required
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-foreground">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-foreground">
                      Tell us about your goals *
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Describe your customer acquisition challenges and what you're looking to achieve..."
                      required
                      rows={4}
                      className="mt-2"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="default"
                    size="lg"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white border-0 font-semibold tracking-wide transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Send Message
                  </Button>

                  <p className="text-sm text-muted-foreground text-center">
                    By submitting this form, you agree to our privacy policy and
                    terms of service.
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-8">
              <Card className="bg-surface border-border shadow-elegant">
                <CardHeader>
                  <CardTitle className="text-xl font-heading text-foreground">
                    Get in Touch
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <Phone className="w-5 h-5 text-accent mt-1" />
                    <div>
                      <h4 className="font-medium text-foreground">Phone</h4>
                      <p className="text-muted-foreground">+1 833 6627956</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <Mail className="w-5 h-5 text-accent mt-1" />
                    <div>
                      <h4 className="font-medium text-foreground">Email</h4>
                      <p className="text-muted-foreground">
                        hello@northernleadsmedia.com
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <MapPin className="w-5 h-5 text-accent mt-1" />
                    <div>
                      <h4 className="font-medium text-foreground">Office</h4>
                      <p className="text-muted-foreground">
                        30 N Gould St Ste N
                        <br />
                        Sheridan, WY 82801 USA
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <Clock className="w-5 h-5 text-accent mt-1" />
                    <div>
                      <h4 className="font-medium text-foreground">
                        Business Hours
                      </h4>
                      <p className="text-muted-foreground">
                        Monday - Friday: 8:00 AM - 6:00 PM PST
                        <br />
                        Saturday: 9:00 AM - 2:00 PM PST
                        <br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-primary border-0 text-primary-foreground shadow-elegant">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-heading font-bold mb-4">
                    Why Choose Northern Leads Media?
                  </h3>
                  <ul className="text-left space-y-2 text-primary-foreground/90">
                    <li>• Proven performance marketing strategies</li>
                    <li>• Dedicated account management team</li>
                    <li>• Custom solutions for your industry</li>
                    <li>• Real-time campaign optimization</li>
                    <li>• Transparent reporting and analytics</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
