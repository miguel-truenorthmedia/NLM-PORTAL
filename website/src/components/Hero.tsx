import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTypingAnimation } from "@/hooks/use-typing-animation";
import NortherLeadsVideo from "@/assets/trueNorthVideo.mp4";

const Hero = () => {
  const typingText = useTypingAnimation({
    texts: [
      "All Things Growth",
      "Scaling Your Business",
      "Increasing Your Revenue",
      "Finding The Right Customers",
    ],
    speed: 150,
    delay: 500,
    loop: true,
    pauseTime: 2000,
  });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src={NortherLeadsVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-hero-gradient opacity-30" />

      {/* Wave Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute bottom-0 w-full h-40 text-surface-elevated opacity-30"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,60 C300,100 600,20 900,60 C1050,80 1150,40 1200,60 L1200,120 L0,120 Z" />
        </svg>
        <svg
          className="absolute bottom-0 w-full h-32 text-surface-elevated opacity-20"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,80 C400,40 800,100 1200,80 L1200,120 L0,120 Z" />
        </svg>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-accent rounded-full animate-pulse opacity-60" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-accent-glow-light rounded-full animate-pulse opacity-40 animation-delay-1000" />
        <div className="absolute bottom-1/3 left-1/5 w-3 h-3 bg-accent/30 rounded-full animate-pulse animation-delay-2000" />
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-accent-glow-light rounded-full animate-pulse opacity-50 animation-delay-3000" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-bold text-foreground mb-6 leading-tight">
            Your Strategic Partner in{" "}
            <span className="relative">
              <span className="bg-gradient-to-r from-accent to-accent-glow-light bg-clip-text text-transparent">
                {typingText}
              </span>
              <span className="animate-pulse text-accent">|</span>
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-accent to-accent-glow-light rounded-full opacity-60" />
            </span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
            <span className="font-semibold text-foreground">
              We Help CEOs and Business Owners Scale Their Companies.
            </span>
            <br className="hidden sm:block" />
            We are a performance marketing agency focused on generating
            high-quality leads and calls through data-driven ad campaigns. By
            leveraging platforms like Google and Meta, we design, launch, and
            optimize campaigns that drive measurable ROI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              variant="default"
              size="xl"
              className="min-w-[200px] bg-orange-500 hover:bg-orange-600 text-white border-0 font-semibold tracking-wide transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              asChild
            >
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>

          {/* Stats or Trust Indicators */}
          <div className="grid grid-cols-3 lg:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-accent mb-1">
                100+
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">
                Businesses Helped
              </div>
            </div>
            {/* <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-accent mb-1">
                50+
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">
                Clients Served
              </div>
            </div> */}
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-accent mb-1">
                98%
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">
                Satisfaction Rate
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-accent mb-1">
                $10M+
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">
                Revenue Generated
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
