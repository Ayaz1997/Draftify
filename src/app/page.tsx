
import Link from 'next/link';
import { templates } from '@/lib/templates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-8 bg-gradient-to-r from-primary/10 via-background to-accent/10 rounded-lg shadow-inner">
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-4">Welcome to My Biz Docs</h1>
        <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
          Easily create professional documents from our selection of templates. Fill in the details, preview, and you're ready to go!
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-6 pb-2 border-b border-border">Choose a Template</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <template.icon className="h-8 w-8 text-accent" />
                  <CardTitle className="text-xl font-semibold text-primary">{template.name}</CardTitle>
                </div>
                <CardDescription className="text-sm text-foreground/70 min-h-[40px]">{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                {/* Optional: Could add a small visual preview or key fields here */}
              </CardContent>
              <CardFooter>
                <Button asChild variant="default" className="w-full">
                  <Link href={`/templates/${template.id}`}>
                    Create Document
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
