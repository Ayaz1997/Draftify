
import Link from 'next/link';
import Image from 'next/image';

export function Header() {
  return (
    <header>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-xl font-semibold text-primary hover:opacity-80 transition-opacity">
          <Image 
            src="/doc-illustration.svg"
            alt="Draftify Logo" 
            width={40} 
            height={40}
            data-ai-hint="logo icon"
            className="rounded-md"
          />
          <span>Draftify</span>
        </Link>
        {/* Future navigation items can go here */}
      </div>
    </header>
  );
}
