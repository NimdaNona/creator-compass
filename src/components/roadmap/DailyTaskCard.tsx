'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  CheckCircle2,
  Circle,
  Clock,
  Target,
  BookOpen,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Lock,
  Zap,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedTask {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  timeEstimate: number;
  difficulty: string;
  category: string;
  platformSpecific: {
    tips: string[];
    bestPractices: string[];
    commonMistakes: string[];
  };
  successMetrics: {
    metric: string;
    target: string | number;
    howToMeasure: string;
  }[];
  resources: {
    type: string;
    title: string;
    url?: string;
    content?: string;
  }[];
  completed: boolean;
  completion?: {
    completedAt: string;
    quality?: number;
    timeSpent?: number;
  };
  locked: boolean;
}

interface DailyTaskCardProps {
  task: EnhancedTask;
  onComplete: (taskId: string, data: any) => Promise<void>;
  compact?: boolean;
}

export default function DailyTaskCard({ task, onComplete, compact = false }: DailyTaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [timeSpent, setTimeSpent] = useState(task.timeEstimate.toString());
  const [notes, setNotes] = useState('');
  const [quality, setQuality] = useState<string>('3');
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await onComplete(task.id, {
        timeSpent: parseInt(timeSpent),
        notes,
        quality: parseInt(quality),
        skipped: false
      });
      setShowCompleteDialog(false);
    } catch (error) {
      console.error('Error completing task:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkip = async () => {
    setIsCompleting(true);
    try {
      await onComplete(task.id, {
        skipped: true
      });
    } catch (error) {
      console.error('Error skipping task:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-500';
      case 'intermediate': return 'text-yellow-500';
      case 'advanced': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'content': return '🎬';
      case 'technical': return '⚙️';
      case 'community': return '👥';
      case 'analytics': return '📊';
      case 'monetization': return '💰';
      default: return '📝';
    }
  };

  if (task.locked) {
    return (
      <Card className="p-4 opacity-75">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <div>
              <h4 className="font-medium line-through">{task.title}</h4>
              <p className="text-sm text-muted-foreground">Upgrade to unlock this task</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Upgrade <Zap className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={cn(
        "p-4 transition-all",
        task.completed && "opacity-75 bg-muted/50"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {task.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "font-medium",
                task.completed && "line-through"
              )}>{task.title}</h4>
              <div className="flex items-center gap-4 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {getCategoryIcon(task.category)} {task.category}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {task.timeEstimate} min
                </span>
              </div>
            </div>
          </div>
          {!task.completed && (
            <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
              <DialogTrigger asChild>
                <Button size="sm">Complete</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Complete Task</DialogTitle>
                  <DialogDescription>
                    How did it go? Your feedback helps improve recommendations.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Time spent (minutes)</Label>
                    <input
                      type="number"
                      value={timeSpent}
                      onChange={(e) => setTimeSpent(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quality rating</Label>
                    <RadioGroup value={quality} onValueChange={setQuality}>
                      <div className="flex items-center gap-4">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <div key={rating} className="flex items-center">
                            <RadioGroupItem value={rating.toString()} id={`quality-${rating}`} />
                            <Label htmlFor={`quality-${rating}`} className="ml-1 cursor-pointer">
                              <Star className={cn(
                                "h-5 w-5",
                                parseInt(quality) >= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                              )} />
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any thoughts or learnings?"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    disabled={isCompleting}
                  >
                    Skip Task
                  </Button>
                  <Button
                    onClick={handleComplete}
                    disabled={isCompleting}
                  >
                    Complete Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      task.completed && "opacity-75 bg-muted/50"
    )}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {task.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-2">
                <h4 className={cn(
                  "font-semibold text-lg",
                  task.completed && "line-through"
                )}>{task.title}</h4>
                <p className="text-muted-foreground">{task.description}</p>
                <div className="flex flex-wrap items-center gap-4">
                  <Badge variant="secondary">
                    {getCategoryIcon(task.category)} {task.category}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {task.timeEstimate} min
                  </span>
                  <span className={cn("text-sm font-medium", getDifficultyColor(task.difficulty))}>
                    {task.difficulty}
                  </span>
                </div>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </div>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t pt-4">
            {/* Instructions */}
            {task.instructions.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Step-by-Step Instructions
                </h5>
                <ol className="space-y-1 list-decimal list-inside">
                  {task.instructions.map((instruction, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Success Metrics */}
            {task.successMetrics.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Success Metrics
                </h5>
                <div className="space-y-2">
                  {task.successMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="font-medium">{metric.metric}:</span>
                      <span className="text-muted-foreground">{metric.target}</span>
                      <span className="text-xs text-muted-foreground">({metric.howToMeasure})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Platform Specific Tips */}
            <div className="grid gap-4 md:grid-cols-3">
              {task.platformSpecific.tips.length > 0 && (
                <div className="space-y-2">
                  <h6 className="text-sm font-medium text-green-600">💡 Tips</h6>
                  <ul className="space-y-1 text-xs">
                    {task.platformSpecific.tips.map((tip, index) => (
                      <li key={index} className="text-muted-foreground">• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {task.platformSpecific.bestPractices.length > 0 && (
                <div className="space-y-2">
                  <h6 className="text-sm font-medium text-blue-600">✅ Best Practices</h6>
                  <ul className="space-y-1 text-xs">
                    {task.platformSpecific.bestPractices.map((practice, index) => (
                      <li key={index} className="text-muted-foreground">• {practice}</li>
                    ))}
                  </ul>
                </div>
              )}

              {task.platformSpecific.commonMistakes.length > 0 && (
                <div className="space-y-2">
                  <h6 className="text-sm font-medium text-red-600">⚠️ Common Mistakes</h6>
                  <ul className="space-y-1 text-xs">
                    {task.platformSpecific.commonMistakes.map((mistake, index) => (
                      <li key={index} className="text-muted-foreground">• {mistake}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Resources */}
            {task.resources.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium">Resources</h5>
                <div className="flex flex-wrap gap-2">
                  {task.resources.map((resource, index) => (
                    <Badge key={index} variant="outline">
                      {resource.type === 'tool' && '🔧'}
                      {resource.type === 'template' && '📄'}
                      {resource.type === 'guide' && '📖'}
                      {resource.type === 'example' && '💡'}
                      {' '}{resource.title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!task.completed && (
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkip}
                  disabled={isCompleting}
                >
                  Skip Task
                </Button>
                <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      Complete Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Complete Task</DialogTitle>
                      <DialogDescription>
                        How did it go? Your feedback helps improve recommendations.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Time spent (minutes)</Label>
                        <input
                          type="number"
                          value={timeSpent}
                          onChange={(e) => setTimeSpent(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Quality rating</Label>
                        <RadioGroup value={quality} onValueChange={setQuality}>
                          <div className="flex items-center gap-4">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <div key={rating} className="flex items-center">
                                <RadioGroupItem value={rating.toString()} id={`quality-${rating}`} />
                                <Label htmlFor={`quality-${rating}`} className="ml-1 cursor-pointer">
                                  <Star className={cn(
                                    "h-5 w-5",
                                    parseInt(quality) >= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                  )} />
                                </Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes (optional)</Label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Any thoughts or learnings?"
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCompleteDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleComplete}
                        disabled={isCompleting}
                      >
                        Complete Task
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Completion Info */}
            {task.completed && task.completion && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-400">
                  Completed on {new Date(task.completion.completedAt).toLocaleDateString()}
                  {task.completion.quality && ` • Quality: ${task.completion.quality}/5`}
                  {task.completion.timeSpent && ` • Time: ${task.completion.timeSpent} min`}
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}