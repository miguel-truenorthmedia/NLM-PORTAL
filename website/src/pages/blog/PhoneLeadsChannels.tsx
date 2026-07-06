import BlogPost from "@/components/BlogPost";
import {
  TrendingUp,
  Search,
  Users,
  Target,
  BarChart3,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import PhoneLeadsImg from "@/assets/phone-lead-5.jpg";

const PhoneLeadsChannels = () => {
  const content = (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-8">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Generating high-quality phone leads requires a strategic approach
            across multiple channels. At Northern Leads Media, we've discovered
            these hidden channels through our testing and optimization. Here are
            the 5 most overlooked channels that consistently drive quality phone
            leads.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-accent" />
            The 5 Most Effective Phone Lead Channels
          </h2>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Search className="w-5 h-5 text-accent" />
            1. Google Local Service Ads
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Local Service Ads appear at the top of Google search results and are
            specifically designed for service-based businesses. They're highly
            effective for generating phone calls because they include a
            prominent "Call" button and show your business rating and reviews.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            2. Facebook Lead Ads
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Facebook Lead Ads allow users to submit their information without
            leaving the platform. The pre-filled forms make it easy for
            prospects to request a callback, resulting in higher conversion
            rates than traditional landing pages.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            3. YouTube Video Ads
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Video content is incredibly engaging and allows you to build trust
            before asking for contact information. YouTube ads with clear
            call-to-actions can drive significant phone lead volume, especially
            for complex services.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent" />
            4. Google My Business
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Optimizing your Google My Business profile is crucial for local
            phone leads. Regular posts, customer reviews, and accurate business
            information help you appear in local searches and encourage direct
            calls.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            5. Retargeting Campaigns
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Retargeting visitors who didn't convert initially can be highly
            effective for phone leads. These prospects are already familiar with
            your brand and more likely to pick up the phone when they see your
            ad again.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-accent" />
            Why These Channels Work
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            These channels are often overlooked because they require specialized
            knowledge and optimization. However, when properly implemented, they
            consistently deliver high-quality phone leads with better conversion
            rates than traditional methods.
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
            Ready to tap into these powerful phone lead channels? Our team at
            Northern Leads Media specializes in optimizing these overlooked
            channels for maximum ROI. Contact us today to discover how we can
            help you generate more qualified phone leads through our proven
            strategies.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <BlogPost
      title="Phone Leads: 5 Most Overlooked Channels That Drive Quality Phone Leads"
      excerpt="Discover the hidden channels that consistently generate high-quality phone leads for your business."
      category="Lead Generation"
      date="Dec 14, 2024"
      author="Northern Leads Media Team"
      readTime="6 min read"
      content={content}
      icon={TrendingUp}
      backgroundImage={PhoneLeadsImg}
    />
  );
};

export default PhoneLeadsChannels;
