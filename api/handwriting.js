// Vercel Serverless Function: the Gemini key stays on the server.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'Gemini is not configured. Add GEMINI_API_KEY in Vercel Environment Variables and redeploy.'
    });
  }

  let timer;
  try {
    const body = req.body || {};
    const image = body.image || {};
    const mimeType = image.mimeType;
    const data = image.data;
    const language = ['eng', 'hin', 'eng+hin'].includes(body.language) ? body.language : 'eng';

    if (typeof data !== 'string' || !data.length) {
      return res.status(400).json({ error: 'No image data received. Upload the photo again.' });
    }
    if (data.length > 4_000_000) {
      return res.status(413).json({ error: 'Image is too large for AI scanning. Crop the page or choose a smaller photo.' });
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      return res.status(415).json({ error: 'Unsupported image format. Use JPG, PNG or WEBP.' });
    }

    const languageInstruction = language === 'hin'
      ? 'Read Hindi/Devanagari handwriting and preserve the original script.'
      : language === 'eng+hin'
        ? 'Read both English and Hindi/Devanagari handwriting and preserve each original script.'
        : 'Read English handwriting.';

    const prompt = `You are a precise school question-paper transcription engine. Read the uploaded page image and transcribe every visible heading, question, sub-question, option and mark. ${languageInstruction}
Rules:
- Preserve exact wording, numbering, punctuation, line order and original language.
- Preserve MCQ options (A), (B), (C), (D), subparts and marks.
- Do not solve questions, answer them, translate them, summarize them or invent missing text.
- Ignore notebook ruling, page borders, doodles and unrelated marks.
- If a word cannot be read confidently, write [unclear]. Do not guess.
- Return only a JSON object with "text" (string) and "confidence" (integer from 0 to 100).`;

    const controller = new AbortController();
    timer = setTimeout(() => controller.abort(), 55000);
    const upstream = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent',
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data } },
              { text: prompt }
            ]
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0,
            maxOutputTokens: 8192
          }
        })
      }
    );

    const result = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const providerMessage = result?.error?.message || '';
      console.error('Gemini API request failed:', upstream.status, providerMessage);
      if (upstream.status === 400) {
        return res.status(502).json({ error: 'Gemini rejected this image. Try a JPG/PNG photo with the full page visible.' });
      }
      if (upstream.status === 401 || upstream.status === 403) {
        return res.status(503).json({ error: 'Gemini API key was rejected. Check GEMINI_API_KEY in Vercel and redeploy.' });
      }
      if (upstream.status === 429) {
        return res.status(429).json({ error: 'Gemini usage limit reached. Wait a little and scan again, or use local OCR.' });
      }
      return res.status(502).json({ error: 'Gemini could not process the photo right now. Try again or use local OCR.' });
    }

    const candidate = result.candidates?.[0];
    const raw = (candidate?.content?.parts || []).map(part => part.text || '').join('').trim();
    if (!raw) {
      console.error('Gemini returned no text. Finish reason:', candidate?.finishReason || 'unknown');
      return res.status(502).json({ error: 'Gemini returned an empty result. Try a clearer photo.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, ''));
    } catch {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start < 0 || end <= start) throw new Error('Gemini returned invalid JSON.');
      parsed = JSON.parse(raw.slice(start, end + 1));
    }

    if (typeof parsed.text !== 'string' || !parsed.text.trim()) {
      return res.status(502).json({ error: 'Gemini did not find readable question text in this photo.' });
    }

    return res.status(200).json({
      text: parsed.text.slice(0, 30000),
      confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)),
      engine: 'Gemini handwriting AI'
    });
  } catch (error) {
    console.error('Handwriting endpoint error:', error);
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Gemini took too long to respond. The app can retry with local OCR.' });
    }
    return res.status(500).json({ error: 'Handwriting scan failed unexpectedly. Please retry.' });
  } finally {
    if (timer) clearTimeout(timer);
  }
}
