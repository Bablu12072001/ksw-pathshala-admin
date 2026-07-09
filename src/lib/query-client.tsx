'use strict';
'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onSuccess: (data: any, variables, context, mutation) => {
            // Determine the message based on mutation or use a default
            const actionMessage = mutation.meta?.successMessage as string || 'Action completed successfully!';
            toast.success(actionMessage);
          },
          onError: (error: any, variables, context, mutation) => {
            const errorMessage = mutation.meta?.errorMessage as string || error?.response?.data?.message || error.message || 'An error occurred';
            toast.error(`Failed: ${errorMessage}`);
          }
        }),
        defaultOptions: {
          queries: {
            staleTime: 0, // 0 minutes (always fetch)
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
