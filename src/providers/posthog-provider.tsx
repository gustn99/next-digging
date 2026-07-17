'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import { getOrCreateUserId } from '@/lib/user-id';

// Use environment variables for these in a real application
// Next.js requires NEXT_PUBLIC_ prefix for client-side env vars
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_placeholder_key';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize if we have a key and aren't already initialized
    if (typeof window !== 'undefined') {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        // Disable automatic pageview capturing, we might want to do it manually in Next.js App router
        capture_pageview: false, 
        // We will identify the user ourselves
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') posthog.debug();
          
          const userId = getOrCreateUserId();
          posthog.identify(userId);
        }
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
