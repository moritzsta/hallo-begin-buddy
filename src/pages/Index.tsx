import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/upload/FileUpload';
import { DocumentList } from '@/components/documents/DocumentList';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Upload, FileText, LogOut } from 'lucide-react';

const Index = () => {
  const { user, profile, signOut } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('documents');

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t('app.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {user?.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t('common.logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
            <DocumentList />
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <div className="max-w-3xl mx-auto">
              <FileUpload onUploadComplete={() => setActiveTab('documents')} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
