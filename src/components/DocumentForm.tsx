
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
import { Eye, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Accordion, AccordionItem, AccordionContent } from '@/components/ui/accordion';
import * as AccordionPrimitive from "@radix-ui/react-accordion";


interface DocumentFormProps {
  template: DocumentFormPropsTemplate;
}

const MAX_ITEMS_PER_SECTION = 5;

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
             validator = z.string().optional(); 
          }
        } else {
          validator = z.string().optional(); 
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
    shape[field.id] = validator;
  });
  return z.object(shape);
}

const workOrderSectionStructure: Record<string, string[]> = {
  'Business Details': ['businessName', 'businessAddress', 'businessContactNumber', 'businessEmail', 'businessLogoUrl'],
  'Order Details': ['orderNumber', 'orderDate', 'expectedStartDate', 'expectedEndDate'],
  'Client Details': ['clientName', 'clientPhone', 'clientEmail', 'workLocation', 'orderReceivedBy'],
  'Work Order Specifics': [ // This section is now primarily handled by accordions
    'generalWorkDescription', 'termsOfService',
    // Accordion toggle fields are implicitly part of this, but handled within the Accordion components
    'otherCosts', 'taxRatePercentage', 'approvedByName', 'dateOfApproval'
  ]
};

interface AccordionSectionItemPattern {
  description?: string;
  area?: string;
  rate?: string;
  quantity?: string;
  unit?: string;
  pricePerUnit?: string;
  numPersons?: string;
  amount?: string;
}

interface WorkOrderAccordionConfig {
  id: string; // Unique ID for the accordion item
  toggleFieldId: keyof FormData; // Field ID for the master toggle (e.g., 'includeWorkDescriptionTable')
  itemFieldIdPatterns: AccordionSectionItemPattern;
  countKey: keyof VisibleItemCounts; // Key in visibleItemCounts state (e.g., 'workItems')
  addButtonLabel: string;
  itemTitleSingular: string; // e.g. "Work Item"
}

type VisibleItemCounts = {
  workItems: number;
  materials: number;
  labor: number;
};


const workOrderAccordionSubSectionsConfig: WorkOrderAccordionConfig[] = [
  {
    id: 'work-items-accordion',
    toggleFieldId: 'includeWorkDescriptionTable',
    itemFieldIdPatterns: {
      description: 'workItem#Description',
      area: 'workItem#Area',
      rate: 'workItem#Rate'
    },
    countKey: 'workItems',
    addButtonLabel: 'Add Work Item',
    itemTitleSingular: 'Work Item',
  },
  {
    id: 'materials-accordion',
    toggleFieldId: 'includeMaterialTable',
    itemFieldIdPatterns: {
      description: 'materialItem#Name', // Note: Suffix is Name here
      quantity: 'materialItem#Quantity',
      unit: 'materialItem#Unit',
      pricePerUnit: 'materialItem#PricePerUnit',
    },
    countKey: 'materials',
    addButtonLabel: 'Add Material',
    itemTitleSingular: 'Material',
  },
  {
    id: 'labour-charges-accordion',
    toggleFieldId: 'includeLaborTable',
    itemFieldIdPatterns: {
      description: 'laborItem#TeamName', // Note: Suffix is TeamName here
      numPersons: 'laborItem#NumPersons',
      amount: 'laborItem#Amount',
    },
    countKey: 'labor',
    addButtonLabel: 'Add Labor Charge',
    itemTitleSingular: 'Labor Charge',
  },
];


