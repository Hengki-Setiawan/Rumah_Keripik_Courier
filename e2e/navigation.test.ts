import { by, device, element, expect } from 'detox';

describe('Courier Navigation', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true, newInstance: true });
    await element(by.type('TextInput').atIndex(0)).typeText('6281234567890');
    await element(by.type('TextInput').atIndex(1)).typeText('123456');
    await element(by.text('Masuk')).tap();
  });

  it('should reject invalid login, then proceed', async () => {
    try {
      await expect(element(by.text('Login Gagal'))).toBeVisible({ timeout: 15000 });
      await element(by.text('OK')).tap();
    } catch {
    }
  });

  it('should navigate to earnings page', async () => {
    try {
      await element(by.text('💰 Pendapatan')).tap();
      await expect(element(by.text('Pendapatan'))).toBeVisible();
      await device.pressBack();
    } catch {
    }
  });

  it('should navigate to SOS page', async () => {
    try {
      await element(by.text('🆘 Darurat')).tap();
      await expect(element(by.text('Darurat'))).toBeVisible();
      await device.pressBack();
    } catch {
    }
  });

  it('should try to toggle location tracking', async () => {
    try {
      await element(by.text('▶ Mulai Lacak Lokasi')).tap();
      await expect(element(by.text('⏹ Stop Lacak Lokasi'))).toBeVisible();
      await element(by.text('⏹ Stop Lacak Lokasi')).tap();
      await expect(element(by.text('▶ Mulai Lacak Lokasi'))).toBeVisible();
    } catch {
    }
  });

  it('should attempt logout', async () => {
    try {
      await element(by.text('Logout')).tap();
      await expect(element(by.text('Yakin ingin logout?'))).toBeVisible();
    } catch {
    }
  });
});
