import type { MigratedUser } from './migration';

export type StarterUser = {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
};

export type User = StarterUser | MigratedUser;

export type Auth = {
    user: User | null;
};
