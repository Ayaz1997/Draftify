
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
import { Eye, PlusCircle, Trash2, ChevronDown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Accordion, AccordionItem, AccordionContent } from '@/components/ui/accordion';
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";


interface DocumentFormProps {
  template: DocumentFormPropsTemplate;
}

const MAX_ITEMS_PER_SECTION = 10; 

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
        // Ensure that empty strings or null are treated as undefined for optional numbers
        validator = z.preprocess(
          (val) => (val === "" || val === null ? undefined : val),
          z.coerce.number({ invalid_type_error: 'Must be a number' }).optional().nullable()
        );
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
            validator = z.enum(enumValues).optional().or(z.literal(''));
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
    if (field.required) {
        if (field.type === 'boolean') {
             // Required booleans don't make much sense unless they must be true, handle as needed
        } else if (field.type === 'number') {
            validator = validator.refine(val => val !== undefined && val !== null && !isNaN(val), { message: `${field.label} is required` });
        }
         else {
             validator = validator.min(1, { message: `${field.label} is required` });
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
  'Work Order Specifics': [ // Top-level non-accordion fields for this section
    'generalWorkDescription', 'termsOfService',
    // Accordion toggles are implicitly part of this section logic
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
  id: string; 
  toggleFieldId: keyof FormData; 
  itemFieldIdPatterns: AccordionSectionItemPattern;
  countKey: keyof VisibleItemCounts; 
  addButtonLabel: string;
  itemTitleSingular: string; 
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
      description: 'materialItem#Name', 
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
      description: 'laborItem#TeamName', 
      numPersons: 'laborItem#NumPersons',
      amount: 'laborItem#Amount',
    },
    countKey: 'labor',
    addButtonLabel: 'Add Labor Charge',
    itemTitleSingular: 'Labor Charge',
  },
];

const WORK_ORDER_TABS_CONFIG = [
  { id: 'businessDetails', title: 'Business Details', fieldIds: workOrderSectionStructure['Business Details'] },
  { id: 'orderDetails', title: 'Order Details', fieldIds: workOrderSectionStructure['Order Details'] },
  { id: 'clientDetails', title: 'Client Details', fieldIds: workOrderSectionStructure['Client Details'] },
  { id: 'workOrderSpecifics', title: 'Work Order Specifics', fieldIds: workOrderSectionStructure['Work Order Specifics'] },
];


