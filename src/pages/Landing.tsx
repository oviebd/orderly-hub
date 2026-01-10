import { Button } from '@/components/ui/button';
import { Package, CheckCircle, Clock, Users, ArrowRight, Star, MessageCircle, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Clock,
      title: 'Fast Order Entry',
      description: 'Add new orders in under 30 seconds. No complex forms or unnecessary fields.',
    },
    {
      icon: Users,
      title: 'Customer Memory',
      description: 'Automatically track customer history by phone number. Rate and add private notes.',
    },
    {
      icon: CheckCircle,
      title: 'Status Tracking',
      description: 'Clear delivery status updates. Never miss a pending order again.',
    },
  ];

  const sources = [
    { icon: MessageCircle, label: 'WhatsApp', color: 'text-source-whatsapp' },
    { icon: MessageCircle, label: 'Messenger', color: 'text-source-messenger' },
    { icon: Phone, label: 'Phone', color: 'text-source-phone' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">OrderFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/login')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6 animate-fade-in">
            <Star className="h-4 w-4 fill-primary" />
            Free for up to 50 orders/month
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-fade-in">
            Stop losing orders in
            <span className="text-primary"> your WhatsApp chats</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
            A simple order notebook for small businesses. Track orders, remember customers, and never miss a delivery again.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <Button variant="hero" size="xl" onClick={() => navigate('/login')} className="gap-2">
              Start Free <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="hero-outline" size="xl" onClick={() => navigate('/dashboard')}>
              View Demo
            </Button>
          </div>

          {/* Source Pills */}
          <div className="flex items-center justify-center gap-4 mt-12 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <span className="text-sm text-muted-foreground">Works with orders from:</span>
            <div className="flex items-center gap-3">
              {sources.map((source) => (
                <div key={source.label} className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
                  <source.icon className={`h-4 w-4 ${source.color}`} />
                  <span className="text-sm font-medium">{source.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-secondary/50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need, nothing you don't
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for sellers who take orders through chats and calls. No complex features, just what works.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="bg-card rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to organize your orders?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start for free. No credit card required.
          </p>
          <Button variant="hero" size="xl" onClick={() => navigate('/login')} className="gap-2">
            Get Started Free <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">OrderFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 OrderFlow. Simple order management.
          </p>
        </div>
      </footer>
    </div>
  );
}
