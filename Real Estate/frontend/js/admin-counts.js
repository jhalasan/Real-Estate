// new file
const POLL_INTERVAL = 200; // ms
const TIMEOUT = 3000; // ms

async function countRowsFromIframe(pagePath, selector) {
  return new Promise((resolve) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;border:0;visibility:hidden;';
      iframe.src = pagePath;
      document.body.appendChild(iframe);

      const start = Date.now();

      const cleanup = (count) => {
        try { iframe.remove(); } catch (e) { /* ignore */ }
        resolve(count);
      };

      const attemptCount = () => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow && iframe.contentWindow.document;
          if (!doc) {
            if (Date.now() - start > TIMEOUT) return cleanup(0);
            return setTimeout(attemptCount, POLL_INTERVAL);
          }
          const tbody = doc.querySelector(selector);
          if (tbody) {
            // count only direct TR children
            const rows = Array.from(tbody.children).filter(c => c.tagName === 'TR').length;
            return cleanup(rows);
          }
          // try generic table fallback
          const table = doc.querySelector('table');
          if (table) {
            const tb = table.querySelector('tbody') || table;
            const rows = Array.from(tb.querySelectorAll('tr')).length - (table.querySelectorAll('thead tr').length || 0);
            if (rows > 0 || Date.now() - start > TIMEOUT) return cleanup(Math.max(0, rows));
          }
        } catch (e) {
          // could be cross-origin or other access issue -> fallback to fetch + parse
          return fetchAndCount(pagePath, selector).then(cleanup).catch(() => cleanup(0));
        }
        if (Date.now() - start > TIMEOUT) return cleanup(0);
        setTimeout(attemptCount, POLL_INTERVAL);
      };

      iframe.addEventListener('load', () => {
        // start polling once iframe has loaded
        setTimeout(attemptCount, 50);
      });

      // in case load never fires, start polling anyway after short delay
      setTimeout(() => {
        if (!iframe.contentDocument) attemptCount();
      }, 500);
    } catch (err) {
      // something unexpected
      resolve(0);
    }
  });
}

async function fetchAndCount(pagePath, selector) {
  try {
    const base = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
    const res = await fetch(base + pagePath, { cache: 'no-store' });
    if (!res.ok) return 0;
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const tbody = doc.querySelector(selector);
    if (tbody) {
      return Array.from(tbody.children).filter(el => el.tagName === 'TR').length;
    }
    const table = doc.querySelector('table');
    if (!table) return 0;
    return table.querySelectorAll('tr').length - (table.querySelectorAll('thead tr').length || 0);
  } catch {
    return 0;
  }
}

(async function updateAdminCounts() {
  const tasks = [
    { page: 'inquire.html', selector: '#inquiriesTableBody', outId: 'total-inquiries-count' },
    { page: 'career-application.html', selector: '#applicants-tbody', outId: 'total-career-count' },
    { page: 'contact-us.html', selector: '#contactTableBody', outId: 'total-contact-count' }
  ];

  await Promise.all(tasks.map(async (t) => {
    const el = document.getElementById(t.outId);
    if (el) el.textContent = '...';
    const count = await countRowsFromIframe(t.page, t.selector);
    if (el) el.textContent = String(count);
  }));
})();
