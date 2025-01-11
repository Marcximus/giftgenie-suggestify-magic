import { Form } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { BlogPostFormData } from "../types/BlogPostTypes";

interface BlogPostFormWrapperProps {
  form: UseFormReturn<BlogPostFormData>;
  onSubmit: (data: BlogPostFormData) => void;
  children: React.ReactNode;
}

export const BlogPostFormWrapper = ({ form, onSubmit, children }: BlogPostFormWrapperProps) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-left">
        {children}
      </form>
    </Form>
  );
};