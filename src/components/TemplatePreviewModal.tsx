
'use client';

import React, { useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { templates } from '@/lib/templates';
import type { FormData } from '@/types';
import { sampleData } from '@/lib/sample-data';

interface TemplatePreviewModalProps {
  templateId: string | null;
  onClose: () => void;
}

export function TemplatePreviewModal({ templateId, onClose }: TemplatePreviewModalProps) {
  const template = useMemo(() => {
    if (!templateId) return null;
    return templates.find(t => t.id === templateId) || null;
  }, [templateId]);

  const data: FormData = useMemo(() => {
    if (!templateId) return {};
    return sampleData[templateId] || {};
  }, [templateId]);

  const open = !!templateId;

  if (!template) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-2 sm:p-4">
        <div className="flex-grow overflow-auto rounded-lg">
          {template.previewLayout(data)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
