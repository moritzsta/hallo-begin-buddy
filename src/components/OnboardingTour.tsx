import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingTourProps {
  run: boolean;
  onFinish: () => void;
}

export const OnboardingTour = ({ run, onFinish }: OnboardingTourProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const steps: Step[] = [
    {
      target: '[data-tour="upload-tab"]',
      content: t('onboarding.step1', {
        defaultValue: 'Hier können Sie Dateien hochladen. Mit "Smart Upload" analysiert unsere KI Ihre Dokumente automatisch und schlägt den besten Ablageort vor.',
      }),
      title: t('onboarding.step1Title', { defaultValue: 'Dateien hochladen' }),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="folder-sidebar"]',
      content: t('onboarding.step2', {
        defaultValue: 'In der Seitenleiste verwalten Sie Ihre Ordnerstruktur. Klicken Sie auf einen Ordner, um dessen Inhalte anzuzeigen. Neue Ordner können Sie mit dem +-Symbol erstellen.',
      }),
      title: t('onboarding.step2Title', { defaultValue: 'Ordner organisieren' }),
      placement: 'right',
    },
    {
      target: '[data-tour="documents-tab"]',
      content: t('onboarding.step3', {
        defaultValue: 'Hier finden Sie alle Ihre Dokumente. Nutzen Sie die Suche und Filter, um schnell die richtige Datei zu finden. "Neu"-Badges zeigen ungelesene Dateien an.',
      }),
      title: t('onboarding.step3Title', { defaultValue: 'Dokumente finden' }),
      placement: 'bottom',
    },
  ];

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      // Mark tour as completed in database
      if (user) {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('user_id', user.id);
      }
      onFinish();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--background))',
          arrowColor: 'hsl(var(--background))',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          marginRight: '0.5rem',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        },
        tooltip: {
          borderRadius: '0.75rem',
          padding: '1.5rem',
          fontSize: '0.95rem',
        },
        tooltipTitle: {
          fontSize: '1.125rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
        },
        tooltipContent: {
          padding: '0.75rem 0',
        },
      }}
      locale={{
        back: t('common.back', { defaultValue: 'Zurück' }),
        close: t('common.close', { defaultValue: 'Schließen' }),
        last: t('onboarding.finish', { defaultValue: 'Fertig' }),
        next: t('common.next', { defaultValue: 'Weiter' }),
        skip: t('onboarding.skip', { defaultValue: 'Überspringen' }),
      }}
    />
  );
};
