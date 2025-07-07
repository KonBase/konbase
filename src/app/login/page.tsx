'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { GuestGuard } from '@/components/guards/GuestGuard';
import { Metadata } from 'next';
import Image from 'next/image';
import { Building2, Users, Package, Calendar } from 'lucide-react';

export default function LoginPage() {
  return (
    <GuestGuard>
      <div className="min-h-screen flex">
        {/* Left Side - KonBase Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-konbase-navy-blue text-konbase-light-gray flex-col justify-center p-12">
          <div className="max-w-md">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-konbase-pastel-yellow rounded-lg flex items-center justify-center">
              <Building2 className="h-8 w-8 text-konbase-navy-blue" />
            </div>
            <h1 className="text-3xl font-bold text-konbase-pastel-yellow">KonBase</h1>
            </div>
            
            {/* Tagline */}
            <h2 className="text-2xl font-semibold mb-4">KonBase Supply Chain</h2>
            <p className="text-konbase-light-gray/80 mb-8 text-lg">
              Streamline your convention inventory management with our comprehensive solution.
            </p>
            
            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-konbase-pastel-yellow/20 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-konbase-pastel-yellow" />
                </div>
                <span>Inventory Tracking</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-konbase-pastel-yellow/20 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-konbase-pastel-yellow" />
                </div>
                <span>Event Management</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-konbase-pastel-yellow/20 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-konbase-pastel-yellow" />
                </div>
                <span>Association Management</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-4 bg-background">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
