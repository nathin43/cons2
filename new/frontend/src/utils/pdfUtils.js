/**
 * PDF Utility – Mani Electrical
 * Shared helpers for all admin report PDF exports.
 */

export const SHOP_INFO = {
  name: 'MANI ELECTRICAL',
  tagline: 'Your trusted partner for electrical appliances & electronics',
  phone: '+91-9095399271',
  email: 'manielectricalshop@gmail.com',
  address: 'Kunnathur Road, Perundurai - 638052, Tamil Nadu',
};

/**
 * Draws the shop letterhead on a jsPDF document.
 * @param {object} doc        - jsPDF instance
 * @param {string} reportTitle - e.g. "STOCK REPORT"
 * @param {number[]} accent   - RGB array, e.g. [139, 92, 246]
 * @returns {number} Y position where content should begin
 */
export const addShopHeader = (doc, reportTitle, accent = [139, 92, 246]) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Top coloured band (height 34) ─────────────────────────────────────────
  doc.setFillColor(...accent);
  doc.rect(0, 0, pageWidth, 34, 'F');

  // Left side: shop name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(SHOP_INFO.name, 14, 14);

  // Left side: tagline below name
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(220, 235, 255);
  doc.text(SHOP_INFO.tagline, 14, 22);

  // Right side: "OFFICIAL REPORT" badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL REPORT', pageWidth - 14, 14, { align: 'right' });

  // Right side: current date under badge
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(220, 235, 255);
  const shortDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  doc.text(shortDate, pageWidth - 14, 22, { align: 'right' });

  // ── Light grey contact strip ───────────────────────────────────────────────
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 34, pageWidth, 11, 'F');

  // Thin accent line at top of contact strip
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.5);
  doc.line(0, 34, pageWidth, 34);

  // Contact info – three items evenly distributed across the strip
  const contactY = 41;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);

  // Phone (left)
  doc.setFont('helvetica', 'bold');
  doc.text('Ph:', 14, contactY);
  doc.setFont('helvetica', 'normal');
  doc.text(SHOP_INFO.phone, 21, contactY);

  // Email (centre)
  const emailLabel = 'Email:';
  const emailLabelW = doc.getTextWidth(emailLabel);
  const emailX = pageWidth / 2 - doc.getTextWidth(SHOP_INFO.email) / 2 - emailLabelW - 1;
  doc.setFont('helvetica', 'bold');
  doc.text(emailLabel, emailX, contactY);
  doc.setFont('helvetica', 'normal');
  doc.text(SHOP_INFO.email, emailX + emailLabelW + 1, contactY);

  // Address (right)
  doc.setFont('helvetica', 'bold');
  doc.text('Addr:', pageWidth - 14 - doc.getTextWidth(SHOP_INFO.address) - 8, contactY);
  doc.setFont('helvetica', 'normal');
  doc.text(SHOP_INFO.address, pageWidth - 14, contactY, { align: 'right' });

  // ── Report title block ────────────────────────────────────────────────────
  let y = 55;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...accent);
  doc.text(reportTitle, pageWidth / 2, y, { align: 'center' });

  y += 6;

  // Generated date line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  const genDate = `Generated: ${new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })}`;
  doc.text(genDate, pageWidth / 2, y, { align: 'center' });

  y += 5;

  // Separator line
  doc.setDrawColor(220, 225, 235);
  doc.setLineWidth(0.4);
  doc.line(14, y, pageWidth - 14, y);

  return y + 6;
};

/**
 * Loads NotoSans font (regular + bold) into jsPDF with multiple CDN fallbacks.
 * NotoSans has the Indian Rupee glyph (\u20B9); Helvetica does not.
 * @param {object} doc - jsPDF instance
 * @returns {Promise<string>} 'NotoSans' on success, 'helvetica' as fallback
 */
export const loadUnicodeFonts = async (doc) => {
  const FONT_SOURCES = [
    // Try multiple versions in case Google Fonts updates
    ['https://fonts.gstatic.com/s/notosans/v40/o-0bIpQlx3QUlC5A4PNb91.ttf',
     'https://fonts.gstatic.com/s/notosans/v40/o-0NIpQlx3QUlC5A4PNjXhFlY9aA5Wl6PQ.ttf'],
    ['https://fonts.gstatic.com/s/notosans/v39/o-0bIpQlx3QUlC5A4PNb91.ttf',
     'https://fonts.gstatic.com/s/notosans/v39/o-0NIpQlx3QUlC5A4PNjXhFlY9aA5Wl6PQ.ttf'],
    ['https://fonts.gstatic.com/s/notosans/v36/o-0bIpQlx3QUlC5A4PNb91.ttf',
     'https://fonts.gstatic.com/s/notosans/v36/o-0NIpQlx3QUlC5A4PNjXhFlY9aA5Wl6PQ.ttf'],
    // jsDelivr GitHub mirror as final fallback
    ['https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Regular.ttf',
     'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Bold.ttf']
  ];

  const toB64 = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const u8 = new Uint8Array(await res.arrayBuffer());
    let bin = '';
    for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
    return btoa(bin);
  };

  for (const [regUrl, boldUrl] of FONT_SOURCES) {
    try {
      const [regB64, boldB64] = await Promise.all([toB64(regUrl), toB64(boldUrl)]);
      doc.addFileToVFS('NotoSans-Regular.ttf', regB64);
      doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
      doc.addFileToVFS('NotoSans-Bold.ttf', boldB64);
      doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
      console.log('✓ NotoSans font loaded successfully');
      return 'NotoSans';
    } catch (err) {
      console.warn('Font load failed, trying next source:', err.message);
    }
  }
  console.error('All font CDNs failed - falling back to Helvetica (₹ will not display)');
  return 'helvetica';
};

/**
 * Formats Indian Rupee for PDF using Unicode escape to prevent encoding corruption.
 * @param {number|string} amount
 * @returns {string} e.g. "₹1,299"
 */
export const pdfRupee = (amt) => '\u20B9' + Math.round(Number(amt || 0)).toLocaleString('en-IN');

/**
 * Stamps page numbers on every page of the document.
 * Call this AFTER all content has been added and BEFORE doc.save().
 * @param {object}   doc    - jsPDF instance
 * @param {number[]} accent - RGB array
 */
export const addPageNumbers = (doc, accent = [139, 92, 246]) => {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Bottom accent line
    doc.setDrawColor(...accent);
    doc.setLineWidth(0.4);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text('Mani Electrical – Confidential', 14, pageHeight - 8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }
};
