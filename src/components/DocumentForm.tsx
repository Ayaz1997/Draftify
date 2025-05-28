
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
        // Allow number to be optional and null (for empty input), coerce to number if present
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
        validator = z.any().optional(); // Specific file validation (type, size) handled in onSubmit
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
    shape[field.id] = validator;
  });
  return z.object(shape);
}

const workOrderSectionStructure: Record<string, string[]> = {
  'Business Details': ['businessName', 'businessAddress', 'businessContactNumber', 'businessEmail', 'businessLogoUrl'],
  'Order Details': ['orderNumber', 'orderDate', 'expectedStartDate', 'expectedEndDate'],
  'Client Details': ['clientName', 'clientPhone', 'clientEmail', 'workLocation', 'orderReceivedBy'],
  'Work Order Specifics': [ // This list is used to find fields for "Work Order Specifics" *before* the accordion structure
    'generalWorkDescription', 'termsOfService',
    // Toggle fields (will be handled by accordion logic, but listed here for completeness of the section)
    'includeWorkDescriptionTable', 'includeMaterialTable', 'includeLaborTable',
    // Item fields (will be handled by accordion logic)
    // ... (item fields are not listed here as they are dynamically generated in accordion)
    // Fields after accordions
    'otherCosts', 'taxRatePercentage', 'approvedByName', 'dateOfApproval'
  ]
};

