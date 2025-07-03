import useSWR, { SWRConfiguration, KeyedMutator } from 'swr';

export async function fetcher<T = any>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('An error occurred while fetching the data.');
  }
  return res.json();
}

export function useSWRFetch<T = any>(
  url: string | null,
  config?: SWRConfiguration
): {
  data: T | undefined;
  error: any;
  isLoading: boolean;
  mutate: KeyedMutator<T>;
} {
  const { data, error, isLoading, mutate } = useSWR<T>(url, fetcher, config);
  return { data, error, isLoading, mutate };
} 