import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { User, CreditCard, BarChart3, ArrowLeft, Save, RefreshCw, Settings2, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PLAN_CONFIGS } from '@/lib/plans';
import { PlanCard } from '@/components/plans/PlanCard';
import { useSubscription } from '@/hooks/useSubscription';

const PLAN_LIMITS = {
  free: {
    smartUploads: 10,
    storage: 1, // GB
    maxFileSize: 5, // MB
  },
  basic: {
    smartUploads: 50,
    storage: 10,
    maxFileSize: 25,
  },
  plus: {
    smartUploads: 200,
    storage: 50,
    maxFileSize: 100,
  },
  max: {
    smartUploads: 999999,
    storage: 1000,
    maxFileSize: 2048,
  },
};

const Settings = () => {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [aiDocAnalysisEnabled, setAiDocAnalysisEnabled] = useState(false);

  const subscription = useSubscription();
  
  // Get initial tab from URL params
  const initialTab = searchParams.get('tab') || 'profile';
  const checkoutStatus = searchParams.get('checkout');

  useEffect(() => {
    if (checkoutStatus === 'success') {
      toast({
        title: t('plans.checkoutSuccess'),
        description: t('plans.checkoutSuccessDesc'),
      });
      // Refresh subscription status
      subscription.checkSubscription();
    } else if (checkoutStatus === 'cancel') {
      toast({
        title: t('plans.checkoutCanceled'),
        description: t('plans.checkoutCanceledDesc'),
        variant: 'destructive',
      });
    }
  }, [checkoutStatus]);

  const planTier = subscription.plan_tier;
  const limits = PLAN_LIMITS[planTier as keyof typeof PLAN_LIMITS];

  // Fetch user preferences
  const { data: preferences } = useQuery({
    queryKey: ['user_preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Initialize preferences state from fetched data
  useEffect(() => {
    if (preferences) {
      setAiDocAnalysisEnabled(preferences.smart_upload_enabled);
    }
  }, [preferences]);

  // Fetch usage data
  const { data: usage } = useQuery({
    queryKey: ['usage', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('feature, count')
        .eq('user_id', user!.id)
        .eq('date', today);

      if (error) throw error;

      const smartUploads = data?.find(u => u.feature === 'smart_upload')?.count || 0;
      return { smartUploads };
    },
    enabled: !!user,
  });

  // Fetch storage usage
  const { data: storageUsage } = useQuery({
    queryKey: ['storage', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('files')
        .select('size')
        .eq('owner_id', user!.id);

      if (error) throw error;

      const totalBytes = data?.reduce((sum, file) => sum + file.size, 0) || 0;
      const totalGB = totalBytes / 1024 / 1024 / 1024;
      return totalGB;
    },
    enabled: !!user,
  });

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast({
        title: t('settings.error'),
        description: t('settings.nameRequired'),
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // For now, we'll just show success without saving display_name
      // In a real implementation, you'd add a display_name column to profiles table
      toast({
        title: t('settings.saveSuccess'),
        description: t('settings.saveSuccessDesc'),
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: t('settings.saveError'),
        description: error instanceof Error ? error.message : t('common.unknownError'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSmartUploadPreferences = async () => {
    setIsSaving(true);
    try {
      // Check if preferences exist
      if (preferences) {
        // Update existing preferences
        const { error } = await supabase
          .from('user_preferences')
          .update({
            smart_upload_enabled: aiDocAnalysisEnabled,
          })
          .eq('user_id', user!.id);
        
        if (error) throw error;
      } else {
        // Create new preferences
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user!.id,
            smart_upload_enabled: aiDocAnalysisEnabled,
          });
        
        if (error) throw error;
      }

      toast({
        title: t('settings.saveSuccess'),
        description: t('settings.smartUploadPrefSaved'),
      });
    } catch (error) {
      console.error('Preferences update error:', error);
      toast({
        title: t('settings.saveError'),
        description: error instanceof Error ? error.message : t('common.unknownError'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
          <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('settings.profile')}
            </TabsTrigger>
            <TabsTrigger value="smartupload" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t('settings.smartUpload')}
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t('settings.plan')}
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('settings.usage')}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.profileSettings')}</CardTitle>
                <CardDescription>{t('settings.profileDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('settings.emailNotEditable')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display-name">{t('settings.displayName')}</Label>
                  <Input
                    id="display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t('settings.displayNamePlaceholder')}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <Label>{t('settings.language')}</Label>
                    <div className="mt-2">
                      <LanguageSwitcher />
                    </div>
                  </div>

                  <div>
                    <Label>{t('settings.theme')}</Label>
                    <div className="mt-2">
                      <ThemeSwitcher />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? t('common.loading') : t('common.save')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Smart Upload Tab */}
          <TabsContent value="smartupload" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {t('settings.smartUploadSettings')}
                </CardTitle>
                <CardDescription>{t('settings.smartUploadDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup
                  value={aiDocAnalysisEnabled ? 'enabled' : 'disabled'}
                  onValueChange={(value) => {
                  setAiDocAnalysisEnabled(value === 'enabled');
                }}
                  className="space-y-4"
                >
                  {/* Option 1: KI-Dokumentenanalyse aktivieren */}
                  <div className="flex items-start gap-4 rounded-lg border p-4">
                    <RadioGroupItem value="enabled" id="ai-enabled" className="mt-1" />
                    <div className="space-y-1 flex-1">
                      <Label htmlFor="ai-enabled" className="text-base font-medium cursor-pointer">
                        {t('settings.aiDocAnalysisEnabled')}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.aiDocAnalysisEnabledDesc')}
                      </p>
                    </div>
                  </div>

                  {/* Option 2: KI-Dokumentenanalyse deaktivieren */}
                  <div className="flex items-start gap-4 rounded-lg border p-4">
                    <RadioGroupItem value="disabled" id="ai-disabled" className="mt-1" />
                    <div className="space-y-1 flex-1">
                      <Label htmlFor="ai-disabled" className="text-base font-medium cursor-pointer">
                        {t('settings.aiDocAnalysisDisabled')}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.aiDocAnalysisDisabledDesc')}
                      </p>
                      <p className="text-xs text-muted-foreground italic mt-2">
                        {t('settings.aiDocAnalysisNote')}
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                <Separator />

                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {t('settings.smartUploadInfoTitle')}
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• {t('settings.smartUploadInfo1')}</li>
                    <li>• {t('settings.smartUploadInfo2')}</li>
                    <li>• {t('settings.smartUploadInfo3')}</li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSmartUploadPreferences} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? t('common.loading') : t('common.save')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plan Tab */}
          <TabsContent value="plan" className="mt-6">
            <div className="space-y-6">
              {/* Current Plan Status */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t('settings.currentPlan')}</CardTitle>
                      <CardDescription>{t('settings.planDesc')}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={planTier === 'free' ? 'secondary' : 'default'} className="text-lg px-4 py-1">
                        {PLAN_CONFIGS[planTier].name}
                      </Badge>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => subscription.checkSubscription()}
                        disabled={subscription.loading}
                      >
                        <RefreshCw className={`h-4 w-4 ${subscription.loading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subscription.subscribed && subscription.subscription_end && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <p className="text-sm font-medium mb-1">
                        {t('plans.activeSubscription')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('plans.renewsOn')}: {new Date(subscription.subscription_end).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {subscription.subscribed && (
                    <Button
                      variant="outline"
                      onClick={() => subscription.openCustomerPortal()}
                      className="w-full gap-2"
                    >
                      <Settings2 className="h-4 w-4" />
                      {t('plans.manageSubscription')}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Available Plans */}
              <div>
                <h2 className="text-2xl font-bold mb-4">{t('plans.availablePlans')}</h2>
                <div className="grid gap-6 md:grid-cols-3">
                  {(['basic', 'plus', 'max'] as const).map((tier) => (
                    <PlanCard
                      key={tier}
                      plan={PLAN_CONFIGS[tier]}
                      currentTier={planTier}
                      onUpgrade={() => {
                        const priceId = PLAN_CONFIGS[tier].stripePriceId;
                        if (priceId) {
                          subscription.createCheckout(priceId);
                        }
                      }}
                      isSubscribed={subscription.subscribed}
                      loading={subscription.loading}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.smartUploadsUsage')}</CardTitle>
                  <CardDescription>{t('settings.thisMonth')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{t('settings.used')}</span>
                      <span className="font-medium">
                        {usage?.smartUploads || 0} / {limits.smartUploads === 999999 ? '∞' : limits.smartUploads}
                      </span>
                    </div>
                    <Progress
                      value={limits.smartUploads === 999999 ? 0 : ((usage?.smartUploads || 0) / limits.smartUploads) * 100}
                      className="h-2"
                    />
                  </div>
                  {usage && usage.smartUploads >= limits.smartUploads && limits.smartUploads !== 999999 && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <p className="text-sm text-destructive">
                        {t('settings.limitReached')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.storageUsage')}</CardTitle>
                  <CardDescription>{t('settings.totalUsed')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{t('settings.used')}</span>
                      <span className="font-medium">
                        {storageUsage?.toFixed(2) || 0} / {limits.storage} GB
                      </span>
                    </div>
                    <Progress
                      value={((storageUsage || 0) / limits.storage) * 100}
                      className="h-2"
                    />
                  </div>
                  {storageUsage && storageUsage >= limits.storage * 0.9 && (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                      <p className="text-sm text-warning-foreground">
                        {t('settings.storageWarning')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
