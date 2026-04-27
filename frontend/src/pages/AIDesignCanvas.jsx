/**
 * AI Design Canvas – Templates, AI-generated copy + image prompt via backend Groq API.
 */
import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import Image from '@mui/icons-material/Image';
import Download from '@mui/icons-material/Download';
import api from '../api/axios';

const FALLBACK_TEMPLATES = [
  { id: 'poster', label: 'Poster', width: 24, height: 36, desc: '24" × 36" (e.g. store front)' },
  { id: 'banner', label: 'Banner', width: 6, height: 2, desc: '6" × 2" strip' },
  { id: 'transit', label: 'Transit', width: 48, height: 12, desc: '48" × 12" (metro/bus)' },
];

const PREVIEW_MAX = 360;
export default function AIDesignCanvas() {
  const [templates, setTemplates] = useState(FALLBACK_TEMPLATES);
  const [template, setTemplate] = useState(String(FALLBACK_TEMPLATES[0].id));
  const [copy, setCopy] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const previewRef = useRef(null);

  useEffect(() => {
    api.get('templates')
      .then((res) => {
        const list = (res.data.data || []).map((x) => ({
          id: String(x.id),
          label: x.name,
          width: Number(x.width) || 1,
          height: Number(x.height) || 1,
          desc: x.description || `${x.category || 'General'} template`,
        }));
        if (list.length > 0) {
          setTemplates(list);
          setTemplate(String(list[0].id));
        }
      })
      .catch(() => {});
  }, []);

  const t = templates.find((x) => String(x.id) === String(template)) || templates[0];
  const aspect = t.height / t.width;
  const previewW = Math.min(PREVIEW_MAX, PREVIEW_MAX / aspect);
  const previewH = previewW * aspect;
  const handleGenerateAI = async () => {
    const prompt = (aiPrompt || copy || 'outdoor advertisement').trim();
    if (!prompt) {
      setSnackbar({ open: true, message: 'Enter a prompt or headline to generate from.', severity: 'info' });
      return;
    }
    setAiLoading(true);
    setSnackbar({ open: false, message: '', severity: 'success' });
    try {
      const res = await api.post('ai/generate-ad', {
        prompt,
        templateLabel: t.label,
        templateSize: `${t.width}" x ${t.height}"`,
      });
      if (!res.data.success) throw new Error(res.data.message || 'AI request failed');
      const headline = res.data.data?.headline || '';
      const imgPrompt = res.data.data?.imagePrompt || '';
      if (headline) setCopy(headline);
      if (imgPrompt) setImagePrompt(imgPrompt);
      setSnackbar({ open: true, message: 'Generated headline + image prompt with Groq AI.', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err?.response?.data?.message || err.message || 'AI generation failed', severity: 'error' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleExport = () => {
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = t.width * scale * 4;
    canvas.height = t.height * scale * 4;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setSnackbar({ open: true, message: 'Export not supported', severity: 'error' });
      return;
    }
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#bdbdbd';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    ctx.fillStyle = '#424242';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ArcAds – Your ad design', canvas.width / 2, canvas.height / 2 - 16);
    ctx.font = '14px sans-serif';
    ctx.fillText(copy || 'Add your headline or slogan above', canvas.width / 2, canvas.height / 2 + 16);
    ctx.fillText(`${t.label} • ${t.width}" × ${t.height}"`, canvas.width / 2, canvas.height / 2 + 48);
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `arcads-${t.id}-${Date.now()}.png`;
    a.click();
    setSnackbar({ open: true, message: 'PNG downloaded. Use for print or upload.', severity: 'success' });
  };

  const handleGenerateImage = () => {
    const prompt = (imagePrompt || aiPrompt || copy).trim();
    if (!prompt) {
      setSnackbar({ open: true, message: 'Enter image prompt first.', severity: 'info' });
      return;
    }
    setImageLoading(true);
    api.post('ai/generate-image', { prompt })
      .then((res) => {
        if (!res.data.success) throw new Error(res.data.message || 'Image generation failed');
        const url = res.data.data?.imageUrl;
        if (!url) throw new Error('No image URL returned');
        setGeneratedImageUrl(url);
        setSnackbar({
          open: true,
          message: 'Image generated. You can preview or open it in new tab.',
          severity: 'success',
        });
      })
      .catch((err) => setSnackbar({ open: true, message: err.response?.data?.message || err.message || 'Image generation failed', severity: 'error' }))
      .finally(() => setImageLoading(false));
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>AI Design Canvas</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Choose a template, add your copy, and export a print-ready layout.
      </Typography>

      <FormControl size="small" sx={{ minWidth: 220, mb: 2 }}>
        <InputLabel>Template</InputLabel>
        <Select value={template} label="Template" onChange={(e) => setTemplate(e.target.value)}>
          {templates.map((opt) => (
            <MenuItem key={opt.id} value={opt.id}>{opt.label} – {opt.desc}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'flex-start' }}>
        <Paper variant="outlined" sx={{ p: 2, flex: '0 0 auto' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>Preview</Typography>
          <Box
            ref={previewRef}
            sx={{
              width: previewW,
              height: previewH,
              bgcolor: 'grey.100',
              border: '2px solid',
              borderColor: 'grey.300',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {generatedImageUrl && (
              <Box
                component="img"
                src={generatedImageUrl}
                alt="Generated ad visual"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}
            <Typography variant="body2" fontWeight="bold" color="text.primary">Your ad design</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, textAlign: 'center' }}>
              {copy || 'Headline / slogan'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>{t.label}</Typography>
          </Box>
        </Paper>

        <Box sx={{ flex: '1 1 280px' }}>
          <TextField
            label="AI prompt"
            placeholder="e.g. coffee shop opening, fitness brand, festive sale"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            fullWidth
            size="small"
            sx={{ mb: 1 }}
            helperText="Describe your ad topic; AI will generate a headline below."
          />
          <TextField
            label="Headline / slogan"
            placeholder="Generated or type your own"
            value={copy}
            onChange={(e) => setCopy(e.target.value)}
            multiline
            rows={3}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Generated image prompt"
            placeholder="AI will generate an image prompt for Grok-compatible image tools"
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            multiline
            rows={3}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<Image />}
              onClick={handleGenerateImage}
              disabled={imageLoading}
            >
              {imageLoading ? 'Generating image…' : 'Generate Image'}
            </Button>
            <Button
              variant="contained"
              startIcon={aiLoading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesome />}
              onClick={handleGenerateAI}
              disabled={aiLoading}
            >
              {aiLoading ? 'Generating…' : 'Generate with Groq AI'}
            </Button>
            <Button variant="contained" color="secondary" startIcon={<Download />} onClick={handleExport}>
              Export as PNG
            </Button>
            {generatedImageUrl && (
              <Button
                variant="text"
                onClick={() => window.open(generatedImageUrl, '_blank', 'noopener,noreferrer')}
              >
                Open image
              </Button>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            AI uses backend Groq model to generate ad headline and image prompt. Export generates a high-resolution PNG.
          </Typography>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
