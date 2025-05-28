
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
import { Accordion, AccordionItem, AccordionContent } from '@/components/ui/accordion';
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
        // This case should ideally not be reached if all field types are handled
        const exhaustiveCheck: never = field.type;
        console.warn(`Unknown field type: ${exhaustiveCheck}, treating as optional string.`);
        validator = z.string().optional(); // Fallback for unhandled types
        break;
      }
    }
    // Removed required validation logic based on user request for easier testing
    // if (field.required) {
    //     if (field.type === 'text' || field.type === 'textarea' || field.type === 'email') {
    //         validator = validator.min(1, { message: `${field.label} is required.` });
    //     } else if (field.type === 'date') {
    //          validator = validator.min(1, { message: `${field.label} is required.` })
    //                             .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be YYYY-MM-DD' });
    //     }
    // }
    shape[field.id] = validator;
  });
  return z.object(shape);
}

const workOrderSectionStructure: Record<string, string[]> = {
  'Business Details': ['businessName', 'businessAddress', 'businessContactNumber', 'businessEmail', 'businessLogoUrl'],
  'Order Details': ['orderNumber', 'orderDate', 'expectedStartDate', 'expectedEndDate'],
  'Client Details': ['clientName', 'clientPhone', 'clientEmail', 'workLocation', 'orderReceivedBy'],
  'Work Order Specifics': [
    'generalWorkDescription', 'termsOfService', // General fields before accordions
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
    toggleFieldId: 'includeWorkDescriptionTable',
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
            sessionStorage.removeItem(editDataKey); // Clear after loading for edit
        }
      } catch (e) {
        console.error('Failed to parse edit data from session storage:', e);
      }
    }

    // Set defaults for fields not in stored data or for new forms
    template.fields.forEach(field => {
        if (initialValues[field.id] === undefined) { // Only set if not already populated by edit data
            if (field.type === 'date' && field.defaultValue === undefined) {
                initialValues[field.id] = new Date().toISOString().split('T')[0]; // Default to current date
            } else if (field.defaultValue !== undefined) {
                initialValues[field.id] = field.defaultValue;
            } else if (field.type === 'boolean') {
                 initialValues[field.id] = false; // Default booleans to false if no other default
            } else if (field.type === 'number') {
                 initialValues[field.id] = undefined; // So placeholder shows, or can be `null`
            } else if (field.type === 'file'){
                 initialValues[field.id] = undefined; // File inputs are uncontrolled initially
            }
            else {
                 initialValues[field.id] = ''; // Default other types to empty string
            }
        } else if (field.type === 'date' && initialValues[field.id]) {
            // Ensure dates from storage are in YYYY-MM-DD format
            try {
                const dateObj = new Date(initialValues[field.id]);
                if (!isNaN(dateObj.getTime())) {
                    initialValues[field.id] = dateObj.toISOString().split('T')[0];
                } else { // If stored date is invalid, default to current date
                    initialValues[field.id] = new Date().toISOString().split('T')[0];
                }
            } catch (e) { // If parsing stored date fails, default to current date
                initialValues[field.id] = new Date().toISOString().split('T')[0];
            }
        } else if (field.type === 'number' && (initialValues[field.id] === null || initialValues[field.id] === '')) {
            // Ensure numbers are treated as undefined if empty/null for placeholder visibility
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

    // Initialize logo field in submissionValues if it's part of the template
    if (logoFieldId && submissionValues[logoFieldId] === undefined) {
        submissionValues[logoFieldId] = ''; // Default to empty string
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
                submissionValues[logoFieldId] = ''; // Reset on validation failure
            } else if (file.size > MAX_FILE_SIZE) {
                toast({
                    variant: "destructive",
                    title: "File Too Large",
                    description: `Please upload an image smaller than 5MB. Yours is ${(file.size / (1024*1024)).toFixed(2)}MB.`,
                });
                submissionValues[logoFieldId] = ''; // Reset on validation failure
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
                    submissionValues[logoFieldId] = dataUri; // Set data URI on success
                } catch (error: any) {
                    console.error("CRITICAL: Error converting file to data URI:", error);
                    toast({
                        variant: "destructive",
                        title: "Logo Upload Failed",
                        description: `Error converting file: ${error.message || 'Unknown error'}. Please try again or skip logo.`,
                    });
                    submissionValues[logoFieldId] = ''; // Reset on conversion failure
                }
            }
        } else if (typeof logoFileValue === 'string' && logoFileValue.startsWith('data:image')) {
            // If it's already a data URI (e.g., from edit flow), keep it
            submissionValues[logoFieldId] = logoFileValue;
        } else if (logoFileValue && !(logoFileValue instanceof FileList)) {
             // Handle unexpected logoFileValue type
             toast({
                variant: "destructive",
                title: "Invalid Logo Input",
                description: "The logo data was not recognized. Please re-upload if you wish to change it."
             });
             submissionValues[logoFieldId] = ''; // Reset
        }
        // If logoFileValue is undefined or an empty FileList, submissionValues[logoFieldId] remains as initialized (empty string or previous data URI)
    } else if (logoFieldId && typeof values[logoFieldId] === 'string' && (values[logoFieldId] as string).startsWith('data:image')) {
        // This handles case where initial value was a dataURI and no new file was selected.
        submissionValues[logoFieldId] = values[logoFieldId];
    } else if (logoFieldId && !submissionValues[logoFieldId]) {
        // If it's still falsy here (e.g. undefined, null from form state but not explicitly cleared by FileList check)
        submissionValues[logoFieldId] = '';
    }


    // Ensure all fields defined in the template have a value in submissionValues
    // (e.g. for boolean fields that might be undefined if not touched)
    template.fields.forEach(field => {
        if (submissionValues[field.id] === undefined) {
            if (field.type === 'boolean') {
                submissionValues[field.id] = field.defaultValue !== undefined ? field.defaultValue : false;
            } else if (field.id !== logoFieldId) { // Avoid overwriting logo if already processed
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
    const value = (field.type === 'number' && (formFieldControllerProps.value === undefined || formFieldControllerProps.value === null)) ? '' : formFieldControllerProps.value;

    switch (field.type) {
      case 'textarea': {
        return <Textarea placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} rows={field.rows || 5} />;
      }
      case 'number': {
        return <Input type="number" placeholder={field.placeholder} {...formFieldControllerProps} value={value} step="any" />;
      }
      case 'date': {
        // Ensure date is in YYYY-MM-DD, handling potential Date objects or malformed strings
        let dateValue = formFieldControllerProps.value || '';
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
        // For 'file' type, react-hook-form handles FileList. We don't set 'value' directly.
        // The `form.register` or `Controller` handles the file input.
        // We only need to ensure the onChange properly gives the FileList to RHF.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { value: fileValue, onChange: onFileChange, ...restFileProps } = formFieldControllerProps;
        return (
          <Input
            type="file"
            accept="image/*" // Example: only accept images
            onChange={(e) => onFileChange(e.target.files)} // Pass FileList to RHF
            {...restFileProps} // Pass other props like name, ref, onBlur
            className="pt-2" // Example styling
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
                id={field.id} // Ensure id is passed for label association
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
        // Fallback for any unhandled field types to prevent crashes.
        // This part should ideally not be reached if all types in TemplateField are covered.
        const exhaustiveCheck: never = field.type; // This will cause a type error if a case is missed
        console.warn(`Unhandled field type in renderField: ${exhaustiveCheck}`);
        return <Input type="text" placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} />;
      }
    }
  };

  const renderFormField = (field: TemplateField | undefined) => {
    if (!field) return null;
    // Do not render toggle fields directly here if they are part of an accordion header
    if (template.id === 'work-order' && workOrderAccordionSubSections.some(s => s.toggleFieldId === field.id)) {
        return null; // These are rendered inside AccordionPrimitive.Header
    }

    return (
        <FormField
        key={field.id}
        control={form.control}
        name={field.id as keyof z.infer<typeof formSchema>} // Cast to keyof schema
        render={({ field: formHookFieldRenderProps }) => (
            // Special rendering for boolean to integrate label with checkbox better by default
            field.type === 'boolean' ? renderField(field, formHookFieldRenderProps) :
            <FormItem>
            <FormLabel className="font-semibold text-foreground/90">{field.label}</FormLabel>
            <FormControl>
                {renderField(field, formHookFieldRenderProps)}
            </FormControl>
            {/* Show placeholder as description for types other than textarea, boolean, and file */}
            {field.placeholder && field.type !== 'textarea' && field.type !== 'boolean' && field.type !== 'file' && (
                <FormDescription className="text-xs text-muted-foreground">
                Example: {field.placeholder}
                </FormDescription>
            )}
            {/* For file type, placeholder might be used for instructions */}
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
                  // Special handling for the 'Work Order Specifics' section which contains accordions
                  if (sectionTitle === 'Work Order Specifics') {
                    const generalSpecificFields = ['generalWorkDescription', 'termsOfService'];
                    const financialSpecificFields = ['otherCosts', 'taxRatePercentage', 'approvedByName', 'dateOfApproval'];

                    // Determine default open accordions based on template field defaultValue
                    const defaultAccordionValues = workOrderAccordionSubSections
                        .filter(s => {
                            const toggleFieldDef = template.fields.find(f => f.id === s.toggleFieldId);
                            return toggleFieldDef?.defaultValue === true;
                        })
                        .map(s => s.id);


                    return (
                      <div key={sectionTitle} className="space-y-4 pt-4">
                        <h2 className={`text-xl font-semibold text-primary ${sectionIndex > 0 ? 'mt-8' : 'mt-0'} pb-2 border-b border-border`}>
                          {sectionTitle}
                        </h2>
                        <div className="space-y-4">
                          {/* Render general fields before the accordion block */}
                          {generalSpecificFields.map(fieldId => renderFormField(template.fields.find(f => f.id === fieldId)))}

                          {/* Accordion for toggleable sections */}
                          <Accordion type="multiple" className="w-full space-y-3" defaultValue={defaultAccordionValues}>
                            {workOrderAccordionSubSections.map((accordionSection) => {
                              const toggleField = template.fields.find(f => f.id === accordionSection.toggleFieldId);
                              if (!toggleField || toggleField.type !== 'boolean') return null; // Should be a boolean field

                              return (
                                <AccordionItem value={accordionSection.id} key={accordionSection.id} className="border border-border rounded-md shadow-sm">
                                  <AccordionPrimitive.Header className="flex items-center justify-between w-full p-3 data-[state=open]:border-b">
                                    <AccordionPrimitive.Trigger className="p-0 flex-grow text-left hover:no-underline [&>svg]:hidden">
                                      <span className="text-lg font-semibold text-foreground">{toggleField.label}</span>
                                    </AccordionPrimitive.Trigger>

                                    {/* FormField for the Checkbox toggle, placed as a sibling to the Trigger */}
                                    <FormField
                                      control={form.control}
                                      name={accordionSection.toggleFieldId as any} // Cast needed as toggleFieldId is keyof FormData
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
                                          {/* Optional: Visual description for checkbox */}
                                          {/* <FormDescription className="text-xs text-muted-foreground">{toggleField.placeholder}</FormDescription> */}
                                        </FormItem>
                                      )}
                                    />
                                  </AccordionPrimitive.Header>
                                  <AccordionContent className="pt-4 px-3 pb-3 space-y-4">
                                    {/* Render content fields for this accordion section */}
                                    {accordionSection.contentFieldIds.map(fieldId =>
                                      renderFormField(template.fields.find(f => f.id === fieldId))
                                    )}
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })}
                          </Accordion>

                          {/* Render financial and approval fields after the accordion block */}
                          {financialSpecificFields.map(fieldId => renderFormField(template.fields.find(f => f.id === fieldId)))}
                        </div>
                      </div>
                    );
                  } else {
                    // Standard rendering for other sections
                    return (
                      <div key={sectionTitle} className="space-y-4 pt-4">
                        <h2 className={`text-xl font-semibold text-primary ${sectionIndex > 0 ? 'mt-8' : 'mt-0'} pb-2 border-b border-border`}>
                          {sectionTitle}
                        </h2>
                        <div className="space-y-4">
                          {fieldIdsInSection.map(fieldId => {
                            const field = template.fields.find(f => f.id === fieldId);
                            // Ensure fields within accordions are not rendered again here
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
              // Default rendering for templates other than 'work-order'
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

