import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { LifestyleGradientBar } from '@/components/LifestyleGradientBar';
import { SEOHead } from '@/components/SEOHead';
import { 
  Sparkles, Lock, Zap, Eye, Tag, Upload, CheckCircle, 
  Shield, Globe, Palette, FolderOpen, FileText, Star
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={t('public.hero.headline') + ' - Smart Docs'}
        description={t('public.hero.subtitle')}
      />
      <LifestyleGradientBar />
      <PublicNavbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <Badge variant="lifestyle" className="text-base px-4 py-2">
            {t('public.hero.badge')}
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            {t('public.hero.headline')}
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            {t('public.hero.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              variant="lifestyle"
              className="text-lg px-8 py-6 rounded-2xl shadow-glow hover-lift"
              asChild
            >
              <Link to="/auth">{t('public.hero.ctaPrimary')}</Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6 rounded-2xl"
            >
              {t('public.hero.ctaSecondary')}
            </Button>
          </div>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center items-center gap-4 pt-8">
            <Badge variant="outline" className="gap-2">
              <Shield className="w-4 h-4" />
              {t('public.hero.dsgvo')}
            </Badge>
            <Badge variant="outline" className="gap-2">
              <Globe className="w-4 h-4" />
              {t('public.hero.eu')}
            </Badge>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Sparkles,
              title: t('public.benefits.smart.title'),
              desc: t('public.benefits.smart.desc'),
              color: 'from-primary to-primary-glow'
            },
            {
              icon: FolderOpen,
              title: t('public.benefits.auto.title'),
              desc: t('public.benefits.auto.desc'),
              color: 'from-secondary to-info'
            },
            {
              icon: Lock,
              title: t('public.benefits.secure.title'),
              desc: t('public.benefits.secure.desc'),
              color: 'from-success to-success/70'
            },
            {
              icon: Eye,
              title: t('public.benefits.preview.title'),
              desc: t('public.benefits.preview.desc'),
              color: 'from-warning to-warning/70'
            }
          ].map((benefit, idx) => (
            <Card key={idx} className="p-6 hover-lift rounded-2xl">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-4`}>
                <benefit.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('public.features.headline')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('public.features.subtitle')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Tag, title: t('public.features.tags.title'), desc: t('public.features.tags.desc') },
            { icon: Upload, title: t('public.features.bulk.title'), desc: t('public.features.bulk.desc') },
            { icon: Globe, title: t('public.features.i18n.title'), desc: t('public.features.i18n.desc') },
            { icon: Palette, title: t('public.features.theme.title'), desc: t('public.features.theme.desc') },
            { icon: FileText, title: t('public.features.badges.title'), desc: t('public.features.badges.desc') },
            { icon: Zap, title: t('public.features.fast.title'), desc: t('public.features.fast.desc') }
          ].map((feature, idx) => (
            <Card key={idx} className="p-6 rounded-2xl hover-scale">
              <feature.icon className="w-8 h-8 text-primary mb-3" />
              <h4 className="font-semibold mb-2">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('public.howItWorks.headline')}
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              step: '1',
              icon: Upload,
              title: t('public.howItWorks.step1.title'),
              desc: t('public.howItWorks.step1.desc')
            },
            {
              step: '2',
              icon: Eye,
              title: t('public.howItWorks.step2.title'),
              desc: t('public.howItWorks.step2.desc')
            },
            {
              step: '3',
              icon: CheckCircle,
              title: t('public.howItWorks.step3.title'),
              desc: t('public.howItWorks.step3.desc')
            }
          ].map((step, idx) => (
            <div key={idx} className="text-center">
              <div className="relative inline-flex mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-2xl font-bold text-white shadow-glow">
                  {step.step}
                </div>
              </div>
              <step.icon className="w-12 h-12 text-primary mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">{step.title}</h4>
              <p className="text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('public.pricingTeaser.headline')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('public.pricingTeaser.subtitle')}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            { name: 'Free', price: '0', uploads: '30', storage: '5 GB' },
            { name: 'Basic', price: '3,99', uploads: '300', storage: '50 GB', popular: true },
            { name: 'Plus', price: '7,99', uploads: '1.500', storage: '200 GB' },
            { name: 'Max', price: '12,99', uploads: '5.000', storage: '1 TB' }
          ].map((plan, idx) => (
            <Card key={idx} className={`p-6 rounded-2xl hover-lift ${plan.popular ? 'border-primary shadow-glow' : ''}`}>
              {plan.popular && (
                <Badge variant="lifestyle" className="mb-4">
                  {t('public.pricingTeaser.popular')}
                </Badge>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">{plan.price}€</span>
                <span className="text-muted-foreground">/mon</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-success" />
                  {plan.uploads} Smart Uploads
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-success" />
                  {plan.storage} Speicher
                </li>
              </ul>
              <Button variant={plan.popular ? 'lifestyle' : 'outline'} className="w-full rounded-xl" asChild>
                <Link to="/auth">{t('public.pricingTeaser.cta')}</Link>
              </Button>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Button variant="outline" size="lg" className="rounded-xl" asChild>
            <Link to="/pricing">{t('public.pricingTeaser.allPlans')}</Link>
          </Button>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('public.testimonials.headline')}
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            {
              name: 'Anna M.',
              role: t('public.testimonials.t1.role'),
              text: t('public.testimonials.t1.text')
            },
            {
              name: 'Thomas K.',
              role: t('public.testimonials.t2.role'),
              text: t('public.testimonials.t2.text')
            },
            {
              name: 'Lisa S.',
              role: t('public.testimonials.t3.role'),
              text: t('public.testimonials.t3.text')
            }
          ].map((testimonial, idx) => (
            <Card key={idx} className="p-6 rounded-2xl">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
              <div>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('public.faq.headline')}
          </h2>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-4">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <Card key={num} className="p-6 rounded-2xl">
              <h4 className="font-semibold mb-2">{t(`public.faq.q${num}.question`)}</h4>
              <p className="text-muted-foreground">{t(`public.faq.q${num}.answer`)}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-16">
        <Card className="p-12 rounded-3xl text-center gradient-lifestyle-soft">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('public.finalCta.headline')}
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('public.finalCta.subtitle')}
          </p>
          <Button size="lg" variant="lifestyle" className="text-lg px-8 py-6 rounded-2xl shadow-glow" asChild>
            <Link to="/auth">{t('public.finalCta.cta')}</Link>
          </Button>
        </Card>
      </section>

      <PublicFooter />
    </div>
  );
}