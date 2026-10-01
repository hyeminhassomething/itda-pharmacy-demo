(function () {
  "use strict";

  const DESIGN_WIDTH = 1600;
  const DESIGN_HEIGHT = 900;
  const MOBILE_BREAKPOINT = 760;

  const dom = {
    presentation: document.getElementById("presentation"),
    viewport: document.getElementById("viewport"),
    stageWrap: document.getElementById("stage-wrap"),
    stage: document.getElementById("stage"),
    title: document.getElementById("deck-title"),
    position: document.getElementById("slide-position"),
    elapsed: document.getElementById("time-display"),
    progress: document.getElementById("progress-bar"),
    timeProgress: document.getElementById("time-bar"),
    prev: document.getElementById("prev-button"),
    next: document.getElementById("next-button"),
    play: document.getElementById("play-button"),
    fullscreen: document.getElementById("fullscreen-button"),
    tocButton: document.getElementById("toc-button"),
    notesButton: document.getElementById("notes-button"),
    tocOverlay: document.getElementById("toc-overlay"),
    notesOverlay: document.getElementById("notes-overlay"),
    tocList: document.getElementById("toc-list"),
    notesTitle: document.getElementById("notes-title"),
    notesScript: document.getElementById("notes-script"),
    notesCue: document.getElementById("notes-cue"),
    notesCorrection: document.getElementById("notes-correction"),
    sourceList: document.getElementById("source-list")
  };

  const state = {
    deck: null,
    index: 0,
    playing: false,
    slideElapsed: 0,
    lastFrame: 0,
    raf: 0,
    demoStep: 0,
    demoTimer: 0,
    modalReturnFocus: null,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
  };

  function element(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined && text !== null) item.textContent = String(text);
    return item;
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function cleanText(value, fallback) {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  function finiteNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function formatClock(seconds) {
    const safe = Math.max(0, Math.floor(finiteNumber(seconds, 0)));
    const minutes = Math.floor(safe / 60);
    const remainder = safe % 60;
    return String(minutes).padStart(2, "0") + ":" + String(remainder).padStart(2, "0");
  }

  function titleWithAccent(title) {
    const wrapper = element("span");
    const lines = cleanText(title, "제목 없음").split("\n");
    lines.forEach((line, index) => {
      const text = element("span", index === lines.length - 1 && lines.length > 1 ? "accent" : "", line);
      wrapper.appendChild(text);
      if (index < lines.length - 1) wrapper.appendChild(document.createElement("br"));
    });
    return wrapper;
  }

  function addReveal(item, index) {
    item.classList.add("reveal");
    item.style.setProperty("--reveal-index", String(index));
    return item;
  }

  function appendPoints(container, points, className) {
    const list = element("ul", className || "body-points");
    safeArray(points).forEach((point, index) => {
      list.appendChild(addReveal(element("li", "", point), index));
    });
    container.appendChild(list);
    return list;
  }

  function splitLabel(value) {
    const text = cleanText(value, "");
    const colon = text.indexOf(":");
    if (colon < 0) return ["항목", text];
    return [text.slice(0, colon).trim(), text.slice(colon + 1).trim()];
  }

  function validateDeck(candidate) {
    if (!candidate || typeof candidate !== "object") throw new Error("발표 데이터 형식이 올바르지 않습니다.");
    if (!Array.isArray(candidate.slides) || candidate.slides.length !== 11) {
      throw new Error("표지를 포함한 11장의 슬라이드가 필요합니다.");
    }
    const ids = new Set();
    candidate.slides.forEach((slide, index) => {
      if (!slide || typeof slide !== "object") throw new Error(`${index + 1}번 슬라이드 데이터가 없습니다.`);
      const id = cleanText(slide.id, "");
      if (!id || ids.has(id)) throw new Error(`슬라이드 id가 없거나 중복됩니다: ${index + 1}`);
      ids.add(id);
      if (!cleanText(slide.title, "")) throw new Error(`${id} 슬라이드 제목이 없습니다.`);
      if (finiteNumber(slide.duration, -1) <= 0) throw new Error(`${id} 슬라이드 시간이 올바르지 않습니다.`);
    });
    return candidate;
  }

  async function readDeckData() {
    const holder = document.getElementById("slide-data");
    const raw = holder ? holder.textContent.trim() : "";
    if (raw && raw !== "__SLIDES_JSON__") return validateDeck(JSON.parse(raw));

    const response = await fetch("slides.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`slides.json을 불러오지 못했습니다. (${response.status})`);
    return validateDeck(await response.json());
  }

  function commonHeader(slide) {
    const top = element("div", "slide-topline");
    const kicker = element("div", "slide-kicker");
    kicker.appendChild(element("span", "number", slide.number || ""));
    kicker.appendChild(element("span", "", slide.kicker || ""));
    top.appendChild(kicker);
    const sources = safeArray(slide.sourceRefs);
    top.appendChild(element("div", "source-count", sources.length ? `근거 ${sources.length}건` : "내부 설명"));
    return top;
  }

  function commonFooter(index) {
    const footer = element("footer", "slide-footer");
    footer.appendChild(element("span", "", `${state.deck.team || "[CODE] 테러범"} · ITDA 본선`));
    footer.appendChild(element("span", "page-index", `${String(index).padStart(2, "0")} / 10`));
    return footer;
  }

  function renderCover(slide, index) {
    const article = element("article", "slide layout-cover");
    const grid = element("div", "cover-grid");
    const copy = element("div", "cover-copy");
    copy.appendChild(addReveal(element("div", "slide-kicker", slide.kicker), 0));
    const title = element("h1", "slide-title");
    title.appendChild(titleWithAccent(slide.title));
    copy.appendChild(addReveal(title, 1));

    const lines = element("div", "cover-lines");
    safeArray(slide.body).forEach((line, lineIndex) => lines.appendChild(addReveal(element("div", "", line), lineIndex + 2)));
    copy.appendChild(lines);

    const meta = element("div", "cover-meta");
    meta.appendChild(element("strong", "", state.deck.team || "[CODE] 테러범"));
    meta.appendChild(element("span", "", state.deck.date || ""));
    copy.appendChild(addReveal(meta, 4));

    const visual = element("div", "question-visual");
    const panel = element("div", "question-panel");
    panel.appendChild(element("div", "eyebrow", "가상 도입 질문"));
    panel.appendChild(element("div", "big-number", "4"));
    panel.appendChild(element("div", "question", slide.visual && slide.visual.question));
    panel.appendChild(element("div", "caption", slide.visual && slide.visual.caption));
    visual.appendChild(addReveal(panel, 2));

    grid.append(copy, visual);
    article.appendChild(grid);
    article.appendChild(commonFooter(index));
    return article;
  }

  function renderProblem(slide) {
    const root = element("div", "problem-grid");
    const points = element("div", "problem-points");
    appendPoints(points, slide.body);
    root.appendChild(points);

    const visual = element("div", "comparison-visual");
    const columns = safeArray(slide.visual && slide.visual.columns);
    columns.forEach((column, index) => {
      const block = addReveal(element("section", "comparison-column"), index + 1);
      block.appendChild(element("h3", "", column.label));
      const list = element("ul");
      safeArray(column.items).forEach((item) => list.appendChild(element("li", "", item)));
      block.appendChild(list);
      visual.appendChild(block);
      if (index === 0) visual.appendChild(element("div", "comparison-gap", "↔"));
    });
    visual.appendChild(element("p", "caption", slide.visual && slide.visual.caption));
    root.appendChild(visual);
    return root;
  }

  function renderStakes(slide) {
    const root = element("div", "stakes-layout");
    const words = element("div", "stakes-words");
    safeArray(slide.body).forEach((point, index) => {
      const item = addReveal(element("div", "stakes-word"), index);
      item.appendChild(element("span", "ordinal", `0${index + 1}`));
      item.appendChild(element("strong", "", point));
      words.appendChild(item);
    });
    root.appendChild(words);

    const sequence = element("div", "sequence-line");
    safeArray(slide.visual && slide.visual.items).forEach((item, index) => {
      sequence.appendChild(addReveal(element("div", "sequence-item", item), index + 2));
    });
    sequence.appendChild(element("div", "sequence-caption", slide.visual && slide.visual.caption));
    root.appendChild(sequence);
    return root;
  }

  function renderPosition(slide) {
    const root = element("div", "boundary-layout");
    const line = element("div", "boundary-line");
    const blocks = [
      ["기존 기록", slide.visual && slide.visual.left, ""],
      ["보완 구간", slide.visual && slide.visual.middle, "middle"],
      ["후속 업무", slide.visual && slide.visual.right, ""]
    ];
    blocks.forEach((entry, index) => {
      const block = addReveal(element("div", `boundary-block ${entry[2]}`.trim()), index);
      block.appendChild(element("span", "label", entry[0]));
      block.appendChild(element("strong", "", entry[1]));
      line.appendChild(block);
    });
    root.appendChild(line);

    const notes = element("div", "boundary-notes");
    safeArray(slide.body).forEach((point, index) => notes.appendChild(addReveal(element("p", "", point), index + 2)));
    const caption = element("p", "caption", slide.visual && slide.visual.caption);
    notes.appendChild(caption);
    root.appendChild(notes);
    return root;
  }

  function renderFlow(slide) {
    const root = element("div", "flow-layout");
    const track = element("div", "workflow-track");
    safeArray(slide.visual && slide.visual.steps).forEach((step, index) => {
      const item = addReveal(element("div", "workflow-step"), index);
      item.appendChild(element("span", "node", String(index + 1).padStart(2, "0")));
      item.appendChild(element("strong", "", step));
      track.appendChild(item);
    });
    root.appendChild(track);

    const lower = element("div", "flow-lower");
    const record = addReveal(element("section", "record-sheet"), 2);
    record.appendChild(element("div", "eyebrow", "확인 기록의 구성"));
    safeArray(slide.visual && slide.visual.fields).forEach((field) => {
      const pair = splitLabel(field);
      const row = element("div", "record-field");
      row.append(element("span", "", pair[0]), element("strong", "", pair[1]));
      record.appendChild(row);
    });
    lower.appendChild(record);

    const reuse = element("section", "reuse-list");
    safeArray(slide.body).forEach((point, index) => {
      const item = addReveal(element("div", "reuse-item", point), index + 3);
      item.dataset.index = String(index + 1).padStart(2, "0");
      reuse.appendChild(item);
    });
    reuse.appendChild(element("div", "flow-caption", slide.visual && slide.visual.caption));
    lower.appendChild(reuse);
    root.appendChild(lower);
    return root;
  }

  function renderOcr(slide) {
    const root = element("div", "ocr-layout");
    const table = element("div", "parser-table");
    const header = element("div", "parser-row header");
    ["읽힌 문자열", "보존·정규화", "판정 근거"].forEach((text) => header.appendChild(element("span", "", text)));
    table.appendChild(header);
    safeArray(slide.visual && slide.visual.rows).forEach((row, index) => {
      const line = addReveal(element("div", "parser-row"), index);
      line.appendChild(element("code", "", row[0]));
      line.appendChild(element("span", "normalized", row[1]));
      line.appendChild(element("span", "reason", row[2]));
      table.appendChild(line);
    });
    root.appendChild(table);

    const gate = element("aside", "meaning-gate");
    const upper = element("div");
    upper.appendChild(element("div", "eyebrow", "의미 판정"));
    upper.appendChild(element("div", "gate-title", "같은 숫자라도 역할어와 날짜 완전성이 다릅니다"));
    const list = element("div", "gate-list");
    safeArray(slide.body).forEach((point, index) => list.appendChild(addReveal(element("div", "gate-item", point), index + 1)));
    upper.appendChild(list);
    gate.appendChild(upper);
    gate.appendChild(element("div", "partial-date", slide.visual && slide.visual.caption));
    root.appendChild(gate);
    return root;
  }

  function renderStrategy(slide) {
    const root = element("div", "strategy-layout");
    const visual = slide.visual || {};
    const branch = element("div", "branch-diagram");
    const nodes = [
      ["base", visual.base, "경량 검출·인식과 규칙 후처리"],
      ["decision", visual.decision, "충분하지 않으면 보완 경로"],
      ["accept", visual.accept, "기본 경로에서 종료"],
      ["rescue", visual.rescue, "필요한 영역에만 추가 연산"]
    ];
    nodes.forEach((entry, index) => {
      const node = addReveal(element("div", `branch-node ${entry[0]}`), index);
      node.appendChild(element("strong", "", entry[1]));
      node.appendChild(element("span", "", entry[2]));
      branch.appendChild(node);
    });
    branch.appendChild(element("span", "branch-arrow one", "›"));
    branch.appendChild(element("span", "branch-arrow two", "›"));
    branch.appendChild(element("span", "branch-arrow three", "›"));
    root.appendChild(branch);

    const scope = element("aside", "measurement-scope");
    scope.appendChild(element("h3", "", "측정 범위를 분리합니다"));
    safeArray(slide.body).forEach((point, index) => {
      const row = addReveal(element("div", "measurement-row"), index + 1);
      const pair = splitLabel(point);
      row.appendChild(element("strong", "", pair[0]));
      row.appendChild(element("span", "", pair[1] || point));
      scope.appendChild(row);
    });
    scope.appendChild(element("p", "caption", visual.caption));
    root.appendChild(scope);
    return root;
  }

  function renderRecall(slide) {
    const root = element("div", "recall-layout");
    const visual = slide.visual || {};
    const summary = addReveal(element("section", "range-summary"), 0);
    summary.appendChild(element("div", "eyebrow", "가상 수량 예시"));
    summary.appendChild(element("div", "inputs", `X 입고 ${visual.x}개 · Y 입고 ${visual.y}개 · 현재 총재고 ${visual.stock}개`));
    const range = element("div", "range-number");
    range.appendChild(document.createTextNode(`${visual.min}–${visual.max}`));
    range.appendChild(element("small", "", "개"));
    summary.appendChild(range);
    summary.appendChild(element("code", "", `최소 max(0, ${visual.stock} - ${visual.y}) = ${visual.min}\n최대 min(${visual.x}, ${visual.stock}) = ${visual.max}`));
    root.appendChild(summary);

    const plot = element("section", "range-plot");
    plot.appendChild(element("div", "eyebrow", "X의 가능한 잔여 수량"));
    const axis = element("div", "range-axis");
    axis.appendChild(element("div", "baseline"));
    const active = element("div", "active-range");
    const maximum = Math.max(1, finiteNumber(visual.x, 4));
    active.style.left = `${finiteNumber(visual.min, 0) / maximum * 100}%`;
    active.style.width = `${(finiteNumber(visual.max, maximum) - finiteNumber(visual.min, 0)) / maximum * 100}%`;
    axis.appendChild(active);
    for (let tick = 0; tick <= maximum; tick += 1) {
      const marker = element("span", "range-tick", tick);
      marker.style.left = `${tick / maximum * 100}%`;
      axis.appendChild(marker);
    }
    const minMarker = element("span", "range-marker", `최소 ${visual.min}`);
    minMarker.style.left = `${finiteNumber(visual.min, 0) / maximum * 100}%`;
    const maxMarker = element("span", "range-marker", `최대 ${visual.max}`);
    maxMarker.style.left = `${finiteNumber(visual.max, maximum) / maximum * 100}%`;
    axis.append(minMarker, maxMarker);
    plot.appendChild(axis);

    const assumptions = element("div", "range-assumptions");
    safeArray(slide.body).forEach((point, index) => assumptions.appendChild(addReveal(element("div", "range-assumption", point), index + 1)));
    plot.appendChild(assumptions);
    plot.appendChild(element("p", "caption", visual.caption));
    root.appendChild(plot);
    return root;
  }

  function renderReturns(slide) {
    const root = element("div", "returns-layout");
    const visual = slide.visual || {};
    const timeline = addReveal(element("section", "window-timeline"), 0);
    const head = element("div", "window-head");
    head.appendChild(element("strong", "", visual.rule));
    head.appendChild(element("span", "", `사용기한 ${visual.expiry}`));
    timeline.appendChild(head);
    const line = element("div", "window-line");
    line.appendChild(element("div", "window-active"));
    line.appendChild(element("span", "window-now", `기준일 ${visual.asOf}`));
    line.appendChild(element("span", "window-open", `접수 시작 ${visual.opens}`));
    line.appendChild(element("span", "window-expiry", `만료 ${visual.expiry}`));
    timeline.appendChild(line);
    root.appendChild(timeline);

    const lower = element("div", "returns-lower");
    const states = element("section", "return-states");
    const stateItems = [
      ["현재 상태", visual.state || "조건 확인", ""],
      ["계산 입력", safeArray(slide.body)[0] || "기한·거래·규칙·기준일", ""],
      ["보류 기준", safeArray(slide.body)[1] || "조건 미확인 또는 충돌", "hold"],
      ["최종 결정", "담당자 검토", "hold"]
    ];
    stateItems.forEach((entry, index) => {
      const item = addReveal(element("div", `return-state ${entry[2]}`.trim()), index + 1);
      item.appendChild(element("strong", "", entry[0]));
      item.appendChild(element("code", "", entry[1]));
      states.appendChild(item);
    });
    lower.appendChild(states);

    const limit = addReveal(element("section", "comparison-limit"), 3);
    limit.appendChild(element("h3", "", "반품과 판매 유지의 조건부 비교"));
    limit.appendChild(element("p", "", safeArray(slide.body)[2] || "확인된 금액만 비교합니다."));
    limit.appendChild(element("div", "caption", visual.comparison));
    limit.appendChild(element("div", "caption", visual.caption));
    lower.appendChild(limit);
    root.appendChild(lower);
    return root;
  }

  function demoField(label, value) {
    const field = element("div", "fake-field");
    field.appendChild(element("span", "", label));
    field.appendChild(element("strong", "", value));
    return field;
  }

  function buildDemoPane(slide, paneIndex) {
    const visual = slide.visual || {};
    const pane = element("section", "demo-pane");
    pane.dataset.demoPane = String(paneIndex);

    if (paneIndex === 0) {
      const raw = element("div", "raw-snippet");
      raw.appendChild(element("small", "", "고정된 가상 원문 · OCR 실행 아님"));
      raw.appendChild(document.createTextNode(`EXP ${visual.expiry || "-"}\nLOT ${visual.lot || "-"}`));
      pane.appendChild(raw);
    } else if (paneIndex === 1) {
      const fields = element("div", "confirmation-grid");
      fields.appendChild(demoField("품목", visual.product));
      fields.appendChild(demoField("사용기한", visual.expiry));
      fields.appendChild(demoField("제조번호", visual.lot));
      fields.appendChild(demoField("선택한 입고 건", visual.transaction));
      fields.appendChild(element("div", "confirmation-note", "원문·품목·입고 건을 사람이 확인한 가상 상태"));
      pane.appendChild(fields);
    } else if (paneIndex === 2) {
      const saved = element("div", "saved-record");
      saved.appendChild(element("h3", "", "입고 기록 연결 · 시연"));
      const list = element("dl");
      const rows = [
        ["거래", visual.transaction],
        ["매입처", visual.supplier],
        ["확인 수량", `${visual.qty}개`],
        ["기한·LOT", `${visual.expiry} · ${visual.lot}`],
        ["정책", "값 수정 시 이후 판단 무효화"]
      ];
      rows.forEach((row) => {
        list.append(element("dt", "", row[0]), element("dd", "", row[1]));
      });
      saved.appendChild(list);
      pane.appendChild(saved);
    } else {
      const pair = element("div", "result-pair");
      const ready = element("div", "result-box");
      ready.appendChild(element("div", "code", "NOT_OPEN_YET"));
      ready.appendChild(element("strong", "", "접수 전"));
      ready.appendChild(element("p", "", `기준일 ${visual.asOf} · 가상 접수 시작 ${visual.opens}`));
      const hold = element("div", "result-box hold");
      hold.appendChild(element("div", "code", "HOLD · NEEDS_DATA"));
      hold.appendChild(element("strong", "", "정보 누락은 보류"));
      hold.appendChild(element("p", "", "제조번호 또는 연결 거래가 없으면 상태를 추정하지 않습니다."));
      pair.append(ready, hold);
      pane.appendChild(pair);
    }
    return pane;
  }

  function renderDemo(slide) {
    const wrapper = element("div");
    const visual = slide.visual || {};
    const ribbon = element("div", "demo-ribbon");
    ribbon.appendChild(element("span", "", visual.disclaimer));
    ribbon.appendChild(element("span", "status-tag yellow", "SYNTHETIC DEMO"));
    wrapper.appendChild(ribbon);

    const layout = element("div", "demo-layout");
    const steps = element("div", "demo-steps");
    steps.setAttribute("role", "list");
    steps.setAttribute("aria-label", "가상 연결 시연 단계");
    safeArray(visual.steps).forEach((step, index) => {
      const row = element("div", "demo-step");
      row.dataset.demoStep = String(index);
      row.setAttribute("role", "listitem");
      row.appendChild(element("span", "step-number", String(index + 1).padStart(2, "0")));
      row.appendChild(element("strong", "", step));
      steps.appendChild(row);
    });
    layout.appendChild(steps);

    const right = element("div");
    const workbench = element("section", "demo-workbench");
    const head = element("div", "workbench-head");
    head.appendChild(element("span", "", "연결 흐름 · 설명용 화면"));
    head.appendChild(element("span", "", "실제 전산 저장 없음"));
    const live = element("span", "demo-live");
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    live.setAttribute("aria-atomic", "true");
    live.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0";
    head.appendChild(live);
    workbench.appendChild(head);
    for (let index = 0; index < 4; index += 1) workbench.appendChild(buildDemoPane(slide, index));
    right.appendChild(workbench);

    const controls = element("div", "demo-controls");
    const previous = element("button", "demo-control", "이전 단계");
    previous.type = "button";
    previous.dataset.demoAction = "previous";
    const play = element("button", "demo-control primary", "단계 재생");
    play.type = "button";
    play.dataset.demoAction = "play";
    const next = element("button", "demo-control", "다음 단계");
    next.type = "button";
    next.dataset.demoAction = "next";
    controls.append(previous, play, next);
    right.appendChild(controls);
    layout.appendChild(right);
    wrapper.appendChild(layout);
    requestAnimationFrame(updateDemoView);
    return wrapper;
  }

  function renderClosing(slide) {
    const root = element("div", "closing-layout");
    const points = element("div", "closing-points");
    appendPoints(points, slide.body);
    root.appendChild(points);

    const question = addReveal(element("section", "closing-question"), 1);
    question.appendChild(element("div", "eyebrow", "처음 질문으로"));
    question.appendChild(element("div", "question", slide.visual && slide.visual.question));
    question.appendChild(element("div", "caption", slide.visual && slide.visual.caption));
    root.appendChild(question);
    return root;
  }

  const layoutRenderers = {
    problem: renderProblem,
    stakes: renderStakes,
    position: renderPosition,
    flow: renderFlow,
    ocr: renderOcr,
    strategy: renderStrategy,
    recall: renderRecall,
    returns: renderReturns,
    demo: renderDemo,
    ending: renderClosing
  };

  function renderStandard(slide, index) {
    const article = element("article", `slide layout-${slide.layout || "default"}`);
    article.appendChild(commonHeader(slide));
    const title = element("h1", "slide-title");
    title.appendChild(titleWithAccent(slide.title));
    article.appendChild(addReveal(title, 0));

    const body = element("div", "slide-body");
    const renderer = layoutRenderers[slide.layout];
    if (renderer) body.appendChild(renderer(slide));
    else appendPoints(body, slide.body);
    article.appendChild(body);
    article.appendChild(commonFooter(index));
    return article;
  }

  function renderSlide() {
    const slide = state.deck.slides[state.index];
    state.demoStep = 0;
    clearTimeout(state.demoTimer);
    const article = slide.layout === "cover" ? renderCover(slide, state.index) : renderStandard(slide, state.index);
    article.setAttribute("role", "group");
    article.setAttribute("aria-roledescription", "슬라이드");
    article.setAttribute("aria-label", `${state.index + 1} / ${state.deck.slides.length}: ${slide.title.replace(/\n/g, " ")}`);
    dom.stage.replaceChildren(article);
    requestAnimationFrame(() => article.classList.add("is-ready"));
    updateControls();
    updateNotes();
    updateTocCurrent();
    fitStage();
  }

  function updateDemoView() {
    const steps = dom.stage.querySelectorAll("[data-demo-step]");
    const panes = dom.stage.querySelectorAll("[data-demo-pane]");
    steps.forEach((item, index) => {
      item.classList.toggle("is-active", index === state.demoStep);
      item.classList.toggle("is-complete", index < state.demoStep);
      item.setAttribute("aria-current", index === state.demoStep ? "step" : "false");
    });
    panes.forEach((item, index) => {
      const active = index === state.demoStep;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-hidden", active ? "false" : "true");
    });
    const current = steps[state.demoStep];
    const live = dom.stage.querySelector(".demo-live");
    if (current && live) {
      const title = current.querySelector("strong");
      live.textContent = `시연 단계 ${state.demoStep + 1}/${steps.length}: ${title ? title.textContent : ""}`;
    }
    const previous = dom.stage.querySelector('[data-demo-action="previous"]');
    const next = dom.stage.querySelector('[data-demo-action="next"]');
    if (previous) previous.disabled = state.demoStep === 0;
    if (next) next.disabled = state.demoStep === Math.max(0, panes.length - 1);
  }

  function playDemoSequence() {
    clearTimeout(state.demoTimer);
    state.demoStep = 0;
    updateDemoView();
    const advance = () => {
      const lastStep = Math.max(0, dom.stage.querySelectorAll("[data-demo-step]").length - 1);
      if (state.demoStep >= lastStep || state.deck.slides[state.index].id !== "demo") return;
      state.demoStep += 1;
      updateDemoView();
      state.demoTimer = window.setTimeout(advance, state.reducedMotion ? 50 : 1350);
    };
    state.demoTimer = window.setTimeout(advance, state.reducedMotion ? 50 : 1350);
  }

  function slideSecondsBefore(index) {
    return state.deck.slides.slice(0, index).reduce((sum, slide) => sum + finiteNumber(slide.duration, 0), 0);
  }

  function totalDuration() {
    return state.deck.slides.reduce((sum, slide) => sum + finiteNumber(slide.duration, 0), 0);
  }

  function updateControls() {
    const count = state.deck.slides.length;
    const slide = state.deck.slides[state.index];
    const total = totalDuration();
    const absolute = slideSecondsBefore(state.index) + state.slideElapsed;
    dom.position.textContent = `${String(state.index + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
    dom.elapsed.textContent = `${formatClock(absolute)} / ${formatClock(total)}`;
    dom.progress.style.width = `${(state.index + 1) / count * 100}%`;
    dom.timeProgress.style.width = `${Math.min(100, absolute / Math.max(1, total) * 100)}%`;
    dom.prev.disabled = state.index === 0;
    dom.next.disabled = state.index === count - 1;
    dom.play.textContent = state.playing ? "일시정지" : "재생";
    dom.play.setAttribute("aria-pressed", state.playing ? "true" : "false");
    document.title = `${slide.number || String(state.index)} ${slide.title.replace(/\n/g, " ")} · ITDA`;
  }

  function updateNotes() {
    const slide = state.deck.slides[state.index];
    dom.notesTitle.textContent = `${slide.number} ${slide.title.replace(/\n/g, " ")}`;
    dom.notesScript.textContent = slide.script || "발표자 노트가 없습니다.";
    dom.notesCue.textContent = slide.cue ? `발표 큐 · ${slide.cue}` : "";
    dom.notesCue.hidden = !slide.cue;
    dom.notesCorrection.textContent = slide.screenCorrection ? `화면 정정 원칙 · ${slide.screenCorrection}` : "";
    dom.notesCorrection.hidden = !slide.screenCorrection;
    dom.sourceList.replaceChildren();
    safeArray(slide.sourceRefs).forEach((ref) => {
      const source = state.deck.sources && state.deck.sources[ref];
      if (!source) return;
      const item = element("li", "source-item");
      const url = cleanText(source.url, "");
      if (/^https:\/\//i.test(url)) {
        const link = element("a", "", source.title || ref);
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        item.appendChild(link);
      } else {
        item.appendChild(element("strong", "", source.title || ref));
      }
      item.appendChild(element("p", "", source.detail || ""));
      dom.sourceList.appendChild(item);
    });
  }

  function buildToc() {
    dom.tocList.replaceChildren();
    state.deck.slides.forEach((slide, index) => {
      const item = element("li");
      const button = element("button", "toc-button");
      button.type = "button";
      button.dataset.slideIndex = String(index);
      button.appendChild(element("span", "toc-number", slide.number));
      button.appendChild(element("span", "toc-title", slide.title.replace(/\n/g, " ")));
      button.appendChild(element("span", "toc-duration", `${slide.duration}초`));
      item.appendChild(button);
      dom.tocList.appendChild(item);
    });
  }

  function updateTocCurrent() {
    dom.tocList.querySelectorAll("[data-slide-index]").forEach((button) => {
      button.setAttribute("aria-current", Number(button.dataset.slideIndex) === state.index ? "page" : "false");
    });
  }

  function setHash(slide) {
    const hash = `#${encodeURIComponent(slide.id)}`;
    // Streamlit embeds the document as about:srcdoc, where history mutation
    // is prohibited. Navigation must still work without a deep-link URL.
    if (location.protocol === "about:") return;
    if (location.hash !== hash) {
      try { history.replaceState(null, "", hash); } catch (_) { /* optional URL sync */ }
    }
  }

  function goTo(index, options) {
    const config = Object.assign({ keepPlaying: false, updateHash: true }, options || {});
    const nextIndex = Math.max(0, Math.min(state.deck.slides.length - 1, Number(index)));
    if (!config.keepPlaying) pause();
    state.index = nextIndex;
    state.slideElapsed = 0;
    if (config.updateHash) setHash(state.deck.slides[state.index]);
    renderSlide();
  }

  function initialIndexFromHash() {
    let id = "";
    try { id = decodeURIComponent(location.hash.replace(/^#/, "")); } catch (_) { return 0; }
    if (!id) return 0;
    const index = state.deck.slides.findIndex((slide) => slide.id === id || slide.number === id);
    return index >= 0 ? index : 0;
  }

  function pause() {
    state.playing = false;
    state.lastFrame = 0;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = 0;
    updateControls();
  }

  function togglePlay() {
    if (state.playing) {
      pause();
      return;
    }
    if (state.index === state.deck.slides.length - 1 && state.slideElapsed >= state.deck.slides[state.index].duration) {
      goTo(0, { keepPlaying: true });
    }
    state.playing = true;
    state.lastFrame = performance.now();
    updateControls();
    state.raf = requestAnimationFrame(tick);
  }

  function tick(now) {
    if (!state.playing) return;
    const delta = Math.min(0.2, Math.max(0, (now - state.lastFrame) / 1000));
    state.lastFrame = now;
    state.slideElapsed += delta;
    const slide = state.deck.slides[state.index];

    if (slide.id === "demo") {
      const stepCount = Math.max(1, dom.stage.querySelectorAll("[data-demo-step]").length);
      const step = Math.min(stepCount - 1, Math.floor(state.slideElapsed / Math.max(1, slide.duration / stepCount)));
      if (step !== state.demoStep) {
        state.demoStep = step;
        updateDemoView();
      }
    }

    if (state.slideElapsed >= slide.duration) {
      const carry = state.slideElapsed - slide.duration;
      if (state.index >= state.deck.slides.length - 1) {
        state.slideElapsed = slide.duration;
        pause();
        return;
      }
      state.index += 1;
      state.slideElapsed = carry;
      setHash(state.deck.slides[state.index]);
      renderSlide();
    } else {
      updateControls();
    }
    state.raf = requestAnimationFrame(tick);
  }

  function fitStage() {
    if (!state.deck) return;
    const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
    document.body.classList.toggle("reader-mode", mobile);
    if (mobile) {
      dom.stage.style.transform = "none";
      dom.stageWrap.style.width = "100%";
      dom.stageWrap.style.height = "auto";
      return;
    }
    const availableWidth = Math.max(320, dom.viewport.clientWidth - 32);
    const availableHeight = Math.max(180, dom.viewport.clientHeight - 28);
    const scale = Math.min(availableWidth / DESIGN_WIDTH, availableHeight / DESIGN_HEIGHT);
    dom.stage.style.transform = `scale(${scale})`;
    dom.stageWrap.style.width = `${DESIGN_WIDTH * scale}px`;
    dom.stageWrap.style.height = `${DESIGN_HEIGHT * scale}px`;
  }

  function openOverlay(overlay) {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeOverlays(false);
    state.modalReturnFocus = opener;
    dom.presentation.inert = true;
    dom.presentation.setAttribute("aria-hidden", "true");
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    const focusable = overlay.querySelector("button, a[href]");
    if (focusable) focusable.focus();
  }

  function closeOverlays(restoreFocus = true) {
    [dom.tocOverlay, dom.notesOverlay].forEach((overlay) => {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
    });
    dom.presentation.inert = false;
    dom.presentation.removeAttribute("aria-hidden");
    if (restoreFocus && state.modalReturnFocus && state.modalReturnFocus.isConnected) {
      state.modalReturnFocus.focus();
    }
    if (restoreFocus) state.modalReturnFocus = null;
  }

  function isOverlayOpen() {
    return dom.tocOverlay.classList.contains("is-open") || dom.notesOverlay.classList.contains("is-open");
  }

  function currentOverlay() {
    if (dom.tocOverlay.classList.contains("is-open")) return dom.tocOverlay;
    if (dom.notesOverlay.classList.contains("is-open")) return dom.notesOverlay;
    return null;
  }

  function trapModalFocus(event) {
    const overlay = currentOverlay();
    if (!overlay || event.key !== "Tab") return false;
    const focusable = Array.from(overlay.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'))
      .filter((item) => !item.hasAttribute("hidden") && item.getAttribute("aria-hidden") !== "true");
    if (!focusable.length) {
      event.preventDefault();
      return true;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return true;
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
      return true;
    }
    return false;
  }

  function handleKeydown(event) {
    const target = event.target;
    if (event.key === "Escape") {
      event.preventDefault();
      if (isOverlayOpen()) closeOverlays();
      else if (document.fullscreenElement) document.exitFullscreen();
      return;
    }
    if (trapModalFocus(event)) return;
    if (isOverlayOpen()) return;
    if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    if (event.code === "Space" && target && /^(BUTTON|A)$/.test(target.tagName)) return;
    if (["ArrowRight", "PageDown"].includes(event.key)) {
      event.preventDefault();
      goTo(state.index + 1);
    } else if (["ArrowLeft", "PageUp"].includes(event.key)) {
      event.preventDefault();
      goTo(state.index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(state.deck.slides.length - 1);
    } else if (event.code === "Space" || event.key.toLowerCase() === "p") {
      event.preventDefault();
      togglePlay();
    } else if (event.key.toLowerCase() === "m") {
      event.preventDefault();
      openOverlay(dom.tocOverlay);
    } else if (event.key.toLowerCase() === "n") {
      event.preventDefault();
      openOverlay(dom.notesOverlay);
    }
  }

  function bindEvents() {
    dom.prev.addEventListener("click", () => goTo(state.index - 1));
    dom.next.addEventListener("click", () => goTo(state.index + 1));
    dom.play.addEventListener("click", togglePlay);
    dom.tocButton.addEventListener("click", () => openOverlay(dom.tocOverlay));
    dom.notesButton.addEventListener("click", () => openOverlay(dom.notesOverlay));
    dom.fullscreen.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch (_error) {
        dom.fullscreen.textContent = "브라우저 메뉴 사용";
      }
    });

    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("resize", fitStage);
    document.addEventListener("fullscreenchange", fitStage);
    window.addEventListener("hashchange", () => {
      const index = initialIndexFromHash();
      if (index !== state.index) goTo(index, { updateHash: false });
    });

    document.querySelectorAll("[data-close-overlay]").forEach((button) => button.addEventListener("click", closeOverlays));
    [dom.tocOverlay, dom.notesOverlay].forEach((overlay) => {
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeOverlays();
      });
    });
    dom.tocList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-slide-index]");
      if (!button) return;
      closeOverlays();
      goTo(Number(button.dataset.slideIndex));
    });
    dom.stage.addEventListener("click", (event) => {
      const button = event.target.closest("[data-demo-action]");
      if (!button) return;
      const action = button.dataset.demoAction;
      if (action === "previous") state.demoStep = Math.max(0, state.demoStep - 1);
      if (action === "next") {
        const lastStep = Math.max(0, dom.stage.querySelectorAll("[data-demo-step]").length - 1);
        state.demoStep = Math.min(lastStep, state.demoStep + 1);
      }
      if (action === "play") playDemoSequence();
      updateDemoView();
    });
  }

  function showError(error) {
    const view = element("div", "error-screen");
    const content = element("div");
    content.appendChild(element("h1", "", "발표 데이터를 열 수 없습니다"));
    content.appendChild(element("p", "", error && error.message ? error.message : String(error)));
    view.appendChild(content);
    dom.stage.replaceChildren(view);
    fitStage();
  }

  async function start() {
    try {
      state.deck = await readDeckData();
      dom.title.textContent = state.deck.title || "ITDA 본선 발표";
      buildToc();
      bindEvents();
      state.index = initialIndexFromHash();
      setHash(state.deck.slides[state.index]);
      renderSlide();
    } catch (error) {
      showError(error);
    }
  }

  start();
})();
