
import Link from 'next/link';
import { Building2, MessageSquare, Twitter, Dribbble, Linkedin, Globe } from 'lucide-react';
import { Button } from './ui/button';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Left Column */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary hover:opacity-80 transition-opacity">
              <Building2 className="h-7 w-7 text-accent" />
              <span>My Biz Docs</span>
            </Link>
            <p className="text-lg font-semibold text-foreground max-w-xs">
              Have a project idea to build?
            </p>
            <Button asChild>
              <a href="mailto:hey@ayaz.me">
                <MessageSquare className="mr-2 h-4 w-4" />
                Let's talk
              </a>
            </Button>
          </div>

          {/* Right Column */}
          <div className="flex flex-col items-start md:items-end gap-4">
            <p className="font-semibold text-foreground">Find me on</p>
            <div className="flex items-center gap-4">
              <a href="https://x.com/SkAyaz97" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-6 w-6" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="https://dribbble.com/Ayaz97" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Dribbble className="h-6 w-6" />
                <span className="sr-only">Dribbble</span>
              </a>
              <a href="https://linkedin.com/in/skayaz97" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-6 w-6" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="https://ayaz.me/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Globe className="h-6 w-6" />
                <span className="sr-only">Website</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} — Developed and maintained by{' '}
            <a href="https://ayaz.me/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
              Ayaz
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
