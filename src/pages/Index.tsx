import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarProvider, Sidebar, SidebarContent, SidebarTrigger } from '@/components/ui/sidebar';
import { FileUpload } from '@/components/upload/FileUpload';
import { DocumentList } from '@/components/documents/DocumentList';
import { FolderTree } from '@/components/folders/FolderTree';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Upload, FileText, LogOut, Settings as SettingsIcon } from 'lucide-react';

const Index = () => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('documents');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">
        {/* Sidebar with Folder Tree */}
        <Sidebar className="border-r">
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
              <div className="flex items-center gap-2">
                <ThemeSwitcher />
                <LanguageSwitcher />
                <Button variant="outline" size="icon" onClick={() => navigate('/settings')}>
                  <SettingsIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('common.logout')}
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 overflow-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t('documents.title')}
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
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
                    onUploadComplete={() => setActiveTab('documents')} 
                  />
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
