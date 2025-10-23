import { useState, useEffect } from 'react';
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
import { useFolderUnreadCounts } from '@/hooks/useFolderUnreadCounts';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Upload, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const { invalidate: invalidateUnreadCounts } = useFolderUnreadCounts();
  const [activeTab, setActiveTab] = useState('documents');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

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
              onSelectFolder={setSelectedFolderId}
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
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger 
                  value="documents" 
                  className="flex items-center gap-2"
                  data-tour="documents-tab"
                >
                  <FileText className="h-4 w-4" />
                  {t('documents.title')}
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
                <DocumentList folderId={selectedFolderId} />
              </TabsContent>

              <TabsContent value="upload" className="mt-6">
                <div className="max-w-3xl mx-auto">
                  <FileUpload 
                    folderId={selectedFolderId}
                    onUploadComplete={() => {
                      invalidateUnreadCounts();
                      setActiveTab('documents');
                    }} 
                  />
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
        </div>
      </SidebarProvider>
    </>
  );
};

export default Index;
