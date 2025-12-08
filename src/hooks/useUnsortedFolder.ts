import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to get the "Unsortiert" system folder for the current user
 */
export function useUnsortedFolder() {
  const { user } = useAuth();

  const { data: unsortedFolder, isLoading, error } = useQuery({
    queryKey: ['unsorted-folder', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('owner_id', user!.id)
        .eq('meta->>type', 'unsorted')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Count files in unsorted folder
  const { data: unsortedCount = 0 } = useQuery({
    queryKey: ['unsorted-count', unsortedFolder?.id],
    queryFn: async () => {
      if (!unsortedFolder?.id) return 0;
      
      const { count, error } = await supabase
        .from('files')
        .select('id', { count: 'exact', head: true })
        .eq('folder_id', unsortedFolder.id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!unsortedFolder?.id,
  });

  return {
    unsortedFolder,
    unsortedFolderId: unsortedFolder?.id || null,
    unsortedCount,
    isLoading,
    error,
  };
}
