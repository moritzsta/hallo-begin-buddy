import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarProvider, Sidebar, SidebarContent, SidebarTrigger } from '@/components/ui/sidebar';
import { FileUpload } from '@/components/upload/FileUpload';
import { DocumentList } from '@/components/documents/DocumentList';
import { FolderTree } from '@/components/folders/FolderTree';
import { ProfileMenu } from '@/components/ProfileMenu';
import { LifestyleGradientBar } from '@/components/LifestyleGradientBar';
import { OnboardingTour } from '@/components/OnboardingTour';
import { KeyboardShortcutsDialog } from '@/components/KeyboardShortcutsDialog';
import { QuickUpload } from '@/components/upload/QuickUpload';
import { UnsortedFileList } from '@/components/upload/UnsortedFileList';
import { useFolderUnreadCounts } from '@/hooks/useFolderUnreadCounts';
import { useUnsortedFolder } from '@/hooks/useUnsortedFolder';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Upload, FileText, Inbox } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { MetadataConfirmDialog } from '@/components/upload/MetadataConfirmDialog';
import { AiConfirmationDialog } from '@/components/upload/AiConfirmationDialog';

const Index = () => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { invalidate: invalidateUnreadCounts } = useFolderUnreadCounts();
  const { unsortedFolderId, unsortedCount } = useUnsortedFolder();
  
  const [activeTab, setActiveTab] = useState('documents');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // Smart Upload state for unsorted files
  const [smartUploadLoading, setSmartUploadLoading] = useState<string | null>(null);
  const [confirmDialogState, setConfirmDialogState] = useState<{
    open: boolean;
    fileId: string | null;
    metadata: any;
    fileName: string;
  }>({ open: false, fileId: null, metadata: null, fileName: '' });
  const [aiConfirmDialogOpen, setAiConfirmDialogOpen] = useState(false);
  const [pendingSmartUploadId, setPendingSmartUploadId] = useState<string | null>(null);

  // Check if user is admin & if onboarding needed
  useEffect(() => {
    const checkAdminAndOnboarding = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!error && data !== null);

      // Check if onboarding completed
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (profile && !profile.onboarding_completed) {
        // Show onboarding after short delay
        setTimeout(() => setShowOnboarding(true), 1000);
      }
    };

    checkAdminAndOnboarding();
  }, [user]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'u',
      ctrl: true,
      handler: () => setActiveTab('upload'),
      description: 'Open upload tab',
    },
    {
      key: 'f',
      ctrl: true,
      handler: () => {
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        searchInput?.focus();
      },
      description: 'Focus search',
    },
    {
      key: '?',
      ctrl: false,
      handler: () => setShowShortcuts(true),
      description: 'Show keyboard shortcuts',
    },
  ]);

  const handleLogout = async () => {
    await signOut();
  };

  // State for skipDocumentAnalysis
  const [pendingSkipAnalysis, setPendingSkipAnalysis] = useState(false);

  // Smart Upload handler for unsorted files
  const handleSmartUpload = useCallback(async (fileId: string, skipDocumentAnalysis?: boolean) => {
    // Get file info
    const { data: fileData } = await supabase
      .from('files')
      .select('title')
      .eq('id', fileId)
      .single();

    if (!fileData) return;

    // Check user preferences
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('smart_upload_enabled, show_ai_confirmation')
      .eq('user_id', user!.id)
      .maybeSingle();

    const shouldShowConfirmation = prefs?.show_ai_confirmation !== false;
    
    if (shouldShowConfirmation) {
      setPendingSmartUploadId(fileId);
      setPendingSkipAnalysis(skipDocumentAnalysis || false);
      setAiConfirmDialogOpen(true);
      return;
    }

    await executeSmartUpload(fileId, fileData.title, skipDocumentAnalysis);
  }, [user]);

  const executeSmartUpload = async (fileId: string, fileName: string, skipDocumentAnalysis?: boolean) => {
    setSmartUploadLoading(fileId);

    try {
      const { data, error } = await supabase.functions.invoke('smart-upload', {
        body: { file_id: fileId, skip_document_analysis: skipDocumentAnalysis || false },
      });

      if (error) throw error;

      if (data?.extracted) {
        const transformedMetadata = {
          title: data.extracted.suggested_title || fileName,
          doc_type: data.extracted.document_type || undefined,
          keywords: data.extracted.keywords || [],
          suggested_path: data.extracted.suggested_path || undefined,
        };

        setConfirmDialogState({
          open: true,
          fileId,
          metadata: transformedMetadata,
          fileName,
        });
      } else {
        toast({
          title: t('upload.smartUploadSkipped'),
          description: data?.message || t('upload.smartUploadSkippedDesc'),
        });
      }
    } catch (error) {
      console.error('Smart upload error:', error);
      toast({
        title: t('upload.smartUploadError'),
        description: error instanceof Error ? error.message : t('common.unknownError'),
        variant: 'destructive',
      });
    } finally {
      setSmartUploadLoading(null);
    }
  };

  const handleConfirmMetadata = async (updatedMetadata: any, tags: string[]) => {
    const fileId = confirmDialogState.fileId;
    if (!fileId) return;

    try {
      let targetFolderId: string | null = null;

      // Create folder structure if suggested_path exists
      if (confirmDialogState.metadata?.suggested_path) {
        const pathParts = confirmDialogState.metadata.suggested_path.split('/').filter(Boolean);
        
        if (pathParts.length > 0) {
          const { data: allFolders } = await supabase
            .from('folders')
            .select('*')
            .eq('owner_id', user!.id);

          let currentParentId: string | null = null;
          
          for (const folderName of pathParts) {
            const existingFolder = allFolders?.find(
              f => f.name === folderName && f.parent_id === currentParentId
            );

            if (existingFolder) {
              currentParentId = existingFolder.id;
            } else {
              const { data: newFolder, error: folderError } = await supabase
                .from('folders')
                .insert({
                  owner_id: user!.id,
                  name: folderName,
                  parent_id: currentParentId,
                })
                .select()
                .single();

              if (folderError) throw folderError;
              currentParentId = newFolder.id;
            }
          }

          targetFolderId = currentParentId;
        }
      }

      // Update file with confirmed metadata
      const { error: updateError } = await supabase
        .from('files')
        .update({
          title: updatedMetadata.title,
          tags,
          folder_id: targetFolderId || undefined,
          meta: {
            doc_type: updatedMetadata.doc_type,
            date: updatedMetadata.date,
            party: updatedMetadata.party,
            amount: updatedMetadata.amount,
            smart_upload: true,
            ai_suggested_path: confirmDialogState.metadata?.suggested_path,
          },
        })
        .eq('id', fileId);

      if (updateError) throw updateError;

      // Update unread counts if folder changed
      if (targetFolderId && unsortedFolderId) {
        await supabase.rpc('increment_folder_unread_count', {
          p_user_id: user!.id,
          p_folder_id: unsortedFolderId,
          p_increment: -1,
        });
        await supabase.rpc('increment_folder_unread_count', {
          p_user_id: user!.id,
          p_folder_id: targetFolderId,
          p_increment: 1,
        });
      }

      toast({
        title: t('upload.metadataConfirmed'),
        description: t('upload.metadataConfirmedDesc'),
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['unsorted-files'] });
      queryClient.invalidateQueries({ queryKey: ['unsorted-count'] });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      invalidateUnreadCounts();

      setConfirmDialogState({ open: false, fileId: null, metadata: null, fileName: '' });
    } catch (error) {
      console.error('Metadata update error:', error);
      toast({
        title: t('upload.metadataUpdateError'),
        description: error instanceof Error ? error.message : t('common.unknownError'),
        variant: 'destructive',
      });
    }
  };

  // Fetch available tags for the metadata dialog
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  useEffect(() => {
    const fetchTags = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('files')
        .select('tags')
        .eq('owner_id', user.id);
      
      const tags = new Set<string>();
      data?.forEach(file => file.tags?.forEach(tag => tags.add(tag)));
      setAvailableTags(Array.from(tags).sort());
    };
    fetchTags();
  }, [user]);

  return (
    <>
      <LifestyleGradientBar />
      <OnboardingTour 
        run={showOnboarding} 
        onFinish={() => setShowOnboarding(false)} 
      />
      <KeyboardShortcutsDialog 
        open={showShortcuts} 
        onOpenChange={setShowShortcuts} 
      />
      <SidebarProvider>
        <div className="min-h-screen w-full flex bg-background">
        {/* Sidebar with Folder Tree */}
        <Sidebar className="border-r" data-tour="folder-sidebar">
          <SidebarContent>
            <div className="p-4 border-b">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {t('folders.title')}
              </h2>
            </div>
            <FolderTree 
              selectedFolderId={selectedFolderId}
              onSelectFolder={(folderId) => {
                setSelectedFolderId(folderId);
                // If clicking unsorted folder, switch to unsorted tab
                if (folderId === unsortedFolderId) {
                  setActiveTab('unsorted');
                } else if (activeTab === 'unsorted') {
                  setActiveTab('documents');
                }
              }}
            />
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b border-border bg-card">
            <div className="px-4 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold">{t('app.title')}</h1>
                  <p className="text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <ProfileMenu 
                userEmail={user?.email}
                isAdmin={isAdmin}
                onLogout={handleLogout}
              />
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-lg grid-cols-3">
                <TabsTrigger 
                  value="documents" 
                  className="flex items-center gap-2"
                  data-tour="documents-tab"
                >
                  <FileText className="h-4 w-4" />
                  {t('documents.title')}
                </TabsTrigger>
                <TabsTrigger 
                  value="unsorted" 
                  className="flex items-center gap-2 relative"
                  data-tour="unsorted-tab"
                >
                  <Inbox className="h-4 w-4" />
                  {t('upload.unsortedTab')}
                  {unsortedCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
                      {unsortedCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="upload" 
                  className="flex items-center gap-2"
                  data-tour="upload-tab"
                >
                  <Upload className="h-4 w-4" />
                  {t('upload.title')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="documents" className="mt-6">
                <div className="mb-4 flex justify-end">
                  <QuickUpload 
                    folderId={selectedFolderId} 
                    onUploadComplete={() => {
                      invalidateUnreadCounts();
                      queryClient.invalidateQueries({ queryKey: ['files'] });
                    }}
                  />
                </div>
                <DocumentList folderId={selectedFolderId} />
              </TabsContent>

              <TabsContent value="unsorted" className="mt-6">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">
                      {t('upload.unsorted')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t('upload.noUnsortedFilesDesc')}
                    </p>
                  </div>
                  <UnsortedFileList 
                    onSmartUpload={handleSmartUpload}
                    smartUploadLoading={smartUploadLoading}
                  />
                </div>
              </TabsContent>

              <TabsContent value="upload" className="mt-6">
                <div className="max-w-3xl mx-auto">
                  <FileUpload 
                    folderId={unsortedFolderId}
                    onUploadComplete={() => {
                      invalidateUnreadCounts();
                      queryClient.invalidateQueries({ queryKey: ['unsorted-files'] });
                      queryClient.invalidateQueries({ queryKey: ['unsorted-count'] });
                      setActiveTab('unsorted');
                    }} 
                  />
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
        </div>
      </SidebarProvider>

      {/* Metadata Confirmation Dialog */}
      {confirmDialogState.open && (
        <MetadataConfirmDialog
          open={confirmDialogState.open}
          onOpenChange={(open) => !open && setConfirmDialogState({ open: false, fileId: null, metadata: null, fileName: '' })}
          metadata={confirmDialogState.metadata || {}}
          fileName={confirmDialogState.fileName}
          onConfirm={handleConfirmMetadata}
          onCancel={() => setConfirmDialogState({ open: false, fileId: null, metadata: null, fileName: '' })}
          availableTags={availableTags}
        />
      )}

      {/* AI Confirmation Dialog */}
      <AiConfirmationDialog
        open={aiConfirmDialogOpen}
        onConfirm={async (dontShowAgain) => {
          setAiConfirmDialogOpen(false);
          
          if (dontShowAgain && user) {
            const { data: prefs } = await supabase
              .from('user_preferences')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (prefs) {
              await supabase
                .from('user_preferences')
                .update({ show_ai_confirmation: false })
                .eq('user_id', user.id);
            } else {
              await supabase
                .from('user_preferences')
                .insert({
                  user_id: user.id,
                  smart_upload_enabled: false,
                  show_ai_confirmation: false,
                });
            }
          }

          if (pendingSmartUploadId) {
            const { data: fileData } = await supabase
              .from('files')
              .select('title')
              .eq('id', pendingSmartUploadId)
              .single();
            
            if (fileData) {
              await executeSmartUpload(pendingSmartUploadId, fileData.title, pendingSkipAnalysis);
            }
            setPendingSmartUploadId(null);
            setPendingSkipAnalysis(false);
          }
        }}
        onCancel={() => {
          setAiConfirmDialogOpen(false);
          setPendingSmartUploadId(null);
        }}
      />
    </>
  );
};

export default Index;
