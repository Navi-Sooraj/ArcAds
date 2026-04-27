import OpenAI from 'openai';

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });
}

export async function generateAdContent(req, res) {
  try {
    const client = getGroqClient();
    if (!client) {
      return res.status(400).json({
        success: false,
        message: 'GROQ_API_KEY is missing in backend environment.',
      });
    }

    const { prompt, templateLabel, templateSize } = req.body || {};
    const topic = String(prompt || 'outdoor advertisement').trim();
    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

    const response = await client.responses.create({
      model,
      input: `You are an ad creative assistant.
Return only valid JSON with keys "headline" and "imagePrompt".
- headline: one catchy line under 15 words
- imagePrompt: a descriptive prompt for generating a billboard ad visual
Context:
- Template: ${templateLabel || 'General'}
- Size: ${templateSize || 'N/A'}
- Topic: ${topic}`,
    });

    const text = response.output_text || '';
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Fallback if model returns plain text instead of JSON
      parsed = {
        headline: text.split('\n').find((x) => x.trim()) || topic,
        imagePrompt: `Create a high-impact outdoor advertising visual for: ${topic}`,
      };
    }

    return res.json({
      success: true,
      data: {
        headline: String(parsed.headline || '').trim(),
        imagePrompt: String(parsed.imagePrompt || '').trim(),
      },
    });
  } catch (err) {
    console.error('AI generateAdContent error:', err);
    return res.status(500).json({ success: false, message: err.message || 'AI generation failed.' });
  }
}

export async function generateAdImage(req, res) {
  try {
    const { prompt } = req.body || {};
    const text = String(prompt || '').trim();
    if (!text) {
      return res.status(400).json({ success: false, message: 'Prompt is required.' });
    }

    const safeSeed = Math.floor(Math.random() * 2147483647);
    const pollinationsKey = process.env.POLLINATIONS_API_KEY;
    if (pollinationsKey) {
      const remoteUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?width=1024&height=1024&seed=${safeSeed}&key=${encodeURIComponent(pollinationsKey)}`;
      try {
        const response = await fetch(remoteUrl);
        if (response.ok) {
          const contentType = response.headers.get('content-type') || 'image/png';
          const buffer = Buffer.from(await response.arrayBuffer());
          const base64 = buffer.toString('base64');
          const imageUrl = `data:${contentType};base64,${base64}`;
          return res.json({ success: true, data: { imageUrl } });
        }
      } catch {
        // silently fall back to local SVG below
      }
    }

    // Keyless fallback: generate a local SVG data URL so preview always works.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#6C63FF"/>
          <stop offset="100%" stop-color="#00D4FF"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <rect x="64" y="64" width="896" height="896" rx="28" fill="rgba(11,15,26,0.25)"/>
      <text x="512" y="470" text-anchor="middle" fill="#ffffff" font-size="42" font-family="Arial" font-weight="700">ArcAds AI Visual</text>
      <text x="512" y="540" text-anchor="middle" fill="#e8f1ff" font-size="24" font-family="Arial">${text.slice(0, 80).replace(/[<>&'"]/g, '')}</text>
    </svg>`;
    const imageUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    return res.json({ success: true, data: { imageUrl, fallback: true } });
  } catch (err) {
    console.error('AI generateAdImage error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Image generation failed.' });
  }
}
