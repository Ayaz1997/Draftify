
import Link from 'next/link';
import { Building2 } from 'lucide-react'; // Changed from FileTextIcon

export function Header() {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary hover:opacity-80 transition-opacity">
          <Building2 className="h-7 w-7 text-accent" /> {/* Changed icon */}
          <span>My Biz Docs</span> {/* Changed text */}
        </Link>
        {/* Future navigation items can go here */}
      </div>
    </header>
  );
}
