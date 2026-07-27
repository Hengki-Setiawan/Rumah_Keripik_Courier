import { by, device, element, expect } from 'detox';

describe('Device State Handling', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('should survive backgrounding and foregrounding', async () => {
    await device.sendToHome();
    await device.launchApp({ newInstance: false });
    await expect(element(by.text('Login Kurir'))).toBeVisible();
  });

  it('should survive rapid foreground/background cycles', async () => {
    for (let i = 0; i < 3; i++) {
      await device.sendToHome();
      await device.launchApp({ newInstance: false });
    }
    await expect(element(by.text('Login Kurir'))).toBeVisible();
  });

  it('should handle orientation change to landscape', async () => {
    await device.setOrientation('landscape');
    await expect(element(by.text('Masuk'))).toBeVisible();
    await device.setOrientation('portrait');
    await expect(element(by.text('Masuk'))).toBeVisible();
  });

  it('should handle deep link to delivery', async () => {
    await device.sendToHome();
    await device.launchApp({
      url: 'rumahkeripikcourier://delivery/1',
      newInstance: true,
    });
    await expect(element(by.text('Login Kurir'))).toBeVisible();
  });

  it('should recover from low memory state', async () => {
    await device.launchApp({ newInstance: true, launchArgs: { detoxDebug: 'memory_warning' } });
    await expect(element(by.text('Login Kurir'))).toBeVisible();
  });
});
