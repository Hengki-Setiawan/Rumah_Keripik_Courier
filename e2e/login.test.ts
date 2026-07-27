import { by, device, element, expect, waitFor } from 'detox';

describe('Courier Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
  });

  afterAll(async () => {
    await device.uninstallApp();
  });

  it('should show login screen with brand header', async () => {
    await expect(element(by.text('Rumah Keripik'))).toBeVisible();
    await expect(element(by.text('Login Kurir'))).toBeVisible();
  });

  it('should show form elements', async () => {
    await expect(element(by.text('Nomor Telepon'))).toBeVisible();
    await expect(element(by.text('PIN (6 digit)'))).toBeVisible();
    await expect(element(by.text('Masuk'))).toBeVisible();
  });

  it('should validate empty fields', async () => {
    await element(by.text('Masuk')).tap();
    await expect(element(by.text('Nomor telepon tidak valid'))).toBeVisible();
  });

  it('should validate 6-digit PIN', async () => {
    await element(by.type('TextInput').atIndex(0)).typeText('6281234567890');
    await element(by.text('Masuk')).tap();
    await expect(element(by.text('PIN harus 6 digit'))).toBeVisible();
  });

  it('should attempt login with valid inputs', async () => {
    await element(by.type('TextInput').atIndex(1)).typeText('123456');
    await element(by.text('Masuk')).tap();
    await waitFor(element(by.text('Login Gagal')))
      .toExist()
      .withTimeout(15000);
  });

  it('should show login error on failure', async () => {
    await expect(element(by.text('OK'))).toBeVisible();
    await element(by.text('OK')).tap();
  });
});
