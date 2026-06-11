/**
 * claim-layer.js — Claim highlighting, tooltips, and proof panel interaction
 * Version: 1.0.0
 *
 * Expects article HTML to contain:
 *   <script class="claim-data" type="application/json">{...claims data...}</script>
 *
 * Or loads from window.__CLAIMS_DATA__ set by inline script.
 */
(function () {
  'use strict';

  const MATURITY_LABELS = {
    0: 'Untiered',
    1: 'Metaphor',
    2: 'Hypothesis',
    3: 'Evidence-Backed',
    4: 'Public Proof Claim',
    5: 'Formal Proof',
  };

  const MATURITY_ICONS = {
    0: '',
    1: 'M',
    2: 'S',
    3: 'E',
    4: 'P',
    5: 'F',
  };

  const Q_KEYS = ['identity', 'scope', 'mechanism', 'evidence', 'falsifiability', 'boundary', 'listener_risk'];

  function getClaimsData() {
    const inline = document.querySelector('script.claim-data[type="application/json"]');
    if (inline) {
      try { return JSON.parse(inline.textContent); } catch (e) { console.error('claim-layer: bad JSON', e); }
    }
    if (window.__CLAIMS_DATA__) return window.__CLAIMS_DATA__;
    return null;
  }

  /* ── Build tooltip HTML for a claim ── */
  function buildTooltip(claim) {
    const level = claim.maturity_level || 0;
    const qDots = Q_KEYS.map(function (q) {
      const val = (claim.q_scores && claim.q_scores[q]) || 'missing';
      let cls = val === 'present' || val === 'clear' || val === 'narrow' ? 'present'
              : val === 'implicit' || val === 'broad' ? 'implicit'
              : 'missing';
      return '<span class="claim-tooltip-qdot ' + cls + '"></span>';
    }).join('');

    return (
      '<div class="claim-tooltip-header">' +
        '<span class="claim-tooltip-id">' + escapeHtml(claim.claim_id) + '</span>' +
        '<span class="claim-tooltip-maturity level-' + level + '">' + escapeHtml(MATURITY_LABELS[level] || 'Unknown') + '</span>' +
      '</div>' +
      '<div class="claim-tooltip-text">' + escapeHtml(claim.text) + '</div>' +
      '<div class="claim-tooltip-section">' + escapeHtml(claim.section || '') + '</div>' +
      '<div class="claim-tooltip-qbar" title="Q-scores: identity, scope, mechanism, evidence, falsifiability, boundary, listener_risk">' + qDots + '</div>'
    );
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ── Find and wrap claim text in article body ── */
  function highlightClaims(claims) {
    const body = document.querySelector('article.prose-body') || document.querySelector('article') || document.body;
    if (!body) return;

    claims.forEach(function (claim) {
      const text = claim.text;
      if (!text || text.length < 8) return; // Skip very short fragments

      // Try to find the text in paragraphs
      const paragraphs = body.querySelectorAll('p');
      paragraphs.forEach(function (p) {
        if (p.dataset.claimProcessed) return;
        const html = p.innerHTML;
        const idx = html.indexOf(text);
        if (idx !== -1 && !p.closest('.mtl-callout') && !p.closest('.mda-proof-panel')) {
          // Wrap the matched text
          const before = html.substring(0, idx);
          const after = html.substring(idx + text.length);
          const wrapped = '<span class="claim-tag" data-claim-id="' + escapeHtml(claim.claim_id) + '" data-maturity="' + (claim.maturity_level || 0) + '" tabindex="0">' +
                          escapeHtml(text) +
                          buildTooltip(claim) +
                          '</span>';
          p.innerHTML = before + wrapped + after;
          p.dataset.claimProcessed = 'true';
        }
      });
    });
  }

  /* ── Click-to-scroll proof panel ── */
  function setupProofPanelClicks(claims) {
    document.querySelectorAll('.claim-tag').forEach(function (tag) {
      tag.addEventListener('click', function () {
        const cid = tag.dataset.claimId;
        const panelClaim = document.querySelector('.mda-proof-claim[data-claim-id="' + cid + '"]');
        if (panelClaim) {
          panelClaim.scrollIntoView({ behavior: 'smooth', block: 'center' });
          panelClaim.style.transition = 'background 0.5s ease';
          panelClaim.style.background = 'rgba(212, 175, 55, 0.08)';
          setTimeout(function () { panelClaim.style.background = ''; }, 1500);
        }
      });
    });
  }

  /* ── Main init ── */
  function init() {
    const data = getClaimsData();
    if (!data || !data.claims) {
      console.log('claim-layer: no claims data found');
      return;
    }
    highlightClaims(data.claims);
    setupProofPanelClicks(data.claims);
    console.log('claim-layer: highlighted ' + data.claims.length + ' claims');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
