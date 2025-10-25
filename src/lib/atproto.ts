// AT Protocol client utilities

export interface ATProtoNote {
  $type: 'app.mbdscribe.record';
  title: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ATProtoRecord {
  uri: string;
  cid: string;
  value: ATProtoNote;
}

export interface ATProtoCredentials {
  handle: string;
  pdsUrl: string;
  accessJwt: string;
  refreshJwt: string;
  did: string;
}

class ATProtoClient {
  private credentials: ATProtoCredentials | null = null;

  async login(handle: string, password: string, pdsUrl: string = 'https://bsky.social'): Promise<ATProtoCredentials> {
    const response = await fetch(`${pdsUrl}/xrpc/com.atproto.server.createSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: handle, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Authentication failed');
    }

    const data = await response.json();
    this.credentials = {
      handle: data.handle,
      pdsUrl,
      accessJwt: data.accessJwt,
      refreshJwt: data.refreshJwt,
      did: data.did,
    };

    return this.credentials;
  }

  setCredentials(credentials: ATProtoCredentials) {
    this.credentials = credentials;
  }

  getCredentials(): ATProtoCredentials | null {
    return this.credentials;
  }

  async createNote(note: Omit<ATProtoNote, '$type'>): Promise<ATProtoRecord> {
    if (!this.credentials) throw new Error('Not authenticated');

    const record: ATProtoNote = {
      $type: 'app.mbdscribe.record',
      ...note,
    };

    const response = await fetch(`${this.credentials.pdsUrl}/xrpc/com.atproto.repo.createRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials.accessJwt}`,
      },
      body: JSON.stringify({
        repo: this.credentials.did,
        collection: 'app.mbdscribe.record',
        record,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create note');
    }

    const data = await response.json();
    return { uri: data.uri, cid: data.cid, value: record };
  }

  async updateNote(rkey: string, note: Omit<ATProtoNote, '$type'>): Promise<void> {
    if (!this.credentials) throw new Error('Not authenticated');

    const record: ATProtoNote = {
      $type: 'app.mbdscribe.record',
      ...note,
    };

    const response = await fetch(`${this.credentials.pdsUrl}/xrpc/com.atproto.repo.putRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials.accessJwt}`,
      },
      body: JSON.stringify({
        repo: this.credentials.did,
        collection: 'app.mbdscribe.record',
        rkey,
        record,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update note');
    }
  }

  async deleteNote(rkey: string): Promise<void> {
    if (!this.credentials) throw new Error('Not authenticated');

    const response = await fetch(`${this.credentials.pdsUrl}/xrpc/com.atproto.repo.deleteRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials.accessJwt}`,
      },
      body: JSON.stringify({
        repo: this.credentials.did,
        collection: 'app.mbdscribe.record',
        rkey,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete note');
    }
  }

  async listNotes(): Promise<ATProtoRecord[]> {
    if (!this.credentials) throw new Error('Not authenticated');

    const url = new URL(`${this.credentials.pdsUrl}/xrpc/com.atproto.repo.listRecords`);
    url.searchParams.set('repo', this.credentials.did);
    url.searchParams.set('collection', 'app.mbdscribe.record');
    url.searchParams.set('limit', '100');

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${this.credentials.accessJwt}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to list notes');
    }

    const data = await response.json();
    return data.records || [];
  }
}

export const atprotoClient = new ATProtoClient();
