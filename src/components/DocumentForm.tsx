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
// Switch is not used in current renderField, can be removed if not planned for other templates
// import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import React, { useCallback } from 'react'; // useEffect removed as it's not directly used now for form.reset

// Accordion components are not used here, can be removed if not planned
// import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

interface DocumentFormProps {
  template: DocumentFormPropsTemplate;
}

function createZodSchema(fields: TemplateField[]): z.ZodObject<any, any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  fields.forEach((field) => {
    let validator: z.ZodTypeAny;
    switch (field.type) {
      case 'email': {
        // Making email optional based on current requirement to make all fields not required
        validator = z.string().email({ message: 'Invalid email address' }).optional().or(z.literal(''));
        break;
      }
      case 'number': {
        // Coerce to number, then make it optional or allow empty string which might be coerced to NaN/0 by Zod.
        // .optional().nullable() allows it to be undefined or null.
        validator = z.coerce.number({ invalid_type_error: 'Must be a number' }).optional().nullable();
        break;
      }
      case 'date': {
        // Allow empty string or valid date format
        validator = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' }).optional().or(z.literal(''));
        break;
      }
      case 'textarea': {
        validator = z.string().optional();
        break;
      }
      case 'boolean': {
        validator = z.boolean().optional().default(field.defaultValue === true);
        break;
      }
      case 'file': {
        // For file uploads, use z.any() as FileList/File object is complex for Zod.
        // Validation happens in onSubmit. Make it optional.
        validator = z.any().optional();
        break;
      }
      case 'text': {
        validator = z.string().optional();
        break;
      }
      default: {
        validator = z.string().optional();
        break;
      }
    }
    // Field requirement is handled by .optional() based on PRD, not field.required
    shape[field.id] = validator;
  });
  return z.object(shape);
}

// Structure for Work Order sections
const workOrderSectionStructure: Record<string, string[]> = {
  'Business Details': ['businessName', 'businessAddress', 'businessContactNumber', 'businessEmail', 'businessLogoUrl'],
  'Order Details': ['orderNumber', 'orderDate', 'expectedStartDate', 'expectedEndDate'],
  'Client Details': ['clientName', 'clientPhone', 'clientEmail', 'workLocation', 'orderReceivedBy'],
  'Work Order Specifics': [
    'generalWorkDescription', 'termsOfService',
    'includeWorkDescriptionTable', 'workItem1Description', 'workItem1Area', 'workItem1Rate',
    'workItem2Description', 'workItem2Area', 'workItem2Rate',
    'workItem3Description', 'workItem3Area', 'workItem3Rate',
    'includeMaterialTable', 'materialItem1Name', 'materialItem1Unit', 'materialItem1Quantity', 'materialItem1PricePerUnit',
    'materialItem2Name', 'materialItem2Unit', 'materialItem2Quantity', 'materialItem2PricePerUnit',
    'materialItem3Name', 'materialItem3Unit', 'materialItem3Quantity', 'materialItem3PricePerUnit',
    'includeLaborTable', 'laborItem1TeamName', 'laborItem1NumPersons', 'laborItem1Amount',
    'laborItem2TeamName', 'laborItem2NumPersons', 'laborItem2Amount',
    'laborItem3TeamName', 'laborItem3NumPersons', 'laborItem3Amount',
    'otherCosts', 'taxRatePercentage',
    'approvedByName', 'dateOfApproval'
  ]
};