export function DocumentForm({ template }: DocumentFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [visibleItemCounts, setVisibleItemCounts] = useState<VisibleItemCounts>({
    workItems: 1,
    materials: 1,
    labor: 1,
  });
  
  const [currentTab, setCurrentTab] = useState(WORK_ORDER_TABS_CONFIG[0].id);
  const currentTabIndex = WORK_ORDER_TABS_CONFIG.findIndex(tab => tab.id === currentTab);

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
                 resolvedInitialValues[field.id] = ''; 
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
    mode: 'onChange', // Validate on change for better immediate feedback
  });

  useEffect(() => {
    form.reset(currentInitialValues); // Ensure form resets when initial values change (e.g. navigating back for edit)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentInitialValues, form.reset]);


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
  }, [currentInitialValues, template.id]); 

 const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const submissionValues: Record<string, any> = { ...values };

    const logoField = template.fields.find(f => f.id === 'businessLogoUrl' && f.type === 'file');
    const logoFieldId = logoField?.id;

    if (logoFieldId && submissionValues[logoFieldId] === undefined && currentInitialValues[logoFieldId] === undefined) {
        submissionValues[logoFieldId] = '';
    } else if (logoFieldId && typeof currentInitialValues[logoFieldId] === 'string' && currentInitialValues[logoFieldId].startsWith('data:image') && submissionValues[logoFieldId] === undefined) {
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
            } else if (field.id !== logoFieldId) { 
                 submissionValues[field.id] = field.defaultValue !== undefined ? field.defaultValue : (field.type === 'number' ? null : '');
            }
        }
    });

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
    if (currentVisibleCount <= 1) return; 

    const sectionConfig = workOrderAccordionSubSectionsConfig.find(s => s.countKey === countKey);
    if (!sectionConfig) return;

    // Clear values for the item being removed and shift subsequent items up
    for (let i = itemIndexToRemove; i < currentVisibleCount - 1; i++) {
        Object.values(sectionConfig.itemFieldIdPatterns).forEach(pattern => {
            if (pattern) {
                const sourceFieldId = pattern.replace('#', String(i + 2)); // N+1 item data
                const targetFieldId = pattern.replace('#', String(i + 1)); // N item data
                form.setValue(targetFieldId as any, form.getValues(sourceFieldId as any));
            }
        });
    }
    // Clear values for the last item that was shifted from
    Object.values(sectionConfig.itemFieldIdPatterns).forEach(pattern => {
        if (pattern) {
            const fieldId = pattern.replace('#', String(currentVisibleCount));
            const fieldDef = template.fields.find(f => f.id === fieldId);
            form.setValue(fieldId as any, fieldDef?.type === 'number' ? undefined : '');
        }
    });


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
            value={String(formFieldControllerProps.value || '')} 
            defaultValue={String(field.defaultValue || '')}
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

  const renderFormField = (field?: TemplateField) => {
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

  const handleTabChangeAttempt = async (targetTabId: string) => {
    const targetTabIndex = WORK_ORDER_TABS_CONFIG.findIndex(t => t.id === targetTabId);
    const currentActiveTabIndex = WORK_ORDER_TABS_CONFIG.findIndex(t => t.id === currentTab);

    if (targetTabIndex > currentActiveTabIndex) { // Moving forward
        for (let i = currentActiveTabIndex; i < targetTabIndex; i++) {
            const tabToValidate = WORK_ORDER_TABS_CONFIG[i];
            const fieldsToValidate = getFieldsForTabValidation(tabToValidate.id);
            if (fieldsToValidate.length > 0) {
                const isValid = await form.trigger(fieldsToValidate as any);
                if (!isValid) {
                    toast({
                        title: "Validation Error",
                        description: `Please correct errors in the "${tabToValidate.title}" tab.`,
                        variant: "destructive",
                    });
                    setCurrentTab(tabToValidate.id); // Stay on/move to the tab with errors
                    return; // Stop further tab changes
                }
            }
        }
    }
    setCurrentTab(targetTabId); // Allow navigation if all intermediate/current tabs are valid or moving backward
  };


  const getFieldsForTabValidation = (tabId: string): string[] => {
    const tabConfig = WORK_ORDER_TABS_CONFIG.find(t => t.id === tabId);
    if (!tabConfig) return [];

    if (tabId !== 'workOrderSpecifics') {
        return tabConfig.fieldIds || [];
    }

    // For 'workOrderSpecifics' tab, gather all relevant fields
    let fields: string[] = [...(tabConfig.fieldIds || [])]; // Starts with top-level fields like generalWorkDescription, etc.

    workOrderAccordionSubSectionsConfig.forEach(section => {
        fields.push(section.toggleFieldId); // Add the toggle checkbox itself
        if (form.getValues(section.toggleFieldId)) { // Only validate items if section is active
            for (let i = 1; i <= visibleItemCounts[section.countKey]; i++) {
                Object.values(section.itemFieldIdPatterns).forEach(pattern => {
                    if (pattern) fields.push(pattern.replace('#', String(i)));
                });
            }
        }
    });
    return fields.filter(Boolean);
  };


  const handleNext = async () => {
    const currentTabConfig = WORK_ORDER_TABS_CONFIG[currentTabIndex];
    const fieldsToValidate = getFieldsForTabValidation(currentTabConfig.id);

    if (fieldsToValidate.length > 0) {
        const isValid = await form.trigger(fieldsToValidate as any); // RHF expects FieldPath<TFieldValues>[]
        if (!isValid) {
            toast({
                title: "Validation Error",
                description: `Please correct the errors on the "${currentTabConfig.title}" tab before proceeding.`,
                variant: "destructive",
            });
            return;
        }
    }

    if (currentTabIndex < WORK_ORDER_TABS_CONFIG.length - 1) {
      setCurrentTab(WORK_ORDER_TABS_CONFIG[currentTabIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (currentTabIndex > 0) {
      setCurrentTab(WORK_ORDER_TABS_CONFIG[currentTabIndex - 1].id);
    }
  };

  if (template.id === 'work-order') {
    const defaultAccordionOpenValues = workOrderAccordionSubSectionsConfig
        .filter(s => {
            const toggleFieldDef = template.fields.find(f => f.id === s.toggleFieldId);
            return form.getValues(s.toggleFieldId as any) === true || (form.getValues(s.toggleFieldId as any) === undefined && toggleFieldDef?.defaultValue === true);
        })
        .map(s => s.id);

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg font-medium">Fill in the details for your {template.name}</CardTitle>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Tabs value={currentTab} onValueChange={handleTabChangeAttempt} className="w-full">
                        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-4">
                            {WORK_ORDER_TABS_CONFIG.map(tab => (
                                <TabsTrigger key={tab.id} value={tab.id}>
                                    {tab.title}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {WORK_ORDER_TABS_CONFIG.map(tabInfo => (
                            <TabsContent key={tabInfo.id} value={tabInfo.id} className="focus-visible:ring-0 focus-visible:ring-offset-0">
                                <CardContent className="space-y-6 pt-6">
                                    {tabInfo.id === 'workOrderSpecifics' ? (
                                        <>
                                            {template.fields.filter(f => ['generalWorkDescription', 'termsOfService'].includes(f.id)).map(field => renderFormField(field))}
                                            
                                            <Accordion type="multiple" className="w-full space-y-3" defaultValue={defaultAccordionOpenValues}>
                                                {workOrderAccordionSubSectionsConfig.map((accordionSection) => {
                                                const toggleField = template.fields.find(f => f.id === accordionSection.toggleFieldId);
                                                if (!toggleField || toggleField.type !== 'boolean') return null;

                                                return (
                                                    <AccordionItem value={accordionSection.id} key={accordionSection.id} className="border border-border rounded-md shadow-sm">
                                                    <AccordionPrimitive.Header className="flex items-center justify-between w-full p-3 data-[state=open]:border-b">
                                                        <AccordionPrimitive.Trigger
                                                        className={cn(
                                                            "flex flex-1 items-center text-left text-lg font-semibold text-foreground hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                                            "[&[data-state=open]>svg]:rotate-180"
                                                        )}
                                                        >
                                                        <span className="mr-auto">{toggleField.label}</span>
                                                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                                                        </AccordionPrimitive.Trigger>
                                                        <div className="ml-4">
                                                            <FormField
                                                            control={form.control}
                                                            name={accordionSection.toggleFieldId as any}
                                                            render={({ field: checkboxCtrl }) => (
                                                                <FormItem className="flex flex-row items-center m-0 p-0">
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
                                                        </div>
                                                    </AccordionPrimitive.Header>
                                                    <AccordionContent className="pt-4 px-3 pb-3 space-y-4">
                                                        {Array.from({ length: visibleItemCounts[accordionSection.countKey] }).map((_, itemIndex) => {
                                                        const itemNumber = itemIndex + 1;
                                                        const fieldPatterns = accordionSection.itemFieldIdPatterns;
                                                        const itemFieldsToRender: TemplateField[] = [];

                                                        // Corrected order for Materials to place Unit after Quantity
                                                        if (accordionSection.id === 'materials-accordion') {
                                                            if (fieldPatterns.description) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.description!.replace('#', String(itemNumber)))!);
                                                            if (fieldPatterns.quantity) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.quantity!.replace('#', String(itemNumber)))!);
                                                            if (fieldPatterns.unit) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.unit!.replace('#', String(itemNumber)))!);
                                                            if (fieldPatterns.pricePerUnit) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.pricePerUnit!.replace('#', String(itemNumber)))!);
                                                        } else { // Original order for other sections
                                                            if (fieldPatterns.description) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.description!.replace('#', String(itemNumber)))!);
                                                            if (fieldPatterns.area) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.area!.replace('#', String(itemNumber)))!);
                                                            if (fieldPatterns.rate) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.rate!.replace('#', String(itemNumber)))!);
                                                            
                                                            if (fieldPatterns.quantity) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.quantity!.replace('#', String(itemNumber)))!);
                                                            if (fieldPatterns.unit) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.unit!.replace('#', String(itemNumber)))!);
                                                            if (fieldPatterns.pricePerUnit) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.pricePerUnit!.replace('#', String(itemNumber)))!);
                                                            
                                                            if (fieldPatterns.numPersons) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.numPersons!.replace('#', String(itemNumber)))!);
                                                            if (fieldPatterns.amount) itemFieldsToRender.push(template.fields.find(f => f.id === fieldPatterns.amount!.replace('#', String(itemNumber)))!);
                                                        }
                                                        
                                                        const actualFields = itemFieldsToRender.filter(Boolean);
                                                        if (actualFields.length === 0) return null;

                                                        return (
                                                            <div key={`${accordionSection.id}-item-${itemNumber}`} className="space-y-4 border-b border-dashed border-border pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0 relative group">
                                                            <h4 className="text-md font-medium text-muted-foreground">{accordionSection.itemTitleSingular} #{itemNumber}</h4>
                                                            {actualFields.map(field => renderFormField(field))}
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
                                            {template.fields.filter(f => ['otherCosts', 'taxRatePercentage', 'approvedByName', 'dateOfApproval'].includes(f.id)).map(field => renderFormField(field))}
                                        </>
                                    ) : (
                                        tabInfo.fieldIds?.map(fieldId => {
                                            const field = template.fields.find(f => f.id === fieldId);
                                            return field ? renderFormField(field) : null;
                                        })
                                    )}
                                </CardContent>
                            </TabsContent>
                        ))}
                    </Tabs>

                    <CardFooter className="flex justify-between border-t pt-6 mt-4">
                        <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentTabIndex === 0}>
                            Previous
                        </Button>
                        {currentTabIndex === WORK_ORDER_TABS_CONFIG.length - 1 ? (
                            <Button type="submit" variant="default">
                                <Eye className="mr-2 h-4 w-4" />
                                Preview Document
                            </Button>
                        ) : (
                            <Button type="button" variant="default" onClick={handleNext}>
                                Next
                            </Button>
                        )}
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
  }
  
  // Fallback for other templates (non-tabbed view)
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Fill in the details for your {template.name}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {template.fields.map((field) => renderFormField(field))}
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t pt-6">
             <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              <Eye className="mr-2 h-4 w-4" />
              Preview Document
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}


    

    