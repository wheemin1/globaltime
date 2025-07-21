import { SEO, seoConfigs } from "@/components/SEO";
import { Clock, Users, Globe, Zap, Shield, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Features() {
  const features = [
    {
      icon: Clock,
      title: "Smart Time Zone Handling",
      description: "Automatically converts and displays times across multiple time zones with visual clarity."
    },
    {
      icon: Users,
      title: "Real-time Collaboration",
      description: "Multiple participants can join and update their availability simultaneously."
    },
    {
      icon: BarChart3,
      title: "Visual Overlap Analysis",
      description: "Heatmap visualization instantly shows the best meeting times for all participants."
    },
    {
      icon: Zap,
      title: "Drag & Drop Interface",
      description: "Intuitive drag-and-drop selection makes scheduling quick and effortless."
    },
    {
      icon: Globe,
      title: "Global City Support",
      description: "Choose from 114+ cities worldwide with accurate timezone information."
    },
    {
      icon: Shield,
      title: "Private & Secure",
      description: "Meeting rooms are private and not indexed by search engines."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO {...seoConfigs.features} />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center text-xl font-bold text-blue-700 hover:text-blue-800 transition-colors">
              <Clock className="inline mr-2" size={24} />
              TimeSync
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/features" className="text-blue-600 font-medium">Features</Link>
              <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</Link>
              <Link href="/help/share" className="text-gray-600 hover:text-gray-900">Help</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Powerful Features for Global Teams
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Everything you need to coordinate meetings across time zones with ease and precision.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <feature.icon className="text-blue-600" size={24} />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Create your first meeting room and experience seamless global coordination.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create-room">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Create Meeting Room
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline">
                Learn How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
