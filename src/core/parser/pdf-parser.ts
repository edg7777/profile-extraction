import * as pdfjsLib from 'pdfjs-dist';

// Use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

export interface PdfTextLine {
  text: string;
  fontSize: number;
  isBold: boolean;
  y: number;
}

export interface PdfParseResult {
  lines: PdfTextLine[];
  fullText: string;
}

export async function parsePdfFile(file: File): Promise<PdfParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allLines: PdfTextLine[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    let currentLine: { text: string; fontSize: number; isBold: boolean; y: number } | null = null;

    for (const item of textContent.items) {
      if (!('str' in item)) continue;
      const textItem = item as { str: string; transform: number[]; fontName: string; height: number };
      if (!textItem.str.trim()) continue;

      const y = Math.round(textItem.transform[5]);
      const fontSize = Math.round(textItem.height);
      const isBold = /bold/i.test(textItem.fontName);

      if (currentLine && Math.abs(currentLine.y - y) < 3) {
        // Same line
        currentLine.text += textItem.str;
        currentLine.fontSize = Math.max(currentLine.fontSize, fontSize);
        currentLine.isBold = currentLine.isBold || isBold;
      } else {
        if (currentLine) {
          allLines.push(currentLine);
        }
        currentLine = { text: textItem.str, fontSize, isBold, y };
      }
    }

    if (currentLine) {
      allLines.push(currentLine);
    }
  }

  const fullText = allLines.map((l) => l.text.trim()).join('\n');

  return { lines: allLines, fullText };
}
