'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { businessCategories } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface CategorySelectionModalProps {
  open: boolean;
  onClose: () => void;
}

export function CategorySelectionModal({ open, onClose }: CategorySelectionModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedCategory) {
      // In a real app, you might save this preference to a user profile or global state.
      console.log('Selected Category:', selectedCategory);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Select your business type to continue</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2 -mr-6 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {businessCategories.map((category) => (
              <div
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={cn(
                  'flex flex-col items-center justify-center p-4 border rounded-lg aspect-square cursor-pointer transition-colors hover:bg-accent/50',
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
        <DialogFooter>
          <Button
            type="button"
            onClick={handleContinue}
            disabled={!selectedCategory}
            className="w-full sm:w-auto"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
