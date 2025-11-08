type PublicEnv = {
  VITE_PUBLIC_SITE_MODE?: string;
  VITE_PUBLIC_SENTRY_DSN?: string;
  VITE_PUBLIC_CHROMATIC?: string;
};

const env = (import.meta as any)?.env as PublicEnv | undefined;

export const PUBLIC_SITE_MODE = env?.VITE_PUBLIC_SITE_MODE ?? 'local';
export const PUBLIC_SENTRY_DSN = env?.VITE_PUBLIC_SENTRY_DSN ?? '';
export const PUBLIC_CHROMATIC = (env?.VITE_PUBLIC_CHROMATIC ?? 'false') === 'true';
