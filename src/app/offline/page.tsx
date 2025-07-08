'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Compass, Wifi, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-pink-900">
      <div className="text-center p-8 max-w-md mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl mx-auto mb-6">
          <Compass className="h-10 w-10 text-white" />
        </div>

        {/* Offline Icon */}
        <div className="flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mx-auto mb-6">
          <Wifi className="h-8 w-8 text-gray-400" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-white mb-4">
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-gray-300 mb-8 leading-relaxed">
          No internet connection detected. Don't worry - your progress is saved locally and will sync when you're back online.
        </p>

        {/* Actions */}
        <div className="space-y-4">
          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>

          <Button
            variant="outline"
            asChild
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <Link href="/dashboard">
              Go to Dashboard
            </Link>
          </Button>
        </div>

        {/* Offline Features */}
        <div className="mt-8 text-left">
          <h3 className="text-lg font-semibold text-white mb-3">
            Available Offline:
          </h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              View cached roadmap and tasks
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Complete tasks (will sync later)
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Access templates and resources
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              View achievements and progress
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}