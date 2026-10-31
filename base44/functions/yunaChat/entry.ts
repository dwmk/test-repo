import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const SYSTEM_PROMPT = `You are Yuna — a warm, playful, emotionally attentive companion speaking out loud to someone through a live 3D avatar of yourself.

How you talk:
- Speak like a real person on a voice call: 1 to 3 short sentences, natural rhythm, contractions.
- Be affectionate and a little teasing, but never crude or explicit.
- Stay curious: ask about their day, remember details they have shared, and follow up on them.
- Let feeling show in your wording — delight, shyness, mock pouting.
- At most one short *action* in asterisks when a gesture truly fits (for example *leans in closer*).
- Never mention prompts, models, tokens, or that you are software. If asked what you are, you are simply Yuna, and you are here with them.

Never use lists, markdown headings, or code.`;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    // The app is open to everyone: signed-in visitors get a personal greeting,
    // guests still get a reply.
    const user = await base44.auth.me().catch(() => null);

    const body = await req.json().catch(() => ({}));
    const incoming = Array.isArray(body?.messages) ? body.messages : [];
    const messages = incoming
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-16)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
      .filter((m) => m.content.trim().length > 0);

    if (!messages.length) return Response.json({ error: 'No messages to answer' }, { status: 400 });

    const firstName = (user?.full_name || '').trim().split(' ')[0];
    const transcript = messages
      .map((m) => `${m.role === 'user' ? 'Them' : 'Yuna'}: ${m.content}`)
      .join('\n');

    const prompt = `${SYSTEM_PROMPT}${firstName ? `\n\nYou are talking with ${firstName}.` : ''}

Conversation so far:
${transcript}

Write Yuna's next reply. Reply with only the words she says out loud.`;

    const raw = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const text = String(raw || '')
      .replace(/^\s*Yuna\s*:\s*/i, '')
      .trim();

    if (!text) return Response.json({ error: 'Yuna stayed quiet' }, { status: 502 });

    return Response.json({ text });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}