export function DocumentForm({ template }: DocumentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const formSchema = createZodSchema(template.fields);

  const getInitialValues = useCallback(() => {
    const editDataKey = `docuFormEditData-${template.id}`;
    const storedEditDataString = typeof window !== 'undefined' ? sessionStorage.getItem(editDataKey) : null;

    let initialValues: Record<string, any> = {};

    if (storedEditDataString) {
      try {
        const parsedData = JSON.parse(storedEditDataString);
        initialValues = { ...parsedData }; // Spread to ensure all fields from storage are copied
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(editDataKey);
        }
      } catch (e) {
        console.error('Failed to parse edit data from session storage:', e);
        // Fall through to default template values if parsing fails
      }
    }

    template.fields.forEach(field => {
        if (initialValues[field.id] === undefined) { // If not set by edit data
            if (field.type === 'date' && field.defaultValue === undefined) {
                initialValues[field.id] = new Date().toISOString().split('T')[0];
            } else if (field.defaultValue !== undefined) {
                initialValues[field.id] = field.defaultValue;
            } else if (field.type === 'boolean') {
                 initialValues[field.id] = false; // Default booleans to false if no defaultValue
            } else if (field.type === 'number') {
                 initialValues[field.id] = undefined; // Important for controlled number inputs to not show 0
            } else if (field.type === 'file'){
                 initialValues[field.id] = undefined; // File inputs are uncontrolled by default value
            }
            else {
                 initialValues[field.id] = ''; // Default other types to empty string
            }
        } else if (field.type === 'date' && initialValues[field.id]) {
            // Ensure dates from storage are in YYYY-MM-DD format for the input[type=date]
            try {
                const dateObj = new Date(initialValues[field.id]);
                // Check if date is valid. getTime() returns NaN for invalid dates.
                if (!isNaN(dateObj.getTime())) {
                    initialValues[field.id] = dateObj.toISOString().split('T')[0];
                } else {
                     // If stored date string is invalid, default to current date
                    initialValues[field.id] = new Date().toISOString().split('T')[0];
                }
            } catch (e) {
                 // Fallback if date conversion from storage fails
                initialValues[field.id] = new Date().toISOString().split('T')[0];
            }
        } else if (field.type === 'number' && (initialValues[field.id] === null || initialValues[field.id] === '')) {
             // Ensure empty string or null for numbers become undefined for the form state
            initialValues[field.id] = undefined;
        }
    });
    return initialValues;
  }, [template.id, template.fields]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const submissionValues: Record<string, any> = { ...values };
    const logoField = template.fields.find(f => f.id === 'businessLogoUrl' && f.type === 'file');

    if (logoField) {
      const logoFileValue = values[logoField.id]; // This will be FileList | string (dataURI) | undefined

      if (logoFileValue instanceof FileList && logoFileValue.length > 0) {
        const file = logoFileValue[0];
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

        if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
          toast({
            variant: "destructive",
            title: "Invalid File Type",
            description: `Please upload an image (JPEG, PNG, GIF, WEBP, SVG). You uploaded: ${file.type}`,
          });
          submissionValues[logoField.id] = '';
        } else if (file.size > MAX_FILE_SIZE) {
          toast({
            variant: "destructive",
            title: "File Too Large",
            description: `Please upload an image smaller than 5MB. Yours is ${(file.size / (1024*1024)).toFixed(2)}MB.`,
          });
          submissionValues[logoField.id] = '';
        } else {
          try {
            const dataUri = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (event) => {
                if (event.target && typeof event.target.result === 'string') {
                  resolve(event.target.result);
                } else {
                  reject(new Error('Failed to read file content.'));
                }
              };
              reader.onerror = (error) => {
                console.error("FileReader error:", error);
                reject(error);
              };
              reader.readAsDataURL(file);
            });
            submissionValues[logoField.id] = dataUri;
          } catch (error: any) {
            console.error("Error converting file to data URI:", error);
            toast({
              variant: "destructive",
              title: "Logo Upload Failed",
              description: `CRITICAL: Error converting file to data URI: ${error.message || 'Unknown error'}. Please try again or skip logo.`,
            });
            submissionValues[logoField.id] = '';
          }
        }
      } else if (typeof logoFileValue === 'string' && logoFileValue.startsWith('data:image')) {
        // It's an existing data URI (e.g., from edit mode), keep it
        submissionValues[logoField.id] = logoFileValue;
      } else {
        // No new file uploaded, or invalid existing value.
        // Check if initialValues had a valid data URI for this (e.g. if editData didn't change the logo)
        const initialLogo = getInitialValues()[logoField.id];
        if (typeof initialLogo === 'string' && initialLogo.startsWith('data:image')) {
          submissionValues[logoField.id] = initialLogo;
        } else {
          submissionValues[logoField.id] = ''; // Default to empty if no valid new upload or existing URI
        }
      }
    }
    
    // Ensure all fields defined in the template are present in submissionValues,
    // especially for fields that might not be touched or are booleans.
    template.fields.forEach(field => {
      if (submissionValues[field.id] === undefined) {
        if (field.type === 'boolean') {
          submissionValues[field.id] = false; // Default undefined booleans to false
        } else if (field.id !== logoField?.id) { // Non-logo, non-boolean undefined fields
           submissionValues[field.id] = values[field.id] !== undefined ? values[field.id] : (field.defaultValue !== undefined ? field.defaultValue : '');
        } else if (field.id === logoField?.id && submissionValues[field.id] === undefined) {
           submissionValues[field.id] = ''; // Ensure logo field is at least an empty string
        }
      }
    });

    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const dataKey = `docuFormPreviewData-${template.id}`;
        sessionStorage.setItem(dataKey, JSON.stringify(submissionValues));
        router.push(`/templates/${template.id}/preview`);
      } else {
        throw new Error('Session storage is not available.');
      }
    } catch (e: any) {
      console.error('Error saving to session storage or navigating:', e);
      toast({
        variant: "destructive",
        title: "Error Proceeding to Preview",
        description: e.message || "Could not save data for preview.",
      });
    }
  };

  const renderField = (field: TemplateField, formFieldControllerProps: any) => {
    // For controlled number inputs, an empty string value is often preferred over undefined/null to avoid react warnings,
    // but Zod coercion might handle it. Let's ensure value is '' if undefined.
    const value = (field.type === 'number' && (formFieldControllerProps.value === undefined || formFieldControllerProps.value === null)) ? '' : formFieldControllerProps.value;

    switch (field.type) {
      case 'textarea': {
        return <Textarea placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} rows={field.rows || 5} />;
      }
      case 'number': {
        // Pass value directly, react-hook-form handles number conversion.
        return <Input type="number" placeholder={field.placeholder} {...formFieldControllerProps} value={value} step="any" />;
      }
      case 'date': {
        let dateValue = formFieldControllerProps.value || '';
        // Ensure dateValue is in 'YYYY-MM-DD' format for the input.
        // This might already be handled by getInitialValues and Zod, but double check.
        if (dateValue && typeof dateValue === 'string' && !dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            try {
                const parsed = new Date(dateValue);
                if(!isNaN(parsed.getTime())) dateValue = parsed.toISOString().split('T')[0];
                else dateValue = ''; // or today's date as fallback: new Date().toISOString().split('T')[0];
            } catch {
                dateValue = ''; // Fallback if conversion fails
            }
        }
        return <Input type="date" placeholder={field.placeholder} {...formFieldControllerProps} value={dateValue} />;
      }
      case 'email': {
        return <Input type="email" placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} />;
      }
      case 'file': {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { value: fileValue, onChange: onFileChange, ...restFileProps } = formFieldControllerProps;
        return (
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => onFileChange(e.target.files)} // Pass FileList
            {...restFileProps} // Pass other props like name, onBlur, ref
            className="pt-2" // Some padding for file input
          />
        );
      }
      case 'boolean': {
        return (
          <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2">
            <FormControl>
              <Checkbox
                checked={formFieldControllerProps.value || false} // Ensure checked is boolean
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
      }
      case 'text': {
        return <Input type="text" placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} />;
      }
      default: {
        return <Input type="text" placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} />;
      }
    }
  };

  const renderFormField = (field: TemplateField) => (
    <FormField
      key={field.id}
      control={form.control}
      name={field.id as keyof z.infer<typeof formSchema>} // Type assertion
      render={({ field: formHookFieldRenderProps }) => (
        // For boolean (checkbox), we render FormItem differently inside renderField
        field.type === 'boolean' ? renderField(field, formHookFieldRenderProps) :
        <FormItem>
          <FormLabel className="font-semibold text-foreground/90">{field.label}</FormLabel>
          <FormControl>
            {renderField(field, formHookFieldRenderProps)}
          </FormControl>
          {field.placeholder && field.type !== 'textarea' && field.type !== 'boolean' && field.type !== 'file' && (
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
      )}
    />
  );


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Fill in the details for your {template.name}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {template.id === 'work-order' ? (
              <>
                {Object.entries(workOrderSectionStructure).map(([sectionTitle, fieldIds], sectionIndex) => (
                  <div key={sectionTitle} className="space-y-4 pt-4"> {/* Added pt-4 for spacing before section content */}
                    <h2 className={`text-xl font-semibold text-primary ${sectionIndex > 0 ? 'mt-6' : 'mt-0'} pb-2 border-b border-border`}>
                      {sectionTitle}
                    </h2>
                    <div className="space-y-4"> {/* Wrapper for fields within a section */}
                      {fieldIds.map(fieldId => {
                        const field = template.fields.find(f => f.id === fieldId);
                        if (!field) return null;
                        // Skip rendering if fieldId is not in the current section's fieldIds
                        if (!workOrderSectionStructure[sectionTitle].includes(fieldId)) return null;
                        return renderFormField(field);
                      })}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              template.fields.map((field) => renderFormField(field))
            )}
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
