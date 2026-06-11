(function () {
  var state = {
    speaking: false,
    paused: false,
    utterances: [],
    index: 0,
    player: null
  };

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function getArticleText() {
    var article = document.querySelector(".prose-body") || document.querySelector("main");
    if (!article) return "";

    var clone = article.cloneNode(true);
    clone.querySelectorAll("script, style, nav, footer, audio, video, table").forEach(function (node) {
      node.remove();
    });

    return clone.textContent
      .replace(/\s+/g, " ")
      .replace(/\s([.,;:!?])/g, "$1")
      .trim();
  }

  function chunkText(text) {
    var sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    var chunks = [];
    var current = "";

    sentences.forEach(function (sentence) {
      var next = (current + " " + sentence.trim()).trim();
      if (next.length > 900 && current) {
        chunks.push(current);
        current = sentence.trim();
      } else {
        current = next;
      }
    });

    if (current) chunks.push(current);
    return chunks;
  }

  function setIcon(player, icon) {
    var button = player.querySelector(".play-btn");
    if (button) button.innerHTML = '<i class="fas fa-' + icon + '"></i>';
  }

  function setDescription(player, text) {
    var desc = player.querySelector(".player-desc");
    if (desc) desc.textContent = text;
  }

  function setProgress(player, index, total) {
    var fill = player.querySelector(".fill");
    var current = player.querySelector(".current-time");
    var duration = player.querySelector(".duration");
    var pct = total ? Math.min(100, Math.round((index / total) * 100)) : 0;
    if (fill) fill.style.width = pct + "%";
    if (current) current.textContent = index + "/" + total;
    if (duration) duration.textContent = "Browser TTS";
  }

  function resetPlayer(player) {
    window.speechSynthesis.cancel();
    state.speaking = false;
    state.paused = false;
    state.utterances = [];
    state.index = 0;
    state.player = null;
    setIcon(player, "play");
  }

  function speakNext() {
    if (!state.speaking || state.paused || state.index >= state.utterances.length) {
      if (state.player && state.index >= state.utterances.length) {
        setProgress(state.player, state.utterances.length, state.utterances.length);
        resetPlayer(state.player);
      }
      return;
    }

    var utterance = state.utterances[state.index];
    var player = state.player;
    setProgress(player, state.index + 1, state.utterances.length);
    utterance.onend = function () {
      state.index += 1;
      speakNext();
    };
    utterance.onerror = function () {
      setDescription(player, "Browser read-aloud stopped. Your browser may have blocked speech playback.");
      resetPlayer(player);
    };
    window.speechSynthesis.speak(utterance);
  }

  function startBrowserRead(player) {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setDescription(player, "Browser read-aloud is not available here. Use Edge or Chrome, or add a generated audio file.");
      return;
    }

    var text = getArticleText();
    if (!text) {
      setDescription(player, "No readable article text was found for browser read-aloud.");
      return;
    }

    resetPlayer(player);
    state.player = player;
    state.speaking = true;
    state.utterances = chunkText(text).map(function (chunk) {
      var utterance = new SpeechSynthesisUtterance(chunk);
      utterance.rate = 0.92;
      utterance.pitch = 1;
      utterance.volume = 1;
      return utterance;
    });

    setIcon(player, "pause");
    setDescription(player, "Free browser read-aloud is playing. Voice quality depends on the reader's browser and system voices.");
    speakNext();
  }

  function handlePlay(event) {
    var player = event.target.closest('[data-component="audio"][data-name="audio-pill-player"]');
    if (!player) return;

    var active = player.querySelector(".mode-pill.active");
    if (active && active.dataset.src) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (state.player && state.player !== player) resetPlayer(state.player);

    if (state.speaking && !state.paused) {
      state.paused = true;
      window.speechSynthesis.pause();
      setIcon(player, "play");
      setDescription(player, "Browser read-aloud paused.");
      return;
    }

    if (state.speaking && state.paused) {
      state.paused = false;
      window.speechSynthesis.resume();
      setIcon(player, "pause");
      setDescription(player, "Free browser read-aloud is playing. Voice quality depends on the reader's browser and system voices.");
      return;
    }

    startBrowserRead(player);
  }

  function handleModeChange(event) {
    var pill = event.target.closest(".mode-pill");
    if (!pill || !state.player) return;
    if (pill.closest('[data-component="audio"][data-name="audio-pill-player"]') === state.player) {
      resetPlayer(state.player);
    }
  }

  ready(function () {
    document.addEventListener("click", function (event) {
      if (event.target.closest(".play-btn")) handlePlay(event);
      else if (event.target.closest(".mode-pill")) handleModeChange(event);
    }, true);

    window.addEventListener("beforeunload", function () {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    });
  });
})();
