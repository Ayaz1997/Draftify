
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
    shape[field.id] = validator;
  });
  return z.object(shape);
}

const workOrderSectionStructure: Record<string, string[]> = {
  'Business Details': ['businessName', 'businessAddress', 'businessContactNumber', 'businessEmail', 'businessLogoUrl'],
  'Order Details': ['orderNumber', 'orderDate', 'expectedStartDate', 'expectedEndDate'],
  'Client Details': ['clientName', 'clientPhone', 'clientEmail', 'workLocation', 'orderReceivedBy'],
  'Work Order Specifics': [ // This section will be handled specially for accordions
    'generalWorkDescription', 'termsOfService',
    // Accordion toggles and their related fields will be managed by a different structure
    'includeWorkDescriptionTable',
    'workItem1Description', 'workItem1Area', 'workItem1Rate',
    'workItem2Description', 'workItem2Area', 'workItem2Rate',
    'workItem3Description', 'workItem3Area', 'workItem3Rate',
    'includeMaterialTable',
    'materialItem1Name', 'materialItem1Unit', 'materialItem1Quantity', 'materialItem1PricePerUnit',
    'materialItem2Name', 'materialItem2Unit', 'materialItem2Quantity', 'materialItem2PricePerUnit',
    'materialItem3Name', 'materialItem3Unit', 'materialItem3Quantity', 'materialItem3PricePerUnit',
    'includeLaborTable',
    'laborItem1TeamName', 'laborItem1NumPersons', 'laborItem1Amount',
    'laborItem2TeamName', 'laborItem2NumPersons', 'laborItem2Amount',
    'laborItem3TeamName', 'laborItem3NumPersons', 'laborItem3Amount',
    'otherCosts', 'taxRatePercentage',
    'approvedByName', 'dateOfApproval'
  ]
};

interface AccordionSectionConfig {
  id: string; // for AccordionItem value
  label: string; // The new header text (e.g., "Work Items")
  toggleFieldId: keyof FormData; // e.g., 'includeWorkDescriptionTable'
  contentFieldIds: Array<keyof FormData>;
}

