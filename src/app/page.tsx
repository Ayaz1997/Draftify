import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, MousePointerClick, Download, CheckCircle, PencilRuler, Bot, Sparkles, Handshake } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[80vh] items-center text-center">
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <section className="w-full py-20 lg:py-32">
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
            <div className="mt-10 flex justify-center">
              <Button asChild size="lg" className="text-lg rounded-full">
                <Link href="/dashboard">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Try App
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-16 bg-muted/50 rounded-2xl">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-12">Create Documents in 3 Easy Steps</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center p-6">
                <FileText className="h-16 w-16 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">1. Select a Template</h3>
                <p className="text-muted-foreground">Choose from a variety of professionally designed business document templates.</p>
              </div>
              <div className="flex flex-col items-center p-6">
                <MousePointerClick className="h-16 w-16 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">2. Fill in the Details</h3>
                <p className="text-muted-foreground">Enter your information into a simple, guided form with a live preview.</p>
              </div>
              <div className="flex flex-col items-center p-6">
                <Download className="h-16 w-16 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">3. Download & Share</h3>
                <p className="text-muted-foreground">Instantly download your document as a PDF to print or share digitally.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold text-foreground mb-12">Why Choose Draftify?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <Card className="hover:shadow-xl transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <PencilRuler className="h-10 w-10 text-accent" />
                        <CardTitle>Easy to Use</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Select a template, fill in the details, and your professional document is ready in minutes.</p>
                    </CardContent>
                </Card>
                 <Card className="hover:shadow-xl transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <CheckCircle className="h-10 w-10 text-accent" />
                        <CardTitle>Professional Templates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Access a library of pre-built documents for invoices, work orders, letterheads, and more.</p>
                    </CardContent>
                </Card>
                 <Card className="hover:shadow-xl transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Bot className="h-10 w-10 text-accent" />
                        <CardTitle>AI-Powered (Coming Soon)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Leverage AI to help you write content, generate ideas, and even create logos.</p>
                    </CardContent>
                </Card>
                </div>
            </div>
        </section>

        {/* Final CTA Section */}
        <section className="w-full py-16">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-foreground">Customize to your business requirements!</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    Stop wrestling with word processors. Start creating beautiful documents today.
                </p>
                <div className="mt-8">
                    <Button asChild size="lg" className="text-lg rounded-full">
                        <Link href="mailto:hey@ayaz.me">
                        <Handshake className="ml-2 h-5 w-5" /> Contact for Business Enquiries
                        </Link>
                    </Button>
                </div>
            </div>
        </section>

      </main>
    </div>
  );
}
