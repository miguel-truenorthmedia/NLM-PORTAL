import BlogPost from "@/components/BlogPost";
import {
  Scale,
  Target,
  Users,
  TrendingUp,
  BarChart3,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import MiddleFunnelImg from "@/assets/middle-of-funnel-content-for-lawyers.jpg";

const MiddleFunnelContentLawyers = () => {
  const content = (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-8">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Middle-funnel content is crucial for nurturing prospects who are
            aware of their legal needs but haven't yet decided on an attorney.
            These potential clients are evaluating their options and comparing
            different law firms. At Northern Leads Media, we help law firms
            create compelling middle-funnel content that builds trust and moves
            prospects closer to hiring decisions.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-accent" />
            Effective Middle-Funnel Content Strategies
          </h2>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-accent" />
            1. Educational Webinars and Workshops
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Host educational webinars on legal topics relevant to your practice
            areas. These events position you as an expert while providing value
            to prospects. Follow up with attendees to nurture relationships and
            convert them into clients.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            2. Attorney Profiles and Team Pages
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Detailed attorney profiles help prospects get to know your team and
            understand their expertise. Include professional backgrounds, case
            results, and personal touches that build trust and rapport with
            potential clients.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            3. Practice Area Deep Dives
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Create comprehensive guides for each practice area you serve. These
            detailed resources help prospects understand their legal situation
            and see the value you can provide. Include process explanations,
            timelines, and potential outcomes.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            4. Comparison Guides and Checklists
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Help prospects evaluate their options with comparison guides and
            decision-making checklists. These tools position you as a helpful
            resource while subtly highlighting your advantages over competitors.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-accent" />
            Content Distribution Strategies
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Distribute your middle-funnel content through multiple channels
            including email newsletters, social media, and retargeting
            campaigns. Use lead magnets to capture contact information and
            nurture prospects through automated email sequences.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" />
            Measuring Content Effectiveness
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Track engagement metrics like time on page, download rates, and
            email open rates to understand which content resonates with your
            audience. Use conversion tracking to measure how middle-funnel
            content contributes to client acquisition.
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
            Ready to create compelling middle-funnel content that nurtures
            prospects and builds trust? Our team at Northern Leads Media
            specializes in helping law firms develop content strategies that
            convert prospects into clients. Contact us today to discover how we
            can help you create content that drives results.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <BlogPost
      title="Middle of Funnel Content for Lawyers"
      excerpt="Learn how to create effective middle-funnel content that nurtures prospects and builds trust for your law firm."
      category="Legal Marketing"
      date="Dec 9, 2024"
      author="Northern Leads Media Team"
      readTime="6 min read"
      content={content}
      icon={Scale}
      backgroundImage={MiddleFunnelImg}
    />
  );
};

export default MiddleFunnelContentLawyers;