const workOrderAccordionSubSections: AccordionSectionConfig[] = [
  {
    id: 'work-items-accordion',
    label: 'Work Items', // This label comes from the toggleField's definition
    toggleFieldId: 'includeWorkDescriptionTable',
    contentFieldIds: [
      'workItem1Description', 'workItem1Area', 'workItem1Rate',
      'workItem2Description', 'workItem2Area', 'workItem2Rate',
      'workItem3Description', 'workItem3Area', 'workItem3Rate',
    ],
  },
  {
    id: 'materials-accordion',
    label: 'Materials',
    toggleFieldId: 'includeMaterialTable',
    contentFieldIds: [
      'materialItem1Name', 'materialItem1Unit', 'materialItem1Quantity', 'materialItem1PricePerUnit',
      'materialItem2Name', 'materialItem2Unit', 'materialItem2Quantity', 'materialItem2PricePerUnit',
      'materialItem3Name', 'materialItem3Unit', 'materialItem3Quantity', 'materialItem3PricePerUnit',
    ],
  },
  {
    id: 'labour-charges-accordion',
    label: 'Labour Charges',
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
  const formSchema = createZodSchema(template.fields);

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
                 initialValues[field.id] = undefined; 
            } else if (field.type === 'file'){
                 initialValues[field.id] = undefined; 
            }
            else {
                 initialValues[field.id] = ''; 
            }
        } else if (field.type === 'date' && initialValues[field.id]) {
            try {
                const dateObj = new Date(initialValues[field.id]);
                if (!isNaN(dateObj.getTime())) {
                    initialValues[field.id] = dateObj.toISOString().split('T')[0];
                } else {
                    initialValues[field.id] = new Date().toISOString().split('T')[0];
                }
            } catch (e) {
                initialValues[field.id] = new Date().toISOString().split('T')[0];
            }
        } else if (field.type === 'number' && (initialValues[field.id] === null || initialValues[field.id] === '')) {
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
    const logoFieldId = logoField?.id;

    // Initialize logo field in submissionValues if it exists in template
    if (logoFieldId) {
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
                // submissionValues[logoFieldId] remains ''
            } else if (file.size > MAX_FILE_SIZE) {
                toast({
                    variant: "destructive",
                    title: "File Too Large",
                    description: `Please upload an image smaller than 5MB. Yours is ${(file.size / (1024*1024)).toFixed(2)}MB.`,
                });
                // submissionValues[logoFieldId] remains ''
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
                    // submissionValues[logoFieldId] remains ''
                }
            }
        } else if (typeof logoFileValue === 'string' && logoFileValue.startsWith('data:image')) {
            // It's an existing data URI (e.g., from edit mode), keep it
            submissionValues[logoFieldId] = logoFileValue;
        } else if (logoFileValue) {
             // Some other non-FileList, non-dataURI value, treat as invalid for new upload
             toast({
                variant: "destructive",
                title: "Invalid Logo Input",
                description: "The logo data was not recognized. Please re-upload if you wish to change it."
             });
             // submissionValues[logoFieldId] remains ''
        }
        // If no new file was selected and logoFileValue was undefined/null, it remains empty string or keeps previous data URI from spread values
    } else if (logoFieldId && typeof values[logoFieldId] === 'string' && (values[logoFieldId] as string).startsWith('data:image')) {
        // Case where values already contained a valid data URI (e.g. from editing an entry that had a logo)
        submissionValues[logoFieldId] = values[logoFieldId];
    }


    template.fields.forEach(field => {
        if (submissionValues[field.id] === undefined) {
            if (field.type === 'boolean') {
                submissionValues[field.id] = field.defaultValue !== undefined ? field.defaultValue : false;
            } else if (field.id !== logoFieldId) {
                submissionValues[field.id] = values[field.id] !== undefined ? values[field.id] : (field.defaultValue !== undefined ? field.defaultValue : '');
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
        let dateValue = formFieldControllerProps.value || '';
        if (dateValue && typeof dateValue === 'string' && !dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            try {
                const parsed = new Date(dateValue);
                if(!isNaN(parsed.getTime())) dateValue = parsed.toISOString().split('T')[0];
                else dateValue = '';
            } catch {
                dateValue = ''; 
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
            onChange={(e) => onFileChange(e.target.files)} 
            {...restFileProps} 
            className="pt-2" 
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
    return (
        <FormField
        key={field.id}
        control={form.control}
        name={field.id as keyof z.infer<typeof formSchema>} 
        render={({ field: formHookFieldRenderProps }) => (
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
                    
                    // Default accordion items to be open
                    const defaultAccordionValues = workOrderAccordionSubSections.map(s => s.id);


                    return (
                      <div key={sectionTitle} className="space-y-4 pt-4">
                        <h2 className={`text-xl font-semibold text-primary ${sectionIndex > 0 ? 'mt-6' : 'mt-0'} pb-2 border-b border-border`}>
                          {sectionTitle}
                        </h2>
                        <div className="space-y-4">
                          {generalSpecificFields.map(fieldId => renderFormField(template.fields.find(f => f.id === fieldId)))}

                          <Accordion type="multiple" collapsible className="w-full space-y-3" defaultValue={defaultAccordionValues}>
                            {workOrderAccordionSubSections.map((accordionSection) => {
                              const toggleField = template.fields.find(f => f.id === accordionSection.toggleFieldId);
                              if (!toggleField || toggleField.type !== 'boolean') return null;
                              
                              return (
                                <AccordionItem value={accordionSection.id} key={accordionSection.id} className="border border-border rounded-md px-1 shadow-sm">
                                  <AccordionTrigger className="[&>svg]:hidden hover:no-underline py-0 data-[state=open]:border-b">
                                    <FormField
                                      control={form.control}
                                      name={accordionSection.toggleFieldId as any}
                                      render={({ field: checkboxCtrl }) => (
                                        <FormItem className="flex flex-row items-center justify-between w-full p-3">
                                          <div className="flex-grow">
                                            <FormLabel htmlFor={checkboxCtrl.name} className="text-lg font-semibold text-foreground hover:cursor-pointer">
                                              {toggleField.label} {/* Use label from template definition */}
                                            </FormLabel>
                                            <FormDescription className="text-xs">
                                              {toggleField.placeholder}
                                            </FormDescription>
                                          </div>
                                          <FormControl>
                                            <Checkbox
                                              checked={checkboxCtrl.value}
                                              onCheckedChange={checkboxCtrl.onChange}
                                              id={checkboxCtrl.name}
                                              className="ml-4"
                                              aria-label={`Toggle ${toggleField.label} section`}
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </AccordionTrigger>
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
                        <h2 className={`text-xl font-semibold text-primary ${sectionIndex > 0 ? 'mt-6' : 'mt-0'} pb-2 border-b border-border`}>
                          {sectionTitle}
                        </h2>
                        <div className="space-y-4">
                          {fieldIdsInSection.map(fieldId => {
                            const field = template.fields.find(f => f.id === fieldId);
                            if (!field || workOrderAccordionSubSections.some(s => s.contentFieldIds.includes(fieldId as keyof FormData) || s.toggleFieldId === fieldId)) return null;
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

