'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Trophy, 
  MessageSquare, 
  Rocket,
  Star,
  Shield,
  TrendingUp,
  UserPlus
} from 'lucide-react';

export default function CommunityPage() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, router]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Users className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading community...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Users className="w-8 h-8" />
            Creator Community
          </h1>
          <p className="text-muted-foreground">
            Connect, collaborate, and grow with fellow creators
          </p>
        </div>

        {/* Coming Soon Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Community Features Coming Soon!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                  <Rocket className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-muted-foreground mb-6">
                We're building an amazing community space where creators can connect, share experiences, and grow together.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <Trophy className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Community Challenges</h3>
                  <p className="text-sm text-muted-foreground">
                    Participate in monthly challenges and compete with other creators
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Discussion Forums</h3>
                  <p className="text-sm text-muted-foreground">
                    Share tips, ask questions, and learn from experienced creators
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <UserPlus className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Find Collaborators</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with creators in your niche for partnerships and collabs
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Success Stories</h3>
                  <p className="text-sm text-muted-foreground">
                    Get inspired by fellow creators' growth journeys
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-indigo-500 mt-0.5" />
                <div>
                  <h3 className="font-medium">Exclusive Events</h3>
                  <p className="text-sm text-muted-foreground">
                    Access workshops, AMAs, and networking events
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 pt-6 border-t">
              <Badge variant="secondary" className="px-4 py-1">
                <TrendingUp className="w-4 h-4 mr-2" />
                Launching Q2 2024
              </Badge>
              <Button onClick={() => router.push('/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}