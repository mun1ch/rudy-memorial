import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Check if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("⚠️ Supabase not configured. Please set up your .env.local file with Supabase credentials.");
    // Return a mock client for development
    return {
      from: () => ({
        insert: () => ({ 
          select: () => ({ 
            single: () => Promise.resolve({ 
              data: { id: 'mock-id-' + Date.now(), message: 'Mock tribute', contributor_name: 'Mock User' }, 
              error: null 
            }) 
          }) 
        }),
        select: () => Promise.resolve({ data: [], error: null }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) })
      }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: { path: 'mock-path' }, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: '/mock-url' } })
        })
      }
    } as any;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
