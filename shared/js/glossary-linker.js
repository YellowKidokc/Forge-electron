/**
 * THEOPHYSICS GLOSSARY AUTO-LINKER
 * ================================
 * Drop this script into any article page. It:
 *   1. Fetches glossary_data.json from the site root
 *   2. Scans article text for matching glossary terms
 *   3. Wraps the FIRST occurrence of each term with a link to the glossary
 *   4. Skips headings, existing links, code, equations, nav, footer
 *
 * Usage: <script src="/glossary-linker.js" defer></script>
 */
(function(){
  'use strict';

  var GLOSSARY_URL = '/glossary_data.json';
  var GLOSSARY_PAGE = '/theophysics-glossary.html';
  var MIN_TERM_LENGTH = 3; // skip tiny terms like "is", "or"
  var MAX_LINKS_PER_PAGE = 60; // don't over-link

  // Elements to SKIP (don't link inside these)
  var SKIP_TAGS = {
    'A':1, 'SCRIPT':1, 'STYLE':1, 'CODE':1, 'PRE':1, 'KBD':1, 'SAMP':1,
    'TEXTAREA':1, 'INPUT':1, 'SELECT':1, 'BUTTON':1, 'SVG':1, 'MATH':1,
    'MJX-CONTAINER':1, 'FIGCAPTION':1, 'NAV':1, 'FOOTER':1, 'H1':1, 'H2':1
  };

  // Classes to skip
  var SKIP_CLASSES = [
    'eq-inline', 'eq-block', 'axiom-box', 'kill-card', 'ring-expander',
    'hero', 'sticky-nav', 'tab-bar', 'article-figure', 'MathJax'
  ];

  function shouldSkip(node) {
    var el = node.parentElement;
    while (el) {
      if (SKIP_TAGS[el.tagName]) return true;
      if (el.className && typeof el.className === 'string') {
        for (var i = 0; i < SKIP_CLASSES.length; i++) {
          if (el.className.indexOf(SKIP_CLASSES[i]) !== -1) return true;
        }
      }
      // Stop at main content boundary
      if (el.tagName === 'MAIN' || el.tagName === 'ARTICLE' || el.tagName === 'BODY') break;
      el = el.parentElement;
    }
    return false;
  }

  function slugify(term) {
    return term.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function buildLinker(terms) {
    // Sort by length descending so longer terms match first
    // e.g. "quantum coherence" matches before "quantum"
    terms.sort(function(a, b) { return b.length - a.length; });

    // Build a map: lowercase term -> display term
    var termMap = {};
    var patterns = [];
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      if (t.length < MIN_TERM_LENGTH) continue;
      var lower = t.toLowerCase();
      if (termMap[lower]) continue; // dedupe
      termMap[lower] = t;
      // Escape regex special chars, add word boundaries
      var escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      patterns.push(escaped);
    }

    // Build one big regex (case insensitive, word boundaries)
    if (patterns.length === 0) return null;
    var regex = new RegExp('\\b(' + patterns.join('|') + ')\\b', 'gi');

    return { regex: regex, termMap: termMap };
  }

  function linkTerms(linker) {
    // Find the main content area
    var container = document.querySelector('main')
      || document.querySelector('article')
      || document.querySelector('.article-container')
      || document.querySelector('.prose-body')
      || document.querySelector('#tab-paper')
      || document.body;

    var linked = {}; // track which terms we've already linked (first occurrence only)
    var linkCount = 0;
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    var textNodes = [];

    // Collect all text nodes first (modifying DOM during walk is unsafe)
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    for (var i = 0; i < textNodes.length; i++) {
      if (linkCount >= MAX_LINKS_PER_PAGE) break;

      var node = textNodes[i];
      var text = node.nodeValue;
      if (!text || text.trim().length < MIN_TERM_LENGTH) continue;
      if (shouldSkip(node)) continue;

      // Reset regex
      linker.regex.lastIndex = 0;

      var match;
      var fragments = [];
      var lastIndex = 0;
      var madeLink = false;

      while ((match = linker.regex.exec(text)) !== null) {
        if (linkCount >= MAX_LINKS_PER_PAGE) break;

        var matchedText = match[0];
        var termKey = matchedText.toLowerCase();

        // Only link first occurrence of each term
        if (linked[termKey]) continue;

        // Text before the match
        if (match.index > lastIndex) {
          fragments.push(document.createTextNode(text.slice(lastIndex, match.index)));
        }

        // Create the glossary link
        var link = document.createElement('a');
        link.href = GLOSSARY_PAGE + '#' + slugify(termKey);
        link.className = 'glossary-term';
        link.title = 'View in glossary: ' + matchedText;
        link.textContent = matchedText;
        fragments.push(link);

        lastIndex = match.index + matchedText.length;
        linked[termKey] = true;
        linkCount++;
        madeLink = true;
      }

      if (madeLink && fragments.length > 0) {
        // Remaining text after last match
        if (lastIndex < text.length) {
          fragments.push(document.createTextNode(text.slice(lastIndex)));
        }
        // Replace original text node with fragments
        var parent = node.parentNode;
        for (var f = 0; f < fragments.length; f++) {
          parent.insertBefore(fragments[f], node);
        }
        parent.removeChild(node);
      }
    }

    // Inject the CSS for glossary links
    if (linkCount > 0) {
      var style = document.createElement('style');
      style.textContent =
        'a.glossary-term{' +
          'color:inherit;' +
          'text-decoration:none;' +
          'border-bottom:1px dotted rgba(212,175,55,.4);' +
          'transition:border-color .2s, color .2s;' +
          'cursor:help;' +
        '}' +
        'a.glossary-term:hover{' +
          'color:#d4af37;' +
          'border-bottom-color:#d4af37;' +
          'border-bottom-style:solid;' +
        '}';
      document.head.appendChild(style);
    }

    return linkCount;
  }

  // Main
  function init() {
    // Don't run on the glossary page itself
    if (window.location.pathname.indexOf('glossary') !== -1) return;

    fetch(GLOSSARY_URL)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var terms = (data.terms || []).map(function(t) { return t.term || t.title || ''; });
        if (terms.length === 0) return;

        var linker = buildLinker(terms);
        if (!linker) return;

        var count = linkTerms(linker);
        if (count > 0) {
          console.log('[Glossary Linker] Linked ' + count + ' terms');
        }
      })
      .catch(function(e) {
        // Silently fail — glossary linking is enhancement, not critical
      });
  }

  // Wait for MathJax to finish (if present) before linking
  if (window.MathJax && window.MathJax.startup) {
    window.MathJax.startup.promise.then(init);
  } else {
    // Run after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
