(() => {
  "use strict";
  const config = window.APP_CONFIG;
  const $ = (id) => document.getElementById(id);
  let current = "start";
  let videoTimer;
  let previousFocus;
  let currentMusic = null;
  let musicEnabled = true;
  const tracks = config.music.tracks;
  const trackVolumes = new Map(tracks.map((track) => [track.id, Math.max(0, Math.min(1, track.volume ?? 0.1))]));
  let selectedTrackIndex = Math.max(0, tracks.findIndex((track) => track.id === config.music.defaultTrack));
  let musicPreviousFocus;
  const screens = ["start", "video", "interaction", "intro-letter", "home", "detail"];

  function position(element, rect) {
    for (const [key, css] of Object.entries({ x: "left", y: "top", width: "width", height: "height" })) {
      element.style[css] = `${rect[key]}%`;
    }
  }
  function positionHotspot() {
    const rect = config.hotspot;
    const img = $("interaction-image");
    if (rect.coordinateSpace !== "image" || !img.naturalWidth) {
      position($("hotspot"), rect);
      return;
    }
    const width = $("app").clientWidth;
    const height = $("app").clientHeight;
    const scale = config.fits.image2 === "cover"
      ? Math.max(width / img.naturalWidth, height / img.naturalHeight)
      : Math.min(width / img.naturalWidth, height / img.naturalHeight);
    const imageWidth = img.naturalWidth * scale;
    const imageHeight = img.naturalHeight * scale;
    const hotspot = $("hotspot");
    hotspot.style.left = `${(width - imageWidth) / 2 + imageWidth * rect.x / 100}px`;
    hotspot.style.top = `${(height - imageHeight) / 2 + imageHeight * rect.y / 100}px`;
    hotspot.style.width = `${imageWidth * rect.width / 100}px`;
    hotspot.style.height = `${imageHeight * rect.height / 100}px`;
  }
  function show(name) {
    clearTimeout(videoTimer);
    if (current === "video") $("intro-video").pause();
    $("detail-content").querySelectorAll("video, audio").forEach((media) => media.pause());
    screens.forEach((id) => { $(id).hidden = id !== name; });
    current = name;
    $("audio-controls").classList.toggle("in-content", name === "detail");
    if (name === "home" && tracks.length) setBackgroundMusic(tracks[selectedTrackIndex]);
    $("status").textContent = $(name).getAttribute("aria-label");
    $(name).querySelector("button")?.focus({ preventScroll: true });
  }
  function setupImage(id, path, fallbackId, fit = "contain") {
    const img = $(id);
    img.style.objectFit = fit;
    img.hidden = !path;
    if (fallbackId) $(fallbackId).hidden = !!path;
    if (!path) return;
    img.onerror = () => {
      img.hidden = true;
      if (fallbackId) $(fallbackId).hidden = false;
    };
    img.src = path;
  }
  function createLetter(container) {
    if (config.media.image3Background) {
      const background = document.createElement("img");
      background.className = "letter-background";
      background.alt = "";
      background.src = config.media.image3Background;
      background.onerror = () => { background.hidden = true; };
      container.before(background);
    }
    if (!config.media.image3) {
      const text = document.createElement("p");
      text.textContent = "이미지 3이 들어갈 자리";
      container.append(text);
      return;
    }
    const img = document.createElement("img");
    img.src = config.media.image3;
    img.alt = "너에게 보내는 편지";
    img.style.objectFit = config.fits.image3;
    img.onerror = () => { container.textContent = "편지 이미지 경로를 확인해주세요."; };
    container.append(img);
  }
  function placeholderVideo() {
    $("intro-video").hidden = true;
    $("play-video").hidden = true;
    $("video-placeholder").hidden = false;
    const progress = $("video-progress");
    progress.style.transition = "none";
    progress.style.width = "0%";
    requestAnimationFrame(() => requestAnimationFrame(() => {
      progress.style.transition = `width ${config.timing.placeholderVideo}ms linear`;
      progress.style.width = "100%";
    }));
    videoTimer = setTimeout(() => show("interaction"), config.timing.placeholderVideo);
  }
  async function playIntro() {
    try {
      await $("intro-video").play();
      $("play-video").hidden = true;
    } catch {
      if (current === "video" && !$("intro-video").hidden) $("play-video").hidden = false;
    }
  }
  function start() {
    if (current !== "start") return;
    playEffect("start-press-audio", config.media.startPressSound);
    show("video");
    if (!config.media.video1) return placeholderVideo();
    $("video-placeholder").hidden = true;
    $("intro-video").hidden = false;
    $("intro-video").volume = config.audio.introVideoVolume;
    $("intro-video").src = config.media.video1;
    playIntro();
  }
  function openSection(number) {
    window.CONTENT_APP.open(number, $("detail-content"), () => {
      show("home");
      document.querySelector(`[data-section="${number}"]`)?.focus({ preventScroll: true });
    });
    $("detail").setAttribute("aria-label", window.CONTENT_APP.title(number));
    show("detail");
  }
  function playEffect(id, path) {
    if (!path) return;
    const audio = $(id);
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch((error) => {
      if (error.name !== "AbortError") console.warn("효과음 재생 실패:", error.message);
    });
  }
  function playLetterSound() {
    playEffect("letter-open-audio", config.media.letterOpenSound);
  }
  function playMusic() {
    $("background-audio").play().then(updateSound).catch((error) => {
      if (error.name !== "AbortError") console.warn("배경음 재생 실패:", error.message);
      updateSound();
    });
  }
  function setBackgroundMusic(track) {
    const audio = $("background-audio");
    const path = track?.src;
    audio.volume = trackVolumes.get(track?.id) ?? 0.1;
    window.MUSIC_PICKER.updateVolume(audio.volume);
    if (currentMusic !== path) {
      audio.pause();
      currentMusic = path;
      if (path) {
        audio.src = path;
        audio.currentTime = 0;
      } else audio.removeAttribute("src");
    }
    $("audio-controls").hidden = !path;
    if (path && musicEnabled && audio.paused) playMusic();
    updateSound();
  }
  function closeLetter() {
    $("letter-modal").hidden = true;
    $("home").inert = false;
    $("audio-controls").inert = false;
    previousFocus?.focus({ preventScroll: true });
  }
  function updateSound() {
    const muted = $("background-audio").muted;
    $("speaker-waves").toggleAttribute("hidden", muted);
    $("speaker-muted").toggleAttribute("hidden", !muted);
    $("sound-toggle").setAttribute("aria-label", muted ? "배경음악 음소거 해제" : "배경음악 음소거");
    $("sound-toggle").setAttribute("aria-pressed", String(muted));
    window.MUSIC_PICKER.updatePlayback(!$("background-audio").paused);
  }
  function openMusic() {
    musicPreviousFocus = document.activeElement;
    $(current).inert = true;
    $("audio-controls").inert = true;
    window.MUSIC_PICKER.open(selectedTrackIndex);
    $("close-music").focus();
  }
  function closeMusic() {
    window.MUSIC_PICKER.close();
    $(current).inert = false;
    $("audio-controls").inert = false;
    musicPreviousFocus?.focus({ preventScroll: true });
  }
  window.MUSIC_PICKER.init(tracks, {
    onSelect(index) {
      selectedTrackIndex = index;
      musicEnabled = true;
      setBackgroundMusic(tracks[index]);
    },
    onToggle() {
      const audio = $("background-audio");
      musicEnabled = audio.paused;
      if (musicEnabled && currentMusic) playMusic();
      else audio.pause();
      updateSound();
    },
    getVolume: () => $("background-audio").volume,
    onVolume(value) {
      trackVolumes.set(tracks[selectedTrackIndex].id, value);
      $("background-audio").volume = value;
      window.MUSIC_PICKER.updateVolume(value);
    },
    onClose: closeMusic,
  });
  function trapMusicFocus(event) {
    const buttons = [...$("music-modal").querySelectorAll("button:not([disabled]), input:not([disabled]), [tabindex='0']")];
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  setupImage("start-image", config.media.image1);
  setupImage("interaction-image", config.media.image2, "interaction-placeholder", config.fits.image2);
  setupImage("home-background", config.media.image4, "home-placeholder", config.fits.image4);
  setupImage("home-character", config.media.homeCharacter);
  $("interaction-image").addEventListener("load", positionHotspot);
  new ResizeObserver(positionHotspot).observe($("app"));
  positionHotspot();
  if (config.hotspot.clipPath) $("hotspot").style.clipPath = config.hotspot.clipPath;
  $("hotspot-hint").hidden = !config.hotspot.showHint;
  createLetter($("intro-letter-content"));
  createLetter($("modal-letter-content"));
  for (const number of [5, 6, 7, 8]) {
    const button = $(`button-${number}`);
    const path = config.media[`image${number}`];
    if (path) {
      const img = button.querySelector("img");
      const fallback = button.querySelector(".button-fallback");
      button.classList.add("has-image");
      img.hidden = false;
      fallback.hidden = true;
      img.onerror = () => { img.hidden = true; fallback.hidden = false; button.classList.remove("has-image"); };
      img.src = path;
    }
  }
  document.querySelectorAll("[data-section]").forEach((button) => {
    const number = Number(button.dataset.section);
    const label = config.menuLabels?.[number] ?? window.CONTENT_APP.title(number);
    button.querySelector(".menu-number").textContent = label;
    button.setAttribute("aria-label", `${label} 열기`);
    button.addEventListener("click", () => openSection(number));
  });
  $("start-button").addEventListener("click", start);
  $("skip-all").addEventListener("click", () => {
    playEffect("start-press-audio", config.media.startPressSound);
    show("home");
  });
  $("intro-video").addEventListener("ended", () => { if (current === "video") show("interaction"); });
  $("intro-video").addEventListener("error", () => { if (current === "video") placeholderVideo(); });
  $("play-video").addEventListener("click", playIntro);
  $("skip-video").addEventListener("click", () => show("interaction"));
  $("letter-open-audio").src = config.media.letterOpenSound || "";
  $("start-press-audio").src = config.media.startPressSound || "";
  $("hotspot").addEventListener("click", () => {
    show("intro-letter");
    playLetterSound();
  });
  $("continue").addEventListener("click", () => show("home"));
  $("button-5").addEventListener("click", () => {
    playLetterSound();
    previousFocus = document.activeElement;
    $("letter-modal").hidden = false;
    $("home").inert = true;
    $("audio-controls").inert = true;
    $("close-letter").focus();
  });
  $("close-letter").addEventListener("click", closeLetter);
  document.addEventListener("keydown", (event) => {
    if (!$("music-modal").hidden) {
      if (event.key === "Escape") { event.preventDefault(); closeMusic(); }
      if (event.key === "Tab") trapMusicFocus(event);
    } else if (!$("letter-modal").hidden) {
      if (event.key === "Escape") closeLetter();
      if (event.key === "Tab") { event.preventDefault(); $("close-letter").focus(); }
    } else if (event.key === "Escape" && current === "detail") window.CONTENT_APP.back();
  });
  $("sound-toggle").addEventListener("click", () => {
    const audio = $("background-audio");
    audio.muted = !audio.muted;
    if (!audio.muted && musicEnabled && currentMusic && audio.paused) playMusic();
    updateSound();
  });
  $("music-toggle").addEventListener("click", openMusic);
  $("background-audio").addEventListener("play", updateSound);
  $("background-audio").addEventListener("pause", updateSound);
  $("background-audio").addEventListener("ended", () => {
    if (!tracks.length || !musicEnabled || !currentMusic) return;
    selectedTrackIndex = (selectedTrackIndex + 1) % tracks.length;
    $("background-audio").currentTime = 0;
    setBackgroundMusic(tracks[selectedTrackIndex]);
    window.MUSIC_PICKER.syncSelection(selectedTrackIndex);
  });
  $("opening").style.setProperty("--fade-duration", `${config.timing.fadeOut}ms`);
  setTimeout(() => $("opening").classList.add("fade"), config.timing.blackHold);
  setTimeout(() => {
    $("opening").hidden = true;
    $("start-button").disabled = false;
  }, config.timing.blackHold + config.timing.fadeOut);
})();
