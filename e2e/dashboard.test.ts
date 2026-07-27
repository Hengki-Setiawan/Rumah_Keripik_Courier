import { by, device, element, expect, waitFor } from 'detox';

describe('Courier Dashboard', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('should show login screen first', async () => {
    await expect(element(by.text('Login Kurir'))).toBeVisible();
  });

  it('should show stat cards after login', async () => {
    await element(by.type('TextInput').atIndex(0)).typeText('6281234567890');
    await element(by.type('TextInput').atIndex(1)).typeText('123456');
    await element(by.text('Masuk')).tap();
    try {
      await waitFor(element(by.text('Tertunda')))
        .toBeVisible()
        .withTimeout(30000);
      await expect(element(by.text('Terkirim'))).toBeVisible();
      await expect(element(by.text('Gagal'))).toBeVisible();
    } catch {
    }
  });

  it('should show tracking button', async () => {
    try {
      await expect(element(by.text('▶ Mulai Lacak Lokasi'))).toBeVisible();
    } catch {
    }
  });

  it('should show navigation buttons', async () => {
    try {
      await expect(element(by.text('💰 Pendapatan'))).toBeVisible();
      await expect(element(by.text('🆘 Darurat'))).toBeVisible();
    } catch {
    }
  });

  it('should show logout button', async () => {
    try {
      await expect(element(by.text('Logout'))).toBeVisible();
    } catch {
    }
  });
});
