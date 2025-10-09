import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold">
          Smart Document Storage
        </h1>
        <p className="text-muted-foreground">
          Willkommen, {user?.email}
        </p>
        {profile && (
          <div className="text-sm text-muted-foreground">
            Plan: {profile.plan_tier} | Theme: {profile.theme} | Sprache: {profile.locale}
          </div>
        )}
        <Button onClick={signOut} variant="outline">
          Abmelden
        </Button>
      </div>
    </div>
  );
};

export default Index;