export function DocumentForm({ template }: DocumentFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [visibleItemCounts, setVisibleItemCounts] = useState<VisibleItemCounts>({
    workItems: 1,
    materials: 1,
    labor: 1,
  });

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
                        // If parsing fails, or it's an empty string, set to current date
                        resolvedInitialValues[field.id] = new Date().toISOString().split('T')[0];
                    }
                } catch (e) {
                     // If error during date conversion, set to current date
                    resolvedInitialValues[field.id] = new Date().toISOString().split('T')[0];
                }
            } else if (field.type === 'number' && (resolvedInitialValues[field.id] === null || resolvedInitialValues[field.id] === '')) {
                resolvedInitialValues[field.id] = undefined; // Keep undefined for empty optional numbers
            } else if (field.type === 'number' && typeof resolvedInitialValues[field.id] === 'string') {
                 const numVal = parseFloat(resolvedInitialValues[field.id]);
                 resolvedInitialValues[field.id] = isNaN(numVal) ? undefined : numVal;
            }
        } else { // No stored value, use defaults or generate
            if (field.type === 'date') {
                 resolvedInitialValues[field.id] = field.defaultValue && typeof field.defaultValue === 'string' && field.defaultValue.match(/^\d{4}-\d{2}-\d{2}$/)
                    ? field.defaultValue // Use provided default if valid format
                    : new Date().toISOString().split('T')[0]; // Otherwise, current date
            } else if (field.defaultValue !== undefined) {
                resolvedInitialValues[field.id] = field.defaultValue;
            } else if (field.type === 'boolean') {
                 resolvedInitialValues[field.id] = false; // Booleans default to false if no defaultValue
            } else if (field.type === 'number') {
                 resolvedInitialValues[field.id] = undefined; // Numbers default to undefined (for placeholder to show)
            } else if (field.type === 'file'){
                 // For file inputs, the 'value' is managed by the browser; we don't set a default string
                 resolvedInitialValues[field.id] = undefined;
            } else if (field.type === 'select') {
                 resolvedInitialValues[field.id] = ''; // Or handle based on options / first option
            }
            else { // Text, textarea, email
                 resolvedInitialValues[field.id] = ''; // Default to empty string for text-based inputs
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

  useEffect(() => {
    if (template.id === 'work-order' && currentInitialValues) {
      const newCounts: VisibleItemCounts = { workItems: 0, materials: 0, labor: 0 };
      let changed = false;

      workOrderAccordionSubSectionsConfig.forEach(section => {
        let maxPopulatedIndex = 0;
        for (let i = 1; i <= MAX_ITEMS_PER_SECTION; i++) {
          const firstFieldPattern = Object.values(section.itemFieldIdPatterns)[0];
          if (firstFieldPattern) {
            const fieldId = firstFieldPattern.replace('#', String(i));
            if (currentInitialValues[fieldId] !== undefined && String(currentInitialValues[fieldId]).trim() !== '') {
              maxPopulatedIndex = i;
            }
          }
        }
        const currentCount = Math.max(1, maxPopulatedIndex);
        if (visibleItemCounts[section.countKey] !== currentCount) changed = true;
        newCounts[section.countKey] = currentCount;
      });

      if (changed) {
        setVisibleItemCounts(newCounts);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentInitialValues, template.id]); // Removed visibleItemCounts to avoid loop

 const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const submissionValues: Record<string, any> = { ...values };

    const logoField = template.fields.find(f => f.id === 'businessLogoUrl' && f.type === 'file');
    const logoFieldId = logoField?.id;

    if (logoFieldId && submissionValues[logoFieldId] === undefined && currentInitialValues[logoFieldId] === undefined) {
        submissionValues[logoFieldId] = '';
    } else if (logoFieldId && typeof currentInitialValues[logoFieldId] === 'string' && currentInitialValues[logoFieldId].startsWith('data:image') && submissionValues[logoFieldId] === undefined) {
        // If editing and no new file uploaded, retain existing logo data URI from initialValues
        submissionValues[logoFieldId] = currentInitialValues[logoFieldId];
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
                submissionValues[logoFieldId] = currentInitialValues[logoFieldId]?.startsWith('data:image') ? currentInitialValues[logoFieldId] : '';
            } else if (file.size > MAX_FILE_SIZE) {
                toast({
                    variant: "destructive",
                    title: "File Too Large",
                    description: `Please upload an image smaller than 5MB. Yours is ${(file.size / (1024*1024)).toFixed(2)}MB.`,
                });
                submissionValues[logoFieldId] = currentInitialValues[logoFieldId]?.startsWith('data:image') ? currentInitialValues[logoFieldId] : '';
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
                    submissionValues[logoFieldId] = currentInitialValues[logoFieldId]?.startsWith('data:image') ? currentInitialValues[logoFieldId] : '';
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
             submissionValues[logoFieldId] = currentInitialValues[logoFieldId]?.startsWith('data:image') ? currentInitialValues[logoFieldId] : '';
        }
    } else if (logoFieldId && typeof values[logoFieldId] === 'string' && (values[logoFieldId] as string).startsWith('data:image')) {
        submissionValues[logoFieldId] = values[logoFieldId];
    } else if (logoFieldId && !submissionValues[logoFieldId]) {
         submissionValues[logoFieldId] = currentInitialValues[logoFieldId]?.startsWith('data:image') ? currentInitialValues[logoFieldId] : '';
    }


    template.fields.forEach(field => {
        if (submissionValues[field.id] === undefined) {
            if (field.type === 'boolean') {
                submissionValues[field.id] = field.defaultValue !== undefined ? field.defaultValue : false;
            } else if (field.id !== logoFieldId) { // Ensure logo field isn't overwritten if it was handled
                 submissionValues[field.id] = field.defaultValue !== undefined ? field.defaultValue : (field.type === 'number' ? null : '');
            }
        }
    });

    // Clear data for non-visible items
    if (template.id === 'work-order') {
      workOrderAccordionSubSectionsConfig.forEach(section => {
        const currentVisibleCount = visibleItemCounts[section.countKey];
        for (let i = currentVisibleCount + 1; i <= MAX_ITEMS_PER_SECTION; i++) {
          Object.values(section.itemFieldIdPatterns).forEach(pattern => {
            if (pattern) {
              const fieldId = pattern.replace('#', String(i));
              if (submissionValues[fieldId] !== undefined) {
                submissionValues[fieldId] = template.fields.find(f => f.id === fieldId)?.type === 'number' ? undefined : '';
              }
            }
          });
        }
      });
    }


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

  const handleAddItem = (countKey: keyof VisibleItemCounts) => {
    setVisibleItemCounts(prevCounts => {
      const currentCount = prevCounts[countKey];
      if (currentCount < MAX_ITEMS_PER_SECTION) {
        return { ...prevCounts, [countKey]: currentCount + 1 };
      }
      return prevCounts;
    });
  };

  const handleRemoveItem = (countKey: keyof VisibleItemCounts, itemIndexToRemove: number) => {
    const currentVisibleCount = visibleItemCounts[countKey];
    if (currentVisibleCount <= 1) return; // Should not remove the last item

    const sectionConfig = workOrderAccordionSubSectionsConfig.find(s => s.countKey === countKey);
    if (!sectionConfig) return;

    // Clear fields for the item being removed
    Object.values(sectionConfig.itemFieldIdPatterns).forEach(pattern => {
      if (pattern) {
        const fieldId = pattern.replace('#', String(itemIndexToRemove + 1));
        const fieldDef = template.fields.find(f => f.id === fieldId);
        form.setValue(fieldId as any, fieldDef?.type === 'number' ? undefined : '');
      }
    });
    
    // Shift data from subsequent items up
    for (let i = itemIndexToRemove + 1; i < currentVisibleCount; i++) {
      Object.values(sectionConfig.itemFieldIdPatterns).forEach(pattern => {
        if (pattern) {
          const sourceFieldId = pattern.replace('#', String(i + 1));
          const targetFieldId = pattern.replace('#', String(i));
          form.setValue(targetFieldId as any, form.getValues(sourceFieldId as any));
        }
      });
    }

    // Clear the last item's fields that was shifted from
    if (currentVisibleCount > itemIndexToRemove +1 || currentVisibleCount > 1) { // check if there was a last item to clear
         Object.values(sectionConfig.itemFieldIdPatterns).forEach(pattern => {
            if (pattern) {
                const fieldId = pattern.replace('#', String(currentVisibleCount));
                const fieldDef = template.fields.find(f => f.id === fieldId);
                form.setValue(fieldId as any, fieldDef?.type === 'number' ? undefined : '');
            }
        });
    }


    setVisibleItemCounts(prevCounts => ({
      ...prevCounts,
      [countKey]: currentVisibleCount - 1,
    }));
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
            value={formFieldControllerProps.value || ''} // Ensure value is controlled
            defaultValue={field.defaultValue as string || ''}
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

  const renderFormField = (fieldId: string | undefined) => {
    if (!fieldId) return null;
    const field = template.fields.find(f => f.id === fieldId);
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

                    const defaultAccordionValues = workOrderAccordionSubSectionsConfig
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
                          {generalSpecificFields.map(fieldId => renderFormField(fieldId))}

                          <Accordion type="multiple" className="w-full space-y-3" defaultValue={defaultAccordionValues}>
                            {workOrderAccordionSubSectionsConfig.map((accordionSection) => {
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
                                    {Array.from({ length: visibleItemCounts[accordionSection.countKey] }).map((_, itemIndex) => {
                                      const itemNumber = itemIndex + 1;
                                      const fieldPatterns = accordionSection.itemFieldIdPatterns;
                                      const itemFieldsToRenderIds: string[] = [];

                                      if (fieldPatterns.description) itemFieldsToRenderIds.push(fieldPatterns.description!.replace('#', String(itemNumber)));
                                      if (fieldPatterns.area) itemFieldsToRenderIds.push(fieldPatterns.area!.replace('#', String(itemNumber)));
                                      if (fieldPatterns.rate) itemFieldsToRenderIds.push(fieldPatterns.rate!.replace('#', String(itemNumber)));
                                      
                                      if (accordionSection.id === 'materials-accordion') {
                                        if (fieldPatterns.quantity) itemFieldsToRenderIds.push(fieldPatterns.quantity!.replace('#', String(itemNumber)));
                                        if (fieldPatterns.unit) itemFieldsToRenderIds.push(fieldPatterns.unit!.replace('#', String(itemNumber)));
                                        if (fieldPatterns.pricePerUnit) itemFieldsToRenderIds.push(fieldPatterns.pricePerUnit!.replace('#', String(itemNumber)));
                                      } else {
                                        if (fieldPatterns.quantity && !itemFieldsToRenderIds.find(id => id === fieldPatterns.quantity!.replace('#', String(itemNumber)))) {
                                            itemFieldsToRenderIds.push(fieldPatterns.quantity!.replace('#', String(itemNumber)));
                                        }
                                        if (fieldPatterns.unit && !itemFieldsToRenderIds.find(id => id === fieldPatterns.unit!.replace('#', String(itemNumber)))) {
                                            itemFieldsToRenderIds.push(fieldPatterns.unit!.replace('#', String(itemNumber)));
                                        }
                                        if (fieldPatterns.pricePerUnit && !itemFieldsToRenderIds.find(id => id === fieldPatterns.pricePerUnit!.replace('#', String(itemNumber)))) {
                                            itemFieldsToRenderIds.push(fieldPatterns.pricePerUnit!.replace('#', String(itemNumber)));
                                        }
                                      }
                                      if (fieldPatterns.numPersons) itemFieldsToRenderIds.push(fieldPatterns.numPersons!.replace('#', String(itemNumber)));
                                      if (fieldPatterns.amount) itemFieldsToRenderIds.push(fieldPatterns.amount!.replace('#', String(itemNumber)));
                                      
                                      const actualFieldsExist = itemFieldsToRenderIds.every(id => template.fields.some(f => f.id === id));
                                      if (!actualFieldsExist || itemFieldsToRenderIds.length === 0) return null;

                                      return (
                                        <div key={`${accordionSection.id}-item-${itemNumber}`} className="space-y-4 border-b border-dashed border-border pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0 relative group">
                                          <h4 className="text-md font-medium text-muted-foreground">{accordionSection.itemTitleSingular} #{itemNumber}</h4>
                                          {itemFieldsToRenderIds.map(fieldId => renderFormField(fieldId))}
                                          {itemIndex > 0 && (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleRemoveItem(accordionSection.countKey, itemIndex)}
                                              className="absolute top-0 right-0 text-destructive hover:text-destructive-foreground hover:bg-destructive/90 opacity-50 group-hover:opacity-100"
                                              aria-label={`Remove ${accordionSection.itemTitleSingular} ${itemNumber}`}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          )}
                                        </div>
                                      );
                                    })}
                                    {visibleItemCounts[accordionSection.countKey] < MAX_ITEMS_PER_SECTION && (
                                      <div className="flex justify-end">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleAddItem(accordionSection.countKey)}
                                          className="mt-2"
                                        >
                                          <PlusCircle className="mr-2 h-4 w-4" />
                                          {accordionSection.addButtonLabel}
                                        </Button>
                                      </div>
                                    )}
                                  </AccordionContent>
                                </AccordionItem>
                              );
                            })}
                          </Accordion>
                          {financialSpecificFields.map(fieldId => renderFormField(fieldId))}
                        </div>
                      </div>
                    );
                  } else { // For sections like "Business Details", "Order Details", "Client Details"
                    return (
                      <div key={sectionTitle} className="space-y-4 pt-4">
                        <h2 className={`text-xl font-semibold text-primary ${sectionIndex > 0 ? 'mt-8' : 'mt-0'} pb-2 border-b border-border`}>
                          {sectionTitle}
                        </h2>
                        <div className="space-y-4">
                        {fieldIdsInSection
                            .map(fieldId => template.fields.find(f => f.id === fieldId))
                            .filter(field => { // Explicitly filter out fields managed by accordions
                              if (!field) return false;
                              // Check if it's a toggle field for any accordion
                              const isToggleField = workOrderAccordionSubSectionsConfig.some(s => s.toggleFieldId === field.id);
                              if (isToggleField) return false;

                              // Check if it's an item field within any accordion (for any item number up to max)
                              const isItemField = workOrderAccordionSubSectionsConfig.some(accSection =>
                                Object.values(accSection.itemFieldIdPatterns).some(pattern => {
                                  if (!pattern) return false;
                                  for (let i = 1; i <= MAX_ITEMS_PER_SECTION; i++) {
                                    if (pattern.replace('#', String(i)) === field.id) return true;
                                  }
                                  return false;
                                })
                              );
                              return !isItemField;
                            })
                            .map(field => field ? renderFormField(field.id) : null)
                          }
                        </div>
                      </div>
                    );
                  }
                })}
              </>
            ) : ( // For templates other than work-order
              template.fields.map((field) => renderFormField(field.id))
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
