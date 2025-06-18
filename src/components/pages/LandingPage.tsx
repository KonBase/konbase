'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Package, Calendar, Users, Shield, BarChart3, FileText, Settings } from 'lucide-react';
import Link from 'next/link';
import { HomeHeader } from '@/components/layout/HomeHeader';
import Footer from '@/components/layout/Footer';

export function LandingPage() {
  const features = [
    {
      icon: Building2,
      title: 'Association Management',
      description: 'Manage your organization profile, members, and permissions with ease.',
    },
    {
      icon: Package,
      title: 'Inventory Tracking',
      description: 'Track equipment, supplies, and consumables with detailed categorization.',
    },
    {
      icon: Calendar,
      title: 'Event Management',
      description: 'Plan and manage conventions with comprehensive requirement tracking.',
    },
    {
      icon: Users,
      title: 'User Management',
      description: 'Role-based access control with granular permission settings.',
    },
    {
      icon: Shield,
      title: 'Security Features',
      description: 'Two-factor authentication and data encryption for sensitive information.',
    },
    {
      icon: BarChart3,
      title: 'Reports & Analytics',
      description: 'Generate comprehensive reports and track usage patterns.',
    },
    {
      icon: FileText,
      title: 'Documentation',
      description: 'Warranty tracking and document management for all equipment.',
    },
    {
      icon: Settings,
      title: 'Import/Export',
      description: 'Seamless data import/export with backup capabilities.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <HomeHeader />
      
      {/* Hero Section */}
      <section className="bg-konbase-blue text-konbase-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Streamline Your
              <span className="text-konbase-yellow block">Convention Management</span>
            </h1>
            <p className="text-xl md:text-2xl text-konbase-white/90 mb-8 leading-relaxed">
              KonBase is the comprehensive inventory and convention management system 
              built for associations that organize events and need to track their equipment and supplies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-konbase-yellow text-konbase-blue hover:bg-konbase-yellow/90 text-lg px-8 py-3"
                asChild
              >
                <Link href="/register">Get Started</Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-konbase-white border-konbase-white/30 hover:bg-konbase-white/10 text-lg px-8 py-3"
                asChild
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your association's inventory and conventions in one place.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 hover:border-konbase-blue/20 transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 bg-konbase-blue/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-konbase-blue" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8">About KonBase</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <h3 className="text-2xl font-semibold mb-4 text-konbase-blue">Built for Associations</h3>
                <p className="text-lg text-muted-foreground mb-6">
                  KonBase was designed specifically for associations that organize events and conventions. 
                  Our platform understands the unique challenges of managing equipment, tracking inventory, 
                  and coordinating complex events.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-konbase-yellow rounded-full mr-3"></div>
                    Comprehensive inventory management
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-konbase-yellow rounded-full mr-3"></div>
                    Convention planning and tracking
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-konbase-yellow rounded-full mr-3"></div>
                    Role-based access control
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-konbase-yellow rounded-full mr-3"></div>
                    Detailed reporting and analytics
                  </li>
                </ul>
              </div>
              <div className="text-left">
                <h3 className="text-2xl font-semibold mb-4 text-konbase-blue">Modern Technology</h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Built with modern web technologies including React, TypeScript, and Supabase, 
                  KonBase provides a fast, secure, and reliable platform for your organization.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-konbase-yellow rounded-full mr-3"></div>
                    Cloud-based with offline capabilities
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-konbase-yellow rounded-full mr-3"></div>
                    Real-time collaboration
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-konbase-yellow rounded-full mr-3"></div>
                    Mobile-responsive design
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-konbase-yellow rounded-full mr-3"></div>
                    Enterprise-grade security
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-konbase-blue text-konbase-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-konbase-white/90 mb-8">
              Join organizations already using KonBase to streamline their convention management.
            </p>
            <Button 
              size="lg" 
              className="bg-konbase-yellow text-konbase-blue hover:bg-konbase-yellow/90 text-lg px-8 py-3"
              asChild
            >
              <Link href="/register">Create Your Account</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}