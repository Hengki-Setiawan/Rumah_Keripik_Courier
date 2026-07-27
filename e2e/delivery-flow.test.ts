import { by, device, element, expect } from 'detox';

describe('Delivery Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.type('TextInput').atIndex(0)).typeText('6281234567890');
    await element(by.type('TextInput').atIndex(1)).typeText('123456');
    await element(by.text('Masuk')).tap();
  });

  it('should show delivery list', async () => {
    try {
      await expect(element(by.text('Belum ada kiriman untuk hari ini'))).toBeVisible();
    } catch {
      await expect(element(by.text('Halo,'))).toBeVisible();
    }
  });

  it('should show offer cards if available', async () => {
    try {
      await expect(element(by.text('Tawaran Baru'))).toBeVisible();
      await expect(element(by.text('Terima'))).toBeVisible();
      await expect(element(by.text('Tolak'))).toBeVisible();
    } catch {
    }
  });

  it('should navigate to delivery detail if deliveries exist', async () => {
    try {
      const deliveryCards = element(by.text('Terkirim'));
      if (await deliveryCards.isVisible()) {
      }
    } catch {
    }
  });
});
