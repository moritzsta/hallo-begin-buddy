import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/upload/FileUpload';

const Index = () => {
  const { user, profile, signOut } = useAuth();

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
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Dokumente hochladen</h2>
          <FileUpload />
        </div>
      </main>
    </div>
  );
};

export default Index;
