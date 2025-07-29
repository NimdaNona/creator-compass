'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Calendar,
  Target,
  Clock,
  MapPin,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Star,
  MessageSquare,
  Send
} from 'lucide-react';
import { CreatorCollaboration, CollaborationType, CollaborationStatus } from '@/types/community';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface CollaborationListProps {
  collaborations: CreatorCollaboration[];
  loading: boolean;
  onRefresh?: () => void;
}

export function CollaborationList({ collaborations, loading, onRefresh }: CollaborationListProps) {
  const [appliedCollabs, setAppliedCollabs] = useState<Set<string>>(new Set());

  const handleApply = async (collaborationId: string) => {
    try {
      const response = await fetch(`/api/community/collaborations/${collaborationId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'I\'m interested in collaborating on this project!',
          experience: 'Previous collaboration experience...'
        })
      });

      if (response.ok) {
        setAppliedCollabs(prev => new Set(prev).add(collaborationId));
        onRefresh?.();
      }
    } catch (error) {
      console.error('Failed to apply for collaboration:', error);
    }
  };

  const getTypeColor = (type: CollaborationType) => {
    const colors: Record<CollaborationType, string> = {
      [CollaborationType.VIDEO]: 'bg-blue-500/10 text-blue-500',
      [CollaborationType.STREAM]: 'bg-purple-500/10 text-purple-500',
      [CollaborationType.PODCAST]: 'bg-green-500/10 text-green-500',
      [CollaborationType.SERIES]: 'bg-orange-500/10 text-orange-500',
      [CollaborationType.EVENT]: 'bg-pink-500/10 text-pink-500',
      [CollaborationType.PRODUCT]: 'bg-indigo-500/10 text-indigo-500',
      [CollaborationType.SERVICE]: 'bg-yellow-500/10 text-yellow-500',
      [CollaborationType.OTHER]: 'bg-gray-500/10 text-gray-500'
    };
    return colors[type] || 'bg-gray-500/10 text-gray-500';
  };

  const getStatusIcon = (status: CollaborationStatus) => {
    switch (status) {
      case CollaborationStatus.OPEN:
        return <AlertCircle className="h-4 w-4 text-green-500" />;
      case CollaborationStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4 text-blue-500" />;
      case CollaborationStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-32 bg-muted animate-pulse mb-2" />
                  <div className="h-3 w-24 bg-muted animate-pulse" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-6 w-3/4 bg-muted animate-pulse mb-2" />
              <div className="h-16 w-full bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (collaborations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No collaborations yet</h3>
          <p className="text-muted-foreground mb-4">
            Be the first to create a collaboration opportunity!
          </p>
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Create Collaboration
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {collaborations.map((collab) => (
            <motion.div
              key={collab.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={collab.creator.image} />
                        <AvatarFallback>
                          {collab.creator.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Link 
                          href={`/profile/${collab.creator.id}`}
                          className="font-semibold hover:underline"
                        >
                          {collab.creator.name}
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{collab.creator.platform}</span>
                          <span>•</span>
                          <span>{collab.creator.followersCount.toLocaleString()} followers</span>
                        </div>
                      </div>
                    </div>
                    {getStatusIcon(collab.status)}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{collab.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {collab.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={getTypeColor(collab.type)}>
                      {collab.type}
                    </Badge>
                    {collab.niches.map((niche) => (
                      <Badge key={niche} variant="outline" className="text-xs">
                        {niche}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{collab.timeline}</span>
                    </div>
                    {collab.compensation && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{collab.compensation}</span>
                      </div>
                    )}
                    {collab.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{collab.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{collab.applicants.length} applied</span>
                    </div>
                  </div>

                  {/* Requirements */}
                  {collab.requirements.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Requirements:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {collab.requirements.slice(0, 2).map((req, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-primary mt-0.5">•</span>
                            <span className="line-clamp-1">{req}</span>
                          </li>
                        ))}
                        {collab.requirements.length > 2 && (
                          <li className="text-xs">+{collab.requirements.length - 2} more</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Progress for in-progress collaborations */}
                  {collab.status === CollaborationStatus.IN_PROGRESS && collab.milestones && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>
                          {collab.milestones.filter(m => m.completed).length}/
                          {collab.milestones.length} milestones
                        </span>
                      </div>
                      <Progress 
                        value={
                          (collab.milestones.filter(m => m.completed).length / 
                          collab.milestones.length) * 100
                        } 
                      />
                    </div>
                  )}
                </CardContent>

                <CardFooter className="border-t pt-4">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Posted {formatDistanceToNow(new Date(collab.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/community/collaborations/${collab.id}`}>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </Link>
                      {collab.status === CollaborationStatus.OPEN && (
                        <Button 
                          size="sm"
                          onClick={() => handleApply(collab.id)}
                          disabled={appliedCollabs.has(collab.id)}
                        >
                          {appliedCollabs.has(collab.id) ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Applied
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-1" />
                              Apply
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Load More */}
      {collaborations.length >= 20 && (
        <div className="text-center">
          <Button variant="outline" onClick={onRefresh}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}