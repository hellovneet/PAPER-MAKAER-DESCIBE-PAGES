export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on Vercel.' });
  }

  try {
    const body = req.body || {};
    const images = Array.isArray(body.images) ? body.images : [];
    const language = body.language || 'English + Hindi';
    const pageNumber = Number(body.pageNumber || 1);

    if (!images.length) {
      return res.status(400).json({ error: 'No image supplied.' });
    }

    if (images.length > 4) {
      return res.status(400).json({ error: 'Maximum 4 images per AI request.' });
    }

    const content = [
      {
        type: 'input_text',
        text: `You are the handwriting/OCR engine for DESCRIBE PAGES, a school question-paper maker.

Read the uploaded question-paper image(s), including handwritten text. Be extremely careful with handwriting, question numbers, punctuation, mathematical symbols, Hindi/English mixed text, and MCQ options.

Language preference: ${language}.
Page number: ${pageNumber}.

Return ONLY valid JSON. No markdown and no explanation.
Use this exact shape:
{
  "questions": [
    {
      "number": 1,
      "type": "mcq|fill|tf|short",
      "text": "question text",
      "options": ["option A", "option B", "option C"]
    }
  ]
}

Rules:
- Preserve the wording as closely as possible.
- Do not invent unreadable words. If a word is uncertain, make the best visual reading and keep the rest intact.
- Detect MCQs and their options.
- Detect fill-in-the-blank and true/false questions.
- If a question continues on another line, join it into one question.
- Ignore school headers, page numbers, marks, decorative text and instructions unless they are clearly part of a question.
- Keep original question numbering when visible.
- For non-MCQ questions, options must be ["","",""]` 
      }
    ];

    for (const image of images) {
      if (typeof image !== 'string' || !image.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Invalid image data.' });
      }
      content.push({
        type: 'input_image',
        image_url: image,
        detail: 'high'
      });
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-5.6',
        input: [
          {
            role: 'user',
            content
          }
        ],
        max_output_tokens: 5000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI error:', data);
      return res.status(response.status).json({
        error: data?.error?.message || 'OpenAI request failed.'
      });
    }

    const output = data.output_text || extractOutputText(data.output);
    if (!output) {
      return res.status(502).json({ error: 'AI returned no text.' });
    }

    const parsed = parseJson(output);
    if (!parsed || !Array.isArray(parsed.questions)) {
      return res.status(502).json({ error: 'AI returned an invalid question format.' });
    }

    return res.status(200).json({ questions: parsed.questions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'AI extraction failed.' });
  }
}

function extractOutputText(output) {
  if (!Array.isArray(output)) return '';
  return output
    .flatMap(item => Array.isArray(item.content) ? item.content : [])
    .filter(item => item.type === 'output_text')
    .map(item => item.text || '')
    .join('\n');
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch (_) {}

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) {
    try { return JSON.parse(fenced[1]); } catch (_) {}
  }

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch (_) {}
  }

  return null;
}
