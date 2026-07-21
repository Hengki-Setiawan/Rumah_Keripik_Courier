import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, TextInput, Alert, ActivityIndicator, Platform, Modal } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignatureScreen from 'react-native-signature-canvas';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { colors, spacing, borderRadius } from '../../../src/theme';
import { completeDelivery } from '../../../src/lib/api-client';

export default function ProofScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [signatureUri, setSignatureUri] = useState<string | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const signatureRef = useRef<any>(null);

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert('Izin Ditolak', 'Aktifkan izin kamera di pengaturan');
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function pickFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert('Izin Ditolak', 'Aktifkan izin galeri di pengaturan');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleComplete() {
    if (!photoUri) {
      return Alert.alert('Foto Diperlukan', 'Ambil foto barang sebagai bukti pengiriman');
    }

    setLoading(true);
    try {
      const deliveryId = parseInt(id!, 10);
      const photoData = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const proofUrl = `data:image/jpeg;base64,${photoData}`;

      const body: { proof_photo_url: string; notes?: string; signature_base64?: string } = {
        proof_photo_url: proofUrl,
      };
      if (notes) body.notes = notes;
      if (signatureUri) body.signature_base64 = signatureUri;
      await completeDelivery(deliveryId, body);

      router.replace(`/delivery/${id}/success`);
    } catch {
      Alert.alert('Error', 'Gagal mengirim bukti pengiriman');
    }
    setLoading(false);
  }

  function handleSignature(signature: string) {
    setSignatureUri(signature);
    setShowSignature(false);
  }

  function handleSignatureEmpty() {
    setShowSignature(false);
  }

  function clearSignature() {
    setSignatureUri(null);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Bukti Pengiriman' }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>📸 Dokumentasi Pengiriman</Text>
        <Text style={styles.subtitle}>Ambil foto barang yang sudah sampai ke pelanggan</Text>

        {photoUri ? (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            <TouchableOpacity onPress={takePhoto} style={styles.retakeButton}>
              <Text style={styles.retakeText}>Ambil Ulang</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <Text style={styles.photoButtonIcon}>📷</Text>
              <Text style={styles.photoButtonText}>Ambil Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={pickFromGallery}>
              <Text style={styles.photoButtonIcon}>🖼️</Text>
              <Text style={styles.photoButtonText}>Dari Galeri</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tanda Tangan Pelanggan</Text>
          {signatureUri ? (
            <View style={styles.signaturePreview}>
              <Image source={{ uri: signatureUri }} style={styles.signatureImage} />
              <TouchableOpacity onPress={clearSignature} style={styles.retakeButton}>
                <Text style={styles.retakeText}>Hapus & Tanda Tangan Ulang</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.signatureButton} onPress={() => setShowSignature(true)}>
              <Text style={styles.signatureButtonIcon}>✍️</Text>
              <Text style={styles.signatureButtonText}>Minta Tanda Tangan</Text>
            </TouchableOpacity>
          )}
        </View>

        {showSignature && (
          <Modal visible={showSignature} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Tanda Tangan</Text>
                <SignatureScreen
                  ref={signatureRef}
                  onOK={handleSignature}
                  onEmpty={handleSignatureEmpty}
                  imageType="image/png"
                  descriptionText="Tanda tangan di sini"
                  clearText="Hapus"
                  confirmText="Simpan"
                  webStyle={`
                    .m-signature-pad { box-shadow: none; border: 1px solid #ddd; }
                    .m-signature-pad--body { border: none; }
                    .m-signature-pad--footer { display: flex; justify-content: space-between; padding: 8px; }
                    .button { min-width: 100px; padding: 10px; border-radius: 8px; font-size: 14px; font-weight: 600; }
                    .button.clear { color: #c55a2b; background: #fff; border: 1px solid #c55a2b; }
                    .button.save { color: #fff; background: #7f9f3e; border: none; }
                  `}
                />
              </View>
            </View>
          </Modal>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Catatan (opsional)</Text>
          <TextInput
            style={styles.textArea}
            value={notes}
            onChangeText={setNotes}
            placeholder="Tambahkan catatan pengiriman..."
            multiline
            numberOfLines={3}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, (!photoUri || loading) && styles.disabled]}
          onPress={handleComplete}
          disabled={!photoUri || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>✅ Konfirmasi Berhasil Antar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Kembali</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl + 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  photoPreview: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  photo: {
    width: '100%',
    height: 250,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceDark,
  },
  retakeButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  retakeText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  photoButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  photoButtonIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  inputGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.green,
    borderRadius: borderRadius.md,
    padding: spacing.md + 2,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  submitText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  backText: {
    color: colors.accent,
    fontSize: 14,
  },
  signatureButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  signatureButtonIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  signatureButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  signaturePreview: {
    alignItems: 'center',
  },
  signatureImage: {
    width: '100%',
    height: 120,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    resizeMode: 'contain',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    height: 400,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
