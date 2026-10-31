import { base44 } from '@/api/base44Client';

export const DEFAULT_OUTFIT = {
  id: 'mint-maid-apron',
  name: 'Mint Maid Apron',
  file: 'hana_v1.5_vrm1.vrm',
};

export const FACE_EMOTIONS = ['neutral', 'happy', 'relaxed', 'sad', 'angry', 'surprised'];

export async function fetchOutfits() {
  const response = await base44.functions.invoke('yunaStage', { action: 'outfits' });
  const list = response.data?.outfits || [];
  if (!list.length) throw new Error('Wardrobe unavailable');
  return list;
}

export async function detectEmotion(text) {
  if (!text) return null;
  const response = await base44.functions.invoke('yunaStage', {
    action: 'emotion',
    text: text.slice(0, 2000),
  });
  const emotion = response.data?.emotion;
  return FACE_EMOTIONS.includes(emotion) ? emotion : null;
}