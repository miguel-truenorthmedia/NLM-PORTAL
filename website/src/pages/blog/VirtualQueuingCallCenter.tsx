import BlogPost from "@/components/BlogPost";
import {
  Phone,
  Clock,
  Users,
  Target,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import VirtualQueuingImg from "@/assets/what-is-virtual-queuing-in-a-call-center.jpg";

const VirtualQueuingCallCenter = () => {
  const content = (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-8">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Virtual queuing is revolutionizing call center operations by
            allowing customers to hold their place in line without staying on
            the phone. This innovative technology improves customer satisfaction
            while reducing operational costs. At Northern Leads Media, we help
            businesses implement virtual queuing solutions that enhance customer
            experiences and optimize call center efficiency.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-accent" />
            What is Virtual Queuing?
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Virtual queuing allows customers to request a callback instead of
            waiting on hold. When they call, they can choose to receive a call
            back when an agent becomes available, eliminating the need to stay
            on the phone and freeing up their time for other activities.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-accent" />
            Key Benefits of Virtual Queuing
          </h2>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            1. Improved Customer Experience
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Customers appreciate the convenience of virtual queuing. They can go
            about their day while waiting for a callback, reducing frustration
            and improving overall satisfaction with your service.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            2. Reduced Operational Costs
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Virtual queuing reduces the number of customers waiting on hold,
            which decreases phone line usage and associated costs. It also
            allows for better resource allocation and more efficient agent
            scheduling.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            3. Higher Call Completion Rates
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            Customers are more likely to complete their calls when they don't
            have to wait on hold. Virtual queuing reduces abandoned calls and
            ensures more customers get the help they need.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" />
            Implementation Best Practices
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Successful virtual queuing implementation requires clear
            communication with customers, accurate wait time estimates, and
            reliable callback systems. Train your agents on the new process and
            ensure your technology can handle the increased callback volume.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" />
            Technology Requirements
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Virtual queuing systems require robust call center technology
            including automatic call distribution, callback scheduling, and
            customer notification systems. Integration with your existing CRM
            and workforce management tools is essential for optimal performance.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-accent" />
            Measuring Success
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Track key metrics like customer satisfaction scores, callback
            completion rates, and average wait times to measure the impact of
            virtual queuing. Monitor customer feedback and agent productivity to
            ensure the system is meeting your goals.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-accent" />
            Getting Started
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Ready to implement virtual queuing in your call center? Our team at
            Northern Leads Media specializes in helping businesses deploy
            advanced call center technologies that improve customer experiences
            and operational efficiency. Contact us today to discover how virtual
            queuing can transform your call center operations.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <BlogPost
      title="What Is Virtual Queuing in a Call Center?"
      excerpt="Discover how virtual queuing technology can improve customer satisfaction and reduce operational costs in your call center."
      category="Call Center"
      date="Dec 8, 2024"
      author="Northern Leads Media Team"
      readTime="7 min read"
      content={content}
      icon={Phone}
      backgroundImage={VirtualQueuingImg}
    />
  );
};

export default VirtualQueuingCallCenter;
