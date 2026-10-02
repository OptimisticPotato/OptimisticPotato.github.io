(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ContentModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  function assert(condition, message) { if (!condition) throw new Error(message); }
  function string(value, name) { assert(typeof value === "string", `${name}: 문자열이 필요합니다.`); }
  function cards(items, name) {
    assert(Array.isArray(items), `${name}: 배열이 필요합니다.`);
    items.forEach((card, i) => {
      ["title", "text", "image"].forEach((key) => string(card[key], `${name}[${i}].${key}`));
      if (card.source) {
        string(card.source.title, "source.title");
        assert(/^https?:\/\//.test(card.source.url), "출처는 http(s) 링크여야 합니다.");
      }
    });
  }
  function validate(data) {
    assert(Array.isArray(data.albums) && data.albums.length === 3, "사진첩은 1~3번 세 섹션입니다.");
    [1, 2, 3].forEach((id) => {
      const album = data.albums.find((a) => a.id === id);
      assert(album, `${id}번 섹션이 필요합니다.`);
      string(album.title, "album.title");
      assert(["stack", "journal", "night"].includes(album.theme), "알 수 없는 사진첩 테마입니다.");
      cards(album.cards, `section${id}.cards`);
    });
    assert(data.facts?.id === 4 && data.quiz?.id === 5, "4번은 카드뉴스, 5번은 퀴즈입니다.");
    string(data.facts.title, "facts.title");
    cards(data.facts.cards, "facts.cards");
    assert(data.facts.cards.length > 0, "카드뉴스는 최소 1장이 필요합니다.");
    string(data.quiz.title, "quiz.title");
    assert(Array.isArray(data.quiz.questions), "문항 배열이 필요합니다.");
    data.quiz.questions.forEach((q, i) => {
      string(q.question, `questions[${i}].question`);
      assert(Array.isArray(q.options) && q.options.length >= 2, "보기는 최소 2개가 필요합니다.");
      q.options.forEach((option) => string(option, "option"));
      assert(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, `${q.id || `questions[${i}]`}: 정답 answer는 0~${q.options.length - 1} 범위여야 합니다. 첫 번째 보기=0, 마지막 보기=${q.options.length - 1} (현재 값: ${q.answer}).`);
      string(q.explanation, "explanation");
    });
    assert(Array.isArray(data.quiz.grades), "등급 배열이 필요합니다.");
    ["A", "B", "C", "D", "F"].forEach((letter) => {
      const grade = data.quiz.grades.find((g) => g.grade === letter);
      assert(grade && Number.isFinite(grade.minPercent) && grade.minPercent >= 0 && grade.minPercent <= 100, `${letter} 등급 설정이 필요합니다.`);
      ["image", "title", "text"].forEach((key) => string(grade[key], `grade.${key}`));
    });
    assert(data.quiz.grades.some((g) => g.minPercent === 0), "0점 등급이 필요합니다.");
    return data;
  }
  function createQuiz(quiz) {
    const state = { index: 0, answers: new Array(quiz.questions.length).fill(null), view: "questions" };
    function select(option) {
      const question = quiz.questions[state.index];
      if (question && Number.isInteger(option) && option >= 0 && option < question.options.length) state.answers[state.index] = option;
    }
    function next() {
      if (state.answers[state.index] === null || !quiz.questions.length) return false;
      if (state.index < quiz.questions.length - 1) state.index += 1;
      else state.view = "result";
      return true;
    }
    function previous() { if (state.index > 0) state.index -= 1; }
    function result() {
      const correct = quiz.questions.reduce((sum, q, i) => sum + Number(state.answers[i] === q.answer), 0);
      const percent = quiz.questions.length ? Math.round(correct / quiz.questions.length * 100) : 0;
      const grade = [...quiz.grades].sort((a, b) => b.minPercent - a.minPercent).find((g) => percent >= g.minPercent);
      return { correct, total: quiz.questions.length, percent, ...grade };
    }
    return { state, select, next, previous, result };
  }
  return { validate, createQuiz };
});
