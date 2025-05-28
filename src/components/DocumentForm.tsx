
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      case 'select': {
        if (field.options && field.options.length > 0) {
          const enumValues = field.options.map(opt => opt.value) as [string, ...string[]];
          if (enumValues.length > 0) {
            validator = z.enum(enumValues).optional();
          } else {
             validator = z.string().optional(); // Fallback if options are empty
          }
        } else {
          validator = z.string().optional(); // Fallback if no options
        }
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
    // 'required' is handled by making fields optional by default.
    // If a field were truly required, its Zod validator would not have .optional()
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
    quantity?: string; // Added for materials
    unit?: string; // Added for materials
    pricePerUnit?: string; // Added for materials
    numPersons?: string; // Added for labor
    amount?: string; // Added for labor
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
      quantity: 'materialItem#Quantity',
      unit: 'materialItem#Unit',
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
            sessionStorage.removeItem(editDataKey);
        }
      } catch (e) {
        console.error('Failed to parse edit data from session storage:', e);
      }
    }

    template.fields.forEach(field => {
        if (resolvedInitialValues[field.id] !== undefined) {
            if (field.type === 'date' && resolvedInitialValues[field.id]) {
                try {
                    const dateObj = new Date(resolvedInitialValues[field.id]);
                    if (!isNaN(dateObj.getTime())) {
                        resolvedInitialValues[field.id] = dateObj.toISOString().split('T')[0];
                    } else {
                        resolvedInitialValues[field.id] = new Date().toISOString().split('T')[0];
                    }
                } catch (e) {
                    resolvedInitialValues[field.id] = new Date().toISOString().split('T')[0];
                }
            } else if (field.type === 'number' && (resolvedInitialValues[field.id] === null || resolvedInitialValues[field.id] === '')) {
                resolvedInitialValues[field.id] = undefined;
            } else if (field.type === 'number' && typeof resolvedInitialValues[field.id] === 'string') {
                 const numVal = parseFloat(resolvedInitialValues[field.id]);
                 resolvedInitialValues[field.id] = isNaN(numVal) ? undefined : numVal;
            }
        } else {
            if (field.type === 'date') {
                resolvedInitialValues[field.id] = field.defaultValue && typeof field.defaultValue === 'string' && field.defaultValue.match(/^\d{4}-\d{2}-\d{2}$/)
                    ? field.defaultValue
                    : new Date().toISOString().split('T')[0];
            } else if (field.defaultValue !== undefined) {
                resolvedInitialValues[field.id] = field.defaultValue;
            } else if (field.type === 'boolean') {
                 resolvedInitialValues[field.id] = false;
            } else if (field.type === 'number') {
                 resolvedInitialValues[field.id] = undefined;
            } else if (field.type === 'file'){
                 resolvedInitialValues[field.id] = undefined;
            } else if (field.type === 'select') {
                 resolvedInitialValues[field.id] = ''; // Or handle based on options
            }
            else {
                 resolvedInitialValues[field.id] = '';
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
    const submissionValues: Record<string, any> = { ...values };

    const logoField = template.fields.find(f => f.id === 'businessLogoUrl' && f.type === 'file');
    const logoFieldId = logoField?.id;

    if (logoFieldId && submissionValues[logoFieldId] === undefined) {
        submissionValues[logoFieldId] = '';
    }

    if (logoFieldId && values[logoFieldId]) {
        const logoFileValue = values[logoFieldId];

        if (logoFileValue instanceof FileList && logoFileValue.length > 0) {
            const file = logoFileValue[0];
            const MAX_FILE_SIZE = 5 * 1024 * 1024;
            const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

            if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
                toast({
                    variant: "destructive",
                    title: "Invalid File Type",
                    description: `Please upload an image (JPEG, PNG, GIF, WEBP, SVG). You uploaded: ${file.type}`,
                });
                submissionValues[logoFieldId] = '';
            } else if (file.size > MAX_FILE_SIZE) {
                toast({
                    variant: "destructive",
                    title: "File Too Large",
                    description: `Please upload an image smaller than 5MB. Yours is ${(file.size / (1024*1024)).toFixed(2)}MB.`,
                });
                submissionValues[logoFieldId] = '';
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
                    submissionValues[logoFieldId] = '';
                }
            }
        } else if (typeof logoFileValue === 'string' && logoFileValue.startsWith('data:image')) {
            submissionValues[logoFieldId] = logoFileValue;
        } else if (logoFileValue && !(logoFileValue instanceof FileList)) {
             console.warn("Unexpected value type for logo field:", logoFileValue);
             toast({
                variant: "destructive",
                title: "Invalid Logo Input",
                description: "The logo data was not recognized. Please re-upload if you wish to change it."
             });
             submissionValues[logoFieldId] = '';
        }
    } else if (logoFieldId && typeof values[logoFieldId] === 'string' && (values[logoFieldId] as string).startsWith('data:image')) {
        submissionValues[logoFieldId] = values[logoFieldId];
    } else if (logoFieldId && !submissionValues[logoFieldId]) {
        submissionValues[logoFieldId] = '';
    }


    template.fields.forEach(field => {
        if (submissionValues[field.id] === undefined) {
            if (field.type === 'boolean') {
                submissionValues[field.id] = field.defaultValue !== undefined ? field.defaultValue : false;
            } else if (field.id !== logoFieldId) {
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
      case 'select': {
        return (
          <Select
            onValueChange={formFieldControllerProps.onChange}
            defaultValue={formFieldControllerProps.value || field.defaultValue as string || ''}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || "Select an option"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      case 'text': {
        return <Input type="text" placeholder={field.placeholder} {...formFieldControllerProps} value={formFieldControllerProps.value || ''} />;
      }
      default: {
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
            {field.placeholder && field.type !== 'textarea' && field.type !== 'boolean' && field.type !== 'file' && field.type !== 'select' && (
                <FormDescription className="text-xs text-muted-foreground">
                Example: {field.placeholder}
                </FormDescription>
            )}
            {field.type === 'file' && field.placeholder && (
                <FormDescription className="text-xs text-muted-foreground">
                {field.placeholder}
                </FormDescription>
            )}
             {field.type === 'select' && field.placeholder && !field.options?.some(opt => opt.value === formHookFieldRenderProps.value) && (
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
                                              aria-label={toggleField.placeholder || `Toggle ${toggleField.label} section`}
                                            />
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  </AccordionPrimitive.Header>
                                  <AccordionContent className="pt-4 px-3 pb-3 space-y-4">
                                    {Array.from({ length: 3 }).map((_, itemIndex) => {
                                      const itemNumber = itemIndex + 1;
                                      const fieldPatterns = accordionSection.itemFieldIdPatterns;
                                      const itemFieldsToRender: (TemplateField | undefined)[] = [];

                                      // Construct field IDs based on patterns and order for rendering
                                      if (fieldPatterns.description) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.description!.replace('#', String(itemNumber))));
                                      if (fieldPatterns.area) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.area!.replace('#', String(itemNumber))));
                                      if (fieldPatterns.rate) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.rate!.replace('#', String(itemNumber))));

                                      // For Materials section, ensure Quantity is before Unit
                                      if (accordionSection.id === 'materials-accordion') {
                                        if (fieldPatterns.quantity) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.quantity!.replace('#', String(itemNumber))));
                                        if (fieldPatterns.unit) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.unit!.replace('#', String(itemNumber))));
                                        if (fieldPatterns.pricePerUnit) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.pricePerUnit!.replace('#', String(itemNumber))));
                                      } else { // For other sections, add remaining fields if they exist in pattern
                                        if (fieldPatterns.quantity && !itemFieldsToRender.find(f => f?.id === fieldPatterns.quantity!.replace('#', String(itemNumber)))) {
                                            itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.quantity!.replace('#', String(itemNumber))));
                                        }
                                        if (fieldPatterns.unit && !itemFieldsToRender.find(f => f?.id === fieldPatterns.unit!.replace('#', String(itemNumber)))) {
                                            itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.unit!.replace('#', String(itemNumber))));
                                        }
                                        if (fieldPatterns.pricePerUnit && !itemFieldsToRender.find(f => f?.id === fieldPatterns.pricePerUnit!.replace('#', String(itemNumber)))) {
                                            itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.pricePerUnit!.replace('#', String(itemNumber))));
                                        }
                                      }


                                      if (fieldPatterns.numPersons) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.numPersons!.replace('#', String(itemNumber))));
                                      if (fieldPatterns.amount) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.amount!.replace('#', String(itemNumber))));

                                      const validItemFields = itemFieldsToRender.filter(Boolean) as TemplateField[];
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
                  } else {
                    return (
                      <div key={sectionTitle} className="space-y-4 pt-4">
                        <h2 className={`text-xl font-semibold text-primary ${sectionIndex > 0 ? 'mt-8' : 'mt-0'} pb-2 border-b border-border`}>
                          {sectionTitle}
                        </h2>
                        <div className="space-y-4">
                        {fieldIdsInSection
                            .map(fieldId => template.fields.find(f => f.id === fieldId))
                            .filter(field => {
                              if (!field) return false;
                              const isToggleField = workOrderAccordionSubSections.some(s => s.toggleFieldId === field.id);
                              const isItemField = workOrderAccordionSubSections.some(accSection =>
                                Object.values(accSection.itemFieldIdPatterns).some(pattern => {
                                  if (!pattern) return false;
                                  return pattern.replace('#', '1') === field.id ||
                                         pattern.replace('#', '2') === field.id ||
                                         pattern.replace('#', '3') === field.id;
                                })
                              );
                              return !isToggleField && !isItemField;
                            })
                            .map(field => field ? renderFormField(field) : null)
                          }
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
