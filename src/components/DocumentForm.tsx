
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
import React, { useCallback, useEffect } from 'react';

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
            // validator = validator.min(10, { message: 'Must be at least 10 characters' });
        }
        break;
      case 'boolean':
        validator = z.boolean();
        break;
      case 'file':
        validator = z.any().optional(); 
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

  const getInitialValues = useCallback(() => {
    const editDataKey = `docuFormEditData-${template.id}`;
    let initialValues: Record<string, any> = {};

    if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
            const storedEditData = sessionStorage.getItem(editDataKey);
            if (storedEditData) {
                initialValues = JSON.parse(storedEditData);
                sessionStorage.removeItem(editDataKey); 
                
                template.fields.forEach(field => {
                    if (!(field.id in initialValues)) {
                        if (field.defaultValue !== undefined) {
                            initialValues[field.id] = field.defaultValue;
                        } else if (field.type === 'number') {
                            initialValues[field.id] = undefined;
                        } else if (field.type === 'boolean') {
                            initialValues[field.id] = false;
                        } else if (field.type === 'file') {
                            initialValues[field.id] = initialValues[field.id] || undefined;
                        } else {
                            initialValues[field.id] = '';
                        }
                    } else if (field.type === 'file' && typeof initialValues[field.id] === 'string' && initialValues[field.id].startsWith('data:image')) {
                        // File input cannot be pre-filled with data URI. User must re-select.
                        // Keep the dataURI in form state for resubmission if not changed.
                    }
                });
                return initialValues;
            }
        } catch (e) {
            console.error("Failed to load or parse edit data from session storage:", e);
        }
    }

    template.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
            initialValues[field.id] = field.defaultValue;
        } else if (field.type === 'number') {
            initialValues[field.id] = undefined;
        } else if (field.type === 'boolean') {
            initialValues[field.id] = false;
        } else if (field.type === 'file') {
            initialValues[field.id] = undefined;
        } else {
            initialValues[field.id] = '';
        }
    });
    return initialValues;
  }, [template.id, template.fields]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(),
  });

  useEffect(() => {
    // This effect ensures that if the template.id changes or fields change,
    // the form is re-initialized with the correct default/sessionStorage values.
    // This is particularly useful if DocumentForm is part of a layout that persists
    // while template.id changes.
    form.reset(getInitialValues());
  }, [getInitialValues, form, template.id]); // Added template.id to ensure re-evaluation if it changes

  async function onSubmit(rawValues: z.infer<typeof formSchema>) {
    const submissionValues: Record<string, any> = { ...rawValues };
    const logoFieldDefinition = template.fields.find(f => f.id === 'businessLogoUrl' && f.type === 'file');
    const logoFieldId = logoFieldDefinition?.id;

    if (logoFieldId && rawValues[logoFieldId]) {
      const logoValueFromForm = rawValues[logoFieldId];

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
            submissionValues[logoFieldId] = dataUri;
          } catch (error) {
            console.error("Error converting file to data URI:", error);
            toast({
              variant: "destructive",
              title: "Logo Upload Failed",
              description: "Could not process the logo file. Please try again.",
            });
            submissionValues[logoFieldId] = ''; 
          }
        } else {
          submissionValues[logoFieldId] = ''; 
        }
      } else if (typeof logoValueFromForm === 'string' && logoValueFromForm.startsWith('data:image')) {
        submissionValues[logoFieldId] = logoValueFromForm;
      } else {
        submissionValues[logoFieldId] = '';
      }
    }
    
    if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
            sessionStorage.setItem(`docuFormPreviewData-${template.id}`, JSON.stringify(submissionValues));
            router.push(`/templates/${template.id}/preview`);
        } catch (error) {
            console.error("Error saving to session storage:", error);
            toast({
                variant: "destructive",
                title: "Navigation Error",
                description: "Could not prepare data for preview. Please try again.",
            });
        }
    } else {
        toast({
            variant: "destructive",
            title: "Environment Error",
            description: "Session storage is not available. Cannot proceed to preview.",
        });
    }
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { value, ...restFileProps } = formFieldControllerProps; // Exclude 'value'
        return (
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => formFieldControllerProps.onChange(e.target.files)} 
            {...restFileProps} // Pass name, onBlur, ref
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
