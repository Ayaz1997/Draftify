
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export function Header() {
  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl">
      <div className="w-full bg-background/60 backdrop-blur-lg border rounded-full shadow-lg p-2 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary hover:opacity-80 transition-opacity pl-4">
          <Image 
            src="/doc-illustration.svg"
            alt="Draftify Logo" 
            width={32} 
            height={32}
            data-ai-hint="logo icon"
            className="rounded-md"
          />
          <span className="hidden sm:inline-block">Draftify</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground/80">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <Link href="#" className="hover:text-primary transition-colors">Pricing</Link>
          <Link href="#" className="hover:text-primary transition-colors">About Us</Link>
          <Link href="#" className="hover:text-primary transition-colors">Resources</Link>
        </nav>

        <div className="flex items-center gap-2 pr-2">
          <Button variant="ghost" asChild className="rounded-full">
            <Link href="#">Create an account</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/dashboard">
              <Sparkles className="mr-2 h-4 w-4" />
              Try App
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