interface AccordionSectionConfig {
  id: string; // Used as AccordionItem value and key
  toggleFieldId: keyof FormData; // The ID of the boolean field that toggles this section
  itemFieldIdPatterns: { // Patterns to find the fields for each of the 3 items in this section
    description?: string; // e.g., "workItem#Description" where # is 1, 2, or 3
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
        resolvedInitialValues = { ...parsedData };
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(editDataKey); // Clear edit data after loading
        }
      } catch (e) {
        console.error('Failed to parse edit data from session storage:', e);
        // Fall through to default values if parsing fails
      }
    }

    // Set defaults for all fields, respecting stored values if they exist
    template.fields.forEach(field => {
        // If value not already set by edit data, apply defaults
        if (resolvedInitialValues[field.id] === undefined) {
            if (field.type === 'date' && field.defaultValue === undefined) {
                // Default all date fields to current date if no other default is specified
                resolvedInitialValues[field.id] = new Date().toISOString().split('T')[0];
            } else if (field.defaultValue !== undefined) {
                resolvedInitialValues[field.id] = field.defaultValue;
            } else if (field.type === 'boolean') {
                 resolvedInitialValues[field.id] = false; // Default booleans to false if no defaultValue
            } else if (field.type === 'number') {
                 // For numbers, undefined means empty in form, which is fine.
                 // Zod schema handles coercion and optionality.
                 resolvedInitialValues[field.id] = undefined;
            } else if (field.type === 'file'){
                 resolvedInitialValues[field.id] = undefined; // File inputs are initially empty
            }
            else {
                 resolvedInitialValues[field.id] = ''; // Default other types to empty string
            }
        } else if (field.type === 'date' && resolvedInitialValues[field.id]) {
            // Ensure dates from storage are correctly formatted if they exist
            try {
                const dateObj = new Date(resolvedInitialValues[field.id]);
                // Check if date is valid, a simple way is to check if getTime() is not NaN
                if (!isNaN(dateObj.getTime())) {
                    resolvedInitialValues[field.id] = dateObj.toISOString().split('T')[0];
                } else { // If stored date is invalid, default to current date
                    resolvedInitialValues[field.id] = new Date().toISOString().split('T')[0];
                }
            } catch (e) { // If parsing fails for any reason, default to current date
                resolvedInitialValues[field.id] = new Date().toISOString().split('T')[0];
            }
        } else if (field.type === 'number' && (resolvedInitialValues[field.id] === null || resolvedInitialValues[field.id] === '')) {
            // Ensure numbers from storage that were 'null' or empty string are treated as undefined for the form state
            // to allow placeholder to show and prevent '0' from appearing if it was stored as null.
            resolvedInitialValues[field.id] = undefined;
        }
    });
    return resolvedInitialValues;
  }, [template.id, template.fields]);

  // Memoize the result of getInitialValues for useForm and defaultAccordionValues
  const currentInitialValues = useMemo(() => getInitialValues(), [getInitialValues]);

  const formSchema = createZodSchema(template.fields);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: currentInitialValues,
  });

 const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const submissionValues: Record<string, any> = { ...values };

    // Handle file upload for businessLogoUrl if it's a file field
    const logoField = template.fields.find(f => f.id === 'businessLogoUrl' && f.type === 'file');
    const logoFieldId = logoField?.id;

    // Initialize logo field in submissionValues if it exists in template
    if (logoFieldId && submissionValues[logoFieldId] === undefined) {
        submissionValues[logoFieldId] = ''; // Default to empty string if not present in values
    }

    if (logoFieldId && values[logoFieldId]) { // Check if there's any value (FileList or existing string)
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
                submissionValues[logoFieldId] = ''; // Clear on validation fail
            } else if (file.size > MAX_FILE_SIZE) {
                toast({
                    variant: "destructive",
                    title: "File Too Large",
                    description: `Please upload an image smaller than 5MB. Yours is ${(file.size / (1024*1024)).toFixed(2)}MB.`,
                });
                submissionValues[logoFieldId] = ''; // Clear on validation fail
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
                    submissionValues[logoFieldId] = ''; // Clear on processing fail
                }
            }
        } else if (typeof logoFileValue === 'string' && logoFileValue.startsWith('data:image')) {
            // If it's already a data URI (e.g., from edit flow), keep it
            submissionValues[logoFieldId] = logoFileValue;
        } else if (logoFileValue && !(logoFileValue instanceof FileList)) {
             // Handle unexpected type for logoFileValue if it's not FileList or data URI string
             console.warn("Unexpected value type for logo field:", logoFileValue);
             toast({
                variant: "destructive",
                title: "Invalid Logo Input",
                description: "The logo data was not recognized. Please re-upload if you wish to change it, or ensure it's a valid image URL if editing."
             });
             submissionValues[logoFieldId] = ''; // Clear on unexpected type
        }
        // If logoFileValue is undefined or empty FileList, submissionValues[logoFieldId] remains as initially set (empty string or existing data URI)
    } else if (logoFieldId && typeof values[logoFieldId] === 'string' && (values[logoFieldId] as string).startsWith('data:image')) {
        // This case handles when the form is submitted and the logo was already a data URI (e.g. from editing)
        submissionValues[logoFieldId] = values[logoFieldId];
    } else if (logoFieldId && !submissionValues[logoFieldId]) {
        // Ensures if somehow logoFieldId exists but submissionValues[logoFieldId] is falsy (but not empty string), it becomes empty string.
        // This is a fallback, usually covered by initialization.
        submissionValues[logoFieldId] = '';
    }


    // Ensure all fields defined in the template have a value in submissionValues
    // This is important for fields that might not be directly part_of the form's current values object
    // if they were, for example, conditionally rendered or if their Zod schema made them optional
    // and they were never interacted with.
    template.fields.forEach(field => {
        if (submissionValues[field.id] === undefined) {
            // For booleans, if undefined, use defaultValue from template or false.
            if (field.type === 'boolean') {
                submissionValues[field.id] = field.defaultValue !== undefined ? field.defaultValue : false;
            } else if (field.id !== logoFieldId) { // Don't override logo if it was already handled/cleared
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
    // For number fields, if the value is undefined or null, render an empty string in the input.
    // Otherwise, use the value directly. This prevents "NaN" or other issues in number inputs.
    const value = (field.type === 'number' && (formFieldControllerProps.value === undefined || formFieldControllerProps.value === null)) ? '' : formFieldControllerProps.value;

    switch (field.type) {
      case 'textarea': {
        return <Textarea placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} rows={field.rows || 5} />;
      }
      case 'number': {
        // Pass the potentially empty string 'value' to the input
        return <Input type="number" placeholder={field.placeholder} {...formFieldControllerProps} value={value} step="any" />;
      }
      case 'date': {
        // Ensure date value is correctly formatted string for input type="date"
        let dateValue = formFieldControllerProps.value || '';
        if (dateValue && typeof dateValue === 'string' && !dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // If it's not in YYYY-MM-DD, try to parse and format
            try {
                const parsed = new Date(dateValue);
                if(!isNaN(parsed.getTime())) dateValue = parsed.toISOString().split('T')[0];
                else dateValue = ''; // Invalid date, clear it
            } catch {
                dateValue = ''; // Parsing error, clear it
            }
        }
        return <Input type="date" placeholder={field.placeholder} {...formFieldControllerProps} value={dateValue} />;
      }
      case 'email': {
        return <Input type="email" placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} />;
      }
      case 'file': {
        // For file inputs, react-hook-form handles FileList. We don't set 'value' prop on file input.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { value: fileValue, onChange: onFileChange, ...restFileProps } = formFieldControllerProps;
        return (
          <Input
            type="file"
            accept="image/*" // Accept only image files
            onChange={(e) => onFileChange(e.target.files)} // Pass FileList to react-hook-form
            {...restFileProps} // Pass other props like name, onBlur, ref
            className="pt-2" // Add some padding top for better appearance
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
                id={field.id} // Ensure ID is passed for label association
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel htmlFor={field.id} className="font-normal"> {/* Use field.id for htmlFor */}
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
        const exhaustiveCheck: never = field.type; // Ensures all types are handled
        console.warn(`Unhandled field type in renderField: ${exhaustiveCheck}`);
        return <Input type="text" placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} />;
      }
    }
  };

  const renderFormField = (field: TemplateField | undefined) => {
    if (!field) return null;
    // Skip rendering accordion toggle fields directly if they are to be handled by AccordionTrigger's FormField
    if (template.id === 'work-order' && workOrderAccordionSubSections.some(s => s.toggleFieldId === field.id)) {
        return null;
    }
    // Skip rendering accordion item fields directly as they are handled inside the AccordionContent loop
    if (template.id === 'work-order' && workOrderAccordionSubSections.some(accSection =>
        Object.values(accSection.itemFieldIdPatterns).some(pattern => {
            if(!pattern) return false;
            // Check for item 1, 2, or 3
            return pattern.replace('#', '1') === field.id ||
                   pattern.replace('#', '2') === field.id ||
                   pattern.replace('#', '3') === field.id;
        })
    )) {
        return null;
    }


    return (
        <FormField
        key={field.id}
        control={form.control}
        name={field.id as keyof z.infer<typeof formSchema>} // Cast to keyof Zod schema type
        render={({ field: formHookFieldRenderProps }) => (
            // If field type is boolean, renderField handles FormItem internally
            field.type === 'boolean' ? renderField(field, formHookFieldRenderProps) :
            <FormItem>
            <FormLabel className="font-semibold text-foreground/90">{field.label}</FormLabel>
            <FormControl>
                {renderField(field, formHookFieldRenderProps)}
            </FormControl>
            {field.placeholder && field.type !== 'textarea' && field.type !== 'boolean' && field.type !== 'file' && ( // Don't show placeholder as description for textarea, boolean, file
                <FormDescription className="text-xs text-muted-foreground">
                Example: {field.placeholder}
                </FormDescription>
            )}
            {/* Show placeholder as description specifically for file type if it exists */}
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
                  if (sectionTitle === 'Work Order Specifics') {
                    const generalSpecificFields = ['generalWorkDescription', 'termsOfService'];
                    const financialSpecificFields = ['otherCosts', 'taxRatePercentage', 'approvedByName', 'dateOfApproval'];

                    // Determine default open accordion items based on currentInitialValues
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
                                        <FormItem className="flex flex-row items-center space-x-2 pl-4">
                                          <FormControl>
                                            <Checkbox
                                              checked={checkboxCtrl.value}
                                              onCheckedChange={checkboxCtrl.onChange}
                                              id={checkboxCtrl.name}
                                              aria-label={toggleField.placeholder || `Toggle ${toggleField.label} section visibility in preview`}
                                            />
                                          </FormControl>
                                           {/* Optional: If you want the description next to checkbox
                                            <FormLabel htmlFor={checkboxCtrl.name} className="font-normal text-sm text-muted-foreground sr-only">
                                                {toggleField.placeholder || `Toggle ${toggleField.label}`}
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

                                      // Dynamically find fields based on patterns
                                      if (fieldPatterns.description) itemFields.push(template.fields.find(f => f.id === fieldPatterns.description!.replace('#', String(itemNumber))));
                                      if (fieldPatterns.area) itemFields.push(template.fields.find(f => f.id === fieldPatterns.area!.replace('#', String(itemNumber))));
                                      if (fieldPatterns.rate) itemFields.push(template.fields.find(f => f.id === fieldPatterns.rate!.replace('#', String(itemNumber))));
                                      if (fieldPatterns.unit) itemFields.push(template.fields.find(f => f.id === fieldPatterns.unit!.replace('#', String(itemNumber))));
                                      if (fieldPatterns.quantity) itemFields.push(template.fields.find(f => f.id === fieldPatterns.quantity!.replace('#', String(itemNumber))));
                                      if (fieldPatterns.pricePerUnit) itemFields.push(template.fields.find(f => f.id === fieldPatterns.pricePerUnit!.replace('#', String(itemNumber))));
                                      if (fieldPatterns.numPersons) itemFields.push(template.fields.find(f => f.id === fieldPatterns.numPersons!.replace('#', String(itemNumber))));
                                      if (fieldPatterns.amount) itemFields.push(template.fields.find(f => f.id === fieldPatterns.amount!.replace('#', String(itemNumber))));

                                      const validItemFields = itemFields.filter(Boolean) as TemplateField[];
                                      if (validItemFields.length === 0) return null; // Skip if no fields found for this item (e.g. if patterns are incomplete)
                                      // Further check: Ensure at least one of these fields is genuinely defined in the main template.fields
                                      // This prevents rendering empty divs if patterns are there but fields aren't.
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
                  } else { // For other sections like Business Details, Order Details, Client Details
                    return (
                      <div key={sectionTitle} className="space-y-4 pt-4">
                        <h2 className={`text-xl font-semibold text-primary ${sectionIndex > 0 ? 'mt-8' : 'mt-0'} pb-2 border-b border-border`}>
                          {sectionTitle}
                        </h2>
                        <div className="space-y-4">
                          {fieldIdsInSection.map(fieldId => {
                            const field = template.fields.find(f => f.id === fieldId);
                            // renderFormField will return null if field is undefined or an accordion-specific field
                            return renderFormField(field);
                          })}
                        </div>
                      </div>
                    );
                  }
                })}
              </>
            ) : ( // For templates other than 'work-order'
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

    