import { SEO, seoConfigs } from "@/components/SEO";
import { Clock, ArrowRight, Users, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Create a Meeting Room",
      description: "Set up your meeting details including dates, time range, and room name.",
      icon: Clock,
      details: [
        "Choose your meeting dates",
        "Set time boundaries",
        "Name your meeting room",
        "Get a shareable link"
      ]
    },
    {
      number: "2", 
      title: "Share with Participants",
      description: "Send the room link to your team members across different time zones.",
      icon: Users,
      details: [
        "Share the unique room URL",
        "Participants join with their name",
        "Everyone selects their timezone",
        "No account registration required"
      ]
    },
    {
      number: "3",
      title: "Find the Perfect Time",
      description: "View the visual heatmap to instantly see when everyone is available.",
      icon: BarChart3,
      details: [
        "Drag and drop to select availability",
        "See real-time availability heatmap",
        "Identify optimal meeting times",
        "Confirm the final meeting time"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO {...seoConfigs.howItWorks} />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center text-xl font-bold text-blue-700 hover:text-blue-800 transition-colors">
              <Clock className="inline mr-2" size={24} />
              TimeSync
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="/how-it-works" className="text-blue-600 font-medium">How It Works</Link>
              <Link href="/help/share" className="text-gray-600 hover:text-gray-900">Help</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            How TimeSync Works
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-3xl mx-auto">
            Three simple steps to coordinate the perfect meeting time across any number of time zones.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className="flex-1">
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full text-xl font-bold">
                          {step.number}
                        </div>
                        <div className="flex items-center space-x-3">
                          <step.icon className="text-blue-600" size={32} />
                          <CardTitle className="text-2xl">{step.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-lg text-gray-600 mb-6">
                        {step.description}
                      </CardDescription>
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center space-x-2">
                            <ArrowRight className="text-green-500" size={16} />
                            <span className="text-gray-700">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center w-16">
                    <ArrowRight className="text-gray-400" size={32} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Try It Out?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start coordinating your global team meetings in less than 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create-room">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Create Your First Room
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline">
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
