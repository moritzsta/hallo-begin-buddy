import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { LifestyleGradientBar } from '@/components/LifestyleGradientBar';
import { CheckCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Pricing() {
  const { t } = useTranslation();

  const plans = [
    {
      name: 'Free',
      price: '0',
      uploads: 30,
      storage: '5 GB',
      maxFileSize: '25 MB',
      features: ['preview', 'badges', 'tags', 'bulk', 'i18n', 'themes']
    },
    {
      name: 'Basic',
      price: '3,99',
      uploads: 300,
      storage: '50 GB',
      maxFileSize: '250 MB',
      popular: true,
      features: ['preview', 'badges', 'tags', 'bulk', 'i18n', 'themes', 'priority']
    },
    {
      name: 'Plus',
      price: '7,99',
      uploads: 1500,
      storage: '200 GB',
      maxFileSize: '1 GB',
      features: ['preview', 'badges', 'tags', 'bulk', 'i18n', 'themes', 'priority', 'api']
    },
    {
      name: 'Max',
      price: '12,99',
      uploads: 5000,
      storage: '1 TB',
      maxFileSize: '2 GB',
      features: ['preview', 'badges', 'tags', 'bulk', 'i18n', 'themes', 'priority', 'api', 'dedicated']
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <LifestyleGradientBar />
      <PublicNavbar />
      
      {/* Hero */}
      <section className="container mx-auto px-4 pt-24 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {t('public.pricing.headline')}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('public.pricing.subtitle')}
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, idx) => (
            <Card 
              key={idx} 
              className={`p-8 rounded-2xl hover-lift ${plan.popular ? 'border-primary shadow-glow relative' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge variant="lifestyle" className="px-4 py-1">
                    {t('public.pricing.popular')}
                  </Badge>
                </div>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold">{plan.price}€</span>
                <span className="text-muted-foreground">/mon</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    <strong>{plan.uploads}</strong> {t('public.pricing.smartUploads')}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    <strong>{plan.storage}</strong> {t('public.pricing.storage')}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">
                    {t('public.pricing.maxFileSize')}: <strong>{plan.maxFileSize}</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{t('public.pricing.allFeatures')}</span>
                </li>
              </ul>
              
              <Button 
                variant={plan.popular ? 'lifestyle' : 'outline'} 
                className="w-full rounded-xl"
                asChild
              >
                <Link to="/auth">
                  {plan.price === '0' ? t('public.pricing.getStarted') : t('public.pricing.upgrade')}
                </Link>
              </Button>
            </Card>
          ))}
        </div>
        
        {/* Add-ons */}
        <div className="max-w-3xl mx-auto mt-16 text-center">
          <h3 className="text-2xl font-bold mb-6">{t('public.pricing.addons.headline')}</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 rounded-2xl">
              <h4 className="font-semibold mb-2">{t('public.pricing.addons.uploads.title')}</h4>
              <p className="text-3xl font-bold mb-2">0,99€</p>
              <p className="text-sm text-muted-foreground">{t('public.pricing.addons.uploads.desc')}</p>
            </Card>
            <Card className="p-6 rounded-2xl">
              <h4 className="font-semibold mb-2">{t('public.pricing.addons.storage.title')}</h4>
              <p className="text-3xl font-bold mb-2">0,03-0,05€</p>
              <p className="text-sm text-muted-foreground">{t('public.pricing.addons.storage.desc')}</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">
          {t('public.pricing.comparison.headline')}
        </h2>
        
        <Card className="p-6 rounded-2xl overflow-x-auto">
          <TooltipProvider>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4">{t('public.pricing.comparison.feature')}</th>
                  <th className="py-4 px-4">Free</th>
                  <th className="py-4 px-4">Basic</th>
                  <th className="py-4 px-4">Plus</th>
                  <th className="py-4 px-4">Max</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { 
                    key: 'smartUpload', 
                    tooltip: t('public.pricing.tooltips.smartUpload')
                  },
                  { 
                    key: 'preview', 
                    tooltip: t('public.pricing.tooltips.preview')
                  },
                  { 
                    key: 'rls', 
                    tooltip: t('public.pricing.tooltips.rls')
                  },
                  { 
                    key: 'signedUrls', 
                    tooltip: t('public.pricing.tooltips.signedUrls')
                  },
                  { 
                    key: 'badges'
                  },
                  { 
                    key: 'tags'
                  },
                  { 
                    key: 'bulk'
                  },
                  { 
                    key: 'i18n'
                  },
                  { 
                    key: 'themes'
                  }
                ].map((feature, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-3 px-4 flex items-center gap-2">
                      {t(`public.pricing.comparison.features.${feature.key}`)}
                      {feature.tooltip && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{feature.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <CheckCircle className="w-5 h-5 text-success mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <CheckCircle className="w-5 h-5 text-success mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <CheckCircle className="w-5 h-5 text-success mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <CheckCircle className="w-5 h-5 text-success mx-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TooltipProvider>
        </Card>
        
        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('public.pricing.vat')}
        </p>
      </section>

      <PublicFooter />
    </div>
  );
}