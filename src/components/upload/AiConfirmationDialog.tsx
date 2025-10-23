import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface AiConfirmationDialogProps {
  open: boolean;
  onConfirm: (dontShowAgain: boolean) => void;
  onCancel: () => void;
}

export const AiConfirmationDialog = ({
  open,
  onConfirm,
  onCancel,
}: AiConfirmationDialogProps) => {
  const { t } = useTranslation();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = () => {
    onConfirm(dontShowAgain);
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            {t('upload.aiConfirmationTitle', { defaultValue: 'KI-Analyse bestätigen' })}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>
              {t('upload.aiConfirmationDesc', {
                defaultValue:
                  'Die Smart-Upload-Funktion verwendet KI, um Ihre Dokumente zu analysieren und automatisch Metadaten zu extrahieren.',
              })}
            </p>
            <p className="font-medium">
              {t('upload.aiConfirmationDataInfo', {
                defaultValue:
                  'Dabei werden die ersten Seiten Ihres Dokuments an unsere KI-Dienste übermittelt.',
              })}
            </p>
            <p className="text-sm">
              {t('upload.aiConfirmationPrivacy', {
                defaultValue:
                  'Ihre Daten werden verschlüsselt übertragen und nicht dauerhaft gespeichert.',
              })}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center space-x-2 py-3">
          <Checkbox
            id="dontShowAgain"
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
          />
          <Label
            htmlFor="dontShowAgain"
            className="text-sm font-normal cursor-pointer"
          >
            {t('upload.aiConfirmationDontShow', {
              defaultValue: 'Diesen Dialog nicht mehr anzeigen',
            })}
          </Label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {t('upload.aiConfirmationConfirm', {
              defaultValue: 'KI-Analyse starten',
            })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
