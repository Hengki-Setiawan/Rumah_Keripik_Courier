import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTodayDeliveries, respondToOffer } from '../lib/api-client';
import { useDeliveryStore } from '../store/delivery-store';
import type { CourierDeliveryDto } from '../lib/types';

const DELIVERIES_KEY = ['deliveries', 'today'] as const;

export function useTodayDeliveries() {
  const setActiveDeliveries = useDeliveryStore((s) => s.setActiveDeliveries);

  return useQuery({
    queryKey: DELIVERIES_KEY,
    queryFn: async () => {
      const data = await getTodayDeliveries();
      const list: CourierDeliveryDto[] = (data as any).deliveries ?? data ?? [];
      setActiveDeliveries(list);
      return list;
    },
  });
}

export function useRespondOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: number;
      action: 'accept' | 'reject';
    }) => {
      return respondToOffer(id, action);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DELIVERIES_KEY });
    },
  });
}
