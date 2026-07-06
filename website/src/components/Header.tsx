import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu } from "@/components/ui/dropdown-menu-custom";
import { Link } from "react-router-dom";
import NorthernLeadsLogo from "@/assets/northerleads-light-logo.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const industriesItems = [
    {
      label: "Insurance",
      href: "/insurance",
      description:
        "Lead generation and customer acquisition for insurance companies",
    },
    {
      label: "Debt Relief",
      href: "/debt-relief",
      description:
        "Lead generation and customer acquisition for debt relief companies",
    },
    {
      label: "Home Improvements",
      href: "/home-improvements",
      description:
        "Lead generation and customer acquisition for home improvement companies",
    },
  ];

  const whyNorthernLeadsItems = [
    {
      label: "About",
      href: "/about",
      description: "Learn about our mission, team, and company culture",
    },
    {
      label: "Testimonials",
      href: "/testimonials",
      description:
        "See what our clients say about working with Northern Leads Media",
    },
  ];

  const resourcesItems = [
    {
      label: "Blog",
      href: "/blog",
      description:
        "Industry insights, tips, and performance marketing strategies",
    },
    {
      label: "PPC FAQs",
      href: "/ppc-faqs",
      description: "Frequently asked questions about pay per call marketing",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-header">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img
              src={NorthernLeadsLogo}
              alt="Northern Leads Media Logo"
              className="h-14 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <DropdownMenu trigger="Industries" items={industriesItems} />
            <Link
              to="/services"
              className="text-foreground hover:text-accent transition-colors"
            >
              Our Services
            </Link>
            <DropdownMenu
              trigger="Why Northern Leads™"
              items={whyNorthernLeadsItems}
            />
            <DropdownMenu trigger="Resources" items={resourcesItems} />
          </nav>

          {/* Desktop CTA Button */}
          <div className="hidden lg:flex">
            <Button
              variant="default"
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white border-0 font-semibold tracking-wide transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              asChild
            >
              <Link to="/contact">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 rounded-md hover:bg-surface-elevated transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-300 ease-in-out",
            isMenuOpen ? "max-h-96 pb-4" : "max-h-0"
          )}
        >
          <nav className="flex flex-col space-y-4 pt-4 border-t border-border">
            {/* Industries Dropdown */}
            <div className="space-y-2">
              <div className="text-foreground font-medium py-2">Industries</div>
              {industriesItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="block text-muted-foreground hover:text-accent transition-colors py-1 pl-4 text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <Link
              to="/services"
              className="text-left text-foreground hover:text-accent transition-colors py-2 block"
              onClick={() => setIsMenuOpen(false)}
            >
              Our Services
            </Link>

            {/* Why Northern Leads Dropdown */}
            <div className="space-y-2">
              <div className="text-foreground font-medium py-2">
                Why Northern Leads™
              </div>
              {whyNorthernLeadsItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="block text-muted-foreground hover:text-accent transition-colors py-1 pl-4 text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Resources Dropdown */}
            <div className="space-y-2">
              <div className="text-foreground font-medium py-2">Resources</div>
              {resourcesItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="block text-muted-foreground hover:text-accent transition-colors py-1 pl-4 text-sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="pt-4">
              <Button
                variant="default"
                size="lg"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white border-0 font-semibold tracking-wide transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                asChild
              >
                <Link to="/contact" onClick={() => setIsMenuOpen(false)}>
                  Get Started
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
