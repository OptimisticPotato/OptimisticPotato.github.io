(() => {
  "use strict";
  let content = ContentModel.validate(window.APP_CONTENT);
  let mount, goHome, section = 0, quiz, activeFact = 0, opening = 0;
  const ready = location.protocol === "file:" ? Promise.resolve() : fetch("content.json", { cache: "no-store" })
    .then((response) => { if (!response.ok) throw new Error("콘텐츠 읽기 실패"); return response.json(); })
    .then((data) => { content = ContentModel.validate(data); })
    .catch((error) => { console.warn("기본 콘텐츠를 사용합니다:", error.message); });

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(label, className, action) {
    const node = el("button", className, label);
    node.type = "button";
    node.addEventListener("click", action);
    return node;
  }
  function image(src, alt, className = "") {
    const frame = el("div", `content-image ${className}`);
    if (src) {
      const img = el("img");
      img.alt = alt;
      img.src = src;
      img.loading = "lazy";
      img.addEventListener("error", () => {
        img.remove();
        frame.classList.add("empty-image");
        frame.setAttribute("aria-label", "이미지를 읽을 수 없습니다");
      });
      frame.append(img);
    } else {
      frame.classList.add("empty-image");
      frame.setAttribute("role", "img");
      frame.setAttribute("aria-label", "비어 있는 사진 자리");
      frame.append(el("span", "empty-image-mark", "+"));
    }
    return frame;
  }
  function header(kicker, title, subtitle) {
    const node = el("header", "content-header");
    node.append(el("span", "content-kicker", kicker));
    const heading = el("h1", "content-title", title);
    heading.tabIndex = -1;
    node.append(heading);
    if (subtitle) node.append(el("p", "content-subtitle", subtitle));
    return node;
  }
  function footer(backAction = goHome) {
    const node = el("footer", "content-footer");
    node.append(button("← BACK", "text-button", backAction));
    return node;
  }
  function page(className) {
    mount.replaceChildren();
    const node = el("div", `content-page ${className}`);
    mount.append(node);
    return node;
  }
  function announce(text) { document.getElementById("status").textContent = text; }
  function focusTitle() { mount.querySelector("h1")?.focus({ preventScroll: true }); }

  function renderAlbum(album) {
    const root = page(`album-page theme-${album.theme}`);
    root.append(header(`ALBUM / 0${album.id}`, album.title, album.subtitle));
    const scroll = el("div", "album-scroll");
    scroll.tabIndex = 0;
    scroll.setAttribute("aria-label", "사진첩 스크롤");
    const collection = el("div", "album-collection");
    album.cards.forEach((card, index) => {
      const article = el("article", "album-card");
      article.style.setProperty("--stack-index", index);
      article.setAttribute("aria-label", card.title || `카드 ${index + 1}`);
      article.append(el("span", "card-index", String(index + 1).padStart(2, "0")));
      const row = el("div", "album-card-body");
      row.append(image(card.image, card.title || `사진 ${index + 1}`));
      const copy = el("div", "album-copy");
      if (card.title) copy.append(el("h2", "album-card-title", card.title));
      else {
        const skeleton = el("div", "skeleton skeleton-title");
        skeleton.setAttribute("aria-hidden", "true");
        copy.append(skeleton);
      }
      if (card.text) copy.append(el("p", "album-card-text", card.text));
      else {
        const skeleton = el("div", "skeleton-lines");
        skeleton.setAttribute("aria-hidden", "true");
        for (let i = 0; i < 3; i++) skeleton.append(el("span", "skeleton"));
        copy.append(skeleton);
      }
      row.append(copy);
      article.append(row);
      collection.append(article);
    });
    if (!album.cards.length) collection.append(el("p", "empty-content", "아직 사진이 없습니다."));
    scroll.append(collection, el("p", "album-end", `${album.cards.length} MOMENTS`));
    root.append(scroll, footer());
  }

  function renderFacts() {
    activeFact = 0;
    const data = content.facts;
    const root = page("facts-page");
    root.append(header("THE LITTLE THINGS / 04", data.title, data.subtitle));
    const track = el("div", "facts-track");
    track.tabIndex = 0;
    track.setAttribute("aria-label", "좌우로 넘기는 카드뉴스");
    data.cards.forEach((card, index) => {
      const slide = el("article", "fact-slide");
      slide.setAttribute("aria-label", `${index + 1} / ${data.cards.length}: ${card.title}`);
      slide.append(image(card.image, card.title));
      const copy = el("div", "fact-copy");
      copy.append(el("span", "content-kicker", `NOTE ${String(index + 1).padStart(2, "0")}`), el("h2", "fact-title", card.title), el("p", "fact-text", card.text));
      if (card.source) {
        const link = el("a", "source-link", card.source.title);
        link.href = card.source.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        copy.append(link);
      }
      slide.append(copy);
      track.append(slide);
    });
    const controls = el("div", "facts-controls");
    const dots = el("div", "fact-dots");
    const count = el("span", "fact-count");
    function move(index) {
      index = Math.max(0, Math.min(data.cards.length - 1, index));
      track.scrollTo({ left: track.clientWidth * index, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
    const prev = button("←", "round-button", () => move(activeFact - 1));
    prev.setAttribute("aria-label", "이전 카드");
    const next = button("→", "round-button", () => move(activeFact + 1));
    next.setAttribute("aria-label", "다음 카드");
    data.cards.forEach((_, index) => {
      const dot = button("", "fact-dot", () => move(index));
      dot.setAttribute("aria-label", `${index + 1}번 카드로 이동`);
      dots.append(dot);
    });
    function update() {
      activeFact = Math.max(0, Math.min(data.cards.length - 1, Math.round(track.scrollLeft / (track.clientWidth || 1))));
      [...dots.children].forEach((dot, index) => {
        dot.classList.toggle("active", index === activeFact);
        dot.setAttribute("aria-current", index === activeFact ? "true" : "false");
      });
      prev.disabled = activeFact === 0;
      next.disabled = activeFact === data.cards.length - 1;
      count.textContent = `${activeFact + 1} / ${data.cards.length}`;
    }
    let drag = null;
    track.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0 || event.target.closest("a, button")) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, index: activeFact, left: track.scrollLeft, moved: false };
    });
    track.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.moved) {
        if (Math.abs(dx) < 8 || Math.abs(dx) <= Math.abs(dy)) return;
        drag.moved = true;
        track.setPointerCapture(event.pointerId);
        track.classList.add("is-dragging");
      }
      event.preventDefault();
      track.scrollLeft = drag.left - dx;
    });
    function finishDrag(event, cancelled = false) {
      if (!drag || event.pointerId !== drag.id) return;
      const previous = drag;
      drag = null;
      track.classList.remove("is-dragging");
      if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
      if (!previous.moved) return;
      const dx = event.clientX - previous.x;
      const step = !cancelled && Math.abs(dx) >= Math.max(30, track.clientWidth * 0.12) ? (dx < 0 ? 1 : -1) : 0;
      move(previous.index + step);
    }
    track.addEventListener("pointerup", (event) => finishDrag(event));
    track.addEventListener("pointercancel", (event) => finishDrag(event, true));
    track.addEventListener("dragstart", (event) => event.preventDefault());
    track.addEventListener("scroll", update, { passive: true });
    track.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        move(activeFact + (event.key === "ArrowRight" ? 1 : -1));
      }
    });
    controls.append(prev, dots, next);
    const bottom = footer();
    bottom.append(count, el("span", "swipe-hint", "좌우로 드래그 ↔"));
    root.append(track, controls, bottom);
    update();
  }

  function quizHeader(root) {
    const data = content.quiz;
    const head = el("header", "quiz-header");
    const brand = el("div", "quiz-brand");
    brand.append(el("span", "content-kicker", "QUIZ / 05"), el("p", "quiz-heading", data.title));
    head.append(brand, button("QUIT ×", "text-button quiz-quit", goHome));
    root.append(head);
    const progress = el("div", "quiz-progress");
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-label", "퀴즈 진행도");
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", String(data.questions.length));
    progress.setAttribute("aria-valuenow", String(quiz.state.index + 1));
    const fill = el("span");
    fill.style.width = `${(quiz.state.index + 1) / data.questions.length * 100}%`;
    progress.append(fill);
    root.append(progress);
  }
  function renderQuestion() {
    const data = content.quiz;
    if (!data.questions.length) {
      const root = page("quiz-page");
      root.append(header("QUIZ / 05", data.title, "아직 등록된 문제가 없습니다."), footer());
      return;
    }
    quiz.state.view = "questions";
    const root = page("quiz-page");
    quizHeader(root);
    const body = el("div", "quiz-body");
    const index = quiz.state.index;
    const question = data.questions[index];
    body.append(el("div", "quiz-count", `QUESTION ${String(index + 1).padStart(2, "0")} / ${String(data.questions.length).padStart(2, "0")}`));
    const heading = el("h1", "question-title", question.question);
    heading.tabIndex = -1;
    body.append(heading);
    const options = el("div", "quiz-options");
    options.setAttribute("role", "group");
    options.setAttribute("aria-label", "답안 선택");
    const bottom = el("footer", "content-footer quiz-footer");
    const previous = button("← BACK", "text-button", () => { quiz.previous(); renderQuestion(); focusTitle(); });
    previous.disabled = index === 0;
    const next = button(index === data.questions.length - 1 ? "RESULT →" : "NEXT →", "primary-button", () => {
      if (!quiz.next()) return;
      if (quiz.state.view === "result") renderResult();
      else renderQuestion();
      focusTitle();
    });
    next.disabled = quiz.state.answers[index] === null;
    question.options.forEach((option, optionIndex) => {
      const choice = button("", "quiz-option", () => {
        quiz.select(optionIndex);
        [...options.children].forEach((node, i) => {
          node.classList.toggle("selected", i === optionIndex);
          node.setAttribute("aria-pressed", String(i === optionIndex));
        });
        next.disabled = false;
        announce(`${String.fromCharCode(65 + optionIndex)}번 답안 선택`);
      });
      choice.append(el("span", "option-letter", String.fromCharCode(65 + optionIndex)), el("span", "option-text", option), el("span", "option-check", "✓"));
      const selected = quiz.state.answers[index] === optionIndex;
      choice.classList.toggle("selected", selected);
      choice.setAttribute("aria-pressed", String(selected));
      options.append(choice);
    });
    body.append(options);
    bottom.append(previous, next);
    root.append(body, bottom);
  }
  function renderResult() {
    quiz.state.view = "result";
    const result = quiz.result();
    const root = page("result-page");
    const body = el("div", "result-body");
    body.append(el("span", "content-kicker", "YOUR LITTLE DISCOVERY"));
    const grade = el("h1", "result-grade", result.grade);
    grade.tabIndex = -1;
    body.append(grade, image(result.image, `${result.grade} 등급 이미지`, "grade-image"), el("p", "result-score", `${result.correct} / ${result.total} · ${result.percent}점`), el("h2", "result-title", result.title), el("p", "result-text", result.text));
    const bottom = footer();
    bottom.append(button("ANSWER →", "primary-button", () => { renderAnswers(); focusTitle(); }));
    root.append(body, bottom);
    announce(`${result.grade} 등급, ${result.total}문제 중 ${result.correct}문제 정답`);
  }
  function renderAnswers() {
    quiz.state.view = "answers";
    const root = page("answers-page");
    root.append(header("QUIZ NOTES", "정답과 해설", "선택한 답과 함께 다시 살펴보세요."));
    const scroll = el("div", "answers-scroll");
    scroll.tabIndex = 0;
    content.quiz.questions.forEach((question, index) => {
      const correct = quiz.state.answers[index] === question.answer;
      const article = el("article", `answer-card ${correct ? "correct" : "incorrect"}`);
      article.append(el("span", "answer-state", `Q${index + 1} · ${correct ? "정답" : "다시 보기"}`), el("h2", "answer-question", question.question));
      article.append(el("p", "answer-picked", `나의 답: ${question.options[quiz.state.answers[index]] ?? "선택하지 않음"}`));
      article.append(el("p", "answer-correct", `정답: ${question.options[question.answer]}`), el("p", "answer-explanation", question.explanation));
      scroll.append(article);
    });
    root.append(scroll, footer(() => { renderResult(); focusTitle(); }));
  }
  function back() {
    if (section === 5 && quiz?.state.view === "answers") { renderResult(); focusTitle(); }
    else if (section === 5 && quiz?.state.view === "questions" && quiz.state.index > 0) { quiz.previous(); renderQuestion(); focusTitle(); }
    else goHome?.();
  }
  function title(number) {
    if (number <= 3) return content.albums.find((a) => a.id === number)?.title || `섹션 ${number}`;
    return number === 4 ? content.facts.title : content.quiz.title;
  }
  async function open(number, container, onHome) {
    const ticket = ++opening;
    mount = container;
    goHome = onHome;
    section = number;
    mount.replaceChildren(el("p", "empty-content", ""));
    await ready;
    if (ticket !== opening) return;
    if (number <= 3) renderAlbum(content.albums.find((a) => a.id === number));
    else if (number === 4) renderFacts();
    else {
      quiz = ContentModel.createQuiz(content.quiz);
      renderQuestion();
    }
    focusTitle();
  }
  window.CONTENT_APP = { open, title, back };
})();
