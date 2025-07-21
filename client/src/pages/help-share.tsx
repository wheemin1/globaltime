import { SEO, seoConfigs } from "@/components/SEO";
import { Clock, Share2, Link as LinkIcon, Copy, Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function HelpShare() {
  const sharingMethods = [
    {
      icon: LinkIcon,
      title: "Direct Link Sharing",
      description: "Copy and paste the room URL to share via any communication platform.",
      steps: [
        "Copy the room URL from your browser",
        "Share via email, Slack, Teams, or any chat app",
        "Participants click the link to join instantly",
        "No account creation required"
      ]
    },
    {
      icon: Copy,
      title: "One-Click Copy",
      description: "Use the built-in copy button for quick sharing.",
      steps: [
        "Click the copy icon in the room header",
        "URL is automatically copied to clipboard",
        "Paste into your preferred communication tool",
        "Share with unlimited participants"
      ]
    }
  ];

  const bestPractices = [
    {
      title: "Set Clear Expectations",
      description: "Inform participants about the meeting duration and time zone considerations."
    },
    {
      title: "Share Early",
      description: "Give participants enough time to mark their availability, especially across time zones."
    },
    {
      title: "Follow Up",
      description: "Send a reminder with the final confirmed meeting time in everyone's local timezone."
    },
    {
      title: "Use Descriptive Names",
      description: "Name your meeting rooms clearly so participants understand the purpose."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO {...seoConfigs.helpShare} />
      
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
              <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</Link>
              <Link href="/help/share" className="text-blue-600 font-medium">Help</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Sharing Guide
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-purple-100 max-w-3xl mx-auto">
            Learn how to effectively share meeting rooms and collaborate with your global team.
          </p>
        </div>
      </section>

      {/* Sharing Methods */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Sharing Methods</h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {sharingMethods.map((method, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <method.icon className="text-purple-600" size={24} />
                    </div>
                    <CardTitle className="text-xl">{method.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-4">
                    {method.description}
                  </CardDescription>
                  <ol className="space-y-2">
                    {method.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start space-x-2">
                        <span className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full text-sm font-medium">
                          {stepIndex + 1}
                        </span>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Best Practices */}
          <div>
            <h3 className="text-2xl font-bold mb-8">Best Practices</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {bestPractices.map((practice, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <ArrowRight className="text-green-500" size={20} />
                      <span>{practice.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600">
                      {practice.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How many participants can join a room?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">There's no limit to the number of participants who can join a TimeSync room. The more participants, the more valuable the heatmap visualization becomes!</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Do participants need to create accounts?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">No! Participants only need to enter their name and select their timezone when joining a room. No registration or account creation is required.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>How long do meeting rooms stay active?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Meeting rooms remain active and accessible as long as you have the URL. There's no automatic expiration, so you can return to update availability anytime.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Start Collaborating?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Create your first meeting room and experience seamless global team coordination.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create-room">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
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
