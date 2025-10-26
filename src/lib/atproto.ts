// AT Protocol client utilities

export interface ATProtoNote {
  $type: 'app.mbdio.uk.note';
  title: string;
  content: string;
  tags?: string[]; // Array of tag URIs
  folder?: string; // Folder URI
  createdAt: string;
  updatedAt: string;
}

export interface ATProtoTag {
  $type: 'app.mbdio.uk.tag';
  name: string;
  color?: string;
  createdAt: string;
}

export interface ATProtoFolder {
  $type: 'app.mbdio.uk.folder';
  name: string;
  color?: string;
  parent?: string; // Parent folder URI for nesting
  createdAt: string;
}

export interface ATProtoTheme {
  $type: 'app.mbdio.uk.theme';
  name: string;
  mode: 'light' | 'dark';
  accent?: string;
  background?: string;
  createdAt: string;
}

export interface ATProtoRecord<T = ATProtoNote | ATProtoTag | ATProtoFolder | ATProtoTheme> {
  uri: string;
  cid: string;
  value: T;
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
      $type: 'app.mbdio.uk.note',
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
        collection: 'app.mbdio.uk.note',
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
      $type: 'app.mbdio.uk.note',
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
        collection: 'app.mbdio.uk.note',
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
        collection: 'app.mbdio.uk.note',
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
    url.searchParams.set('collection', 'app.mbdio.uk.note');
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

  // Tag operations
  async createTag(tag: Omit<ATProtoTag, '$type'>): Promise<ATProtoRecord> {
    if (!this.credentials) throw new Error('Not authenticated');

    const record: ATProtoTag = { $type: 'app.mbdio.uk.tag', ...tag };

    const response = await fetch(`${this.credentials.pdsUrl}/xrpc/com.atproto.repo.createRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials.accessJwt}`,
      },
      body: JSON.stringify({
        repo: this.credentials.did,
        collection: 'app.mbdio.uk.tag',
        record,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create tag');
    }

    const data = await response.json();
    return { uri: data.uri, cid: data.cid, value: record };
  }

  async listTags(): Promise<ATProtoRecord[]> {
    if (!this.credentials) throw new Error('Not authenticated');

    const url = new URL(`${this.credentials.pdsUrl}/xrpc/com.atproto.repo.listRecords`);
    url.searchParams.set('repo', this.credentials.did);
    url.searchParams.set('collection', 'app.mbdio.uk.tag');
    url.searchParams.set('limit', '100');

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${this.credentials.accessJwt}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to list tags');
    }

    const data = await response.json();
    return data.records || [];
  }

  async deleteTag(rkey: string): Promise<void> {
    if (!this.credentials) throw new Error('Not authenticated');

    const response = await fetch(`${this.credentials.pdsUrl}/xrpc/com.atproto.repo.deleteRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials.accessJwt}`,
      },
      body: JSON.stringify({
        repo: this.credentials.did,
        collection: 'app.mbdio.uk.tag',
        rkey,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete tag');
    }
  }

  // Folder operations
  async createFolder(folder: Omit<ATProtoFolder, '$type'>): Promise<ATProtoRecord> {
    if (!this.credentials) throw new Error('Not authenticated');

    const record: ATProtoFolder = { $type: 'app.mbdio.uk.folder', ...folder };

    const response = await fetch(`${this.credentials.pdsUrl}/xrpc/com.atproto.repo.createRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials.accessJwt}`,
      },
      body: JSON.stringify({
        repo: this.credentials.did,
        collection: 'app.mbdio.uk.folder',
        record,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create folder');
    }

    const data = await response.json();
    return { uri: data.uri, cid: data.cid, value: record };
  }

  async updateFolder(rkey: string, folder: Omit<ATProtoFolder, '$type'>): Promise<void> {
    if (!this.credentials) throw new Error('Not authenticated');

    const record: ATProtoFolder = { $type: 'app.mbdio.uk.folder', ...folder };

    const response = await fetch(`${this.credentials.pdsUrl}/xrpc/com.atproto.repo.putRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials.accessJwt}`,
      },
      body: JSON.stringify({
        repo: this.credentials.did,
        collection: 'app.mbdio.uk.folder',
        rkey,
        record,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update folder');
    }
  }

  async listFolders(): Promise<ATProtoRecord[]> {
    if (!this.credentials) throw new Error('Not authenticated');

    const url = new URL(`${this.credentials.pdsUrl}/xrpc/com.atproto.repo.listRecords`);
    url.searchParams.set('repo', this.credentials.did);
    url.searchParams.set('collection', 'app.mbdio.uk.folder');
    url.searchParams.set('limit', '100');

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${this.credentials.accessJwt}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to list folders');
    }

    const data = await response.json();
    return data.records || [];
  }

  async deleteFolder(rkey: string): Promise<void> {
    if (!this.credentials) throw new Error('Not authenticated');

    const response = await fetch(`${this.credentials.pdsUrl}/xrpc/com.atproto.repo.deleteRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials.accessJwt}`,
      },
      body: JSON.stringify({
        repo: this.credentials.did,
        collection: 'app.mbdio.uk.folder',
        rkey,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete folder');
    }
  }

  // Theme operations
  async createTheme(theme: Omit<ATProtoTheme, '$type'>): Promise<ATProtoRecord> {
    if (!this.credentials) throw new Error('Not authenticated');

    const record: ATProtoTheme = { $type: 'app.mbdio.uk.theme', ...theme };

    const response = await fetch(`${this.credentials.pdsUrl}/xrpc/com.atproto.repo.createRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials.accessJwt}`,
      },
      body: JSON.stringify({
        repo: this.credentials.did,
        collection: 'app.mbdio.uk.theme',
        record,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create theme');
    }

    const data = await response.json();
    return { uri: data.uri, cid: data.cid, value: record };
  }

  async listThemes(): Promise<ATProtoRecord[]> {
    if (!this.credentials) throw new Error('Not authenticated');

    const url = new URL(`${this.credentials.pdsUrl}/xrpc/com.atproto.repo.listRecords`);
    url.searchParams.set('repo', this.credentials.did);
    url.searchParams.set('collection', 'app.mbdio.uk.theme');
    url.searchParams.set('limit', '100');

    const response = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${this.credentials.accessJwt}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to list themes');
    }

    const data = await response.json();
    return data.records || [];
  }

  async deleteTheme(rkey: string): Promise<void> {
    if (!this.credentials) throw new Error('Not authenticated');

    const response = await fetch(`${this.credentials.pdsUrl}/xrpc/com.atproto.repo.deleteRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials.accessJwt}`,
      },
      body: JSON.stringify({
        repo: this.credentials.did,
        collection: 'app.mbdio.uk.theme',
        rkey,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete theme');
    }
  }
}

export const atprotoClient = new ATProtoClient();
