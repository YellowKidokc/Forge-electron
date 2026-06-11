/**
 * glossary-layer.js — Inline glossary tooltip engine
 *
 * Loads glossary-terms.json, walks article text nodes,
 * wraps matched terms with <span class="gloss-term">,
 * shows hover tooltip + click-to-expand panel.
 *
 * Only terms with "inline": true are wrapped.
 * Respects nav/footer/script/style/proof-panel/MTL blocks.
 */
(function() {
  'use strict';

  const SCRIPT = document.currentScript;
  const JSON_URL = SCRIPT?.dataset?.glossaryJson || '/shared/data/glossary-terms.json';
  const DATA_ATTR = 'data-glossary-term';

  // Zones to skip entirely
  const SKIP_SELECTOR = 'script,style,nav,header,footer,aside,.tp-header,.tp-level-bar,.tp-proving,.tp-sources,.mtl-callout,.mtl-equation,[data-reader-panel],code,pre';

  let glossary = [];      // {term, id, short, definition, category, inline}
  let termMap = {};       // normalized term -> entry
  let ready = false;

  // ── Load glossary ───────────────────────────────────────────────────────────
  fetch(JSON_URL)
    .then(r => r.ok ? r.json() : [])
    .then(data => {
      glossary = Array.isArray(data) ? data : [];
      // Only inline terms
      glossary = glossary.filter(t => t.inline === true);
      // Build lookup map
      glossary.forEach(t => {
        const key = normalize(t.term);
        termMap[key] = t;
        // Add common variants
        if (!key.endsWith('s')) termMap[key + 's'] = t;
        if (key.endsWith('s') && key.length > 2) termMap[key.slice(0, -1)] = t;
      });
      ready = true;
      wrapTerms(document.body);
      console.log('[Glossary] Loaded', glossary.length, 'inline terms');
    })
    .catch(err => {
      console.warn('[Glossary] Failed to load:', err.message);
    });

  // ── Normalize for matching ──────────────────────────────────────────────────
  function normalize(text) {
    return text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  }

  // ── Check if node is inside a skip zone ─────────────────────────────────────
  function inSkipZone(node) {
    let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    while (el && el !== document.body) {
      if (el.matches?.(SKIP_SELECTOR)) return true;
      // Skip if already processed
      if (el.classList?.contains('gloss-term')) return true;
      el = el.parentElement;
    }
    return false;
  }

  // ── Wrap terms in a text node ───────────────────────────────────────────────
  function wrapNode(textNode) {
    if (!ready || !textNode.textContent.trim()) return;
    if (inSkipZone(textNode)) return;

    const text = textNode.textContent;
    const words = text.split(/(\s+)/); // keep separators
    const frag = document.createDocumentFragment();
    let i = 0;

    while (i < words.length) {
      // Try longest match first (up to 5 words)
      let matched = false;
      const maxWords = Math.min(5, words.length - i);

      for (let w = maxWords; w >= 1; w--) {
        const candidate = words.slice(i, i + w * 2 - 1).filter((_, idx) => idx % 2 === 0).join(' ');
        const key = normalize(candidate);
        const entry = termMap[key];

        if (entry && candidate.length >= 3) {
          // Found match — create span
          const span = document.createElement('span');
          span.className = 'gloss-term';
          span.dataset.term = entry.term;
          span.dataset.definition = entry.short || entry.definition || '';
          span.dataset.category = entry.category || '';
          span.textContent = candidate;
          span.title = entry.short || entry.definition || '';

          // Add separator spaces before if needed
          const before = words.slice(i - (i > 0 ? 1 : 0), i).join('');
          if (before) frag.appendChild(document.createTextNode(before));

          frag.appendChild(span);

          i += w * 2 - 1;
          matched = true;
          break;
        }
      }

      if (!matched) {
        frag.appendChild(document.createTextNode(words[i]));
        i++;
      }
    }

    textNode.replaceWith(frag);
  }

  // ── Walk and wrap ───────────────────────────────────────────────────────────
  function wrapTerms(root) {
    if (!ready) return;
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      if (n.textContent.trim().length >= 3 && !inSkipZone(n)) {
        nodes.push(n);
      }
    }
    nodes.forEach(wrapNode);
  }

  // ── Tooltip ─────────────────────────────────────────────────────────────────
  const tooltip = document.createElement('div');
  tooltip.id = 'glossary-tooltip';
  tooltip.className = 'glossary-tooltip';
  tooltip.style.cssText = 'position:fixed;z-index:100;display:none;max-width:320px;padding:.6rem .8rem;background:#0a0a0a;border:1px solid #333;border-radius:6px;font-size:.78rem;line-height:1.5;color:#e5e3df;box-shadow:0 4px 20px rgba(0,0,0,.5);pointer-events:none;';
  document.body.appendChild(tooltip);

  let activeTerm = null;

  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest('.gloss-term');
    if (!el) {
      tooltip.style.display = 'none';
      activeTerm = null;
      return;
    }
    activeTerm = el;
    const term = el.dataset.term;
    const def = el.dataset.definition;
    const cat = el.dataset.category;

    tooltip.innerHTML = `
      <div style="font-weight:600;color:#d4af37;margin-bottom:.2rem;font-size:.82rem;">${escapeHtml(term)}</div>
      <div style="color:#9a9a9a;font-size:.7rem;margin-bottom:.3rem;text-transform:uppercase;letter-spacing:.05em;">${escapeHtml(cat)}</div>
      <div>${escapeHtml(def)}</div>
      <div style="margin-top:.4rem;font-size:.65rem;color:#666;font-style:italic;">Click for full definition</div>
    `;
    positionTooltip(el);
    tooltip.style.display = 'block';
  });

  document.addEventListener('click', (e) => {
    const el = e.target.closest('.gloss-term');
    if (!el) {
      // Close expanded panels
      document.querySelectorAll('.glossary-panel').forEach(p => p.remove());
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    // Remove other panels
    document.querySelectorAll('.glossary-panel').forEach(p => p.remove());

    const entry = termMap[normalize(el.dataset.term)];
    if (!entry) return;

    const panel = document.createElement('div');
    panel.className = 'glossary-panel';
    panel.style.cssText = 'position:fixed;z-index:101;max-width:400px;padding:1rem 1.2rem;background:#111;border:1px solid #3a3a3a;border-radius:8px;font-size:.85rem;line-height:1.6;color:#e5e3df;box-shadow:0 8px 30px rgba(0,0,0,.6);';
    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.6rem;">
        <span style="font-weight:600;color:#d4af37;font-size:.95rem;">${escapeHtml(entry.term)}</span>
        <button class="glossary-close" style="background:none;border:none;color:#666;cursor:pointer;font-size:1rem;line-height:1;">&times;</button>
      </div>
      <div style="color:#9a9a9a;font-size:.72rem;margin-bottom:.5rem;text-transform:uppercase;letter-spacing:.06em;">${escapeHtml(entry.category)}</div>
      <div style="margin-bottom:.5rem;">${escapeHtml(entry.short || entry.definition || '')}</div>
      ${entry.definition && entry.definition.length > (entry.short?.length || 0) ? `<div style="border-top:1px solid #2a2a2a;padding-top:.5rem;margin-top:.5rem;color:#b0b0b0;font-size:.8rem;">${escapeHtml(entry.definition)}</div>` : ''}
    `;
    panel.querySelector('.glossary-close').addEventListener('click', () => panel.remove());
    document.body.appendChild(panel);

    // Position near the clicked term
    const rect = el.getBoundingClientRect();
    let left = rect.left + window.scrollX;
    let top = rect.bottom + window.scrollY + 8;

    // Keep in viewport
    if (left + 400 > window.innerWidth) {
      left = window.innerWidth - 420;
    }
    if (top + 200 > window.innerHeight + window.scrollY) {
      top = rect.top + window.scrollY - 200 - 8;
    }

    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
  });

  function positionTooltip(targetEl) {
    const rect = targetEl.getBoundingClientRect();
    let left = rect.left + window.scrollX;
    let top = rect.bottom + window.scrollY + 6;

    if (left + 320 > window.innerWidth) {
      left = window.innerWidth - 340;
    }
    if (top + 120 > window.innerHeight) {
      top = rect.top + window.scrollY - 120;
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ── Re-wrap on dynamic content (if needed) ──────────────────────────────────
  window.Glossary = {
    reload: () => wrapTerms(document.body),
    getTerms: () => glossary,
  };

})();
