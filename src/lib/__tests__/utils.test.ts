import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utils Library', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle empty inputs', () => {
      const result = cn('', null, undefined, 'valid-class');
      expect(result).toBe('valid-class');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
    });

    it('should remove duplicate classes', () => {
      const result = cn('text-red-500', 'text-blue-500');
      // Tailwind merge should keep only the last conflicting class
      expect(result).toContain('text-blue-500');
    });
  });
});