import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, Globe, Calendar } from "lucide-react";
import { Link } from "wouter";
import { SEO, seoConfigs } from "@/components/SEO";
import { StructuredData, structuredDataConfigs } from "@/components/StructuredData";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SEO {...seoConfigs.home} />
      <StructuredData type="WebApplication" data={structuredDataConfigs.webApplication} />
      <StructuredData type="Organization" data={structuredDataConfigs.organization} />
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-700">
                <Clock className="inline mr-2" size={24} />
                TimeSync
              </h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link href="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
              <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</Link>
              <Link href="/help/share" className="text-gray-600 hover:text-gray-900">Help</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find the Perfect Meeting Time
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Coordinate across timezones with drag-and-drop scheduling. 
            Get visual heatmaps showing when your global team is available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create-room">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                Create Meeting Room
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 text-blue-600" size={24} />
                Timezone Smart
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatic timezone detection and conversion. See availability in your local time or switch to any participant's perspective.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 text-green-600" size={24} />
                Visual Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Interactive heatmap shows overlapping availability at a glance. Darker colors indicate more people are free.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 text-orange-600" size={24} />
                Drag & Drop
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Select your available times with intuitive drag-and-drop. Works seamlessly on desktop and mobile devices.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Create Room</h3>
              <p className="text-gray-600">Set up a meeting room with date range and time boundaries</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Share & Join</h3>
              <p className="text-gray-600">Team members join via URL and select their available times</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-orange-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Find Best Time</h3>
              <p className="text-gray-600">View heatmap results and confirm the optimal meeting time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
