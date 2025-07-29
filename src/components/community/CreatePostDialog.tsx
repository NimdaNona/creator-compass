'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PostCategory } from '@/types/community';
import { 
  X, 
  Plus, 
  Loader2, 
  AlertCircle,
  Image,
  FileText,
  Video,
  Link
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreatePostDialog({ open, onOpenChange, onSuccess }: CreatePostDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>(PostCategory.GENERAL);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedPlatform, selectedNiche } = useAppStore();

  const handleAddTag = () => {
    if (tagInput.trim() && tags.length < 5 && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Please provide both a title and content for your post');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          category,
          tags,
          attachments,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      // Reset form
      setTitle('');
      setContent('');
      setCategory(PostCategory.GENERAL);
      setTags([]);
      setAttachments([]);
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create post:', error);
      setError('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    { value: PostCategory.GENERAL, label: 'General Discussion' },
    { value: PostCategory.HELP, label: 'Help & Support' },
    { value: PostCategory.SHOWCASE, label: 'Showcase' },
    { value: PostCategory.FEEDBACK, label: 'Feedback' },
    { value: PostCategory.COLLABORATION, label: 'Collaboration' },
    { value: PostCategory.RESOURCES, label: 'Resources' },
    { value: PostCategory.TUTORIALS, label: 'Tutorials' },
    { value: PostCategory.ANNOUNCEMENTS, label: 'Announcements' },
  ];

  const suggestedTags = [
    selectedPlatform?.id,
    selectedNiche?.name,
    'tips',
    'question',
    'discussion',
    'help-wanted',
    'showcase',
    'tutorial',
  ].filter(Boolean) as string[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>
            Share your thoughts, ask questions, or start a discussion with the community
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What's on your mind?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/200
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={category} 
              onValueChange={(value) => setCategory(value as PostCategory)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Share your thoughts, experiences, or questions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px]"
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/5000
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                disabled={tags.length >= 5}
              />
              <Button
                type="button"
                onClick={handleAddTag}
                disabled={tags.length >= 5}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Current Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Suggested Tags */}
            {suggestedTags.length > 0 && tags.length < 5 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Suggested tags:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestedTags
                    .filter(tag => !tags.includes(tag))
                    .map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer text-xs"
                        onClick={() => {
                          if (tags.length < 5) {
                            setTags([...tags, tag]);
                          }
                        }}
                      >
                        #{tag}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Attachment Options */}
          <div className="space-y-2">
            <Label>Attachments (Coming Soon)</Label>
            <div className="grid grid-cols-4 gap-2">
              <Button variant="outline" size="sm" disabled>
                <Image className="h-4 w-4 mr-1" />
                Image
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Video className="h-4 w-4 mr-1" />
                Video
              </Button>
              <Button variant="outline" size="sm" disabled>
                <FileText className="h-4 w-4 mr-1" />
                File
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Link className="h-4 w-4 mr-1" />
                Link
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !content.trim()}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? 'Creating...' : 'Create Post'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}