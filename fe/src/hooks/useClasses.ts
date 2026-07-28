import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

interface ClassInfo {
  name: string;
  student_count: number;
}

export function useClasses() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data: res } = await apiClient.get('/classes');
      return (res.data as ClassInfo[]).map((c: ClassInfo) => c.name).sort();
    },
    staleTime: 60000,
    retry: 2,
    retryDelay: 1000,
  });

  return {
    classes: data || [],
    isLoading,
    error,
  };
}
