(() => {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const total = slides.length;
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const dotsWrap = document.getElementById("dots");
  const soundToggle = document.getElementById("soundToggle");
  const toast = document.getElementById("toast");
  const deck = document.getElementById("deck");
  const voteDemoBtn = document.getElementById("voteDemoBtn");
  const dropPaper = document.getElementById("dropPaper");

  let index = 0;
  let soundOn = true;
  let audioCtx = null;

  function ensureAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  function tone(freq, duration = 0.12, type = "sine", gain = 0.05) {
    if (!soundOn) return;
    ensureAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  function noiseBurst(duration = 0.12, gain = 0.03) {
    if (!soundOn) return;
    ensureAudio();
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = audioCtx.createBufferSource();
    const g = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200;
    src.buffer = buffer;
    g.gain.value = gain;
    src.connect(filter);
    filter.connect(g);
    g.connect(audioCtx.destination);
    src.start();
  }

  function playNav() {
    tone(480, 0.07, "triangle", 0.045);
    setTimeout(() => tone(640, 0.09, "triangle", 0.04), 45);
    setTimeout(() => tone(820, 0.1, "sine", 0.03), 95);
  }

  function playSelect() {
    tone(700, 0.08, "sine", 0.055);
    setTimeout(() => tone(940, 0.12, "sine", 0.045), 60);
    setTimeout(() => tone(1180, 0.1, "triangle", 0.03), 120);
  }

  function playVote() {
    noiseBurst(0.08, 0.025);
    tone(360, 0.1, "square", 0.03);
    setTimeout(() => tone(520, 0.12, "triangle", 0.05), 80);
    setTimeout(() => tone(780, 0.16, "sine", 0.055), 160);
    setTimeout(() => tone(1040, 0.14, "sine", 0.04), 260);
  }

  function playCheer() {
    [523, 659, 784, 988, 1175].forEach((f, i) => {
      setTimeout(() => tone(f, 0.18, "sine", 0.045), i * 65);
    });
    setTimeout(() => noiseBurst(0.2, 0.02), 200);
  }

  function playAnnounce() {
    tone(440, 0.15, "sawtooth", 0.025);
    setTimeout(() => tone(554, 0.18, "sawtooth", 0.03), 100);
    setTimeout(() => tone(659, 0.22, "triangle", 0.04), 220);
  }

  function playMessage() {
    tone(880, 0.08, "sine", 0.05);
    setTimeout(() => tone(1175, 0.14, "sine", 0.045), 90);
  }

  function playCampaign() {
    [392, 494, 587, 698].forEach((f, i) => {
      setTimeout(() => tone(f, 0.1, "triangle", 0.035), i * 55);
    });
  }

  function playSpeech() {
    tone(330, 0.2, "sine", 0.04);
    setTimeout(() => tone(415, 0.22, "sine", 0.035), 160);
    setTimeout(() => tone(494, 0.25, "triangle", 0.03), 320);
  }

  function playSlideSound(slideIndex) {
    const map = {
      3: playAnnounce,
      4: playMessage,
      5: playCampaign,
      6: playSpeech,
      7: playVote,
      8: playCheer,
      11: playCheer,
    };
    (map[slideIndex] || playNav)();
  }

  function showToast(en, ar) {
    toast.hidden = false;
    toast.innerHTML = `<span class="en">${en}</span><span class="ar" dir="rtl">${ar}</span>`;
    toast.classList.add("is-show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.classList.remove("is-show");
    }, 2200);
  }

  function buildDots() {
    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dot" + (i === index ? " is-active" : "");
      btn.setAttribute("aria-label", `Go to slide ${i + 1}`);
      btn.addEventListener("click", () => goTo(i, true));
      dotsWrap.appendChild(btn);
    });
  }

  function fitSlides() {
    slides.forEach((slide) => {
      const inner = slide.querySelector(".slide-inner");
      if (!inner) return;
      inner.style.zoom = "1";
      const boxH = inner.clientHeight;
      const boxW = inner.clientWidth;
      if (boxH < 40 || boxW < 40) return;
      const scale = Math.min(1, boxH / inner.scrollHeight, boxW / inner.scrollWidth);
      inner.style.zoom = scale < 0.992 ? String(Math.floor(scale * 1000) / 1000) : "1";
    });
  }

  function updateUI() {
    progressBar.style.width = `${((index + 1) / total) * 100}%`;
    const num = progressText.querySelector(".counter-num");
    const tot = progressText.querySelector(".counter-total");
    if (num && tot) {
      num.textContent = String(index + 1);
      tot.textContent = String(total);
    } else {
      progressText.textContent = `${index + 1} / ${total}`;
    }
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === total - 1;
    dotsWrap.querySelectorAll(".dot").forEach((dot, i) => {
      dot.classList.toggle("is-active", i === index);
    });
    fitSlides();
  }

  function goTo(next, withSound = true) {
    if (next < 0 || next >= total || next === index) return;
    const current = slides[index];
    const target = slides[next];
    current.classList.remove("is-active");
    current.classList.add("is-exit");
    setTimeout(() => current.classList.remove("is-exit"), 400);
    target.classList.add("is-active");
    index = next;
    updateUI();
    if (withSound) playSlideSound(index);
    deck.focus({ preventScroll: true });
  }

  function next() {
    goTo(index + 1);
  }

  function prev() {
    goTo(index - 1);
  }

  buildDots();
  updateUI();

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      prev();
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(total - 1);
    }
  });

  let touchX = null;
  deck.addEventListener(
    "touchstart",
    (e) => {
      touchX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );
  deck.addEventListener(
    "touchend",
    (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].screenX - touchX;
      if (Math.abs(dx) > 50) {
        if (dx < 0) next();
        else prev();
      }
      touchX = null;
    },
    { passive: true }
  );

  soundToggle.addEventListener("click", () => {
    soundOn = !soundOn;
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    soundToggle.querySelector(".sound-icon").textContent = soundOn ? "🔊" : "🔇";
    soundToggle.querySelector(".sound-label").textContent = soundOn ? "Sound On" : "Sound Off";
    if (soundOn) {
      ensureAudio();
      playSelect();
    }
  });

  document.querySelectorAll("[data-go]").forEach((el) => {
    el.addEventListener("click", () => {
      const n = Number(el.getAttribute("data-go"));
      if (!Number.isNaN(n)) goTo(n);
    });
  });

  document.querySelectorAll(".grade-card").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".grade-card").forEach((c) => c.classList.remove("is-selected"));
      card.classList.add("is-selected");
      playSelect();
    });
  });

  document.querySelectorAll(".role-card").forEach((card) => {
    card.addEventListener("mouseenter", () => {
      if (soundOn) tone(640, 0.05, "sine", 0.025);
    });
    card.addEventListener("click", () => {
      playSelect();
      const title = card.querySelector("h3.en")?.textContent || "Leadership";
      const titleAr = card.querySelector("h3.ar")?.textContent || "قيادة";
      showToast(title, titleAr);
    });
  });

  document.querySelectorAll(".journey-step").forEach((step) => {
    step.addEventListener("mouseenter", () => {
      if (soundOn) tone(720, 0.04, "triangle", 0.02);
    });
  });

  if (voteDemoBtn && dropPaper) {
    voteDemoBtn.addEventListener("click", () => {
      playVote();
      dropPaper.classList.remove("is-dropping");
      void dropPaper.offsetWidth;
      dropPaper.classList.add("is-dropping");
      showToast("Vote cast successfully!", "تم الإدلاء بالصوت بنجاح!");
    });
  }

  window.addEventListener("resize", () => fitSlides());
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => fitSlides());
  }

  ["pointerdown", "keydown"].forEach((evt) => {
    window.addEventListener(
      evt,
      () => {
        if (soundOn) ensureAudio();
      },
      { once: true }
    );
  });
})();
