import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { LifestyleGradientBar } from '@/components/LifestyleGradientBar';
import { SEOHead } from '@/components/SEOHead';
import { Receipt, FileText, Briefcase, Heart, Camera, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UseCases() {
  const { t } = useTranslation();

  const useCases = [
    {
      icon: Receipt,
      emoji: '🧾',
      color: 'from-primary to-primary-glow',
      key: 'finance'
    },
    {
      icon: FileCheck,
      emoji: '📋',
      color: 'from-secondary to-info',
      key: 'contracts'
    },
    {
      icon: FileText,
      emoji: '🏛️',
      color: 'from-warning to-warning/70',
      key: 'official'
    },
    {
      icon: Briefcase,
      emoji: '💼',
      color: 'from-success to-success/70',
      key: 'work'
    },
    {
      icon: Heart,
      emoji: '🏥',
      color: 'from-destructive/80 to-destructive/60',
      key: 'health'
    },
    {
      icon: Camera,
      emoji: '✈️',
      color: 'from-info to-secondary',
      key: 'travel'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={t('public.useCases.headline') + ' - Smart Docs'}
        description={t('public.useCases.subtitle')}
      />
      <LifestyleGradientBar />
      <PublicNavbar />
      
      {/* Hero */}
      <section className="container mx-auto px-4 pt-24 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {t('public.useCases.headline')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('public.useCases.subtitle')}
        </p>
      </section>

      {/* Use Cases Grid */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {useCases.map((useCase, idx) => (
            <Card key={idx} className="p-8 rounded-2xl hover-lift">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${useCase.color} flex items-center justify-center mb-6 shadow-lg`}>
                <span className="text-3xl">{useCase.emoji}</span>
              </div>
              
              <h3 className="text-2xl font-bold mb-3">
                {t(`public.useCases.cases.${useCase.key}.title`)}
              </h3>
              
              <p className="text-muted-foreground mb-4">
                {t(`public.useCases.cases.${useCase.key}.desc`)}
              </p>
              
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-sm font-medium mb-2">
                  {t('public.useCases.howItHelps')}
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {t(`public.useCases.cases.${useCase.key}.help1`)}</li>
                  <li>• {t(`public.useCases.cases.${useCase.key}.help2`)}</li>
                  <li>• {t(`public.useCases.cases.${useCase.key}.help3`)}</li>
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="p-12 rounded-3xl text-center gradient-lifestyle-soft max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('public.useCases.cta.headline')}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t('public.useCases.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="lifestyle" className="text-lg px-8 py-6 rounded-2xl shadow-glow" asChild>
              <Link to="/auth">{t('public.useCases.cta.primary')}</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-2xl" asChild>
              <Link to="/pricing">{t('public.useCases.cta.secondary')}</Link>
            </Button>
          </div>
        </Card>
      </section>

      <PublicFooter />
    </div>
  );
}