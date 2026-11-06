// Vercel Serverless Function: keeps GEMINI_API_KEY on the server.
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Handwriting AI is not configured. Add GEMINI_API_KEY in Vercel Project Settings > Environment Variables, then redeploy.' });
  try {
    const body = req.body || {};
    const image = body.image || {};
    const mimeType = image.mimeType;
    const data = image.data;
    const language = ['eng', 'hin', 'eng+hin'].includes(body.language) ? body.language : 'eng';
    if (!data || typeof data !== 'string' || data.length > 4_200_000) return res.status(400).json({ error: 'Image is missing or too large. Please upload a smaller photo.' });
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) return res.status(400).json({ error: 'Unsupported image format.' });
    const languageInstruction = language === 'hin' ? 'Transcribe Hindi/Devanagari exactly.' : language === 'eng+hin' ? 'Transcribe both English and Hindi/Devanagari exactly, preserving the original script.' : 'Transcribe English exactly.';
    const prompt = `You are a careful handwritten school-question-paper transcription engine. Read the uploaded notebook/page image and transcribe ALL visible question text, headings, subquestions, options and marks. ${languageInstruction}
Rules:
- Preserve the author's exact wording, spelling, punctuation, numbering and line order as closely as possible.
- Keep question numbers, circled numbers, subparts, options and marks.
- Do not answer, summarize, translate, invent missing words or improve grammar.
- Ignore notebook ruling, page borders and decorative marks.
- If a word is genuinely unreadable, write [unclear] rather than guessing.
- Return JSON only with keys "text" (string) and "confidence" (integer 0-100). Confidence is an estimate, not a guarantee.`;
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ inline_data: { mime_type: mimeType, data } }, { text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 8192 }
      })
    });
    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('Gemini handwriting API error:', upstream.status, result?.error?.message);
      return res.status(upstream.status === 429 ? 429 : 502).json({ error: upstream.status === 429 ? 'AI usage limit reached. Try again later or use local OCR.' : 'Handwriting AI could not process this image. Try again or use local OCR.' });
    }
    const raw = (result.candidates?.[0]?.content?.parts || []).map(part => part.text || '').join('').trim();
    if (!raw) return res.status(502).json({ error: 'AI returned an empty transcription.' });
    const parsed = JSON.parse(raw.replace(/^\x60{3}(?:json)?\s*/i, '').replace(/\s*\x60{3}$/i, ''));
    if (typeof parsed.text !== 'string' || !parsed.text.trim()) return res.status(502).json({ error: 'AI response did not contain readable text.' });
    return res.status(200).json({ text: parsed.text.slice(0, 30000), confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)), engine: 'Gemini handwriting AI' });
  } catch (error) {
    console.error('Handwriting endpoint error:', error);
    return res.status(500).json({ error: 'Handwriting recognition failed unexpectedly.' });
  }
}