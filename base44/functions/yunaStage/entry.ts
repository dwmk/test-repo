const HANA_API = 'https://hana.makron.app';
const ASSET_HOST = 'https://muxai.vercel.app';

// Hana's outfit table lists files that are not all hosted upstream: unknown
// names silently fall back to the default avatar, which looked like the
// wardrobe doing nothing. Offer only models that really exist, verified here.
const KNOWN_OUTFITS = [
  { id: 'mint-maid-apron', name: 'Mint Maid Apron', file: 'hana_v1.5_vrm1.vrm', isDefault: true },
  { id: 'pink-maid-apron', name: 'Pink Maid Apron', file: 'hana_v1.0_pinkmaid_vrm1.vrm' },
  { id: 'hana-v1-3', name: 'Hana v1.3', file: 'hana_v1.3_vrm1.vrm' },
  { id: 'hana-v1-2', name: 'Hana v1.2', file: 'hana_v1.2_vrm1.vrm' },
  { id: 'hana-v1-0', name: 'Hana v1.0', file: 'hana_v1.0_vrm1.vrm' },
];

async function modelExists(file) {
  try {
    const res = await fetch(`${ASSET_HOST}/${file}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(6000),
    });
    return res.ok;
  } catch (error) {
    return false;
  }
}

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === 'outfits') {
      const flags = await Promise.all(KNOWN_OUTFITS.map((outfit) => modelExists(outfit.file)));
      const verified = KNOWN_OUTFITS.filter((outfit, index) => flags[index]);
      const list = (verified.length ? verified : KNOWN_OUTFITS).map((outfit) => ({
        ...outfit,
        premium: Boolean(outfit.premium),
      }));
      return Response.json({ outfits: list });
    }

    if (action === 'emotion') {
      const text = typeof body?.text === 'string' ? body.text.slice(0, 2000).trim() : '';
      if (!text) return Response.json({ emotion: 'neutral' });
      const res = await fetch(`${HANA_API}/api/emotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return Response.json({ emotion: 'neutral' });
      const data = await res.json();
      return Response.json({ emotion: data?.emotion || 'neutral' });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}