import BlogPost from "@/components/BlogPost";
import {
  Scale,
  Target,
  CheckCircle,
  Users,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import BottomFunnelImg from "@/assets/bottom-of-funnel-content-for-lawyers.jpg";

const BottomFunnelContentLawyers = () => {
  const content = (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-8">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Bottom-of-funnel content is crucial for converting prospects who are
            ready to hire a lawyer. These potential clients have already
            identified their legal needs and are actively comparing attorneys.
            At Northern Leads Media, we've helped law firms create compelling
            bottom-funnel content that converts prospects into clients.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-accent" />
            Essential Bottom-Funnel Content Types
          </h2>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-accent" />
            1. Case Studies and Success Stories
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Detailed case studies showcase your expertise and results. Include
            specific outcomes, client testimonials, and the strategies you used
            to achieve success. This content helps prospects visualize how you
            can help them with their legal issues.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            2. Client Testimonials and Reviews
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Authentic testimonials from satisfied clients build trust and
            credibility. Include video testimonials, written reviews, and
            before-and-after stories that demonstrate the value you provide to
            your clients.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            3. Free Consultations and Assessments
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Offer free initial consultations or case assessments to remove
            barriers to engagement. Create landing pages that clearly explain
            what prospects can expect during these free sessions and how to
            schedule them.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            4. Pricing and Process Information
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Transparent information about your fees, payment options, and legal
            process helps prospects make informed decisions. Create clear
            pricing pages and process timelines that set proper expectations.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-accent" />
            Content Optimization Tips
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Optimize your bottom-funnel content for conversion by including
            clear calls-to-action, contact information, and easy scheduling
            options. Use compelling headlines and focus on benefits rather than
            features to encourage prospects to take action.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" />
            Measuring Content Performance
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Track metrics like time on page, conversion rates, and lead quality
            to understand which content resonates with your target audience. Use
            A/B testing to optimize headlines, calls-to-action, and content
            structure for better results.
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
            Ready to create compelling bottom-funnel content that converts
            prospects into clients? Our team at Northern Leads Media specializes
            in helping law firms develop content strategies that drive results.
            Contact us today to discover how we can help you create content that
            converts.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <BlogPost
      title="Bottom of Funnel Content for Lawyers"
      excerpt="Learn how to create compelling bottom-funnel content that converts prospects into clients for your law firm."
      category="Legal Marketing"
      date="Dec 12, 2024"
      author="Northern Leads Media Team"
      readTime="6 min read"
      content={content}
      icon={Scale}
      backgroundImage={BottomFunnelImg}
    />
  );
};

export default BottomFunnelContentLawyers;
