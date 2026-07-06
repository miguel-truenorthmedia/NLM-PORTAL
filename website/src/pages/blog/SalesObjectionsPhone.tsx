import BlogPost from "@/components/BlogPost";
import {
  Phone,
  Brain,
  MessageSquare,
  CheckCircle,
  Target,
  TrendingUp,
  Users,
  BarChart3,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SalesObjectionsImg from "@/assets/Essential-tips-for-handling-sales-obejections-over-the-phone.jpg";

const SalesObjectionsPhone = () => {
  const content = (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-8">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Phone sales objections are inevitable, but they don't have to be
            deal-breakers. At Northern Leads Media, we've trained thousands of
            sales professionals to handle objections with confidence and turn
            them into opportunities.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <Brain className="w-6 h-6 text-accent" />
            The Psychology Behind Sales Objections
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Understanding why prospects raise objections is the first step to
            handling them effectively. Most objections stem from fear,
            uncertainty, or lack of information. By addressing these underlying
            concerns, you can move the conversation forward.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-accent" />
            Common Phone Sales Objections and Responses
          </h2>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-accent" />
            "I'm not interested"
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            This is often a reflex response. Acknowledge their position and ask
            a qualifying question to understand their specific needs. "I
            understand you might not be interested right now. Can I ask what
            would make this more relevant for you?"
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            "I need to think about it"
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            This objection often indicates interest but hesitation. Help them
            think through the decision by asking specific questions about their
            concerns. "What specific aspects would you like to think about? I
            can help you gather the information you need."
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            "It's too expensive"
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Price objections are about value perception. Focus on ROI and
            benefits rather than features. "I understand budget is a concern.
            Let me show you how this investment typically pays for itself within
            the first quarter."
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" />
            The LAER Method for Handling Objections
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Listen, Acknowledge, Explore, Respond. This systematic approach
            ensures you address objections thoroughly and professionally. Each
            step builds trust and helps you understand the real concerns behind
            the objection.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" />
            Building Objection-Handling Skills
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Practice is essential for mastering objection handling. Role-play
            common scenarios, record your calls for review, and continuously
            refine your responses based on what works best for your specific
            market and product.
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
            Ready to master phone sales objections and close more deals? Our
            team at Northern Leads Media specializes in training sales
            professionals to handle objections with confidence. Contact us today
            to discover how we can help you improve your sales performance and
            achieve better results.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <BlogPost
      title="Essential Tips for Handling Sales Objections Over the Phone"
      excerpt="Master the art of handling phone sales objections with proven strategies that turn challenges into opportunities."
      category="Sales Training"
      date="Dec 16, 2024"
      author="Northern Leads Media Team"
      readTime="6 min read"
      content={content}
      icon={Phone}
      backgroundImage={SalesObjectionsImg}
    />
  );
};

export default SalesObjectionsPhone;
