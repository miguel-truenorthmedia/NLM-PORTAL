import BlogPost from "@/components/BlogPost";
import {
  BookOpen,
  Target,
  MapPin,
  Users,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import LeadGenerationImg from "@/assets/lead-generation.jpg";

const LocalLeadGeneration = () => {
  const content = (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-8">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Local lead generation is the backbone of successful businesses in
            today's competitive market. At Northern Leads Media, we've helped
            hundreds of businesses master the art of attracting high-quality
            local leads that convert into paying customers.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-accent" />
            Why Local Lead Generation Matters
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Local businesses face unique challenges in the digital landscape.
            Unlike e-commerce or national brands, local businesses need to
            attract customers within a specific geographic area. This requires a
            targeted approach that combines digital marketing strategies with
            local market understanding.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-accent" />
            Our Proven Local Lead Generation Strategies
          </h2>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent" />
            1. Google Ads Local Campaigns
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            We create highly targeted Google Ads campaigns that focus on local
            keywords and geographic targeting. Our campaigns are optimized to
            appear when potential customers in your area are actively searching
            for your services.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            2. Facebook & Instagram Local Targeting
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Social media platforms offer powerful local targeting options. We
            create engaging ad campaigns that reach your ideal customers within
            your service area, using demographic and interest-based targeting
            combined with geographic restrictions.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            3. Landing Page Optimization
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Every lead generation campaign needs a high-converting landing page.
            We design and optimize landing pages specifically for local
            businesses, including local testimonials, service area maps, and
            clear calls-to-action.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" />
            Results You Can Expect
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Our clients typically see a 200-400% increase in qualified local
            leads within the first 90 days of implementing our strategies. We
            focus on quality over quantity, ensuring that every lead has genuine
            potential to become a customer.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" />
            Getting Started
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Ready to transform your local lead generation? Our team will analyze
            your current marketing efforts, identify opportunities, and create a
            customized strategy that delivers results. Contact us today to
            schedule a consultation and discover how we can help your business
            thrive in the local market.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <BlogPost
      title="Local Lead Generation"
      excerpt="Discover the most effective strategies for generating high-quality local leads that convert into paying customers."
      category="Lead Generation"
      date="Dec 15, 2024"
      author="Northern Leads Media Team"
      readTime="5 min read"
      content={content}
      icon={BookOpen}
      backgroundImage={LeadGenerationImg}
    />
  );
};

export default LocalLeadGeneration;
