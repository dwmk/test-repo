// Yuna's voice: a fixed, ordered pack of known female system voices.
// The browser's default voice is often male, so we never fall back to it
// when any non-male voice exists.

export const FEMALE_VOICE_PACK = [
  // Apple — macOS / iOS / iPadOS
  'Ava (Premium)',
  'Ava',
  'Samantha',
  'Allison',
  'Susan',
  'Serena',
  'Karen',
  'Moira',
  'Tessa',
  'Nicky',
  'Kate',
  'Fiona',
  'Victoria',
  'Zoe',
  'Paula',
  'Sinji',
  // Microsoft — Windows / Edge
  'Microsoft Aria Online (Natural) - English (United States)',
  'Microsoft Aria Online (Natural)',
  'Microsoft Jenny Online (Natural) - English (United States)',
  'Microsoft Jenny Online (Natural)',
  'Microsoft Michelle Online (Natural)',
  'Microsoft Ana Online (Natural)',
  'Microsoft Emma Online (Natural)',
  'Microsoft Aria',
  'Microsoft Jenny',
  'Microsoft Zira Desktop - English (United States)',
  'Microsoft Zira - English (United States)',
  'Microsoft Hazel Desktop - English (Great Britain)',
  'Microsoft Hazel',
  'Microsoft Eva',
  // Google — Chrome / Android / ChromeOS
  'Google UK English Female',
  'Google US English',
  'Google UK English',
  'Google Chrome OS English (United States)',
];

// Recognised female-sounding voice names across platforms.
const FEMALE_HINTS =
  /female|woman|aria|jenny|samantha|ava|serena|allison|susan|karen|zira|michelle|hazel|tessa|moira|nicky|kate|victoria|fiona|emma|olivia|sophia|isabella|amelia|joanna|salli|kendra|kimberly|ivy|veena|raveena|linda|heather|catherine|lily|nova|shimmer|sonia|libby|maisie|natasha|clara|emily|chloe|grace|hannah|julia|mary|anna|laura|sara|sarah|paula|zoe|ana|eva/i;

// Explicitly masculine names — never selected, and never a silent fallback.
const MALE_VOICE = /\bmale\b|\bman\b|\bdavid\b|\bmark\b|\bguy\b|\bdaniel\b|\bfred\b|\balex\b|\bgeorge\b|\bjames\b|\bjason\b|\btom\b|\baaron\b|\barthur\b|\beric\b|\bryan\b|\boliver\b|\bthomas\b|\bmatthew\b|\bbrian\b|\bchristopher\b|\bsteffan\b|\brishi\b|\bliam\b|\bnathan\b|\breed\b|\broger\b|\bsteve\b|\bdiego\b|\bjorge\b|\bcarlos\b|\bmiguel\b|\bxander\b|\bravi\b|\bgordon\b|\bjunior\b|\bmartin\b|\bpeter\b|\bpaul\b|\bjohn\b|\bmichael\b|\bkevin\b|\bjustin\b|\bwilliam\b|\bben\b/i;

const isMale = (voice) => !/female|woman/i.test(voice.name || '') && MALE_VOICE.test(voice.name || '');
const isEnglish = (voice) => /^en([-_]|$)/i.test(voice.lang || '');

export function listVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices() || [];
}

// Voice lists arrive asynchronously in most browsers: the first getVoices()
// call is frequently empty, which used to leave Yuna on the system default (male).
export function whenVoicesReady(timeout = 1500) {
  const voices = listVoices();
  if (voices.length) return Promise.resolve(voices);

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener?.('voiceschanged', finish);
      resolve(listVoices());
    };
    window.speechSynthesis.addEventListener?.('voiceschanged', finish);
    setTimeout(finish, timeout);
  });
}

function scoreVoice(voice) {
  const name = String(voice.name || '').toLowerCase();
  const packIndex = FEMALE_VOICE_PACK.findIndex((entry) => name.includes(entry.toLowerCase()));
  if (packIndex >= 0) return 1000 - packIndex;
  if (FEMALE_HINTS.test(voice.name || '')) return 400;
  if (isEnglish(voice)) return 100;
  return 10;
}

export function resolveYunaVoice(voices = listVoices()) {
  let best = null;
  let bestScore = -1;

  voices.forEach((voice) => {
    if (isMale(voice)) return;
    const score = scoreVoice(voice) + (isEnglish(voice) ? 20 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = voice;
    }
  });

  return best;
}