import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export interface Folder {
  id: string;
  name: string;
  owner_id: string;
  parent_id: string | null;
  meta: Record<string, any>;
  inherited_meta: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useFolders() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Fetch all folders for the current user
  const { data: folders = [], isLoading, error } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Folder[];
    },
  });

  // Calculate folder depth
  const getFolderDepth = (folderId: string, folders: Folder[]): number => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder || !folder.parent_id) return 0;
    return 1 + getFolderDepth(folder.parent_id, folders);
  };

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async ({ name, parent_id }: { name: string; parent_id?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Check depth if parent_id provided
      if (parent_id) {
        const depth = getFolderDepth(parent_id, folders);
        if (depth >= 2) {
          throw new Error(t('folders.maxDepthError'));
        }
      }

      const { data, error } = await supabase
        .from('folders')
        .insert({
          name,
          parent_id: parent_id || null,
          owner_id: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast({
        title: t('folders.createSuccess'),
        description: t('folders.createSuccessDesc'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('folders.createError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update folder mutation
  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, name, parent_id }: { id: string; name?: string; parent_id?: string }) => {
      // Check depth if parent_id is being changed
      if (parent_id !== undefined) {
        const depth = parent_id ? getFolderDepth(parent_id, folders) : 0;
        if (depth >= 2) {
          throw new Error(t('folders.maxDepthError'));
        }

        // Check for circular reference
        const isCircular = (currentId: string, targetParentId: string): boolean => {
          if (currentId === targetParentId) return true;
          const parent = folders.find(f => f.id === targetParentId);
          if (!parent || !parent.parent_id) return false;
          return isCircular(currentId, parent.parent_id);
        };

        if (parent_id && isCircular(id, parent_id)) {
          throw new Error(t('folders.circularError'));
        }
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (parent_id !== undefined) updateData.parent_id = parent_id || null;

      const { data, error } = await supabase
        .from('folders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast({
        title: t('folders.updateSuccess'),
        description: t('folders.updateSuccessDesc'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('folders.updateError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast({
        title: t('folders.deleteSuccess'),
        description: t('folders.deleteSuccessDesc'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('folders.deleteError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    folders,
    isLoading,
    error,
    createFolder: createFolderMutation.mutate,
    updateFolder: updateFolderMutation.mutate,
    deleteFolder: deleteFolderMutation.mutate,
    isCreating: createFolderMutation.isPending,
    isUpdating: updateFolderMutation.isPending,
    isDeleting: deleteFolderMutation.isPending,
  };
}
