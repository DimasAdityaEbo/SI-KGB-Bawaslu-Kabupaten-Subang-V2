/**
 * Dedicated, robust print service for SI-KGB Bawaslu Subang.
 * Ensures official documents (Surat Pengantar, Tanda Terima, Laporan) print crisply,
 * cleanly, and reliably across all browsers, operating systems, and iframe environments.
 */

export function printElementDirect(element: HTMLElement, title: string = 'Dokumen_Bawaslu'): void {
  if (!element) {
    window.print();
    return;
  }

  const originalTitle = document.title;
  document.title = title;

  // Try the clean hidden-iframe method first.
  // This isolates the printable content completely from modal overlays,
  // backdrop blurs, scrolling containers, and ensures 0 risk of DOM collision.
  try {
    const existingIframe = document.getElementById('si-kgb-print-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'si-kgb-print-iframe';
    iframe.setAttribute('title', 'Print Preview Frame');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      fallbackPrintDirect(element, title);
      return;
    }

    // Collect all stylesheets and style blocks from parent
    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((tag) => tag.outerHTML)
      .join('\n');

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 15mm 10mm 15mm;
            }
            html, body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
            .print-target-wrapper {
              width: 100% !important;
              max-width: 210mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: #ffffff !important;
            }
          </style>
        </head>
        <body class="bg-white text-slate-900 p-0 m-0">
          <div class="print-target-wrapper">
            ${element.innerHTML}
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // Give iframe sufficient time to parse CSS & layout before triggering print
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        document.title = originalTitle;
      } catch (e) {
        console.warn('Iframe print failed or blocked, falling back to direct print:', e);
        fallbackPrintDirect(element, title);
      }
    }, 250);
  } catch (err) {
    console.warn('Failed setting up print iframe, falling back to direct print:', err);
    fallbackPrintDirect(element, title);
  }
}

/**
 * Fallback direct print method that works when iframes are restricted.
 * Attaches the cloned element cleanly and listens to afterprint for cleanup
 * WITHOUT destructive premature timeouts that cause blank prints.
 */
function fallbackPrintDirect(element: HTMLElement, title: string = 'Dokumen_Bawaslu'): void {
  const originalTitle = document.title;
  document.title = title;

  const stale = document.getElementById('si-kgb-print-target');
  if (stale) {
    stale.remove();
  }

  const printTarget = document.createElement('div');
  printTarget.id = 'si-kgb-print-target';

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = '100%';
  clone.style.maxWidth = '100%';
  clone.style.margin = '0 auto';
  clone.style.padding = '0';
  clone.style.border = 'none';
  clone.style.boxShadow = 'none';
  clone.style.background = '#ffffff';

  printTarget.appendChild(clone);
  document.body.appendChild(printTarget);
  document.body.classList.add('si-kgb-printing');

  const cleanup = () => {
    document.title = originalTitle;
    document.body.classList.remove('si-kgb-printing');
    const target = document.getElementById('si-kgb-print-target');
    if (target && target.parentNode) {
      target.parentNode.removeChild(target);
    }
  };

  // Only clean up on afterprint, NEVER via short arbitrary timer!
  window.addEventListener('afterprint', cleanup, { once: true });

  setTimeout(() => {
    window.focus();
    try {
      window.print();
    } catch (err) {
      console.warn('window.print() invocation error:', err);
    }
  }, 150);
}
