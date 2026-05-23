export interface UserProfile {
  role: Role;
  isAdmin: boolean;
  pseudo: string | null;
}

export interface UserContextType extends UserProfile {
  loading: boolean;
}

export enum Role {
    User = 'user',
    Admin = 'admin',
}