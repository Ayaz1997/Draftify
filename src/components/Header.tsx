import Link from 'next/link';
import { FileTextIcon } from 'lucide-react'; // Using FileTextIcon as a generic document icon

export function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary hover:opacity-80 transition-opacity">
          <FileTextIcon className="h-7 w-7 text-accent" />
          <span>DocuForm</span>
        </Link>
        {/* Future navigation items can go here */}
      </div>
    </header>
  );
}
