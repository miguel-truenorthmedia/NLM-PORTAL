import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Experience from "@/components/Experience";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <Experience />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
