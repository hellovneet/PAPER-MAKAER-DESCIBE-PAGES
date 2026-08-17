# DESCRIBE PAGES — AI Handwriting Edition

Vercel-ready static frontend + serverless AI handwriting extraction.

## Vercel setup

1. Import this project into Vercel.
2. In **Project Settings → Environment Variables**, add:
   - `OPENAI_API_KEY` = your OpenAI API key
3. Redeploy.
4. Open the site, upload paper images, choose the language, and click **AI Read Handwriting**.

The OpenAI key is used only by the Vercel serverless function at `/api/extract`; it is not placed in the browser code.

Without `OPENAI_API_KEY`, the normal local Tesseract extraction still works.
