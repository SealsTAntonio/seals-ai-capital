export type Profile = {
  id: string;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProfileStatus = 'signed-out' | 'loading' | 'ready' | 'missing' | 'error';
