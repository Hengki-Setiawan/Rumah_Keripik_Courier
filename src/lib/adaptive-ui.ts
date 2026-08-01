import type { CourierDeliveryDto } from './types';

export type UrgencyLevel = 'critical' | 'urgent' | 'normal' | 'idle';

export interface ContextAction {
  label: string;
  priority: number;
  type: 'delivery' | 'shift' | 'sos' | 'navigation' | 'notification';
  route: string;
  urgency: UrgencyLevel;
}

export function assessUrgency(delivery: CourierDeliveryDto): UrgencyLevel {
  if (delivery.status === 'Gagal') return 'idle';
  if (delivery.status === 'Terkirim') return 'idle';

  const createdAt = delivery.created_at ? new Date(delivery.created_at).getTime() : Date.now();
  const elapsedMinutes = (Date.now() - createdAt) / 60000;

  if (elapsedMinutes > 45) return 'critical';
  if (elapsedMinutes > 25) return 'urgent';
  if (delivery.status === 'Dalam_Pengiriman') return 'urgent';
  return 'normal';
}

export function getAdaptiveActions(
  deliveries: CourierDeliveryDto[],
): ContextAction[] {
  const actions: ContextAction[] = [];

  const activeDelivery = deliveries.find((d) => d.status === 'Dalam_Pengiriman');
  if (activeDelivery) {
    actions.push({
      label: `Lanjutkan Antar: ${activeDelivery.customer_name}`,
      priority: 100,
      type: 'delivery',
      route: `/delivery/${activeDelivery.id}`,
      urgency: 'urgent',
    });
  }

  const urgentOffers = deliveries
    .filter((d) => d.status === 'Siap_Dikirim')
    .filter((d) => assessUrgency(d) === 'critical');
  for (const offer of urgentOffers) {
    actions.push({
      label: `⏰ SEGERA: ${offer.customer_name}`,
      priority: 90,
      type: 'delivery',
      route: `/delivery/${offer.id}`,
      urgency: 'critical',
    });
  }

  const pendingAssigned = deliveries.find((d) => d.status === 'Siap_Dikirim');
  if (pendingAssigned && !urgentOffers.length) {
    actions.push({
      label: `Mulai Antar: ${pendingAssigned.customer_name}`,
      priority: 70,
      type: 'delivery',
      route: `/delivery/${pendingAssigned.id}`,
      urgency: 'normal',
    });
  }

  const sortedDeliveries = [...deliveries]
    .filter((d) => d.status !== 'Siap_Dikirim')
    .sort((a, b) => {
      const urgencyOrder: Record<UrgencyLevel, number> = {
        critical: 0, urgent: 1, normal: 2, idle: 3,
      };
      return urgencyOrder[assessUrgency(a)] - urgencyOrder[assessUrgency(b)];
    });

  return actions;
}

export function getUrgencyColor(urgency: UrgencyLevel, colors: any) {
  switch (urgency) {
    case 'critical': return colors.error;
    case 'urgent': return colors.warning;
    case 'normal': return colors.accent;
    case 'idle': return colors.textMuted;
  }
}
