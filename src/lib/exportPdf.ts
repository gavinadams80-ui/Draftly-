// ── Submission PDF export ──
// Each drawing is already composed onto an A3 landscape sheet (1190×842 SVG)
// by withTitleBlock(). Here we render each sheet onto an A3 page in a multi-page
// vector PDF via svg2pdf.js, so the output stays crisp and measurable.

import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';

export interface ExportSheet {
  title: string;
  number: string;
  svg: string; // full A3 SVG string (output of withTitleBlock)
}

/** Parse an SVG string into a live (off-screen) DOM element svg2pdf can read. */
function svgStringToElement(svg: string): SVGSVGElement {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const el = doc.documentElement as unknown as SVGSVGElement;
  return el;
}

/**
 * Render the given sheets to a multi-page A3 landscape PDF and trigger a download.
 * Returns the number of pages written.
 */
export async function exportSheetsToPDF(sheets: ExportSheet[], filename: string): Promise<number> {
  const usable = sheets.filter((s) => s.svg && s.svg.trim().length > 0);
  if (!usable.length) throw new Error('No drawings available to export.');

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a3' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // svg2pdf needs the element in the document; keep a hidden host to attach to.
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.width = '0';
  host.style.height = '0';
  host.style.overflow = 'hidden';
  document.body.appendChild(host);

  try {
    for (let i = 0; i < usable.length; i++) {
      if (i > 0) pdf.addPage('a3', 'landscape');
      const el = svgStringToElement(usable[i].svg);
      host.appendChild(el);
      try {
        await svg2pdf(el, pdf, { x: 0, y: 0, width: pageW, height: pageH });
      } finally {
        host.removeChild(el);
      }
    }
  } finally {
    document.body.removeChild(host);
  }

  pdf.save(filename);
  return usable.length;
}
