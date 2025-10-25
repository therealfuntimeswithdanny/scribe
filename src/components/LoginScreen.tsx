import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { atprotoClient } from '@/lib/atproto';

interface LoginScreenProps {
  onSuccess: () => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [pdsUrl, setPdsUrl] = useState('https://bsky.social');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const credentials = await atprotoClient.login(handle, password, pdsUrl);
      localStorage.setItem('atproto-credentials', JSON.stringify(credentials));
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            MBD Scribe
          </h1>
          <p className="text-muted-foreground">
            Rich text notes, synced to your Personal Data Server
          </p>
        </div>

        <Card className="border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Use your Bluesky handle and app password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="handle">Handle or DID</Label>
                <Input
                  id="handle"
                  type="text"
                  placeholder="alice.bsky.social"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">App Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Create an app password in your Bluesky settings
                </p>
              </div>

              {showAdvanced && (
                <div className="space-y-2">
                  <Label htmlFor="pdsUrl">PDS URL</Label>
                  <Input
                    id="pdsUrl"
                    type="url"
                    placeholder="https://bsky.social"
                    value={pdsUrl}
                    onChange={(e) => setPdsUrl(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm"
                >
                  {showAdvanced ? 'Hide' : 'Show'} advanced options
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          This app stores notes as records in your PDS using the AT Protocol
        </p>
      </div>
    </div>
  );
}
