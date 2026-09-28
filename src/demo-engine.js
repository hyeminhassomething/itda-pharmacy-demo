/* Page 09 synthetic demonstration only. No OCR, live notices, ERP or submission. */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DemoEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const clone = (value) => JSON.parse(JSON.stringify(value));
  function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }
  class DemoError extends Error {
    constructor(code, message) { super(message); this.name = "DemoError"; this.code = code; }
  }
  function fail(code, message) { throw new DemoError(code, message); }
  function uint(value, label) {
    if (!Number.isSafeInteger(value) || value < 0) fail("INVALID_QUANTITY", label + "은 0 이상의 정수여야 합니다.");
    return value;
  }
  function normalizeDate(value) {
    if (typeof value !== "string") return null;
    const match = value.trim().match(/^(\d{4})[-.](\d{2})[-.](\d{2})$/);
    if (!match) return null;
    const y = Number(match[1]), m = Number(match[2]), d = Number(match[3]);
    if (y < 1900 || y > 2199 || m < 1 || m > 12) return null;
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return d >= 1 && d <= days ? match.slice(1).join("-") : null;
  }
  function validLot(value) {
    return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._/-]{0,63}$/.test(value) && !/^(NONE|NULL|UNKNOWN)$/i.test(value);
  }
  const DISCLOSURE = "가상 품목·OCR 원문·거래·공지·규칙의 시연입니다. OCR을 실행하지 않았으며 사진·인식 신뢰도는 없습니다. 확인 주체는 시연 조작자이며 실제 약사 승인이 아닙니다. 실제 회수·반품 신청, 판매 허가 또는 환급 보장이 아닙니다.";
  const ASSUMPTIONS = "동일 기준일·단위, 완전한 입고 기록, 모든 입출고 반영, 총재고 정합성 확인이라는 시연 전제입니다. 원장 진위를 자동 검증하지 않으며 감소량을 판매량으로 추정하지 않습니다.";
  const FIXTURE = freeze({
    mode: "SYNTHETIC_DEMO", asOf: "2026-10-03", sourceRef: "PAGE09-SYNTHETIC-FIXTURE-v1",
    productId: "DEMO-PRODUCT-A", productName: "가상 품목 A", supplierId: "DEMO-SUPPLIER-A", unit: "개",
    expiry: "2027-10-31", manufactureDate: "2024-11-01", standardCode: "8800000123456",
    targetLot: "X-DEMO-01", otherLot: "Y-DEMO-02", targetCapacity: 4, otherCapacity: 6, totalOnHand: 8,
    receiptId: "DEMO-RECEIPT-A-X", otherReceiptId: "DEMO-RECEIPT-A-Y", receivedOn: "2026-09-01",
    inventory: {completeReceipts: true, completeMovements: true, reconciled: true, asOf: "2026-10-03", unit: "개", sourceRef: "DEMO-INVENTORY-A"},
    recallNotice: {noticeId: "DEMO-NOTICE-A-X", productId: "DEMO-PRODUCT-A", lotRaw: "X-DEMO-01", scopeKind: "SINGLE_LOT", sourceRef: "SYNTHETIC-NOTICE-NOT-OFFICIAL", publishedOn: "2026-10-03"},
    returnRule: {ruleId: "DEMO-RECALL-REVIEW-RULE", sourceRef: "SYNTHETIC-REVIEW-RULE-NOT-CONTRACT", productId: "DEMO-PRODUCT-A", supplierId: "DEMO-SUPPLIER-A", lotRaw: "X-DEMO-01", action: "REVIEW_ONLY"},
    normal: {productId: "DEMO-PRODUCT-B", productName: "가상 품목 B", lot: "Z-DEMO-03", supplierId: "DEMO-SUPPLIER-B", receiptId: "DEMO-RECEIPT-B-Z", receivedOn: "2026-09-01", receivedQuantity: 4, confirmedQuantity: 4, unit: "개", expiry: "2027-02-28", ruleId: "DEMO-ABSOLUTE-WINDOW-B", windowStart: "2026-11-28", windowEnd: "2027-02-28", sourceRef: "SYNTHETIC-ABSOLUTE-WINDOW-NOT-CONTRACT", noRecallInSyntheticSnapshot: true},
    disclosure: DISCLOSURE, assumptions: ASSUMPTIONS
  });
  function createState() {
    return freeze({schemaVersion: 1, mode: FIXTURE.mode, revision: 0, asOf: FIXTURE.asOf, fixture: clone(FIXTURE),
      input_mode: "synthetic_fixture", ocr_executed: false, photo: null, confidence: null, actor_kind: "demo_operator",
      ocr: {kind: "FIXED_SYNTHETIC_TEXT_NOT_INFERENCE", input_mode: "synthetic_fixture", ocr_executed: false, photo: null, confidence: null, rawText: "사용기한 2027.10.31\n제조번호 X-DEMO-01\n제조일 2024.11.01\n표준코드(예시) 8800000123456", expiryCandidate: FIXTURE.expiry, lotCandidate: FIXTURE.targetLot,
        excluded: [{role: "제조일", value: FIXTURE.manufactureDate, reason: "사용기한과 다른 역할"}, {role: "표준코드(예시)", value: FIXTURE.standardCode, reason: "품목 식별용 예시 문자열이며 날짜가 아님"}]},
      review: {expiry: FIXTURE.expiry, lot: FIXTURE.targetLot, checked: false, confirmed: false, revision: 0, actor_kind: "demo_operator", errors: []},
      transaction: null, recall: null, count: null, returnResult: null, normalReturnResult: null,
      status: "AWAITING_REVIEW", disclosure: DISCLOSURE, log: []});
  }
  function checkState(state) {
    if (!state || state.schemaVersion !== 1 || state.mode !== "SYNTHETIC_DEMO" || state.asOf !== FIXTURE.asOf || JSON.stringify(state.fixture) !== JSON.stringify(FIXTURE) || state.input_mode !== "synthetic_fixture" || state.ocr_executed !== false || state.photo !== null || state.confidence !== null || state.actor_kind !== "demo_operator" || !state.review || state.review.actor_kind !== "demo_operator" || !state.ocr || state.ocr.ocr_executed !== false || state.ocr.input_mode !== "synthetic_fixture" || state.ocr.photo !== null || state.ocr.confidence !== null) {
      fail("INVALID_DEMO_STATE", "이 엔진은 고정된 가상 시연 상태만 처리합니다.");
    }
  }
  function next(state, action) {
    checkState(state);
    const out = clone(state);
    out.revision += 1;
    out.log.push({sequence: out.revision, action, reviewRevision: out.review.revision, asOf: out.asOf, mode: out.mode, actor_kind: "demo_operator"});
    return out;
  }
  function invalidate(out) {
    out.transaction = null; out.recall = null; out.count = null; out.returnResult = null; out.normalReturnResult = null;
  }
  function updateReview(state, values) {
    const out = next(state, "REVIEW_EDIT_INVALIDATES_DOWNSTREAM");
    const input = values || {};
    if (Object.prototype.hasOwnProperty.call(input, "expiry")) out.review.expiry = typeof input.expiry === "string" ? input.expiry : "";
    if (Object.prototype.hasOwnProperty.call(input, "lot")) out.review.lot = typeof input.lot === "string" ? input.lot : "";
    out.review.revision += 1; out.review.checked = false; out.review.confirmed = false; out.review.errors = [];
    invalidate(out); out.status = "AWAITING_REVIEW";
    return freeze(out);
  }
  function confirmReview(state, values) {
    const input = values || {};
    const out = clone(updateReview(state, input));
    out.log[out.log.length - 1].action = "REVIEW_CONFIRM_ATTEMPT";
    const date = normalizeDate(out.review.expiry);
    if (!date) out.review.errors.push("사용기한은 실제 달력의 연·월·일이 모두 필요합니다. NONE·월 단위 값은 보완하지 않습니다.");
    if (!validLot(out.review.lot)) out.review.errors.push("제조번호 원문을 확인해 입력하세요. 범위·목록·NONE은 단일 LOT가 아닙니다.");
    if (input.checked !== true) out.review.errors.push("사용기한과 제조번호를 원문과 대조했다는 명시적 확인이 필요합니다.");
    out.review.checked = input.checked === true;
    out.review.confirmed = out.review.errors.length === 0;
    if (date) out.review.expiry = date;
    out.status = out.review.confirmed ? "REVIEW_CONFIRMED" : "HOLD";
    return freeze(out);
  }
  function fingerprint(review) { return JSON.stringify([review.revision, review.expiry, review.lot, review.confirmed]); }
  function requireBinding(state) {
    checkState(state);
    if (!state.review.confirmed || !state.review.checked || !normalizeDate(state.review.expiry) || !validLot(state.review.lot)) fail("REVIEW_REQUIRED", "명시적인 원문 검수가 먼저 필요합니다.");
    if (!state.transaction || state.transaction.reviewFingerprint !== fingerprint(state.review) || state.transaction.reviewRevision !== state.review.revision || state.transaction.lot !== state.review.lot || state.transaction.expiry !== state.review.expiry) fail("BINDING_REQUIRED", "현재 검수 버전에 매입 거래를 다시 연결하세요.");
    if (state.transaction.receiptId !== FIXTURE.receiptId || state.transaction.productId !== FIXTURE.productId || state.transaction.supplierId !== FIXTURE.supplierId || state.transaction.quantity !== FIXTURE.targetCapacity || state.transaction.lot !== FIXTURE.targetLot) fail("TRANSACTION_MISMATCH", "가상 거래의 품목·LOT·수량·매입처와 일치하지 않습니다.");
  }
  function bindTransaction(state) {
    const out = next(state, "BIND_SYNTHETIC_TRANSACTION");
    if (!out.review.confirmed || !out.review.checked) fail("REVIEW_REQUIRED", "검수 확인 후 거래를 연결하세요.");
    if (out.review.lot !== FIXTURE.targetLot) fail("LOT_TRANSACTION_MISMATCH", "확인한 LOT 원문이 고정 가상 거래의 X-DEMO-01과 일치하지 않습니다.");
    if (!normalizeDate(out.review.expiry)) fail("EXPIRY_REQUIRED", "완전한 사용기한이 필요합니다.");
    invalidate(out);
    out.transaction = {receiptId: FIXTURE.receiptId, productId: FIXTURE.productId, productName: FIXTURE.productName, supplierId: FIXTURE.supplierId, lot: out.review.lot, expiry: out.review.expiry, quantity: FIXTURE.targetCapacity, unit: FIXTURE.unit, receivedOn: FIXTURE.receivedOn,
      reviewRevision: out.review.revision, reviewFingerprint: fingerprint(out.review), sourceRef: "SYNTHETIC-RECEIPT-A-X", mode: FIXTURE.mode};
    out.status = "TRANSACTION_BOUND";
    return freeze(out);
  }
  function inventoryBounds(targetCapacity, otherCapacity, totalOnHand) {
    [targetCapacity, otherCapacity, totalOnHand].forEach((n) => uint(n, "재고 수량"));
    if (!Number.isSafeInteger(targetCapacity + otherCapacity) || totalOnHand > targetCapacity + otherCapacity) fail("INVENTORY_INCONSISTENT", "현재 총재고가 완전한 입고 기록의 수량을 초과합니다.");
    return freeze({minimum: Math.max(0, totalOnHand - otherCapacity), maximum: Math.min(targetCapacity, totalOnHand)});
  }
  function alias(lot) { return lot.toUpperCase().replace(/[^A-Z0-9]/g, ""); }
  function withinOneEdit(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i += 1; j += 1; continue; }
      if (++edits > 1) return false;
      if (a.length <= b.length) j += 1;
      if (a.length >= b.length) i += 1;
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }
  function evaluateRecall(state, options) {
    requireBinding(state);
    const input = options || {}, out = next(state, "EVALUATE_SYNTHETIC_RECALL");
    out.count = null; out.returnResult = null;
    const raw = typeof input.lotRaw === "string" ? input.lotRaw : "";
    const base = {status: "HOLD", category: "HOLD", code: "NOTICE_UNVERIFIED", reason: "가상 공지의 단일 LOT 원문 확인이 필요합니다.", lotRaw: raw, verified: input.verified === true,
      noticeId: FIXTURE.recallNotice.noticeId, productId: FIXTURE.productId, sourceRef: FIXTURE.recallNotice.sourceRef, asOf: out.asOf, reviewRevision: out.review.revision,
      snapshotOnly: true, scopeKind: "SINGLE_LOT", scopeVerification: "USER_ASSERTION_IN_SYNTHETIC_DEMO", bounds: null, combinations: [], saleRecommendationAllowed: false, actualRecallSubmitted: false};
    if (input.verified !== true) {
      // A pending notice never creates an all-clear or enables sale advice.
    } else if (!validLot(raw) || (input.scopeKind !== undefined && input.scopeKind !== "SINGLE_LOT")) {
      base.code = "NOTICE_SCOPE_UNRESOLVED"; base.reason = "단일 제조번호인지 확인되지 않아 공지 범위를 수동 검토합니다.";
    } else if (raw === out.transaction.lot) {
      const inv = out.fixture.inventory;
      if (!(inv.completeReceipts && inv.completeMovements && inv.reconciled && inv.asOf === out.asOf && inv.unit === FIXTURE.unit)) {
        base.code = "INVENTORY_UNVERIFIED"; base.reason = "입고·입출고·총재고의 정합성이 확인되지 않았습니다.";
      } else {
        base.status = "RECALL_REVIEW"; base.category = "REVIEW"; base.code = "EXACT_LOT_MATCH_REVIEW_REQUIRED";
        base.bounds = inventoryBounds(FIXTURE.targetCapacity, FIXTURE.otherCapacity, FIXTURE.totalOnHand);
        for (let x = base.bounds.minimum; x <= base.bounds.maximum; x += 1) base.combinations.push({target: x, other: FIXTURE.totalOnHand - x, total: FIXTURE.totalOnHand});
        base.reason = "가상 공지의 품목·LOT 원문이 일치합니다. 전제가 맞으면 X 잔량은 2~4개이며 실제 수량과 회수 절차를 확인합니다.";
        base.assumptions = ASSUMPTIONS;
      }
    } else if (alias(raw) === alias(out.transaction.lot) || withinOneEdit(raw, out.transaction.lot)) {
      base.status = "RECALL_REVIEW"; base.category = "REVIEW"; base.code = "SIMILAR_LOT_REVIEW_REQUIRED"; base.reason = "유사 제조번호입니다. 원문 일치나 회수 대상으로 자동 확정하지 않고 대조합니다.";
    } else {
      base.status = "REVIEW"; base.category = "REVIEW"; base.code = "NO_MATCH_IN_PROVIDED_SNAPSHOT"; base.reason = "이 가상 스냅샷에서 원문이 일치하지 않습니다. 전체 회수 공지에 대한 안전 확인을 뜻하지 않습니다.";
    }
    out.recall = base; out.status = base.status;
    return freeze(out);
  }
  function invalidateCount(state) {
    requireBinding(state);
    const out = next(state, "COUNT_EDIT_INVALIDATES_RESULTS");
    out.count = null;
    out.returnResult = null;
    out.normalReturnResult = null;
    out.status = "COUNT_UNCONFIRMED";
    return freeze(out);
  }
  function confirmCount(state, quantity) {
    requireBinding(state);
    uint(quantity, "실사 수량");
    if (!state.recall || state.recall.code !== "EXACT_LOT_MATCH_REVIEW_REQUIRED" || !state.recall.bounds) fail("EXACT_RECALL_REVIEW_REQUIRED", "원문 일치 및 조건부 잔량 범위를 먼저 검토하세요.");
    const bounds = inventoryBounds(FIXTURE.targetCapacity, FIXTURE.otherCapacity, FIXTURE.totalOnHand), other = FIXTURE.totalOnHand - quantity;
    if (quantity < bounds.minimum || quantity > bounds.maximum || other < 0 || other > FIXTURE.otherCapacity || quantity + other !== FIXTURE.totalOnHand) fail("COUNT_OUTSIDE_BOUNDS", "실사 수량은 X 2~4개 범위 및 총재고 8개와 정합해야 합니다. 원장을 재확인하세요.");
    const out = next(state, "CONFIRM_SYNTHETIC_PHYSICAL_COUNT");
    out.count = {quantity, otherQuantity: other, total: FIXTURE.totalOnHand, lot: out.review.lot, unit: FIXTURE.unit, asOf: out.asOf, reviewRevision: out.review.revision,
      sourceRef: "SYNTHETIC-PHYSICAL-COUNT-INPUT", status: "COUNT_CONFIRMED_DEMO", otherQuantityKind: "DERIVED_REMAINDER_NOT_PHYSICAL_COUNT"};
    out.returnResult = null; out.status = "COUNT_CONFIRMED_DEMO";
    return freeze(out);
  }
  function evaluateReturn(state, options) {
    requireBinding(state);
    const input = options || {}, out = next(state, "EVALUATE_RECALL_RETURN_REVIEW");
    const result = {status: "HOLD", category: "HOLD", code: "RECALL_NOT_CHECKED", reason: "회수 공지 확인이 먼저 필요합니다.", productId: FIXTURE.productId, productName: FIXTURE.productName, lot: out.review.lot, supplierId: FIXTURE.supplierId,
      asOf: out.asOf, ruleKnown: input.ruleKnown === true, ruleId: input.ruleKnown === true ? FIXTURE.returnRule.ruleId : null, ruleSource: input.ruleKnown === true ? FIXTURE.returnRule.sourceRef : null,
      recallAction: out.recall ? out.recall.code : "NOT_CHECKED", confirmedQuantity: out.count ? out.count.quantity : null,
      saleRecommendationAllowed: false, normalReturnWindowApplied: false, authorization: "NONE", actualReturnSubmitted: false, refundGuaranteed: false, disclosure: DISCLOSURE};
    if (input.ruleKnown !== true) {
      result.code = "RULE_UNKNOWN"; result.reason = "반품 조건이 확인되지 않아 보류합니다. 회수 검토 알림은 유지하며 일반 반품 접수창을 대신 적용하지 않습니다.";
    } else if (!out.recall || !out.recall.verified) {
      result.code = out.recall ? "NOTICE_UNVERIFIED" : "RECALL_NOT_CHECKED";
    } else if (out.recall.code !== "EXACT_LOT_MATCH_REVIEW_REQUIRED") {
      result.code = out.recall.code; result.reason = out.recall.reason;
    } else {
      result.status = "RECALL_REVIEW"; result.category = "REVIEW";
      result.code = out.count ? "RECALL_REVIEW_REQUIRED" : "RECALL_COUNT_REQUIRED";
      result.reason = out.count ? "X 실사 " + out.count.quantity + "개를 근거로 회수·반품 담당자에게 절차를 확인합니다. 이 목록은 검토 자료이며 신청이나 판매 추천이 아닙니다." : "조건부 잔량 범위 2~4개를 실사한 뒤 회수 절차와 반품 조건을 확인합니다.";
    }
    out.returnResult = result; out.status = result.status;
    return freeze(out);
  }
  function evaluateNormalReturn(state, options) {
    checkState(state);
    const out = next(state, "EVALUATE_SEPARATE_NORMAL_PRODUCT"), known = options && options.ruleKnown === true, normal = FIXTURE.normal;
    out.normalReturnResult = {status: known ? "NOT_OPEN_YET" : "HOLD", category: known ? "WAIT" : "HOLD", code: known ? "NOT_OPEN_YET" : "RULE_UNKNOWN",
      productId: normal.productId, productName: normal.productName, lot: normal.lot, supplierId: normal.supplierId, receiptId: normal.receiptId, confirmedQuantity: normal.confirmedQuantity,
      expiry: normal.expiry, asOf: out.asOf, windowStart: known ? normal.windowStart : null, windowEnd: known ? normal.windowEnd : null, ruleId: known ? normal.ruleId : null,
      ruleSource: known ? normal.sourceRef : null, ruleKnown: known, windowKind: "EXPLICIT_ABSOLUTE_DATES_NOT_MONTH_OFFSET",
      reason: known ? "별도 가상 품목 B의 명시된 접수창은 2026-11-28~2027-02-28입니다. 기준일 2026-10-03은 시작 전입니다. X의 회수 검토와 별개입니다." : "별도 가상 품목 B의 반품 조건이 확인되지 않아 보류합니다.",
      saleRecommendationAllowed: false, authorization: "NONE", actualReturnSubmitted: false, reminderScheduled: false, disclosure: DISCLOSURE};
    return freeze(out);
  }
  const CSV_COLUMNS = freeze(["mode", "input_mode", "ocr_executed", "actor_kind", "photo", "confidence", "as_of", "product_id", "product_name", "lot_raw", "expiry", "receipt_id", "supplier_id", "review_revision", "received_quantity", "unit", "total_on_hand", "remaining_min", "remaining_max", "confirmed_quantity", "quantity_source", "status", "category", "code", "recall_status", "notice_source", "rule_id", "rule_source", "window_start", "window_end", "reason", "assumptions", "sale_recommendation_allowed", "authorization", "actual_submission", "disclosure"]);
  function exportRows(state) {
    requireBinding(state);
    if (!state.returnResult && !state.normalReturnResult) fail("RESULT_REQUIRED", "내보낼 검토 결과를 먼저 계산하세요.");
    const rows = [];
    if (state.returnResult) {
      const r = state.returnResult, rec = state.recall, bounds = rec && rec.bounds;
      rows.push({mode: state.mode, input_mode: "synthetic_fixture", ocr_executed: false, actor_kind: "demo_operator", photo: null, confidence: null, as_of: state.asOf, product_id: FIXTURE.productId, product_name: FIXTURE.productName, lot_raw: state.review.lot, expiry: state.review.expiry,
        receipt_id: state.transaction.receiptId, supplier_id: FIXTURE.supplierId, review_revision: state.review.revision, received_quantity: FIXTURE.targetCapacity, unit: FIXTURE.unit, total_on_hand: FIXTURE.totalOnHand,
        remaining_min: bounds ? bounds.minimum : null, remaining_max: bounds ? bounds.maximum : null, confirmed_quantity: state.count ? state.count.quantity : null, quantity_source: state.count ? state.count.sourceRef : "UNCONFIRMED",
        status: r.status, category: r.category, code: r.code, recall_status: rec ? rec.code : "NOT_CHECKED", notice_source: rec ? rec.sourceRef : "", rule_id: r.ruleId, rule_source: r.ruleSource, window_start: null, window_end: null,
        reason: r.reason, assumptions: ASSUMPTIONS, sale_recommendation_allowed: false, authorization: "NONE", actual_submission: false, disclosure: DISCLOSURE});
    }
    if (state.normalReturnResult) {
      const r = state.normalReturnResult, n = FIXTURE.normal;
      rows.push({mode: state.mode, input_mode: "synthetic_fixture", ocr_executed: false, actor_kind: "demo_operator", photo: null, confidence: null, as_of: state.asOf, product_id: n.productId, product_name: n.productName, lot_raw: n.lot, expiry: n.expiry, receipt_id: n.receiptId, supplier_id: n.supplierId, review_revision: "SEPARATE_SYNTHETIC_RECORD",
        received_quantity: n.receivedQuantity, unit: n.unit, total_on_hand: n.confirmedQuantity, remaining_min: null, remaining_max: null, confirmed_quantity: n.confirmedQuantity, quantity_source: "SEPARATE_SYNTHETIC_RECORD",
        status: r.status, category: r.category, code: r.code, recall_status: "NO_RECALL_IN_SYNTHETIC_SNAPSHOT_NOT_ALL_CLEAR", notice_source: "", rule_id: r.ruleId, rule_source: r.ruleSource,
        window_start: r.windowStart, window_end: r.windowEnd, reason: r.reason, assumptions: "별도 가상 품목 B의 고정 거래와 명시된 절대 접수일. X 공지의 적용 대상이 아님.", sale_recommendation_allowed: false, authorization: "NONE", actual_submission: false, disclosure: DISCLOSURE});
    }
    return freeze(rows);
  }
  function csvCell(value) {
    let text = value === null || value === undefined ? "" : String(value);
    // Quoting alone does not stop spreadsheet formula execution.
    if (/^[\s\uFEFF]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function toCSV(rows, options) {
    if (!Array.isArray(rows) || rows.some((row) => !row || typeof row !== "object" || Array.isArray(row))) fail("INVALID_CSV_ROWS", "CSV 행은 객체 배열이어야 합니다.");
    const columns = options && options.columns !== undefined ? options.columns : CSV_COLUMNS;
    if (!Array.isArray(columns) || !columns.length || columns.some((key) => typeof key !== "string" || !key)) fail("INVALID_CSV_COLUMNS", "CSV 열 이름 배열이 필요합니다.");
    return ((options && options.bom === false) ? "" : "\uFEFF") + [columns.map(csvCell).join(","), ...rows.map((row) => columns.map((key) => csvCell(row[key])).join(","))].join("\r\n") + "\r\n";
  }
  function exportCSV(state, options) { return toCSV(exportRows(state), options); }
  return freeze({version: "1.0.2", FIXTURE, CSV_COLUMNS, DemoError, createState, updateReview, confirmReview, bindTransaction, inventoryBounds, evaluateRecall, invalidateCount, confirmCount, evaluateReturn, evaluateNormalReturn, exportRows, toCSV, exportCSV, normalizeDate});
});
