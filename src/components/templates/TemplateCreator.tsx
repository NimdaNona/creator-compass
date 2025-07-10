'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TEMPLATE_CATEGORIES } from '@/lib/template-system';
import { Plus, Save, Info, Code, X } from 'lucide-react';
import { toast } from 'sonner';

interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  description?: string;
}

export default function TemplateCreator() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    type: '',
    platform: '',
    niche: '',
    content: '',
  });
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    try {
      setSaving(true);

      // Validate form
      if (!formData.title || !formData.category || !formData.type || !formData.content) {
        toast.error('Please fill in all required fields');
        return;
      }

      const response = await fetch('/api/templates/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          variables,
          isPublic: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create template');
      }

      const data = await response.json();
      toast.success('Template created successfully!');
      setIsOpen(false);
      
      // Navigate to the template generator
      router.push(`/templates/generate/${data.template.id}`);
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  const addVariable = () => {
    setVariables([
      ...variables,
      {
        name: `variable_${variables.length + 1}`,
        label: '',
        type: 'text',
        required: false,
      },
    ]);
  };

  const updateVariable = (index: number, field: string, value: any) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: value };
    setVariables(updated);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const selectedCategory = formData.category ? TEMPLATE_CATEGORIES[formData.category] : null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Template</DialogTitle>
          <DialogDescription>
            Design your own reusable template with dynamic variables
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title*</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="My Custom Template"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData({ ...formData, platform: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="twitch">Twitch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this template is for..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category*</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value, type: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TEMPLATE_CATEGORIES).map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type*</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  disabled={!formData.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategory &&
                      Object.values(selectedCategory.types).map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Variables */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Template Variables</h3>
              <Button variant="outline" size="sm" onClick={addVariable}>
                <Plus className="h-4 w-4 mr-2" />
                Add Variable
              </Button>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Use {`{{variable_name}}`} in your template content to insert dynamic values
              </AlertDescription>
            </Alert>

            {variables.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                No variables added yet. Click "Add Variable" to create dynamic fields.
              </Card>
            ) : (
              <div className="space-y-4">
                {variables.map((variable, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <Badge variant="secondary">
                          <Code className="h-3 w-3 mr-1" />
                          {`{{${variable.name}}}`}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVariable(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Variable Name</Label>
                          <Input
                            value={variable.name}
                            onChange={(e) => updateVariable(index, 'name', e.target.value)}
                            placeholder="variable_name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Display Label</Label>
                          <Input
                            value={variable.label}
                            onChange={(e) => updateVariable(index, 'label', e.target.value)}
                            placeholder="Variable Label"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select
                            value={variable.type}
                            onValueChange={(value) => updateVariable(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="textarea">Textarea</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="select">Select</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Required</Label>
                          <Select
                            value={variable.required ? 'true' : 'false'}
                            onValueChange={(value) =>
                              updateVariable(index, 'required', value === 'true')
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="false">Optional</SelectItem>
                              <SelectItem value="true">Required</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={variable.description || ''}
                          onChange={(e) => updateVariable(index, 'description', e.target.value)}
                          placeholder="Help text for this variable"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Template Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Template Content*</h3>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter your template content here. Use {{variable_name}} to insert dynamic values."
              rows={10}
              className="font-mono"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}