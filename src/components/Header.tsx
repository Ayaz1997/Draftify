
import Link from 'next/link';
import Image from 'next/image';

export function Header() {
  return (
    <header>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary hover:opacity-80 transition-opacity">
          <Image 
            src="https://placehold.co/100x100/748DA6/white?text=D&font=sans" 
            alt="Draftify Logo" 
            width={28} 
            height={28}
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
