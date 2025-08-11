
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[80vh] items-center justify-center text-center">
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
              <Image 
                src="/doc-illustration.svg"
                alt="Draftify document icon"
                width={120}
                height={120}
                className="mx-auto"
                data-ai-hint="document illustration"
              />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-primary tracking-tight">
            Welcome to Draftify
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg sm:text-xl text-foreground/80">
            Professional paperwork, made playful.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Go to App <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground">Why Choose Draftify?</h2>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="flex items-start space-x-4">
                <CheckCircle className="h-8 w-8 text-green-500 mt-1 shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold">Easy to Use</h3>
                  <p className="text-muted-foreground">Select a template, fill in the details, and your document is ready.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="h-8 w-8 text-green-500 mt-1 shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold">Professional Templates</h3>
                  <p className="text-muted-foreground">Access a library of pre-built documents for any business need.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <CheckCircle className="h-8 w-8 text-green-500 mt-1 shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold">Download & Share</h3>
                  <p className="text-muted-foreground">Instantly download your documents as PDFs or share them with ease.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
