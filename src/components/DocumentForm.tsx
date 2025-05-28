
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
import React, { useCallback, useMemo } from 'react';
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger as CustomAccordionTrigger } from '@/components/ui/accordion';
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
        // For numbers, ensure they are treated as numbers or undefined/null.
        // zod.coerce.number will attempt to convert strings to numbers.
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
        const exhaustiveCheck: never = field.type;
        console.warn(`Unknown field type: ${exhaustiveCheck}, treating as optional string.`);
        validator = z.string().optional();
        break;
      }
    }
    if (!field.required) {
      // No change needed here as most validators are already optional or allow empty strings/null
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
    'generalWorkDescription', 'termsOfService',
    // Toggles are part of this section but rendered in Accordion Headers
    // Item fields are handled dynamically within accordions, not listed here directly
    'otherCosts', 'taxRatePercentage', 'approvedByName', 'dateOfApproval'
  ]
};

interface AccordionSectionConfig {
  id: string; 
  toggleFieldId: keyof FormData; 
  itemFieldIdPatterns: { 
    description?: string; 
    area?: string;
    rate?: string;
    unit?: string;
    quantity?: string;
    pricePerUnit?: string;
    numPersons?: string;
    amount?: string;
  }
}

const workOrderAccordionSubSections: AccordionSectionConfig[] = [
  {
    id: 'work-items-accordion',
    toggleFieldId: 'includeWorkDescriptionTable',
    itemFieldIdPatterns: {
      description: 'workItem#Description',
      area: 'workItem#Area',
      rate: 'workItem#Rate'
    },
  },
  {
    id: 'materials-accordion',
    toggleFieldId: 'includeMaterialTable',
    itemFieldIdPatterns: {
      description: 'materialItem#Name',
      unit: 'materialItem#Unit',
      quantity: 'materialItem#Quantity',
      pricePerUnit: 'materialItem#PricePerUnit',
    }
  },
  {
    id: 'labour-charges-accordion',
    toggleFieldId: 'includeLaborTable',
    itemFieldIdPatterns: {
      description: 'laborItem#TeamName',
      numPersons: 'laborItem#NumPersons',
      amount: 'laborItem#Amount',
    }
  },
];


