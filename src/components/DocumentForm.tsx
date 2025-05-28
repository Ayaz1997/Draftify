
'use client';

import type { TemplateField, FormData, DocumentFormPropsTemplate } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface DocumentFormProps {
  template: DocumentFormPropsTemplate;
}

function createZodSchema(fields: TemplateField[]): z.ZodObject<any, any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  fields.forEach((field) => {
    let validator: z.ZodTypeAny;
    switch (field.type) {
      case 'email':
        validator = z.string().email({ message: 'Invalid email address' });
        break;
      case 'number':
        validator = z.coerce.number({ invalid_type_error: 'Must be a number' }).nullable();
        break;
      case 'date':
        validator = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' });
        break;
      case 'textarea':
        validator = z.string().min(field.required ? 1 : 0, { message: `${field.label} is required` });
        if (field.required && validator instanceof z.ZodString) {
            // For required textareas, a more substantial minimum might be desired, adjust as needed.
            // validator = validator.min(10, { message: 'Must be at least 10 characters' });
        }
        break;
      case 'boolean':
        validator = z.boolean();
        break;
      case 'file':
        validator = z.any().optional(); // Allows FileList, undefined. Specific validation in onSubmit.
        break;
      case 'text':
      default:
        validator = z.string();
        break;
    }
    if (field.required && field.type !== 'boolean' && field.type !== 'file') { 
        if (validator instanceof z.ZodString) {
            validator = validator.min(1, { message: `${field.label} is required` });
        } else if (validator instanceof z.ZodNumber || (validator instanceof z.ZodNullable && validator.unwrap() instanceof z.ZodNumber)) {
            // Ensure required numbers are actually provided
            validator = z.coerce.number({required_error: `${field.label} is required`, invalid_type_error: 'Must be a number'});
        }
    } else if (field.type !== 'boolean' && field.type !== 'file') {
      validator = validator.optional();
    }
    
    shape[field.id] = validator;
  });
  return z.object(shape);
}


export function DocumentForm({ template }: DocumentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formSchema = createZodSchema(template.fields);

  const defaultValues: Record<string, any> = {};
  template.fields.forEach(field => {
    if (field.defaultValue !== undefined) {
      defaultValues[field.id] = field.defaultValue;
    } else if (field.type === 'number') {
      defaultValues[field.id] = undefined; 
    } else if (field.type === 'boolean') {
      defaultValues[field.id] = false; 
    } else if (field.type === 'file') {
      defaultValues[field.id] = undefined; 
    } else {
      defaultValues[field.id] = '';
    }
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  async function onSubmit(rawValues: z.infer<typeof formSchema>) {
    // Use a mutable record for values that will be stringified and sent.
    const submissionValues: Record<string, any> = { ...rawValues };

    // Handle businessLogoUrl specifically
    const logoFieldDefinition = template.fields.find(f => f.id === 'businessLogoUrl' && f.type === 'file');
    if (logoFieldDefinition) {
      const logoValueFromForm = rawValues.businessLogoUrl; // This is 'any' due to z.any()

      if (logoValueFromForm instanceof FileList && logoValueFromForm.length > 0) {
        const file = logoValueFromForm[0];
        let isValidFile = true;

        if (!file.type.startsWith('image/')) {
          toast({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: 'Please upload an image file for the logo (e.g., PNG, JPG).',
          });
          isValidFile = false;
        } else if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast({
            variant: 'destructive',
            title: 'File Too Large',
            description: 'Logo image should be less than 5MB.',
          });
          isValidFile = false;
        }

        if (isValidFile) {
          try {
            const dataUri = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (event) => {
                if (event.target && typeof event.target.result === 'string') {
                  resolve(event.target.result);
                } else {
                  reject(new Error('Failed to read file.'));
                }
              };
              reader.onerror = (error) => reject(error);
              reader.readAsDataURL(file);
            });
            submissionValues.businessLogoUrl = dataUri;
          } catch (error) {
            console.error("Error converting file to data URI:", error);
            toast({
              variant: "destructive",
              title: "Logo Upload Failed",
              description: "Could not process the logo file. Please try again.",
            });
            submissionValues.businessLogoUrl = ''; 
          }
        } else {
          submissionValues.businessLogoUrl = ''; // Set to empty if validation failed
        }
      } else if (typeof logoValueFromForm === 'string' && logoValueFromForm.startsWith('data:image')) {
        // Already a data URI (e.g., from an edit flow that pre-filled the form), keep it.
        submissionValues.businessLogoUrl = logoValueFromForm;
      } else {
        // No file selected, or FileList is empty, or it's an unrecognized type.
        submissionValues.businessLogoUrl = '';
      }
    }
    
    const formDataString = encodeURIComponent(JSON.stringify(submissionValues));
    router.push(`/templates/${template.id}/preview?data=${formDataString}`);
  }

  const renderField = (field: TemplateField, formFieldControllerProps: any) => {
    switch (field.type) {
      case 'textarea':
        return <Textarea placeholder={field.placeholder} {...formFieldControllerProps} rows={field.rows || 5} />;
      case 'number':
        return <Input type="number" placeholder={field.placeholder} {...formFieldControllerProps} step="any" />;
      case 'date':
        return <Input type="date" placeholder={field.placeholder} {...formFieldControllerProps} />;
      case 'email':
        return <Input type="email" placeholder={field.placeholder} {...formFieldControllerProps} />;
      case 'file':
        // Exclude 'ref' from being passed to the DOM element if it's part of formFieldControllerProps from RHF Controller
        const { ref, ...restProps } = formFieldControllerProps;
        return (
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => formFieldControllerProps.onChange(e.target.files)} // Pass FileList to RHF
            // value is managed by react-hook-form; don't set it directly on the input
            // ref is handled by Controller
            name={formFieldControllerProps.name}
            onBlur={formFieldControllerProps.onBlur}
            className="pt-2" 
          />
        );
      case 'boolean':
        return (
          <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2">
            <FormControl>
              <Checkbox
                checked={formFieldControllerProps.value}
                onCheckedChange={formFieldControllerProps.onChange}
                id={field.id}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel htmlFor={field.id} className="font-normal"> 
                {field.label}
              </FormLabel>
              {field.placeholder && (
                <FormDescription className="text-xs">
                  {field.placeholder}
                </FormDescription>
              )}
            </div>
          </FormItem>
        );
      case 'text':
      default:
        return <Input type="text" placeholder={field.placeholder} {...formFieldControllerProps} />;
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Fill in the details for your {template.name}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {template.fields.map((field) => (
              <FormField
                key={field.id}
                control={form.control}
                name={field.id as keyof z.infer<typeof formSchema>}
                render={({ field: formHookFieldRenderProps }) => ( 
                  field.type === 'boolean' ? (
                     renderField(field, formHookFieldRenderProps) 
                  ) : (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground/90">{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</FormLabel>
                      <FormControl>
                        {renderField(field, formHookFieldRenderProps)}
                      </FormControl>
                      {field.placeholder && !field.type.includes('area') && field.type !== 'boolean' && field.type !== 'file' && ( 
                        <FormDescription className="text-xs text-muted-foreground">
                          Example: {field.placeholder}
                        </FormDescription>
                      )}
                       {field.type === 'file' && field.placeholder && (
                        <FormDescription className="text-xs text-muted-foreground">
                          {field.placeholder}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )
                )}
              />
            ))}
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t pt-6">
             <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Eye className="mr-2 h-4 w-4" />
              Preview Document
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

