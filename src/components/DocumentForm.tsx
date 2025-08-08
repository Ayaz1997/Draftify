
'use client';

import type { TemplateField, FormData, DocumentFormPropsTemplate } from '@/types';
import { useForm, useFormContext, useFieldArray, Controller } from 'react-hook-form';
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

const workOrderSectionStructure: Record<string, string[]> = {
  'Business Details': ['businessName', 'businessAddress', 'businessContactNumber', 'businessEmail', 'businessLogoUrl'],
  'Order Details': ['orderNumber', 'orderDate', 'expectedStartDate', 'expectedEndDate', 'currency'],
  'Client Details': ['clientName', 'clientPhone', 'clientEmail', 'workLocation', 'orderReceivedBy'],
  'Work Order Specifics': [
    'generalWorkDescription', 'termsOfService',
    'otherCosts', 'taxRatePercentage', 'approvedByName', 'dateOfApproval'
  ]
};

const WORK_ORDER_TABS_CONFIG = [
  { id: 'businessDetails', title: 'Business Details', fieldIds: workOrderSectionStructure['Business Details'] },
  { id: 'orderDetails', title: 'Order Details', fieldIds: workOrderSectionStructure['Order Details'] },
  { id: 'clientDetails', title: 'Client Details', fieldIds: workOrderSectionStructure['Client Details'] },
  { id: 'workOrderSpecifics', title: 'Work Order Specifics', fieldIds: workOrderSectionStructure['Work Order Specifics'] },
];


