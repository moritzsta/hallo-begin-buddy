import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/upload/FileUpload';
import { DocumentList } from '@/components/documents/DocumentList';
import { Upload, FileText } from 'lucide-react';

const Index = () => {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('documents');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Smart Document Storage</h1>
            <p className="text-sm text-muted-foreground">
              {user?.email} | Plan: {profile?.plan_tier || 'free'}
            </p>
          </div>
          <Button onClick={signOut} variant="outline">
            Abmelden
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Meine Dokumente
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Hochladen
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