export function DocumentForm({ template }: DocumentFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const getInitialValues = useCallback(() => {
    const editDataKey = `docuFormEditData-${template.id}`;
    const storedEditDataString = typeof window !== 'undefined' ? sessionStorage.getItem(editDataKey) : null;

    let resolvedInitialValues: Record<string, any> = {};

    if (storedEditDataString) {
      try {
        const parsedData = JSON.parse(storedEditDataString);
        resolvedInitialValues = { ...parsedData }; // Spread to create a mutable copy
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(editDataKey); 
        }
      } catch (e) {
        console.error('Failed to parse edit data from session storage:', e);
        // Fall through to default initialization if parsing fails
      }
    }

    // Ensure all template fields have an initial value
    template.fields.forEach(field => {
        // If value already exists (from edit data), ensure its type is correct or convert
        if (resolvedInitialValues[field.id] !== undefined) {
            if (field.type === 'date' && resolvedInitialValues[field.id]) {
                try {
                    const dateObj = new Date(resolvedInitialValues[field.id]);
                    if (!isNaN(dateObj.getTime())) {
                        resolvedInitialValues[field.id] = dateObj.toISOString().split('T')[0];
                    } else { // Invalid date string from storage
                        resolvedInitialValues[field.id] = new Date().toISOString().split('T')[0];
                    }
                } catch (e) { // Error parsing date
                    resolvedInitialValues[field.id] = new Date().toISOString().split('T')[0];
                }
            } else if (field.type === 'number' && (resolvedInitialValues[field.id] === null || resolvedInitialValues[field.id] === '')) {
                resolvedInitialValues[field.id] = undefined; // Ensure numbers are numbers or undefined for react-hook-form
            } else if (field.type === 'number' && typeof resolvedInitialValues[field.id] === 'string') {
                 const numVal = parseFloat(resolvedInitialValues[field.id]);
                 resolvedInitialValues[field.id] = isNaN(numVal) ? undefined : numVal;
            }
            // Booleans, text, textarea, email, file should be fine as they are or will be handled by form
        } else { // Value does not exist in edit data, set default
            if (field.type === 'date') {
                resolvedInitialValues[field.id] = field.defaultValue && typeof field.defaultValue === 'string' && field.defaultValue.match(/^\d{4}-\d{2}-\d{2}$/) 
                    ? field.defaultValue 
                    : new Date().toISOString().split('T')[0];
            } else if (field.defaultValue !== undefined) {
                resolvedInitialValues[field.id] = field.defaultValue;
            } else if (field.type === 'boolean') {
                 resolvedInitialValues[field.id] = false; // Default for booleans if no defaultValue
            } else if (field.type === 'number') {
                 resolvedInitialValues[field.id] = undefined; // Default for numbers
            } else if (field.type === 'file'){
                 resolvedInitialValues[field.id] = undefined; // No default for files
            }
            else { // text, textarea, email
                 resolvedInitialValues[field.id] = ''; // Default for text-based inputs
            }
        }
    });
    return resolvedInitialValues;
  }, [template.id, template.fields]);
  
  const currentInitialValues = useMemo(() => getInitialValues(), [getInitialValues]);

  const formSchema = createZodSchema(template.fields);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: currentInitialValues,
  });

 const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Create a mutable copy for processing, especially for the file field
    const submissionValues: Record<string, any> = { ...values };

    const logoField = template.fields.find(f => f.id === 'businessLogoUrl' && f.type === 'file');
    const logoFieldId = logoField?.id;

    // Initialize logo field in submissionValues if it exists in template
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
                submissionValues[logoFieldId] = ''; // Reset on error
            } else if (file.size > MAX_FILE_SIZE) {
                toast({
                    variant: "destructive",
                    title: "File Too Large",
                    description: `Please upload an image smaller than 5MB. Yours is ${(file.size / (1024*1024)).toFixed(2)}MB.`,
                });
                submissionValues[logoFieldId] = ''; // Reset on error
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
                            console.error("CRITICAL: FileReader error:", error);
                            reject(error); // Ensure promise rejection on error
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
                    submissionValues[logoFieldId] = ''; // Reset on error
                }
            }
        } else if (typeof logoFileValue === 'string' && logoFileValue.startsWith('data:image')) {
            // If it's already a data URI (e.g., from edit mode), keep it
            submissionValues[logoFieldId] = logoFileValue;
        } else if (logoFileValue && !(logoFileValue instanceof FileList)) {
             // This case might occur if the field was somehow set to something unexpected
             console.warn("Unexpected value type for logo field:", logoFileValue);
             toast({
                variant: "destructive",
                title: "Invalid Logo Input",
                description: "The logo data was not recognized. Please re-upload if you wish to change it."
             });
             submissionValues[logoFieldId] = ''; // Reset
        }
        // If logoFileValue is an empty FileList or undefined, submissionValues[logoFieldId] will retain its initial value or become ''
    } else if (logoFieldId && typeof values[logoFieldId] === 'string' && (values[logoFieldId] as string).startsWith('data:image')) {
        // Persist existing data URI if no new file is uploaded
        submissionValues[logoFieldId] = values[logoFieldId];
    } else if (logoFieldId && !submissionValues[logoFieldId]) {
        // If no file uploaded and no existing data URI, ensure it's an empty string
        submissionValues[logoFieldId] = '';
    }


    // Ensure all fields defined in the template have a value in submissionValues,
    // defaulting to empty string, false for boolean, or null for number if not already set
    template.fields.forEach(field => {
        if (submissionValues[field.id] === undefined) {
            if (field.type === 'boolean') {
                submissionValues[field.id] = field.defaultValue !== undefined ? field.defaultValue : false;
            } else if (field.id !== logoFieldId) { // Avoid overwriting already processed logo
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
    // For number fields, if value is undefined or null, pass '' to input to avoid React warnings for uncontrolled->controlled.
    const value = (field.type === 'number' && (formFieldControllerProps.value === undefined || formFieldControllerProps.value === null)) ? '' : formFieldControllerProps.value;

    switch (field.type) {
      case 'textarea': {
        return <Textarea placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} rows={field.rows || 5} />;
      }
      case 'number': {
        // Pass the potentially modified 'value' here
        return <Input type="number" placeholder={field.placeholder} {...formFieldControllerProps} value={value} step="any" />;
      }
      case 'date': {
        // Ensure date is in YYYY-MM-DD format for the input
        let dateValue = formFieldControllerProps.value || '';
        if (dateValue && typeof dateValue === 'string' && !dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Attempt to parse and reformat if not in YYYY-MM-DD
            try {
                const parsed = new Date(dateValue);
                if(!isNaN(parsed.getTime())) dateValue = parsed.toISOString().split('T')[0];
                else dateValue = ''; // Fallback to empty if parse fails
            } catch {
                dateValue = ''; // Fallback to empty on error
            }
        }
        return <Input type="date" placeholder={field.placeholder} {...formFieldControllerProps} value={dateValue} />;
      }
      case 'email': {
        return <Input type="email" placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} />;
      }
      case 'file': {
        // For file inputs, react-hook-form handles the FileList object.
        // We don't set 'value' directly. 'onChange' will pass e.target.files.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { value: fileValue, onChange: onFileChange, ...restFileProps } = formFieldControllerProps;
        return (
          <Input
            type="file"
            accept="image/*" // Only accept image files
            onChange={(e) => onFileChange(e.target.files)} // Pass FileList to RHF
            {...restFileProps} // Pass other RHF props like name, ref, onBlur
            className="pt-2" // Some padding for aesthetics
          />
        );
      }
      case 'boolean': {
        // Checkbox is a controlled component, value should be boolean
        return (
          <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2">
            <FormControl>
              <Checkbox
                checked={formFieldControllerProps.value || false}
                onCheckedChange={formFieldControllerProps.onChange}
                id={field.id} // Ensure ID is set for label association
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel htmlFor={field.id} className="font-normal"> {/* Associate label with checkbox via htmlFor */}
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
        const exhaustiveCheck: never = field.type; // Should not happen with defined types
        console.warn(`Unhandled field type in renderField: ${exhaustiveCheck}`);
        return <Input type="text" placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} />;
      }
    }
  };

  const renderFormField = (field: TemplateField | undefined) => {
    if (!field) return null;
    // // THE FOLLOWING CHECKS ARE REMOVED TO SIMPLIFY AND RELY ON CALLER'S FILTERING
    // // Check if the field is a toggle for an accordion section
    // if (template.id === 'work-order' && workOrderAccordionSubSections.some(s => s.toggleFieldId === field.id)) {
    //     return null;
    // }
    // // Check if the field is one of the item fields within an accordion section
    // if (template.id === 'work-order' && workOrderAccordionSubSections.some(accSection =>
    //     Object.values(accSection.itemFieldIdPatterns).some(pattern => {
    //         if(!pattern) return false;
    //         return pattern.replace('#', '1') === field.id ||
    //                pattern.replace('#', '2') === field.id ||
    //                pattern.replace('#', '3') === field.id;
    //     })
    // )) {
    //     return null;
    // }

    return (
        <FormField
        key={field.id}
        control={form.control}
        name={field.id as keyof z.infer<typeof formSchema>} // Cast to ensure type safety with Zod schema
        render={({ field: formHookFieldRenderProps }) => (
            // Special rendering for boolean (checkbox with label beside it)
            field.type === 'boolean' ? renderField(field, formHookFieldRenderProps) :
            // Standard layout for other field types
            <FormItem>
            <FormLabel className="font-semibold text-foreground/90">{field.label}</FormLabel>
            <FormControl>
                {renderField(field, formHookFieldRenderProps)}
            </FormControl>
            {field.placeholder && field.type !== 'textarea' && field.type !== 'boolean' && field.type !== 'file' && ( // Avoid duplicate placeholder for textarea/boolean/file
                <FormDescription className="text-xs text-muted-foreground">
                Example: {field.placeholder}
                </FormDescription>
            )}
            {field.type === 'file' && field.placeholder && ( // Specific handling for file placeholder
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

                    const defaultAccordionValues = workOrderAccordionSubSections
                        .filter(s => {
                            const toggleFieldDef = template.fields.find(f => f.id === s.toggleFieldId);
                            // Check if the field was defaulted to true in currentInitialValues or in template definition
                            return currentInitialValues[s.toggleFieldId as string] === true || toggleFieldDef?.defaultValue === true;
                        })
                        .map(s => s.id);

                    return (
                      <div key={sectionTitle} className="space-y-4 pt-4">
                        <h2 className={`text-xl font-semibold text-primary ${sectionIndex > 0 ? 'mt-8' : 'mt-0'} pb-2 border-b border-border`}>
                          {sectionTitle}
                        </h2>
                        <div className="space-y-4">
                          {generalSpecificFields.map(fieldId => renderFormField(template.fields.find(f => f.id === fieldId)))}

                          <Accordion type="multiple" className="w-full space-y-3" defaultValue={defaultAccordionValues}>
                            {workOrderAccordionSubSections.map((accordionSection) => {
                              const toggleField = template.fields.find(f => f.id === accordionSection.toggleFieldId);
                              if (!toggleField || toggleField.type !== 'boolean') return null;

                              return (
                                <AccordionItem value={accordionSection.id} key={accordionSection.id} className="border border-border rounded-md shadow-sm">
                                  <AccordionPrimitive.Header className="flex items-center justify-between w-full p-3 data-[state=open]:border-b">
                                    <AccordionPrimitive.Trigger className="p-0 flex-grow text-left hover:no-underline [&>svg]:hidden">
                                      <span className="text-lg font-semibold text-foreground">{toggleField.label}</span>
                                    </AccordionPrimitive.Trigger>
                                    <FormField
                                      control={form.control}
                                      name={accordionSection.toggleFieldId as any}
                                      render={({ field: checkboxCtrl }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 pl-4"> {/* Removed space-y-0 */}
                                          <FormControl>
                                            <Checkbox
                                              checked={checkboxCtrl.value}
                                              onCheckedChange={checkboxCtrl.onChange}
                                              id={checkboxCtrl.name}
                                              aria-label={toggleField.placeholder || `Toggle ${toggleField.label} section`}
                                            />
                                          </FormControl>
                                          {/* Optional: Label for checkbox if needed, but label is in AccordionTrigger
                                          <FormLabel htmlFor={checkboxCtrl.name} className="font-normal text-sm">
                                            Enable
                                          </FormLabel>
                                          */}
                                        </FormItem>
                                      )}
                                    />
                                  </AccordionPrimitive.Header>
                                  <AccordionContent className="pt-4 px-3 pb-3 space-y-4">
                                    {Array.from({ length: 3 }).map((_, itemIndex) => {
                                      const itemNumber = itemIndex + 1;
                                      const fieldPatterns = accordionSection.itemFieldIdPatterns;
                                      const itemFields: (TemplateField | undefined)[] = [];

                                      // Build the list of field objects for the current item
                                      if (fieldPatterns.description) itemFields.push(template.fields.find(f => f.id === fieldPatterns.description!.replace('#', String(itemNumber))));
                                      if (fieldPatterns.area) itemFields.push(template.fields.find(f => f.id === fieldPatterns.area!.replace('#', String(itemNumber))));
                                      if (fieldPatterns.rate) itemFields.push(template.fields.find(f => f.id === fieldPatterns.rate!.replace('#', String(itemNumber))));
                                      if (fieldPatterns.unit) itemFields.push(template.fields.find(f => f.id === fieldPatterns.unit!.replace('#', String(itemNumber))));
                                      if (fieldPatterns.quantity) itemFields.push(template.fields.find(f => f.id === fieldPatterns.quantity!.replace('#', String(itemNumber))));
                                      if (fieldPatterns.pricePerUnit) itemFields.push(template.fields.find(f => f.id === fieldPatterns.pricePerUnit!.replace('#', String(itemNumber))));
                                      if (fieldPatterns.numPersons) itemFields.push(template.fields.find(f => f.id === fieldPatterns.numPersons!.replace('#', String(itemNumber))));
                                      if (fieldPatterns.amount) itemFields.push(template.fields.find(f => f.id === fieldPatterns.amount!.replace('#', String(itemNumber))));
                                      
                                      const validItemFields = itemFields.filter(Boolean) as TemplateField[];
                                      // Ensure that at least one field was found for this item based on patterns
                                      // and that those fields actually exist in the main template.fields definition
                                      if (validItemFields.length === 0) return null; 
                                      if (!validItemFields.some(vf => template.fields.some(tf => tf.id === vf.id))) return null;


                                      return (
                                        <div key={`${accordionSection.id}-item-${itemNumber}`} className="space-y-4 border-b border-dashed border-border pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                                          {validItemFields.map(field => renderFormField(field))}
                                        </div>
                                      );
                                    })}
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })}
                          </Accordion>
                          {financialSpecificFields.map(fieldId => renderFormField(template.fields.find(f => f.id === fieldId)))}
                        </div>
                      </div>
                    );
                  } else { // For sections other than "Work Order Specifics"
                    return (
                      <div key={sectionTitle} className="space-y-4 pt-4">
                        <h2 className={`text-xl font-semibold text-primary ${sectionIndex > 0 ? 'mt-8' : 'mt-0'} pb-2 border-b border-border`}>
                          {sectionTitle}
                        </h2>
                        <div className="space-y-4">
                        {fieldIdsInSection
                            .map(fieldId => {
                              const field = template.fields.find(f => f.id === fieldId);
                              if (!field) return null; // Field not found in template definition

                              // Check if this field is managed by accordion logic
                              const isToggleField = workOrderAccordionSubSections.some(s => s.toggleFieldId === field.id);
                              const isItemField = workOrderAccordionSubSections.some(accSection =>
                                Object.values(accSection.itemFieldIdPatterns).some(pattern => {
                                  if (!pattern) return false;
                                  return pattern.replace('#', '1') === field.id ||
                                         pattern.replace('#', '2') === field.id ||
                                         pattern.replace('#', '3') === field.id;
                                })
                              );

                              if (isToggleField || isItemField) {
                                return null; // Skip accordion-managed fields here
                              }
                              return field; // This field belongs to the current main section
                            })
                            .filter(field => field !== null) // Remove nulls (skipped fields)
                            .map(field => field ? renderFormField(field) : null) // Render the valid fields
                          }
                        </div>
                      </div>
                    );
                  }
                })}
              </>
            ) : ( // Fallback for templates other than 'work-order'
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

