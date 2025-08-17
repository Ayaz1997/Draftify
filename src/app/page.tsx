
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, MousePointerClick, Download, CheckCircle, PencilRuler, Bot, Sparkles, Handshake, Palette, Zap, Share2, Check } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[80vh] items-center text-center">
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <section className="w-full py-20 lg:py-24">
          <div className="max-w-5xl mx-auto">
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
            <div className="mt-16">
              <Image 
                src="https://placehold.co/1200x800.png" 
                alt="Draftify application screenshot"
                width={1200}
                height={800}
                className="rounded-xl shadow-2xl ring-1 ring-black/10"
                data-ai-hint="app screenshot"
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="w-full py-16">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Create Documents in 3 Easy Steps</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-background rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-4 flex flex-col items-start text-left">
                  <Image 
                    src="https://placehold.co/500x300.png" 
                    alt="Illustration for selecting a template"
                    width={500}
                    height={300}
                    className="rounded-lg mb-6"
                    data-ai-hint="select template"
                  />
                  <h3 className="text-xl font-semibold mb-2">1. Select a Template</h3>
                  <p className="text-muted-foreground">Choose from a variety of professionally designed business document templates.</p>
                </CardContent>
              </Card>
              <Card className="bg-background rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-4 flex flex-col items-start text-left">
                   <Image 
                    src="https://placehold.co/500x300.png" 
                    alt="Illustration for filling in details"
                    width={500}
                    height={300}
                    className="rounded-lg mb-6"
                    data-ai-hint="fill form"
                  />
                  <h3 className="text-xl font-semibold mb-2">2. Fill in the Details</h3>
                  <p className="text-muted-foreground">Enter your information into a simple, guided form with a live preview.</p>
                </CardContent>
              </Card>
              <Card className="bg-background rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-4 flex flex-col items-start text-left">
                   <Image 
                    src="https://placehold.co/500x300.png" 
                    alt="Illustration for downloading a document"
                    width={500}
                    height={300}
                    className="rounded-lg mb-6"
                    data-ai-hint="download share"
                  />
                  <h3 className="text-xl font-semibold mb-2">3. Download & Share</h3>
                  <p className="text-muted-foreground">Instantly download your document as a PDF to print or share digitally.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section - Bento Grid */}
        <section className="w-full py-24">
            <div className="max-w-5xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Why Choose Draftify?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    {/* Card 1 */}
                    <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-gray-100 flex flex-col">
                        <Image 
                            src="https://placehold.co/600x400.png" 
                            alt="Template Variety" 
                            width={600} 
                            height={400} 
                            className="rounded-xl mb-6"
                            data-ai-hint="template variety"
                        />
                        <h3 className="text-xl font-semibold mb-2 text-foreground">Professional Templates</h3>
                        <p className="text-muted-foreground">Access a library of pre-built documents for invoices, work orders, letterheads, and more. Look professional from day one.</p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-gray-100 flex flex-col">
                        <Image 
                            src="https://placehold.co/600x400.png" 
                            alt="Easy to Use" 
                            width={600} 
                            height={400} 
                            className="rounded-xl mb-6"
                            data-ai-hint="intuitive interface"
                        />
                        <h3 className="text-xl font-semibold mb-2 text-foreground">Intuitive & Fast</h3>
                        <p className="text-muted-foreground">Our guided forms and live preview make document creation effortless. No more fighting with word processors.</p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-gray-100 flex flex-col">
                        <Image 
                            src="https://placehold.co/600x400.png" 
                            alt="AI-Powered Assistance" 
                            width={600} 
                            height={400} 
                            className="rounded-xl mb-6"
                            data-ai-hint="ai assistant"
                        />
                        <h3 className="text-xl font-semibold mb-2 text-foreground">AI-Powered Assistance</h3>
                        <p className="text-muted-foreground">Leverage AI to help you write content, generate ideas, and ensure your documents are error-free. (Coming Soon)</p>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-gray-100 flex flex-col">
                        <Image 
                            src="https://placehold.co/600x400.png" 
                            alt="Instant Download & Share" 
                            width={600} 
                            height={400} 
                            className="rounded-xl mb-6"
                            data-ai-hint="download share"
                        />
                        <h3 className="text-xl font-semibold mb-2 text-foreground">Instant Download & Share</h3>
                        <p className="text-muted-foreground">Generate a pixel-perfect PDF of your document in seconds. Print it, email it, or share it via your favorite apps.</p>
                    </div>
                    
                    {/* Card 5 (Full Width) */}
                    <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-xl border-4 border-gray-100 flex flex-col md:flex-row items-center gap-8">
                         <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2 text-foreground">Customize to Your Brand</h3>
                            <p className="text-muted-foreground">Add your company logo, choose your brand colors, and save your business details to create documents that are uniquely yours.</p>
                        </div>
                        <div className="flex-1 w-full">
                             <Image 
                                src="https://placehold.co/600x400.png" 
                                alt="Brand Customization" 
                                width={600} 
                                height={400} 
                                className="rounded-xl"
                                data-ai-hint="brand customization"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Pricing Section */}
        <section className="w-full py-24">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 text-center">Pricing plans</h2>
            <p className="text-lg text-muted-foreground mb-12 text-center">Choose the right plan for your needs</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Starter Plan */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col h-full">
                <div className="flex-grow">
                  <div className="bg-gray-100 rounded-full px-4 py-1 text-sm font-semibold inline-block mb-6">Starter</div>
                  <div className="mb-6">
                    <span className="text-5xl font-bold">$0</span>
                    <span className="text-muted-foreground text-lg">/month</span>
                  </div>
                  <p className="text-muted-foreground mb-8">Perfect for Small Teams</p>
                  <Button className="w-full bg-black text-white hover:bg-gray-800 rounded-full text-lg py-6">Start Hiring</Button>
                  <ul className="mt-8 space-y-4 text-left">
                    <li className="flex items-center gap-3"><Check className="text-green-500 h-5 w-5" /><span>3 Projects</span></li>
                    <li className="flex items-center gap-3"><Check className="text-green-500 h-5 w-5" /><span>AI Application Screening</span></li>
                    <li className="flex items-center gap-3"><Check className="text-green-500 h-5 w-5" /><span>AI Recruiter</span></li>
                  </ul>
                </div>
              </div>

              {/* Professional Plan */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col h-full border-2 border-primary">
                <div className="flex-grow">
                  <div className="bg-gray-100 rounded-full px-4 py-1 text-sm font-semibold inline-block mb-6">PROFESSIONAL</div>
                  <div className="rounded-2xl bg-gradient-to-br from-blue-200 via-yellow-50 to-orange-200 p-8 mb-6">
                    <span className="text-5xl font-bold">$99</span>
                    <span className="text-muted-foreground text-lg">/month</span>
                  </div>
                  <p className="text-muted-foreground mb-8">Perfect for Growing Teams</p>
                  <Button className="w-full bg-black text-white hover:bg-gray-800 rounded-full text-lg py-6">Start Hiring</Button>
                  <ul className="mt-8 space-y-4 text-left">
                    <li className="flex items-center gap-3"><Check className="text-green-500 h-5 w-5" /><span>Unlimited Projects</span></li>
                    <li className="flex items-center gap-3"><Check className="text-green-500 h-5 w-5" /><span>AI Application Screening</span></li>
                    <li className="flex items-center gap-3"><Check className="text-green-500 h-5 w-5" /><span>AI Recruiter</span></li>
                    <li className="flex items-center gap-3"><Check className="text-green-500 h-5 w-5" /><span>Risk-Free Guarantee</span></li>
                  </ul>
                </div>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col h-full">
                <div className="flex-grow">
                  <div className="bg-gray-100 rounded-full px-4 py-1 text-sm font-semibold inline-block mb-6">ENTERPRISE</div>
                  <div className="mb-6">
                    <span className="text-5xl font-bold">Custom</span>
                  </div>
                  <p className="text-muted-foreground mb-8">For Large Organizations</p>
                  <Button className="w-full bg-black text-white hover:bg-gray-800 rounded-full text-lg py-6">Contact us</Button>
                   <ul className="mt-8 space-y-4 text-left">
                    <li className="flex items-center gap-3"><Check className="text-green-500 h-5 w-5" /><span>Unlimited Projects</span></li>
                    <li className="flex items-center gap-3"><Check className="text-green-500 h-5 w-5" /><span>AI Application Screening</span></li>
                    <li className="flex items-center gap-3"><Check className="text-green-500 h-5 w-5" /><span>Custom Skill Assessments</span></li>
                     <li className="flex items-center gap-3"><Check className="text-green-500 h-5 w-5" /><span>AI Application Screening</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="w-full py-16">
            <div className="max-w-3xl mx-auto text-center">
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
