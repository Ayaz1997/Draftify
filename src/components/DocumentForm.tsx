
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
import React, { useCallback } from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import * as AccordionPrimitive from "@radix-ui/react-accordion";

interface DocumentFormProps {
  template: DocumentFormPropsTemplate;
}

function createZodSchema(fields: TemplateField[]): z.ZodObject<any, any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  fields.forEach((field) => {
    let validator: z.ZodTypeAny;
    switch (field.type) {
      case 'email': {
        validator = z.string().email({ message: 'Invalid email address' }).optional().or(z.literal(''));
        break;
      }
      case 'number': {
        validator = z.coerce.number({ invalid_type_error: 'Must be a number' }).optional().nullable();
        break;
      }
      case 'date': {
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
        validator = z.any().optional();
        break;
      }
      case 'text': {
        validator = z.string().optional();
        break;
      }
      default: {
        // Fallback for any unknown types, treat as optional string
        const exhaustiveCheck: never = field.type; 
        console.warn(`Unknown field type: ${exhaustiveCheck}, treating as optional string.`);
        validator = z.string().optional();
        break;
      }
    }
    if (!field.required) {
        // For optional fields, ensure zod handles empty strings for text-based inputs correctly if needed
        if (field.type === 'text' || field.type === 'textarea' || field.type === 'email' || field.type === 'date') {
            // validator = validator.or(z.literal(''));
        } else if (field.type === 'number') {
            // validator = validator.nullable(); // already handled by coerce.number().optional().nullable()
        }
    } else {
        // Add non-empty checks for required string-like fields, or more specific messages
        if (field.type === 'text' || field.type === 'textarea' || field.type === 'email') {
            validator = validator.min(1, { message: `${field.label} is required.` });
        } else if (field.type === 'date') {
             validator = validator.min(1, { message: `${field.label} is required.` })
                                .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' });
        }
        // Required numbers, booleans, files are intrinsically handled by their presence or Zod's base types
    }
    shape[field.id] = validator;
  });
  return z.object(shape);
}

const workOrderSectionStructure: Record<string, string[]> = {
  'Business Details': ['businessName', 'businessAddress', 'businessContactNumber', 'businessEmail', 'businessLogoUrl'],
  'Order Details': ['orderNumber', 'orderDate', 'expectedStartDate', 'expectedEndDate'],
  'Client Details': ['clientName', 'clientPhone', 'clientEmail', 'workLocation', 'orderReceivedBy'],
  'Work Order Specifics': [ 
    'generalWorkDescription', 'termsOfService', // General fields
    // Accordion toggle fields are handled by workOrderAccordionSubSections
    'includeWorkDescriptionTable', 'includeMaterialTable', 'includeLaborTable',
    // Fields within accordions are also handled by workOrderAccordionSubSections
    // Financial and approval fields after accordions:
    'otherCosts', 'taxRatePercentage', 'approvedByName', 'dateOfApproval'
  ]
};

interface AccordionSectionConfig {
  id: string; // for AccordionItem value
  toggleFieldId: keyof FormData; // e.g., 'includeWorkDescriptionTable'
  contentFieldIds: Array<keyof FormData>;
}

const workOrderAccordionSubSections: AccordionSectionConfig[] = [
  {
    id: 'work-items-accordion',
    toggleFieldId: 'includeWorkDescriptionTable', // Label comes from this field's definition
    contentFieldIds: [
      'workItem1Description', 'workItem1Area', 'workItem1Rate',
      'workItem2Description', 'workItem2Area', 'workItem2Rate',
      'workItem3Description', 'workItem3Area', 'workItem3Rate',
    ],
  },
  {
    id: 'materials-accordion',
    toggleFieldId: 'includeMaterialTable',
    contentFieldIds: [
      'materialItem1Name', 'materialItem1Unit', 'materialItem1Quantity', 'materialItem1PricePerUnit',
      'materialItem2Name', 'materialItem2Unit', 'materialItem2Quantity', 'materialItem2PricePerUnit',
      'materialItem3Name', 'materialItem3Unit', 'materialItem3Quantity', 'materialItem3PricePerUnit',
    ],
  },
  {
    id: 'labour-charges-accordion',
    toggleFieldId: 'includeLaborTable',
    contentFieldIds: [
      'laborItem1TeamName', 'laborItem1NumPersons', 'laborItem1Amount',
      'laborItem2TeamName', 'laborItem2NumPersons', 'laborItem2Amount',
      'laborItem3TeamName', 'laborItem3NumPersons', 'laborItem3Amount',
    ],
  },
];


