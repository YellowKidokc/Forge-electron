/* Math Translation Layer behavior.
   Source of truth: shared/data/mtl-equations.json exported from the Excel workbook. */
(function() {
  'use strict';

  const LEVELS = ['easy', 'standard', 'academic', 'proof'];
  const CALLOUT_SELECTOR = 'details[data-eq-id], .mtl-callout[data-eq-id], .math-translation-block[data-eq-id]';

  function setLevel(level) {
    if (!LEVELS.includes(level)) level = 'standard';

    document.body.classList.remove('level-easy', 'level-standard', 'level-academic', 'level-proof');
    document.body.classList.add('level-' + level);

    document.querySelectorAll('.mtl-callout, .math-translation-block').forEach(function(callout) {
      if (level === 'easy') {
        callout.open = true;
      } else if (!callout.dataset.userToggled) {
        callout.open = false;
      }
    });

    document.querySelectorAll('.mda-tb-tab[data-reader-mode]').forEach(function(tab) {
      tab.classList.toggle('active', tab.getAttribute('data-reader-mode') === level);
    });

    document.querySelectorAll('[data-reader-panel]').forEach(function(panel) {
      panel.style.display = panel.getAttribute('data-reader-panel') === level ? 'block' : 'none';
    });
  }

  function detectLevel() {
    for (const level of LEVELS) {
      if (document.body.classList.contains('level-' + level)) return level;
    }
    return 'standard';
  }

  function getJsonUrl() {
    const script = document.currentScript || document.querySelector('script[data-mtl-json]');
    if (script && script.dataset.mtlJson) return script.dataset.mtlJson;
    if (document.body && document.body.dataset.mtlJson) return document.body.dataset.mtlJson;
    const meta = document.querySelector('meta[name="mtl-json"]');
    if (meta && meta.content) return meta.content;
    return '/shared/data/mtl-equations.json';
  }

  function getMappingUrl() {
    const script = document.currentScript || document.querySelector('script[data-mtl-json]');
    if (script && script.dataset.mtlMapping) return script.dataset.mtlMapping;
    if (document.body && document.body.dataset.mtlMapping) return document.body.dataset.mtlMapping;
    const meta = document.querySelector('meta[name="mtl-mapping"]');
    if (meta && meta.content) return meta.content;
    // Derive from JSON URL: replace filename with eq-id-mapping.json
    const jsonUrl = getJsonUrl();
    return jsonUrl.replace(/mtl-equations\.json$/, 'eq-id-mapping.json').replace(/\/[^\/]*$/, '/eq-id-mapping.json');
  }

  function getEquationMap(payload) {
    if (!payload) return {};
    if (payload.byId && typeof payload.byId === 'object') return payload.byId;
    if (Array.isArray(payload.equations)) {
      return payload.equations.reduce(function(map, equation) {
        if (equation && equation.id) map[equation.id] = equation;
        return map;
      }, {});
    }
    return {};
  }

  function field(equation, key) {
    if (!equation) return '';
    if (equation.translations && equation.translations[key]) return equation.translations[key];
    if (equation[key]) return equation[key];
    if ((key === 'standard' || key === 'academic') && equation.translations && equation.translations.easy) return equation.translations.easy;
    if ((key === 'standard' || key === 'academic') && equation.easy) return equation.easy;
    return '';
  }

  function ensureSummary(callout) {
    let summary = callout.querySelector('summary');
    if (!summary) {
      summary = document.createElement('summary');
      callout.insertBefore(summary, callout.firstChild);
    }
    if (!summary.dataset.mtlPrepared) {
      summary.innerHTML = '';

      const dot = document.createElement('span');
      dot.className = 'mtl-dot';

      const label = document.createElement('span');
      label.className = 'mtl-label';
      label.textContent = 'What this equation says in English';

      const chevron = document.createElement('span');
      chevron.className = 'mtl-chevron';
      chevron.setAttribute('aria-hidden', 'true');
      chevron.textContent = 'v';

      summary.appendChild(dot);
      summary.appendChild(label);
      summary.appendChild(chevron);
      summary.dataset.mtlPrepared = 'true';
    }
  }

  function ensureBody(callout) {
    let body = callout.querySelector('.mtl-body');
    if (!body) {
      body = document.createElement('div');
      body.className = 'mtl-body';
      callout.appendChild(body);
    }
    return body;
  }

  function appendLayer(body, className, text) {
    const layer = document.createElement('div');
    layer.className = className;
    layer.textContent = text;
    body.appendChild(layer);
  }

  function populateCallout(callout, equation) {
    callout.classList.add('mtl-callout');
    ensureSummary(callout);

    if (!equation) {
      callout.dataset.mtlStatus = 'missing';
      return;
    }

    const body = ensureBody(callout);
    body.innerHTML = '';

    const easy = field(equation, 'easy');
    const standard = field(equation, 'standard');
    const academic = field(equation, 'academic');
    const audioSafe = field(equation, 'audioSafe');

    if (easy) appendLayer(body, 'mtl-easy', easy);
    if (standard) appendLayer(body, 'mtl-standard', standard);
    if (academic) appendLayer(body, 'mtl-academic', academic);
    if (audioSafe) {
      const audio = document.createElement('div');
      audio.className = 'mtl-audio';
      audio.setAttribute('aria-label', audioSafe);
      audio.hidden = true;
      audio.textContent = audioSafe;
      body.appendChild(audio);
    }

    callout.dataset.mtlStatus = equation.needsReview ? 'needs-review' : 'complete';
  }

  function initUserToggleTracking() {
    document.querySelectorAll('.mtl-callout, .math-translation-block').forEach(function(callout) {
      callout.addEventListener('toggle', function() {
        callout.dataset.userToggled = 'true';
      });
    });
  }

  function initTopBarTabs() {
    document.querySelectorAll('.mda-tb-tab[data-reader-mode]').forEach(function(tab) {
      tab.addEventListener('click', function() {
        setLevel(tab.getAttribute('data-reader-mode'));
      });
    });
  }

  async function loadAndPopulate() {
    const callouts = Array.from(document.querySelectorAll(CALLOUT_SELECTOR));
    if (!callouts.length) return;

    let map = {};
    let idMapping = {};

    try {
      const jsonUrl = getJsonUrl();
      const mappingUrl = getMappingUrl();

      const [eqResponse, mapResponse] = await Promise.all([
        fetch(jsonUrl, { cache: 'no-store' }),
        fetch(mappingUrl, { cache: 'no-store' })
      ]);

      if (eqResponse.ok) {
        map = getEquationMap(await eqResponse.json());
      }
      if (mapResponse.ok) {
        idMapping = await mapResponse.json();
      }
    } catch (error) {
      document.documentElement.dataset.mtlLoadError = 'true';
    }

    callouts.forEach(function(callout) {
      const equationId = callout.getAttribute('data-eq-id');
      // Try direct lookup first, then mapping fallback
      let equation = map[equationId];
      if (!equation && idMapping && idMapping[equationId]) {
        equation = map[idMapping[equationId]];
        if (equation) {
          callout.dataset.mtlMappedFrom = equationId;
          callout.dataset.mtlMappedTo = idMapping[equationId];
        }
      }
      populateCallout(callout, equation);
    });
  }

  async function init() {
    await loadAndPopulate();
    initUserToggleTracking();
    initTopBarTabs();
    setLevel(detectLevel());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.MTL = {
    setLevel: setLevel,
    reload: loadAndPopulate
  };
})();
