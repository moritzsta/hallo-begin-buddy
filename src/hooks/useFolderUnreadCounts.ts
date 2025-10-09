import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useFolderUnreadCounts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['folder-unread-counts', user?.id],
    queryFn: async (): Promise<Map<string, number>> => {
      if (!user) return new Map();
      
      const { data, error } = await supabase
        .from('folder_unread_counts')
        .select('folder_id, count')
        .eq('user_id', user.id)
        .gt('count', 0); // Only fetch folders with unread counts > 0

      if (error) throw error;

      // Convert to a Map for easy lookup
      const countsMap = new Map<string, number>();
      data?.forEach(item => {
        countsMap.set(item.folder_id, item.count);
      });

      return countsMap;
    },
    enabled: !!user,
    staleTime: 0, // Always fetch fresh data
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const resetFolderVisit = async (folderId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.functions.invoke('reset-folder-visit', {
        body: { folder_id: folderId },
      });

      if (error) {
        console.error('Failed to reset folder visit:', error);
        return;
      }

      // Optimistically update the cache
      queryClient.setQueryData<Map<string, number>>(
        ['folder-unread-counts', user.id],
        (oldData) => {
          if (!oldData) return new Map();
          const newData = new Map(oldData);
          newData.delete(folderId);
          return newData;
        }
      );

      // Refetch to get updated parent counts
      queryClient.invalidateQueries({ queryKey: ['folder-unread-counts', user.id] });
    } catch (error) {
      console.error('Error resetting folder visit:', error);
    }
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['folder-unread-counts', user?.id] });
  };

  return {
    unreadCounts: query.data || new Map(),
    isLoading: query.isLoading,
    resetFolderVisit,
    invalidate,
  };
};
