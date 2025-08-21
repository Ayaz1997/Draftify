
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

  const onSubmit = form.handleSubmit(async (values: Record<string, any>) => {
    // Note: The actual submission logic including file handling is now in TemplateClientPage
    // This function is here to be attached to the button, but the parent's onSubmit will be called.
  });


  const renderField = (field: TemplateField, formFieldControllerProps: any) => {
    const { value, ...rest } = formFieldControllerProps;
    const numericValue = (field.type === 'number' && (value === undefined || value === null)) ? '' : value;

    switch (field.type) {
      case 'textarea': {
        return <Textarea placeholder={field.placeholder} {...rest} value={value || ''} rows={field.rows || 5} />;
      }
      case 'number': {
        return <Input type="number" placeholder={field.placeholder} {...rest} onChange={e => rest.onChange(e.target.value === '' ? undefined : +e.target.value)} value={numericValue} step="any" />;
      }
      case 'date': {
        let dateValue = value || '';
        if (dateValue && typeof dateValue === 'string' && !dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            try {
                const parsed = new Date(dateValue);
                if(!isNaN(parsed.getTime())) dateValue = parsed.toISOString().split('T')[0];
                else dateValue = '';
            } catch {
                dateValue = '';
            }
        }
        return <Input type="date" {...rest} value={dateValue} />;
      }
      case 'email': {
        return <Input type="email" placeholder={field.placeholder} {...rest} value={value || ''} />;
      }
      case 'file': {
        const { onChange, value: fileValue, ...fileProps } = rest;
        return (
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onChange(e.target.files[0]); // Pass the File object
                }
              }}
              {...fileProps}
              className="pt-2"
            />
        );
      }
      case 'boolean': {
        return (
          <FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2">
            <FormControl>
              <Checkbox
                checked={value || false}
                onCheckedChange={rest.onChange}
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
            onValueChange={rest.onChange}
            value={String(value || '')}
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
        return <Input type="text" placeholder={field.placeholder} {...rest} value={value || ''} />;
      }
      default: {
        const exhaustiveCheck: never = field.type;
        console.warn(`Unhandled field type in renderField: ${exhaustiveCheck}`);
        return <Input type="text" placeholder={field.placeholder} {...rest} value={value || ''} />;
      }
    }
  };

  const renderFormField = (field?: TemplateField) => {
    if (!field) return null;

    if (field.type === 'file') {
      return (
        <FormField
          key={field.id}
          control={form.control}
          name={field.id}
          render={({ field: { value, onChange, ...rest } }) => (
            <FormItem>
              <FormLabel className="font-semibold text-foreground/90">{field.label}</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                  {...rest}
                  className="pt-2"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }
    
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
        <Card className="shadow-none border-0">
            <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg font-medium">Fill in the details for your {template.name}</CardTitle>
            </CardHeader>
            <form onKeyDown={handleFormKeyDown} onSubmit={(e) => e.preventDefault()}>
                <Tabs value={currentTab} onValueChange={handleTabChangeAttempt} className="w-full">
                     <div className="relative px-0">
                      <div className="overflow-x-auto pb-2 -mx-0 px-0">
                        <TabsList className="inline-flex">
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
                            <CardContent className="space-y-6 px-1 pb-6 pt-4">
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

                 <CardFooter className="flex justify-between border-t pt-6 mt-4 px-1">
                    <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentTabIndex === 0}>
                        Previous
                    </Button>
                     {currentTabIndex === WORK_ORDER_TABS_CONFIG.length - 1 ? (
                       null
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

  // Fallback for non-tabbed forms
  return (
    <Card className="shadow-none border-0">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-lg font-medium">Fill in the details for your {template.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-1">
        {template.fields.filter(f => !f.id.startsWith('item') && f.id !== 'includeItemsTable').map((field) => renderFormField(field))}
        
        {template.id !== 'letterhead' && template.fields.find(f => f.id === 'includeItemsTable') && renderFormField(template.fields.find(f => f.id === 'includeItemsTable'))}
        {(template.id === 'invoice' || template.id === 'claim-invoice') && (
          <InvoiceItemsSection form={form} template={template} />
        )}

      </CardContent>
    </Card>
  );
}
