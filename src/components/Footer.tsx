
import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Send } from 'lucide-react';
import { Button } from './ui/button';
import Image from 'next/image';
import { Input } from './ui/input';

export function Footer() {
  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Column 1: Brand and Social */}
          <div className="space-y-4">
             <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary hover:opacity-80 transition-opacity">
               <Image 
                src="/doc-illustration.svg"
                alt="Draftify Logo" 
                width={32} 
                height={32}
                data-ai-hint="logo icon"
                className="rounded-md"
              />
              <span>Draftify</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs">
              AI-powered document template designed to help you create and manage business documents effortlessly and fast.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Send className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Column 2: Company Links */}
          <div className="text-sm">
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Home</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">About us</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Pricing</Link></li>
            </ul>
          </div>

          {/* Column 3: Product Links */}
          <div className="text-sm">
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Features</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Careers</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">How it works</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Contact</Link></li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="text-sm">
            <h3 className="font-semibold text-foreground mb-4">Newsletter</h3>
            <p className="text-muted-foreground mb-4">Get tips, product updates, and insights on working smarter with AI.</p>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="email" placeholder="Email address" className="rounded-full" />
              <Button type="submit" variant="default" className="rounded-full">Subscribe</Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p className="mb-4 md:mb-0">
             © 2025 — Developed and maintained by <a href="https://ayaz.me/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ayaz</a> at <a href="https://www.runtime.works/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">runtime.works</a>
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-primary">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary">Terms of Service</Link>
            <Link href="#" className="hover:text-primary">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
