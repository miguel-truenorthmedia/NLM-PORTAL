import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import NorthernLeadsLogo from "@/assets/northerleads-light-logo.png";

const Footer = () => {
  return (
    <footer className="bg-surface-subtle border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Company Info */}
            <div className="lg:col-span-1 space-y-6">
              <Link
                to="/"
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <img
                  src={NorthernLeadsLogo}
                  alt="Northern Leads Media Logo"
                  className="h-12 w-auto"
                />
              </Link>
              <p className="text-muted-foreground leading-relaxed">
                Your strategic partner in all things growth. We're experts in
                acquiring customers and building lasting partnerships that drive
                real results.
              </p>
              <div className="flex space-x-4">
                <button className="w-10 h-10 rounded-lg bg-surface-elevated hover:bg-accent/10 border border-border hover:border-accent/30 flex items-center justify-center transition-all duration-200 group">
                  <Facebook className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </button>
                <button className="w-10 h-10 rounded-lg bg-surface-elevated hover:bg-accent/10 border border-border hover:border-accent/30 flex items-center justify-center transition-all duration-200 group">
                  <Twitter className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </button>
                <button className="w-10 h-10 rounded-lg bg-surface-elevated hover:bg-accent/10 border border-border hover:border-accent/30 flex items-center justify-center transition-all duration-200 group">
                  <Linkedin className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </button>
                <button className="w-10 h-10 rounded-lg bg-surface-elevated hover:bg-accent/10 border border-border hover:border-accent/30 flex items-center justify-center transition-all duration-200 group">
                  <Instagram className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </button>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-6">
              <h3 className="text-lg font-heading font-semibold text-foreground">
                Services
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/services"
                    className="text-muted-foreground hover:text-accent transition-colors text-left block"
                  >
                    Performance Marketing
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="text-muted-foreground hover:text-accent transition-colors text-left block"
                  >
                    Customer Acquisition
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="text-muted-foreground hover:text-accent transition-colors text-left block"
                  >
                    Growth Strategy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="text-muted-foreground hover:text-accent transition-colors text-left block"
                  >
                    Digital Advertising
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="text-muted-foreground hover:text-accent transition-colors text-left block"
                  >
                    Conversion Optimization
                  </Link>
                </li>
                <li>
                  <Link
                    to="/services"
                    className="text-muted-foreground hover:text-accent transition-colors text-left block"
                  >
                    Analytics & Reporting
                  </Link>
                </li>
              </ul>
            </div>

            {/* Industries */}
            <div className="space-y-6">
              <h3 className="text-lg font-heading font-semibold text-foreground">
                Industries
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/insurance"
                    className="text-muted-foreground hover:text-accent transition-colors text-left block"
                  >
                    Insurance
                  </Link>
                </li>
                <li>
                  <Link
                    to="/debt-relief"
                    className="text-muted-foreground hover:text-accent transition-colors text-left block"
                  >
                    Debt Relief
                  </Link>
                </li>
                <li>
                  <Link
                    to="/home-improvements"
                    className="text-muted-foreground hover:text-accent transition-colors text-left block"
                  >
                    Home Improvements
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-6">
              <h3 className="text-lg font-heading font-semibold text-foreground">
                Get in Touch
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-sm">Email</p>
                    <button className="text-foreground hover:text-accent transition-colors">
                      hello@northernleadsmedia.com
                    </button>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-sm">Phone</p>
                    <button className="text-foreground hover:text-accent transition-colors">
                      +1 833 6627956
                    </button>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-sm">Office</p>
                    <p className="text-foreground">
                      30 N Gould St Ste N
                      <br />
                      Sheridan, WY 82801 USA
                    </p>
                  </div>
                </div>
              </div>
              <Link to="/contact">
                <Button
                  variant="default"
                  className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white border-0 font-semibold tracking-wide transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Schedule a Call
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="py-6 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-muted-foreground text-sm">
              © 2024 Northern Leads Media. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link
                to="/privacy-policy"
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/cookie-policy"
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
