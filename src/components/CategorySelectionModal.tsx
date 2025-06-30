
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { businessCategories } from '@/lib/categories';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';

interface CategorySelectionModalProps {
  open: boolean;
  onClose: () => void;
}

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  businessName: z.string().min(2, { message: "Business name must be at least 2 characters." }),
  businessLogo: z.any().optional(),
  businessAddress: z.string().min(10, { message: "Please enter a complete address." }),
  businessWebsite: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  facebook: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  instagram: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  linkedin: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  twitter: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  gstNumber: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function CategorySelectionModal({ open, onClose }: CategorySelectionModalProps) {
  const [step, setStep] = useState<'category' | 'profile'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      businessName: "",
      businessAddress: "",
      businessWebsite: "",
      facebook: "",
      instagram: "",
      linkedin: "",
      twitter: "",
      gstNumber: "",
    },
  });

  const handleCategoryContinue = () => {
    if (selectedCategory) {
      setStep('profile');
    }
  };

  const handleProfileSubmit = (values: ProfileFormValues) => {
    // In a real app, you would save this data to a database or global state.
    console.log({
      ...values,
      businessCategory: selectedCategory,
    });
    onClose();
  };

  const renderCategorySelector = () => (
    <>
      <DialogHeader className="px-6 pt-6">
        <DialogTitle className="text-2xl">Select your business type to continue</DialogTitle>
      </DialogHeader>
      <div className="flex-grow overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-6">
          {businessCategories.map((category) => (
            <div
              key={category.name}
              onClick={() => setSelectedCategory(category.name)}
              className={cn(
                'flex flex-col items-center justify-center p-4 border rounded-lg aspect-square cursor-pointer transition-colors hover:bg-accent/20',
                selectedCategory === category.name && 'bg-primary/10 ring-2 ring-primary'
              )}
              data-selected={selectedCategory === category.name}
            >
              <category.icon className="h-10 w-10 mb-2 text-primary" />
              <p className="text-sm font-medium text-center text-foreground">{category.name}</p>
            </div>
          ))}
        </div>
      </div>
      <DialogFooter className="px-6 pb-6 pt-4 border-t">
        <Button
          type="button"
          onClick={handleCategoryContinue}
          disabled={!selectedCategory}
          className="w-full sm:w-auto"
        >
          Continue
        </Button>
      </DialogFooter>
    </>
  );

  const renderProfileForm = () => (
    <>
      <DialogHeader className="px-6 pt-6">
        <DialogTitle className="text-2xl">Create Your Business Profile</DialogTitle>
        <DialogDescription>
          This information will be used to pre-fill documents for you.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="flex-grow overflow-y-auto">
          <div className="space-y-4 px-6 py-4">
            <div className="bg-muted p-3 rounded-md flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Business Category</p>
                <p className="font-semibold text-primary">{selectedCategory}</p>
              </div>
              <Button variant="outline" size="sm" type="button" onClick={() => setStep('category')}>
                Change
              </Button>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John's Plumbing Co." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="businessLogo"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Business Logo</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files)} {...rest} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="123 Main St, Anytown, USA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessWebsite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Website (Optional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://www.yourbusiness.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Business Socials (Optional)</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <FormField
                  control={form.control}
                  name="facebook"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative flex items-center">
                        <Facebook className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                          <Input type="url" placeholder="Facebook URL" {...field} className="pl-8" />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative flex items-center">
                        <Instagram className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                          <Input type="url" placeholder="Instagram URL" {...field} className="pl-8" />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative flex items-center">
                        <Linkedin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                          <Input type="url" placeholder="LinkedIn URL" {...field} className="pl-8" />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="twitter"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative flex items-center">
                        <Twitter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                          <Input type="url" placeholder="Twitter/X URL" {...field} className="pl-8" />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="gstNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="22AAAAA0000A1Z5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
       <DialogFooter className="px-6 pb-6 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => setStep('category')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button type="button" onClick={form.handleSubmit(handleProfileSubmit)} className="w-full sm:w-auto">
          Submit & Create Profile
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] flex flex-col p-0 rounded-lg">
        {step === 'category' ? renderCategorySelector() : renderProfileForm()}
      </DialogContent>
    </Dialog>
  );
}
