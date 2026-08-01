import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, TextInput, Alert, ActivityIndicator, Platform, Modal } from 'react-native';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignatureScreen from 'react-native-signature-canvas';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Camera, Image as ImageIcon, PenTool, CheckCircle2, ArrowLeft, RotateCw } from 'lucide-react-native';

import { useAppColors, spacing, borderRadius } from '../../../src/theme';
import { completeDelivery } from '../../../src/lib/api-client';
import { BigActionButton } from '../../../src/components/ui/BigActionButton';
import { compressProofPhoto } from '../../../src/lib/photo-utils';
import { stopTracking } from '../../../src/location/location-manager';
import { enqueueRequest, recordSyncAudit } from '../../../src/lib/offline-queue';
import { getToken } from '../../../src/lib/storage';
import { t } from '../../../src/i18n';

const DRAFT_KEY = 'proof_draft_';

export default function ProofScreen() {
  const colors = useAppColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [signatureUri, setSignatureUri] = useState<string | null>(null);
  const [showSignature, setShowSignature] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const signatureRef = useRef<any>(null);

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert(t('common.failed'), t('delivery.cameraPermission'));
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      const compressed = await compressProofPhoto(result.assets[0].uri);
      setPhotoUri(compressed || result.assets[0].uri);
    }
  }

  async function pickFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert(t('common.failed'), t('delivery.galleryPermission'));
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      const compressed = await compressProofPhoto(result.assets[0].uri);
      setPhotoUri(compressed || result.assets[0].uri);
    }
  }

  async function saveDraft() {
    try {
      await AsyncStorage.setItem(DRAFT_KEY + id, JSON.stringify({ photoUri, signatureUri, notes }));
    } catch { /* silent */ }
  }

  async function loadDraft() {
    try {
      const draft = await AsyncStorage.getItem(DRAFT_KEY + id);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.photoUri) setPhotoUri(parsed.photoUri);
        if (parsed.signatureUri) setSignatureUri(parsed.signatureUri);
        if (parsed.notes) setNotes(parsed.notes);
      }
    } catch { /* silent */ }
  }

  function retryComplete() {
    setRetryCount((c) => c + 1);
    setLoading(false);
    setTimeout(() => handleComplete(), 500);
  }

  async function handleComplete() {
    if (!photoUri) {
      return Alert.alert(t('common.confirm'), t('delivery.photoRequired'));
    }
    setLoading(true);
    await saveDraft();
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      const token = await getToken();
      const deliveryId = parseInt(id!, 10);
      await saveDraft();
      await enqueueRequest(
        `/api/courier/deliveries/${deliveryId}/complete`,
        'POST',
        { delivery_id: deliveryId, notes, has_proof: true },
        token,
        'STATUS_UPDATE',
        'high'
      );
      await recordSyncAudit({ deliveryId, action: 'complete', serverVerified: false });
      setLoading(false);
      router.replace(`/delivery/${id}/success`);
      return;
    }
    try {
      const deliveryId = parseInt(id!, 10);
      const photoData = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const proofUrl = `data:image/jpeg;base64,${photoData}`;
      const body: { proof_photo_url: string; proof_url: string; notes?: string; signature_base64?: string } = {
        proof_photo_url: proofUrl,
        proof_url: proofUrl,
      };
      if (notes) body.notes = notes;
      if (signatureUri) body.signature_base64 = signatureUri;
      await completeDelivery(deliveryId, body);
      await AsyncStorage.removeItem(DRAFT_KEY + id);
      stopTracking();
      router.replace(`/delivery/${id}/success`);
    } catch {
      if (retryCount < 2) {
        Alert.alert('Gagal Mengirim', 'Mencoba ulang pengiriman...', [
          { text: 'Coba Lagi', onPress: retryComplete },
          { text: 'Simpan Draft', onPress: () => { saveDraft(); Alert.alert('Draft Tersimpan', 'Anda bisa kirim ulang nanti.'); setLoading(false); } },
        ]);
      } else {
        Alert.alert(t('common.error'), 'Gagal mengirim setelah 3 kali percobaan. Draft tersimpan.');
        await saveDraft();
        setLoading(false);
      }
    }
    if (retryCount === 0) setLoading(false);
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('delivery.proofOfDelivery'),
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.text }]}>{t('delivery.proofDocumentation')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('delivery.proofSubtitle')}</Text>

        {photoUri ? (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            <TouchableOpacity onPress={takePhoto} style={styles.retakeButton}>
              <Text style={[styles.retakeText, { color: colors.accent }]}>{t('delivery.retake')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={takePhoto}>
              <Camera size={32} color={colors.accent} />
              <Text style={[styles.photoButtonText, { color: colors.textSecondary }]}>{t('delivery.takePhoto')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.photoButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={pickFromGallery}>
              <ImageIcon size={32} color={colors.accent} />
              <Text style={[styles.photoButtonText, { color: colors.textSecondary }]}>{t('delivery.fromGallery')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>{t('delivery.customerSignature')}</Text>
          {signatureUri ? (
            <View style={styles.signaturePreview}>
              <Image source={{ uri: signatureUri }} style={[styles.signatureImage, { backgroundColor: colors.surface, borderColor: colors.border }]} />
              <TouchableOpacity onPress={clearSignature} style={styles.retakeButton}>
                <Text style={[styles.retakeText, { color: colors.accent }]}>{t('delivery.clearSignature')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.signatureButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setShowSignature(true)}>
              <PenTool size={32} color={colors.accent} />
              <Text style={[styles.signatureButtonText, { color: colors.textSecondary }]}>{t('delivery.requestSignature')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {showSignature && (
          <Modal visible={showSignature} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('delivery.signature')}</Text>
                <SignatureScreen
                  ref={signatureRef}
                  onOK={handleSignature}
                  onEmpty={handleSignatureEmpty}
                  imageType="image/png"
                  descriptionText={t('delivery.signHere')}
                  clearText={t('common.cancel')}
                  confirmText={t('common.save')}
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
          <Text style={[styles.label, { color: colors.text }]}>{t('delivery.proof_notes')}</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('delivery.notesPlaceholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            editable={!loading}
          />
        </View>

        <BigActionButton
          label={t('delivery.confirmDelivery')}
          onPress={handleComplete}
          loading={loading}
          disabled={!photoUri || loading}
          variant="success"
          icon={CheckCircle2}
        />

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={16} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={[styles.backText, { color: colors.accent }]}>{t('common.back')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl + 20,
    gap: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
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
    backgroundColor: '#e5e7eb',
  },
  retakeButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  retakeText: {
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
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  textArea: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 14,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  signatureButton: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  signatureButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  signaturePreview: {
    alignItems: 'center',
  },
  signatureImage: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.md,
    borderWidth: 1,
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
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    height: 400,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
