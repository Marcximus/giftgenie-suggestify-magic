import { UseFormReturn } from 'react-hook-form';
import { BlogPostFormData } from '../types/BlogPostTypes';

export interface FormComponentBaseProps {
  form: UseFormReturn<BlogPostFormData>;
}

export interface BlogPostBasicInfoProps extends FormComponentBaseProps {
  generateSlug: (title: string) => string;
}

export interface BlogPostImageSectionProps extends FormComponentBaseProps {
  isGeneratingAltText: boolean;
  generateAltText: () => Promise<void>;
}

export interface BlogPostContentProps extends FormComponentBaseProps {
  handleAIGenerate: (type: 'excerpt' | 'seo-title' | 'seo-description' | 'seo-keywords' | 'improve-content') => Promise<void>;
}

export interface BlogPostSEOProps extends FormComponentBaseProps {
  handleAIGenerate: (type: 'excerpt' | 'seo-title' | 'seo-description' | 'seo-keywords' | 'improve-content') => Promise<void>;
}

export interface BlogPostFormActionsProps {
  onSubmit: (isDraft?: boolean) => Promise<void>;
  isSubmitting: boolean;
}