export function DocumentForm({ template }: DocumentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const getInitialValues = useCallback(() => {
    const editDataKey = `docuFormEditData-${template.id}`;
    const storedEditDataString = typeof window !== 'undefined' ? sessionStorage.getItem(editDataKey) : null;

    let initialValues: Record<string, any> = {};

    if (storedEditDataString) {
      try {
        const parsedData = JSON.parse(storedEditDataString);
        initialValues = { ...parsedData }; 
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(editDataKey);
        }
      } catch (e) {
        console.error('Failed to parse edit data from session storage:', e);
      }
    }

    template.fields.forEach(field => {
        if (initialValues[field.id] === undefined) { 
            if (field.type === 'date' && field.defaultValue === undefined) {
                initialValues[field.id] = new Date().toISOString().split('T')[0];
            } else if (field.defaultValue !== undefined) {
                initialValues[field.id] = field.defaultValue;
            } else if (field.type === 'boolean') {
                 initialValues[field.id] = false; 
            } else if (field.type === 'number') {
                 initialValues[field.id] = undefined; // So placeholder shows
            } else if (field.type === 'file'){
                 initialValues[field.id] = undefined; 
            }
            else {
                 initialValues[field.id] = ''; 
            }
        } else if (field.type === 'date' && initialValues[field.id]) {
            try {
                // Ensure stored date string is valid and format it to YYYY-MM-DD
                const dateObj = new Date(initialValues[field.id]);
                if (!isNaN(dateObj.getTime())) {
                    initialValues[field.id] = dateObj.toISOString().split('T')[0];
                } else { // Fallback if stored date is invalid
                    initialValues[field.id] = new Date().toISOString().split('T')[0];
                }
            } catch (e) { // Fallback on any parsing error
                initialValues[field.id] = new Date().toISOString().split('T')[0];
            }
        } else if (field.type === 'number' && (initialValues[field.id] === null || initialValues[field.id] === '')) {
            // Ensure numbers are numbers or undefined for react-hook-form
            initialValues[field.id] = undefined;
        }
    });
    return initialValues;
  }, [template.id, template.fields]);

  const formSchema = createZodSchema(template.fields);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialValues(),
  });

 const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const submissionValues: Record<string, any> = { ...values };
    const logoField = template.fields.find(f => f.id === 'businessLogoUrl' && f.type === 'file');
    const logoFieldId = logoField?.id;

    // Initialize logo field in submissionValues if it exists in template
    if (logoFieldId) {
        // submissionValues[logoFieldId] will be either from 'values' (if already a data URI) or handled below
        if (values[logoFieldId] === undefined || !(typeof values[logoFieldId] === 'string' && (values[logoFieldId] as string).startsWith('data:image')) ) {
          submissionValues[logoFieldId] = ''; // Default to empty string if no pre-existing data URI
        }
    }
    
    if (logoFieldId && values[logoFieldId]) {
        const logoFileValue = values[logoFieldId];

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
                submissionValues[logoFieldId] = ''; // Explicitly set to empty on error
            } else if (file.size > MAX_FILE_SIZE) {
                toast({
                    variant: "destructive",
                    title: "File Too Large",
                    description: `Please upload an image smaller than 5MB. Yours is ${(file.size / (1024*1024)).toFixed(2)}MB.`,
                });
                submissionValues[logoFieldId] = ''; // Explicitly set to empty on error
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
                    submissionValues[logoFieldId] = dataUri;
                } catch (error: any) {
                    console.error("CRITICAL: Error converting file to data URI:", error);
                    toast({
                        variant: "destructive",
                        title: "Logo Upload Failed",
                        description: `Error converting file: ${error.message || 'Unknown error'}. Please try again or skip logo.`,
                    });
                    submissionValues[logoFieldId] = ''; // Explicitly set to empty on error
                }
            }
        } else if (typeof logoFileValue === 'string' && logoFileValue.startsWith('data:image')) {
            // It's an existing data URI (e.g., from edit mode), keep it
            submissionValues[logoFieldId] = logoFileValue;
        } else if (logoFileValue && !(logoFileValue instanceof FileList)) { // Catch other invalid types for new upload
             toast({
                variant: "destructive",
                title: "Invalid Logo Input",
                description: "The logo data was not recognized. Please re-upload if you wish to change it."
             });
             submissionValues[logoFieldId] = ''; // Explicitly set to empty
        }
        // If logoFileValue was FileList but empty, or undefined/null, submissionValues[logoFieldId] remains (or was set to) ''
    } else if (logoFieldId && typeof values[logoFieldId] === 'string' && (values[logoFieldId] as string).startsWith('data:image')) {
        // Case where values already contained a valid data URI (e.g. from editing an entry that had a logo)
        submissionValues[logoFieldId] = values[logoFieldId];
    } else if (logoFieldId && !submissionValues[logoFieldId]) {
        // If it's a logo field and after all checks it's still not set (e.g. was never in values, or was FileList but empty)
        submissionValues[logoFieldId] = '';
    }


    template.fields.forEach(field => {
        // Ensure all fields have a defined value, defaulting appropriately if undefined after spread
        if (submissionValues[field.id] === undefined) {
            if (field.type === 'boolean') {
                submissionValues[field.id] = field.defaultValue !== undefined ? field.defaultValue : false;
            } else if (field.id !== logoFieldId) { // Non-logo fields
                 submissionValues[field.id] = field.defaultValue !== undefined ? field.defaultValue : (field.type === 'number' ? null : '');
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
    // For number fields, if value is undefined or null, pass empty string to input to show placeholder
    const value = (field.type === 'number' && (formFieldControllerProps.value === undefined || formFieldControllerProps.value === null)) ? '' : formFieldControllerProps.value;

    switch (field.type) {
      case 'textarea': {
        return <Textarea placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} rows={field.rows || 5} />;
      }
      case 'number': {
        // Pass the transformed value to the input
        return <Input type="number" placeholder={field.placeholder} {...formFieldControllerProps} value={value} step="any" />;
      }
      case 'date': {
        let dateValue = formFieldControllerProps.value || '';
        // Ensure dateValue is in 'YYYY-MM-DD' if it's a valid date string but not in that format
        if (dateValue && typeof dateValue === 'string' && !dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            try {
                const parsed = new Date(dateValue);
                if(!isNaN(parsed.getTime())) dateValue = parsed.toISOString().split('T')[0];
                else dateValue = ''; // Invalid date, clear it
            } catch {
                dateValue = ''; // Error parsing, clear it
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
            onChange={(e) => onFileChange(e.target.files)} // Pass FileList to RHF
            {...restFileProps} // RHF props like name, ref, onBlur
            className="pt-2" // Example custom styling
          />
        );
      }
      case 'boolean': {
        return (
          <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2">
            <FormControl>
              <Checkbox
                checked={formFieldControllerProps.value || false} 
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
        // Ensure all cases are handled, or provide a default
        const exhaustiveCheck: never = field.type;
        console.warn(`Unhandled field type in renderField: ${exhaustiveCheck}`);
        return <Input type="text" placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} />;
      }
    }
  };

  const renderFormField = (field: TemplateField | undefined) => {
    if (!field) return null;
    // For boolean fields that are part of an accordion trigger, they are rendered differently
    if (template.id === 'work-order' && workOrderAccordionSubSections.some(s => s.toggleFieldId === field.id)) {
        return null; // Will be rendered inside AccordionTrigger
    }

    return (
        <FormField
        key={field.id}
        control={form.control}
        name={field.id as keyof z.infer<typeof formSchema>} 
        render={({ field: formHookFieldRenderProps }) => (
            // Boolean fields not part of accordions are rendered standalone
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
            {field.type === 'file' && field.placeholder && ( // Specific placeholder for file inputs
                <FormDescription className="text-xs text-muted-foreground">
                {field.placeholder}
                </FormDescription>
            )}
            <FormMessage />
            </FormItem>
        )}
        />
    );
  };


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
                {Object.entries(workOrderSectionStructure).map(([sectionTitle, fieldIdsInSection], sectionIndex) => {
                  if (sectionTitle === 'Work Order Specifics') {
                    const generalSpecificFields = ['generalWorkDescription', 'termsOfService'];
                    const financialSpecificFields = ['otherCosts', 'taxRatePercentage', 'approvedByName', 'dateOfApproval'];
                    
                    const defaultAccordionValues = workOrderAccordionSubSections.map(s => s.id);


                    return (
                      <div key={sectionTitle} className="space-y-4 pt-4">
                        <h2 className={`text-xl font-semibold text-primary ${sectionIndex > 0 ? 'mt-8' : 'mt-0'} pb-2 border-b border-border`}>
                          {sectionTitle}
                        </h2>
                        <div className="space-y-4">
                          {generalSpecificFields.map(fieldId => renderFormField(template.fields.find(f => f.id === fieldId)))}

                          <Accordion type="multiple" collapsible className="w-full space-y-3" defaultValue={defaultAccordionValues}>
                            {workOrderAccordionSubSections.map((accordionSection) => {
                              const toggleField = template.fields.find(f => f.id === accordionSection.toggleFieldId);
                              if (!toggleField || toggleField.type !== 'boolean') return null;
                              
                              return (
                                <AccordionItem value={accordionSection.id} key={accordionSection.id} className="border border-border rounded-md shadow-sm">
                                  <AccordionPrimitive.Header className="flex items-center justify-between w-full p-3 data-[state=open]:border-b">
                                    <AccordionTrigger className="p-0 flex-grow text-left hover:no-underline [&>svg]:hidden">
                                      <span className="text-lg font-semibold text-foreground">{toggleField.label}</span>
                                    </AccordionTrigger>
                                    
                                    <FormField
                                      control={form.control}
                                      name={accordionSection.toggleFieldId as any}
                                      render={({ field: checkboxCtrl }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 pl-4">
                                          <FormControl>
                                            <Checkbox
                                              checked={checkboxCtrl.value}
                                              onCheckedChange={checkboxCtrl.onChange}
                                              id={checkboxCtrl.name}
                                              aria-label={toggleField.placeholder || `Toggle ${toggleField.label} section visibility in preview`}
                                            />
                                          </FormControl>
                                          {/* The placeholder is now an aria-label, visual description can be added here if needed */}
                                          {/* <FormDescription className="text-xs text-muted-foreground">{toggleField.placeholder}</FormDescription> */}
                                        </FormItem>
                                      )}
                                    />
                                  </AccordionPrimitive.Header>
                                  <AccordionContent className="pt-4 px-3 pb-3 space-y-4">
                                    {accordionSection.contentFieldIds.map(fieldId =>
                                      renderFormField(template.fields.find(f => f.id === fieldId))
                                    )}
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })}
                          </Accordion>

                          {financialSpecificFields.map(fieldId => renderFormField(template.fields.find(f => f.id === fieldId)))}
                        </div>
                      </div>
                    );
                  } else {
                    // Render other main sections as before
                    return (
                      <div key={sectionTitle} className="space-y-4 pt-4">
                        <h2 className={`text-xl font-semibold text-primary ${sectionIndex > 0 ? 'mt-8' : 'mt-0'} pb-2 border-b border-border`}>
                          {sectionTitle}
                        </h2>
                        <div className="space-y-4">
                          {fieldIdsInSection.map(fieldId => {
                            const field = template.fields.find(f => f.id === fieldId);
                            // Ensure fields part of accordions are not rendered again here
                            if (!field || workOrderAccordionSubSections.some(s => s.contentFieldIds.includes(fieldId as keyof FormData) || s.toggleFieldId === fieldId)) {
                                return null;
                            }
                            return renderFormField(field);
                          })}
                        </div>
                      </div>
                    );
                  }
                })}
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