const WorkItemsSection = ({ form, template }: { form: any, template: DocumentFormPropsTemplate }) => {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "workItems" });
  const includeField = template.fields.find(f => f.id === 'includeWorkDescriptionTable');

  if (!form.watch('includeWorkDescriptionTable')) return null;

  return (
    <div className="space-y-4">
      {fields.map((item, index) => (
        <div key={item.id} className="p-4 border rounded-md relative group space-y-4">
          <h4 className="text-md font-medium text-muted-foreground">Work Item #{index + 1}</h4>
          <FormField control={form.control} name={`workItems.${index}.description`} render={({ field }) => ( <FormItem> <FormLabel>Description</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          <FormField control={form.control} name={`workItems.${index}.area`} render={({ field }) => ( <FormItem> <FormLabel>Area (Sq. ft.)</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          <FormField control={form.control} name={`workItems.${index}.rate`} render={({ field }) => ( <FormItem> <FormLabel>Rate</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          {fields.length > 1 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"> <Trash2 className="h-4 w-4" /> </Button>
          )}
        </div>
      ))}
      {fields.length < 30 && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', area: '', rate: '' })}> <PlusCircle className="mr-2 h-4 w-4" /> Add Work Item </Button>
        </div>
      )}
    </div>
  );
};

const MaterialsSection = ({ form, template }: { form: any, template: DocumentFormPropsTemplate }) => {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "materials" });

  if (!form.watch('includeMaterialTable')) return null;

  return (
    <div className="space-y-4">
      {fields.map((item, index) => (
        <div key={item.id} className="p-4 border rounded-md relative group space-y-4">
          <h4 className="text-md font-medium text-muted-foreground">Material #{index + 1}</h4>
          <FormField control={form.control} name={`materials.${index}.name`} render={({ field }) => ( <FormItem> <FormLabel>Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          <FormField control={form.control} name={`materials.${index}.quantity`} render={({ field }) => ( <FormItem> <FormLabel>Quantity</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          <FormField control={form.control} name={`materials.${index}.unit`} render={({ field }) => ( <FormItem> <FormLabel>Unit</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          <FormField control={form.control} name={`materials.${index}.pricePerUnit`} render={({ field }) => ( <FormItem> <FormLabel>Price/Unit</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          {fields.length > 1 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"> <Trash2 className="h-4 w-4" /> </Button>
          )}
        </div>
      ))}
       {fields.length < 30 && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', quantity: '', unit: 'Pcs', pricePerUnit: '' })}> <PlusCircle className="mr-2 h-4 w-4" /> Add Material </Button>
        </div>
      )}
    </div>
  );
};

const LaborSection = ({ form, template }: { form: any, template: DocumentFormPropsTemplate }) => {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "labor" });

  if (!form.watch('includeLaborTable')) return null;

  return (
    <div className="space-y-4">
      {fields.map((item, index) => (
        <div key={item.id} className="p-4 border rounded-md relative group space-y-4">
          <h4 className="text-md font-medium text-muted-foreground">Labor Charge #{index + 1}</h4>
          <FormField control={form.control} name={`labor.${index}.teamName`} render={({ field }) => ( <FormItem> <FormLabel>Team/Description</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          <FormField control={form.control} name={`labor.${index}.numPersons`} render={({ field }) => ( <FormItem> <FormLabel>No. of Persons</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          <FormField control={form.control} name={`labor.${index}.amount`} render={({ field }) => ( <FormItem> <FormLabel>Amount</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          {fields.length > 1 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"> <Trash2 className="h-4 w-4" /> </Button>
          )}
        </div>
      ))}
      {fields.length < 30 && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => append({ teamName: '', numPersons: '', amount: '' })}> <PlusCircle className="mr-2 h-4 w-4" /> Add Labor Charge </Button>
        </div>
      )}
    </div>
  );
};


const InvoiceItemsSection = ({ form, template }: { form: any, template: DocumentFormPropsTemplate }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const isClaimInvoice = template.id === 'claim-invoice';
  
  if (!form.watch('includeItemsTable')) return null;

  return (
    <div className="space-y-4 border-t pt-4">
      {fields.map((item, index) => (
        <div key={item.id} className="p-4 border rounded-md relative group space-y-4">
          <h4 className="text-md font-medium text-muted-foreground">Item #{index + 1}</h4>
          <FormField control={form.control} name={`items.${index}.description`} render={({ field }) => ( <FormItem> <FormLabel>Description</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          <FormField control={form.control} name={`items.${index}.unit`} render={({ field }) => ( <FormItem> <FormLabel>Unit</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => ( <FormItem> <FormLabel>Quantity</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          <FormField control={form.control} name={`items.${index}.unitCost`} render={({ field }) => ( <FormItem> <FormLabel>Unit Cost</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          {isClaimInvoice && (
            <FormField control={form.control} name={`items.${index}.claimPercentage`} render={({ field }) => ( <FormItem> <FormLabel>Claim (%)</FormLabel> <FormControl><Input type="number" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
          )}

          {fields.length > 1 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="absolute top-2 right-2 text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      {fields.length < 30 && (
        <div className="flex justify-start">
          <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', unit: 'pcs', quantity: '', unitCost: '', claimPercentage: isClaimInvoice ? '' : undefined })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Line
          </Button>
        </div>
      )}
    </div>
  );
};



export function DocumentForm({ template }: DocumentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  // We get the form methods from the context provided by the parent page.
  const form = useFormContext(); 

  const [currentTab, setCurrentTab] = useState(WORK_ORDER_TABS_CONFIG[0].id);
  const currentTabIndex = WORK_ORDER_TABS_CONFIG.findIndex(tab => tab.id === currentTab);

  const onSubmit = async (values: Record<string, any>) => {
    const submissionValues: Record<string, any> = { ...values };
    const fileFields = template.fields.filter(f => f.type === 'file');

    const fileProcessingPromises = fileFields.map(async (fileField) => {
        const fieldId = fileField.id;
        const fileValue = values[fieldId];
        const initialValue = form.formState.defaultValues?.[fieldId];

        if (!(fileValue instanceof FileList) || fileValue.length === 0) {
            if (typeof initialValue === 'string' && initialValue.startsWith('data:image')) {
                submissionValues[fieldId] = initialValue;
            } else if (typeof fileValue === 'string' && fileValue.startsWith('data:image')) {
                submissionValues[fieldId] = fileValue;
            } else {
                submissionValues[fieldId] = '';
            }
            return;
        }

        const file = fileValue[0];
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

        if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
            toast({ variant: "destructive", title: "Invalid File Type", description: `For ${fileField.label}, please upload an image.` });
            submissionValues[fieldId] = (typeof initialValue === 'string' && initialValue.startsWith('data:image')) ? initialValue : '';
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast({ variant: "destructive", title: "File Too Large", description: `For ${fileField.label}, please upload an image smaller than 5MB.` });
            submissionValues[fieldId] = (typeof initialValue === 'string' && initialValue.startsWith('data:image')) ? initialValue : '';
            return;
        }

        try {
            const dataUri = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (event) => event.target?.result ? resolve(event.target.result as string) : reject(new Error('Failed to read file.'));
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(file);
            });
            submissionValues[fieldId] = dataUri;
        } catch (error: any) {
            toast({ variant: "destructive", title: "File Upload Failed", description: `Error processing ${fileField.label}: ${error.message || 'Unknown error'}.` });
            submissionValues[fieldId] = (typeof initialValue === 'string' && initialValue.startsWith('data:image')) ? initialValue : '';
        }
    });

    await Promise.all(fileProcessingPromises);
    
    // Ensure plain fields that might not be in the form (e.g. conditional) have a default value
    template.fields.forEach(field => {
        if (!field.id.includes('.') && submissionValues[field.id] === undefined) {
             if (field.type === 'boolean') submissionValues[field.id] = field.defaultValue !== undefined ? field.defaultValue : false;
             else if (field.type !== 'file') submissionValues[field.id] = field.defaultValue !== undefined ? field.defaultValue : (field.type === 'number' ? null : '');
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
        return <Input type="number" placeholder={field.placeholder} {...formFieldControllerProps} onChange={e => formFieldControllerProps.onChange(e.target.value === '' ? undefined : +e.target.value)} value={value} step="any" />;
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
        return <Input type="date" {...formFieldControllerProps} value={dateValue} />;
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
        name={field.id}
        render={({ field: formHookFieldRenderProps }) => (
            field.type === 'boolean' ? renderField(field, formHookFieldRenderProps) :
            <FormItem>
            <FormLabel className="font-semibold text-foreground/90">{field.label}</FormLabel>
            <FormControl>
                {renderField(field, formHookFieldRenderProps)}
            </FormControl>
            <FormMessage />
            </FormItem>
        )}
        />
    );
  };

  const handleTabChangeAttempt = async (targetTabId: string) => {
    const targetTabIndex = WORK_ORDER_TABS_CONFIG.findIndex(t => t.id === targetTabId);
    const currentActiveTabIndex = WORK_ORDER_TABS_CONFIG.findIndex(t => t.id === currentTab);

    if (targetTabIndex > currentActiveTabIndex) {
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
                    setCurrentTab(tabToValidate.id);
                    return;
                }
            }
        }
    }
    setCurrentTab(targetTabId);
  };


  const getFieldsForTabValidation = (tabId: string): (keyof FormData)[] => {
    const tabConfig = WORK_ORDER_TABS_CONFIG.find(t => t.id === tabId);
    if (!tabConfig) return [];

    let fields: (keyof FormData)[] = [...(tabConfig.fieldIds || [])];

    if (tabId === 'workOrderSpecifics') {
        const dynamicSections = [
            { toggle: 'includeWorkDescriptionTable', arrayName: 'workItems' },
            { toggle: 'includeMaterialTable', arrayName: 'materials' },
            { toggle: 'includeLaborTable', arrayName: 'labor' }
        ] as const;

        dynamicSections.forEach(section => {
            fields.push(section.toggle);
            if (form.getValues(section.toggle)) {
                const items = form.getValues(section.arrayName);
                if (Array.isArray(items)) {
                    items.forEach((_, index) => {
                        fields.push(`${section.arrayName}.${index}.description` as any); // and others
                    });
                }
            }
        });
    }

    return fields.filter(Boolean);
};


  const handleNext = async () => {
    const currentTabConfig = WORK_ORDER_TABS_CONFIG[currentTabIndex];
    const fieldsToValidate = getFieldsForTabValidation(currentTabConfig.id);

    if (fieldsToValidate.length > 0) {
        const isValid = await form.trigger(fieldsToValidate as any);
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

  const handleFormKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter' &&
        (event.target instanceof HTMLInputElement ||
         event.target instanceof HTMLTextAreaElement ||
         event.target instanceof HTMLSelectElement)) {
      if (currentTabIndex < WORK_ORDER_TABS_CONFIG.length - 1) {
        if (!(event.target instanceof HTMLTextAreaElement && event.shiftKey)) { 
          event.preventDefault();
        }
      }
    }
  };


  if (template.id === 'work-order') {
      const workOrderSpecificFields = template.fields.filter(f => ['generalWorkDescription', 'termsOfService', 'otherCosts', 'taxRatePercentage', 'approvedByName', 'dateOfApproval'].includes(f.id));
      const includeWorkDescField = template.fields.find(f => f.id === 'includeWorkDescriptionTable');
      const includeMaterialField = template.fields.find(f => f.id === 'includeMaterialTable');
      const includeLaborField = template.fields.find(f => f.id === 'includeLaborTable');

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg font-medium">Fill in the details for your {template.name}</CardTitle>
            </CardHeader>
            <form onKeyDown={handleFormKeyDown}>
                <Tabs value={currentTab} onValueChange={handleTabChangeAttempt} className="w-full">
                     <div className="px-6">
                      <div className="overflow-x-auto pb-2 -mx-6 px-6">
                        <TabsList>
                            {WORK_ORDER_TABS_CONFIG.map(tab => (
                                <TabsTrigger key={tab.id} value={tab.id} className="whitespace-nowrap">
                                    {tab.title}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                      </div>
                    </div>

                    {WORK_ORDER_TABS_CONFIG.map(tabInfo => (
                        <TabsContent key={tabInfo.id} value={tabInfo.id} className="focus-visible:ring-0 focus-visible:ring-offset-0">
                            <CardContent className="space-y-6 px-6 pb-6 pt-4">
                                {tabInfo.id === 'workOrderSpecifics' ? (
                                    <div className="space-y-6">
                                        {workOrderSpecificFields.slice(0, 2).map(field => renderFormField(field))}
                                        
                                        {includeWorkDescField && renderFormField(includeWorkDescField)}
                                        <WorkItemsSection form={form} template={template} />

                                        {includeMaterialField && renderFormField(includeMaterialField)}
                                        <MaterialsSection form={form} template={template} />

                                        {includeLaborField && renderFormField(includeLaborField)}
                                        <LaborSection form={form} template={template} />

                                        {workOrderSpecificFields.slice(2).map(field => renderFormField(field))}
                                    </div>
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

                <CardFooter className="flex justify-between border-t pt-6 mt-4 px-6 lg:hidden">
                    <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentTabIndex === 0}>
                        Previous
                    </Button>
                    {currentTabIndex === WORK_ORDER_TABS_CONFIG.length - 1 ? (
                        <Button 
                            type="button" 
                            variant="default" 
                            onClick={form.handleSubmit(onSubmit)}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            Preview Document
                        </Button>
                    ) : (
                        <Button type="button" variant="default" onClick={handleNext}>
                            Next
                        </Button>
                    )}
                </CardFooter>
                 <CardFooter className="hidden lg:flex justify-between border-t pt-6 mt-4 px-6">
                    <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentTabIndex === 0}>
                        Previous
                    </Button>
                     {currentTabIndex === WORK_ORDER_TABS_CONFIG.length - 1 ? (
                        <Button 
                            type="button" 
                            variant="default" 
                            onClick={form.handleSubmit(onSubmit)}
                        >
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
        </Card>
    );
  }

  if (template.id === 'invoice' || template.id === 'claim-invoice') {
    const includeItemsField = template.fields.find(f => f.id === 'includeItemsTable');
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Fill in the details for your {template.name}</CardTitle>
        </CardHeader>
        {/* No separate form tag here, it's handled by FormProvider from the page */}
        <CardContent className="space-y-6">
          {template.fields.filter(f => !f.id.startsWith('item') && f.id !== 'includeItemsTable').map((field) => renderFormField(field))}
          
          {includeItemsField && renderFormField(includeItemsField)}
          <InvoiceItemsSection form={form} template={template} />

        </CardContent>
        {/* Footer is removed from here and handled by the page for mobile */}
      </Card>
    );
  }

  // Default form for other templates like letterhead
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Fill in the details for your {template.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {template.fields.map((field) => renderFormField(field))}
      </CardContent>
       {/* Footer is removed from here and handled by the page for mobile */}
    </Card>
  );
}
