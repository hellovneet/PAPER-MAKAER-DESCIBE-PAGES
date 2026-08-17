# DESCRIBE PAGES — Voice + Smart Handwriting Paper Maker

Vercel-ready static app. No OpenAI API key or paid AI API is required.

## Features
- Paper details: school, session, class, subject, time and maximum marks
- Voice Paper Maker using the browser Speech Recognition API
- Hindi/Hinglish and English voice options
- Voice commands for fields, questions, preview, OCR and printing
- Multiple image upload with visible previews and remove buttons
- Smart handwriting OCR using Tesseract.js
- Image enlargement, grayscale/ink/threshold preprocessing
- Multiple OCR page layouts and best-result selection
- English, Hindi, and English + Hindi OCR
- Add/edit/delete MCQ, fill-in-the-blank, true/false and short questions
- Paper preview
- Print / Save PDF
- Download Word

## Voice examples
- "School name ABC Public School"
- "Class fourth"
- "Subject computer"
- "Time two hours"
- "Maximum marks forty"
- "Add question what is a computer"
- "Add MCQ what is CPU"
- "Add true false computer is an electronic machine"
- "Paper set"
- "Extract questions"
- "Print paper"

## Deploy on Vercel
Upload/import this folder as a Vercel project. No build command is required.

## Voice note
Voice recognition depends on browser support. Chrome/Edge generally work best. The browser will ask for microphone permission.

## Handwriting note
Tesseract.js is primarily a printed-text OCR engine. The preprocessing and multiple-pass approach improves difficult images, but very cursive handwriting may still need manual correction.


## License

This project is proprietary software. See `LICENSE` for the full terms.
