
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
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';

interface DocumentFormProps {
  template: DocumentFormPropsTemplate; // Updated type
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
        validator = z.coerce.number({ invalid_type_error: 'Must be a number' });
        break;
      case 'date':
        validator = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' });
        break;
      case 'textarea':
        validator = z.string().min(10, { message: 'Must be at least 10 characters' });
        break;
      case 'text':
      default:
        validator = z.string();
        break;
    }
    if (field.required) {
      validator = validator.min(1, { message: `${field.label} is required` });
    } else {
      validator = validator.optional();
    }
    shape[field.id] = validator;
  });
  return z.object(shape);
}


export function DocumentForm({ template }: DocumentFormProps) {
  const router = useRouter();
  const formSchema = createZodSchema(template.fields);

  const defaultValues: Record<string, any> = {};
  template.fields.forEach(field => {
    if (field.defaultValue !== undefined) {
      defaultValues[field.id] = field.defaultValue;
    } else if (field.type === 'number') {
      defaultValues[field.id] = undefined; 
    } else {
      defaultValues[field.id] = '';
    }
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const formDataString = encodeURIComponent(JSON.stringify(values));
    router.push(`/templates/${template.id}/preview?data=${formDataString}`);
  }

  const renderField = (field: TemplateField, formField: any) => {
    switch (field.type) {
      case 'textarea':
        return <Textarea placeholder={field.placeholder} {...formField} rows={5} />;
      case 'number':
        return <Input type="number" placeholder={field.placeholder} {...formField} />;
      case 'date':
        return <Input type="date" placeholder={field.placeholder} {...formField} />;
      case 'email':
        return <Input type="email" placeholder={field.placeholder} {...formField} />;
      case 'text':
      default:
        return <Input type="text" placeholder={field.placeholder} {...formField} />;
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
                render={({ field: formHookField }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-foreground/90">{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</FormLabel>
                    <FormControl>
                      {renderField(field, formHookField)}
                    </FormControl>
                    {field.placeholder && !field.type.includes('area') && ( 
                      <FormDescription className="text-xs text-muted-foreground">
                        Example: {field.placeholder}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
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
