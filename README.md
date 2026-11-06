# DESCRIBE PAGES — School Question Paper Maker

A Vercel-ready, browser-based question paper maker. The app runs as a static HTML application and does not require a backend or paid AI API.

## Existing capabilities

- Examination details: school, session, class, subject, time and maximum marks
- Voice Paper Maker with Hindi/Hinglish and English speech recognition
- Voice commands for paper fields, questions, preview, OCR and printing
- Multiple image uploads with previews and remove controls
- Tesseract.js OCR with image enlargement, grayscale/contrast and threshold preprocessing
- English, Hindi, and English + Hindi OCR options
- Editable MCQ, fill-in-the-blank, true/false and short-answer questions
- Browser paper preview, print / Save PDF, and Word export

## Complete builder upgrade

- Four configurable paper sections (A–D), with questions grouped under their selected section
- Per-question marks and automatic total calculation against maximum marks
- Optional Hindi translation alongside each question
- Four presentation templates: Classic School, Formal Examination, Minimal Clean and Primary Classes
- A4 print page sizing and print-focused layout
- Automatic local draft saving, restore and clear controls
- Existing voice, OCR, image upload, question editing, print and Word workflows retained

## Run locally

No build step or package installation is required.

1. Download or clone this repository.
2. Open `index.html` in a modern browser, or serve the folder with a local static server.
3. For voice input, use Chrome or Edge and allow microphone access.
4. OCR and Word export load Tesseract.js and docx from their public CDNs, so those features require an internet connection.

## Deploy on Vercel

Import this repository into Vercel as a static project. No framework preset, build command, or output directory is required. The included `vercel.json` provides the static deployment configuration.

## Draft privacy

Drafts are stored in the current browser's `localStorage`. They are not uploaded to a server. Clearing browser site data can remove saved drafts. Uploaded image files are not persisted; extracted and edited questions are saved.

## OCR limitations

Tesseract.js is primarily a printed-text OCR engine. Image preprocessing can improve some difficult scans, but cursive handwriting and low-quality photos may require manual correction. Always review extracted questions before printing.

## Validation checklist

- [ ] Fill in paper details and add questions of each supported type
- [ ] Assign questions to sections A–D and verify numbering
- [ ] Change marks and confirm the total / maximum-marks warning
- [ ] Add Hindi translations and verify preview and Word output
- [ ] Switch all four templates and inspect print preview
- [ ] Refresh the page and restore the autosaved draft
- [ ] Test voice input and OCR in a supported browser
- [ ] Download and inspect the generated DOCX and print-to-PDF output

## License

This project is proprietary software. See [LICENSE](LICENSE) for the full terms.

## Manual smart scanning and OCR correction

- Image upload only adds photos and previews; scanning starts only when the user presses **Scan & Auto Fix**
- Handwriting mode tries original, contrast-enhanced and adaptive image variants with multiple OCR page layouts
- OCR text cleanup normalizes spacing, punctuation, question-number formats and repeated scan lines
- Extracted text remains editable and must be reviewed before printing
- The static browser app does not silently invent missing words; reliable semantic correction of difficult handwriting requires a dedicated handwriting/AI recognition service
