import { useState, useEffect } from 'react';
import { LoginScreen } from '@/components/LoginScreen';
import { NotesApp } from '@/components/NotesApp';
import { atprotoClient } from '@/lib/atproto';

const Index = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing credentials
    const stored = localStorage.getItem('atproto-credentials');
    if (stored) {
      try {
        const credentials = JSON.parse(stored);
        atprotoClient.setCredentials(credentials);
        setAuthenticated(true);
      } catch (error) {
        console.error('Failed to restore credentials:', error);
        localStorage.removeItem('atproto-credentials');
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginScreen onSuccess={() => setAuthenticated(true)} />;
  }

  return <NotesApp />;
};

export default Index;
