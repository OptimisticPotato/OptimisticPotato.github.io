(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  let tracks = [], callbacks, index = 0, drag, targetIndex = null;
  function clamp(value) { return Math.max(0, Math.min(tracks.length - 1, value)); }
  function update(next, select = true) {
    if (!tracks.length) return;
    next = clamp(next);
    const changed = index !== next;
    index = next;
    $("music-title").textContent = tracks[index].title;
    $("music-count").textContent = `${String(index + 1).padStart(2, "0")} / ${String(tracks.length).padStart(2, "0")}`;
    $("music-prev").disabled = index === 0;
    $("music-next").disabled = index === tracks.length - 1;
    [...$("music-dots").children].forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
      dot.setAttribute("aria-current", i === index ? "true" : "false");
    });
    [...$("music-carousel").children].forEach((slide, i) => slide.classList.toggle("active", i === index));
    if (select && changed) {
      callbacks.onSelect(index);
      $("status").textContent = `${tracks[index].title} 선택`;
    }
    updateVolume(callbacks.getVolume());
  }
  function move(next, instant = false) {
    next = clamp(next);
    const track = $("music-carousel");
    update(next);
    targetIndex = Math.abs(track.scrollLeft - track.clientWidth * next) > 1 ? next : null;
    track.scrollTo({ left: track.clientWidth * next, behavior: instant || matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  function finishDrag(event, cancelled = false) {
    if (!drag || drag.id !== event.pointerId) return;
    const old = drag;
    drag = null;
    const track = $("music-carousel");
    track.classList.remove("dragging");
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    if (!old.moved) return;
    const dx = event.clientX - old.x;
    const step = !cancelled && Math.abs(dx) >= Math.max(30, track.clientWidth * .12) ? (dx < 0 ? 1 : -1) : 0;
    move(old.index + step);
  }
  function init(items, handlers) {
    tracks = items;
    callbacks = handlers;
    const carousel = $("music-carousel");
    const dots = $("music-dots");
    carousel.replaceChildren();
    dots.replaceChildren();
    tracks.forEach((track, i) => {
      const slide = document.createElement("div");
      slide.className = "music-slide";
      const jacket = document.createElement("div");
      jacket.className = "music-jacket";
      const fallback = document.createElement("span");
      fallback.className = "music-jacket-fallback";
      fallback.textContent = "♪";
      jacket.append(fallback);
      if (track.cover) {
        const image = document.createElement("img");
        image.src = track.cover;
        image.alt = `${track.title} 앨범 자켓`;
        image.draggable = false;
        image.addEventListener("error", () => image.remove());
        jacket.append(image);
      }
      slide.append(jacket);
      carousel.append(slide);
      const dot = document.createElement("button");
      dot.className = "music-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `${track.title} 선택`);
      dot.addEventListener("click", () => move(i));
      dots.append(dot);
    });
    $("music-prev").addEventListener("click", () => move(index - 1));
    $("music-next").addEventListener("click", () => move(index + 1));
    $("music-play").addEventListener("click", () => callbacks.onToggle());
    $("music-volume").addEventListener("input", (event) => callbacks.onVolume(Number(event.target.value) / 100));
    $("close-music").addEventListener("click", () => callbacks.onClose());
    let scrollPending = false;
    carousel.addEventListener("scroll", () => {
      if (scrollPending || $("music-modal").hidden) return;
      scrollPending = true;
      requestAnimationFrame(() => {
        scrollPending = false;
        if ($("music-modal").hidden || drag) return;
        if (targetIndex !== null) {
          if (Math.abs(carousel.scrollLeft - carousel.clientWidth * targetIndex) > 1) return;
          targetIndex = null;
        }
        update(Math.round(carousel.scrollLeft / (carousel.clientWidth || 1)));
      });
    }, { passive: true });
    $("music-modal").addEventListener("keydown", (event) => {
      if (event.target.matches("input[type='range']")) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        move(index + (event.key === "ArrowRight" ? 1 : -1));
      }
    });
    carousel.addEventListener("pointerdown", (event) => {
      targetIndex = null;
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: carousel.scrollLeft, index, moved: false };
    });
    carousel.addEventListener("pointermove", (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x;
      if (!drag.moved) {
        if (Math.abs(dx) < 8 || Math.abs(dx) <= Math.abs(event.clientY - drag.y)) return;
        drag.moved = true;
        carousel.setPointerCapture(event.pointerId);
        carousel.classList.add("dragging");
      }
      event.preventDefault();
      carousel.scrollLeft = drag.left - dx;
    });
    carousel.addEventListener("pointerup", (event) => finishDrag(event));
    carousel.addEventListener("pointercancel", (event) => finishDrag(event, true));
    carousel.addEventListener("dragstart", (event) => event.preventDefault());
  }
  function open(selectedIndex) {
    $("music-modal").hidden = false;
    syncSelection(selectedIndex);
  }
  function syncSelection(selectedIndex) {
    const carousel = $("music-carousel");
    if (drag && carousel.hasPointerCapture(drag.id)) carousel.releasePointerCapture(drag.id);
    drag = null;
    targetIndex = null;
    carousel.classList.remove("dragging");
    update(selectedIndex, false);
    if (!$("music-modal").hidden) carousel.scrollTo({ left: carousel.clientWidth * index, behavior: "instant" });
  }
  function close() {
    const carousel = $("music-carousel");
    if (drag && carousel.hasPointerCapture(drag.id)) carousel.releasePointerCapture(drag.id);
    drag = null;
    targetIndex = null;
    carousel.classList.remove("dragging");
    $("music-modal").hidden = true;
  }
  function updatePlayback(playing) {
    $("music-play").setAttribute("aria-label", playing ? "음악 일시 정지" : "음악 재생");
    $("music-play-path").setAttribute("d", playing ? "M6 4h4v16H6zm8 0h4v16h-4z" : "M7 4v16l13-8z");
    $("music-play").setAttribute("aria-pressed", String(playing));
  }
  function updateVolume(volume) {
    const percent = Math.round(volume * 1000) / 10;
    $("music-volume").value = String(percent);
    $("music-volume-value").textContent = `${percent}%`;
    $("music-volume").setAttribute("aria-valuetext", `${percent}%`);
    $("music-volume").style.setProperty("--volume-fill", `${percent}%`);
  }
  window.MUSIC_PICKER = { init, open, close, syncSelection, updatePlayback, updateVolume };
})();
