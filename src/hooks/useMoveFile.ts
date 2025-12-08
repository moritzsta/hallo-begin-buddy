import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MoveFileParams {
  fileId: string;
  folderId: string;
  folderName?: string;
}

export function useMoveFile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ fileId, folderId }: MoveFileParams) => {
      const { error } = await supabase
        .from('files')
        .update({ folder_id: folderId })
        .eq('id', fileId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['unsorted-files'] });
      queryClient.invalidateQueries({ queryKey: ['unsorted-count'] });
      
      toast({
        title: t('documents.moveSuccess'),
        description: variables.folderName 
          ? t('documents.movedToFolder', { folder: variables.folderName })
          : t('documents.moveSuccessDesc'),
      });
    },
    onError: (error) => {
      toast({
        title: t('documents.moveError'),
        description: error instanceof Error ? error.message : t('common.unknownError'),
        variant: 'destructive',
      });
    },
  });
}
