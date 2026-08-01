import * as ImageManipulator from 'expo-image-manipulator';
import { File, Directory, Paths } from 'expo-file-system';

export async function compressProofPhoto(localUri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 1200 } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

export async function savePhotoLocally(sourceUri: string): Promise<string> {
  const dir = new Directory(Paths.document, 'proof-photos');
  await dir.create({ intermediates: true });
  const filename = `proof_${Date.now()}.jpg`;
  const source = new File(sourceUri);
  const dest = new File(dir, filename);
  await source.move(dest);
  return dest.uri;
}

export async function deleteLocalPhoto(localUri: string) {
  try {
    const f = new File(localUri);
    const info = await f.info();
    if (info.exists) {
      await f.delete();
    }
  } catch {
    // ignore
  }
}

export async function getPhotoSizeInKB(localUri: string): Promise<number> {
  try {
    const f = new File(localUri);
    const info = await f.info();
    if (info?.size != null) {
      return Math.round(info.size / 1024);
    }
  } catch {
    // ignore
  }
  return 0;
}
