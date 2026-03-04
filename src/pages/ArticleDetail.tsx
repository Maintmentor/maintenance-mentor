import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  Clock,
  Tool,
  AlertTriangle,
  PlayCircle,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';

interface Article {
  title: string;
  category: string;
  color: string;
  summary: string;
  time: string;
  steps: Array<{
    title: string;
    description: string;
    safetyNote?: string;
  }>;
  parts: string[];
  videoUrl?: string;
}

// Simple in-memory database (replace with Supabase query later)
const articles: Record<string, Article> = {
  'clogged-drain': {
    title: 'Shower Drain Completely Clogged',
    category: 'Plumbing',
    color: 'plumbing',
    summary: 'Most common call in student housing. Usually hair + soap buildup in the P-trap.',
    time: '12 min',
    steps: [
      { title: 'Safety first', description: 'Turn off water at the shower valve or main shutoff.' },
      { title: 'Remove drain cover', description: 'Unscrew or pop off the strainer. Clean any visible hair.' },
      { title: 'Plunge it', description: 'Use a flat-bottom plunger with 2–3 inches of water in the shower.' },
      { title: 'Snake the drain', description: 'Insert a 25-ft drain snake and twist clockwise until it grabs the clog.' },
      { title: 'Final flush', description: 'Run hot water for 2 minutes and check flow.' },
    ],
    parts: ['Drain snake', 'Plunger', 'Zip-it tool (optional)'],
    videoUrl: 'https://www.youtube.com/embed/example-clog',
  },
  'ac-not-cooling': {
    title: 'AC Blowing Warm Air',
    category: 'HVAC',
    color: 'hvac',
    summary: 'Classic Texas summer issue — dirty filter or low refrigerant.',
    time: '18 min',
    steps: [
      { title: 'Check air filter', description: 'Replace if dirty (students almost never change them).' },
      { title: 'Check thermostat', description: 'Make sure it\u2019s set to COOL and fan is AUTO.' },
      { title: 'Inspect outdoor unit', description: 'Clear leaves, grass, and debris from the condenser.' },
      { title: 'Test capacitors', description: 'If fan spins but compressor doesn\u2019t, capacitor may be bad.' },
    ],
    parts: ['MERV 8 or 11 filter', 'Run capacitor'],
  },
  // Add more articles here as you create them
};

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? articles[slug] : null;
  const [logged, setLogged] = useState(false);

  if (!article) {
    return (
      <>
        <Sidebar />
        <main className="lg:ml-72 pt-14 lg:pt-0 min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Article not found</h1>
            <p className="mt-4">The guide you're looking for doesn't exist yet.</p>
            <Button asChild className="mt-6">
              <Link to="/knowledge-base">Back to Knowledge Base</Link>
            </Button>
          </div>
        </main>
      </>
    );
  }

  const logRepair = () => {
    // TODO: Later call Supabase + trigger slack-alert-sender
    setLogged(true);
    setTimeout(() => setLogged(false), 2000);
  };

  return (
    <>
      <Sidebar />
      <main className="lg:ml-72 pt-14 lg:pt-0 min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6 lg:p-10">
          {/* Back button */}
          <Link
            to="/knowledge-base"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Knowledge Base
          </Link>

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-10">
            <div>
              <Badge className={`mb-4 ${article.color}`}>{article.category}</Badge>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                {article.title}
              </h1>
              <p className="mt-4 text-xl text-muted-foreground max-w-2xl">
                {article.summary}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground whitespace-nowrap">
              <Clock className="h-4 w-4" />
              {article.time} fix
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-4 mb-12">
            <Button onClick={logRepair} size="lg" className="flex-1 lg:flex-none">
              {logged ? '\u2705 Logged to History' : 'Log This Repair'}
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href={article.videoUrl || '#'} target="_blank" rel="noopener">
                <PlayCircle className="mr-2 h-5 w-5" />
                Watch Video
              </a>
            </Button>
          </div>

          {/* Summary Card */}
          <Card className="p-8 mb-12 bg-card">
            <h3 className="font-semibold mb-4">Quick Summary</h3>
            <p className="text-foreground/90 leading-relaxed">{article.summary}</p>
          </Card>

          {/* Step-by-Step */}
          <h2 className="text-2xl font-semibold mb-6">Step-by-Step Repair</h2>
          <Accordion type="single" collapsible className="space-y-4" defaultValue="step-0">
            {article.steps.map((step, index) => (
              <AccordionItem
                key={index}
                value={`step-${index}`}
                className="border border-border rounded-2xl overflow-hidden"
              >
                <AccordionTrigger className="px-8 py-6 text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-mono text-primary">
                      {index + 1}
                    </div>
                    <span className="font-semibold text-lg">{step.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-8 pb-8 pt-2">
                  <p className="text-foreground/90 leading-relaxed">{step.description}</p>
                  {step.safetyNote && (
                    <div className="mt-6 bg-urgent/10 border-l-4 border-urgent p-4 rounded-r-xl flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-urgent mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-urgent">{step.safetyNote}</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Parts Needed */}
          {article.parts && article.parts.length > 0 && (
            <Card className="mt-12 p-8">
              <h3 className="font-semibold mb-5 flex items-center gap-2">
                <Tool className="h-5 w-5" />
                Parts / Tools Needed
              </h3>
              <div className="flex flex-wrap gap-3">
                {article.parts.map((part, i) => (
                  <Badge key={i} variant="secondary" className="text-base py-3 px-6">
                    {part}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Related Guides */}
          <div className="mt-16">
            <h3 className="font-semibold mb-4">Related Guides</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(articles)
                .filter(([key]) => key !== slug)
                .slice(0, 2)
                .map(([key, art]) => (
                  <Link key={key} to={`/knowledge-base/${key}`}>
                    <Card className="p-6 hover:bg-muted/50 transition-colors">
                      <Badge className={`mb-3 ${art.color}`}>{art.category}</Badge>
                      <p className="font-medium leading-tight">{art.title}</p>
                    </Card>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
