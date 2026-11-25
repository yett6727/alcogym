/* AlcoGym — rebrands algogym.ru in place. */
(() => {
  "use strict";

  const BEER = "🍺";
  const STYLE_ID = "alcogym-style";

  const AUTH_EYEBROW = "ПОНЯТЬ. ПРОПИТЬ. ЗАБЫТЬ.";
  const HANGOVER_ICON =
    '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 4h11v14a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3Z"/><path d="M16 8h2a3 3 0 0 1 0 6h-2"/><path d="M9 8v6m4-6v6"/></svg>';

  // Text nodes inside these are user content or code; leave them alone.
  const SKIP_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "TEXTAREA",
    "INPUT",
    "CODE",
    "PRE",
  ]);

  const ATTRS = ["aria-label", "title", "alt", "placeholder"];

  let enabled = false;
  let started = false;

  /* ---------------------------------------------------------------- */
  /* Text helpers                                                      */
  /* ---------------------------------------------------------------- */

  // "algogym" -> "alcogym", "AlgoGym" -> "AlcoGym", "ALGOGYM" -> "ALCOGYM".
  // The first "g" becomes "c" and keeps its case.
  function rebrand(value) {
    return value.replace(/algogym/gi, (match) =>
      match.replace(/g/i, (letter) => (letter === "G" ? "C" : "c"))
    );
  }

  function fixTextNode(node) {
    const value = node.nodeValue;
    if (!value || !/algogym/i.test(value)) return;
    const next = rebrand(value);
    if (next !== value) node.nodeValue = next;
  }

  function fixAttribute(el, name) {
    const value = el.getAttribute(name);
    if (!value || !/algogym/i.test(value)) return;
    el.setAttribute(name, rebrand(value));
  }

  /* ---------------------------------------------------------------- */
  /* Logo                                                              */
  /* ---------------------------------------------------------------- */

  // The wordmark is split as .brand-name > "Algo" + <span>"Gym"</span>,
  // so plain text-node replacement can't see it. Rebuild it instead.
  function fixBrandName(el) {
    if (el.dataset.alcogymName === "1" && !/algogym/i.test(el.textContent || "")) {
      return;
    }
    const original = el.textContent || "";
    if (!/algogym/i.test(original)) return;

    el.dataset.alcogymName = "1";
    const label = rebrand(original);

    if (/gym$/i.test(label)) {
      const accent = document.createElement("span");
      accent.textContent = label.slice(-3);
      el.replaceChildren(document.createTextNode(label.slice(0, -3)), accent);
    } else {
      el.textContent = label;
    }
  }

  // The mark itself is a purple tile with an SVG (code brackets).
  function fixBrandMark(el) {
    if (el.dataset.alcogymMark === "1" && el.textContent === BEER) return;
    el.dataset.alcogymMark = "1";
    el.textContent = BEER;
    el.setAttribute("aria-hidden", "true");
  }

  function fixIcons() {
    let iconUrl;
    try {
      iconUrl = browser.runtime.getURL("icons/icon.svg");
    } catch {
      iconUrl = chrome.runtime.getURL("icons/icon.svg");
    }

    for (const link of document.querySelectorAll('link[rel~="icon"]')) {
      if (link.href !== iconUrl) link.href = iconUrl;
    }

    const description = document.querySelector('meta[name="description"]');
    if (description) fixAttribute(description, "content");
  }

  // Extra jokes for the login/register screen (the SPA re-renders it often).
  function fixAuthIntro() {
    const intro = document.querySelector(".auth-intro");
    if (!intro) return;

    // The current login screen dropped the original eyebrow, so put it back
    // above the heading. Wait for the heading if the intro is still empty.
    let eyebrow = intro.querySelector(".eyebrow");
    if (!eyebrow) {
      const heading = intro.querySelector("h1");
      if (heading) {
        eyebrow = document.createElement("div");
        eyebrow.className = "eyebrow";
        intro.insertBefore(eyebrow, heading);
      }
    }
    if (eyebrow && eyebrow.textContent !== AUTH_EYEBROW) {
      eyebrow.textContent = AUTH_EYEBROW;
    }

    // The heading used to be "Алгоритмы, которые остаются в памяти."; it is
    // now "Тренажёр алгоритмов". Match either form (and any future wording
    // that still mentions algorithms) without depending on the exact phrase.
    const heading = intro.querySelector("h1");
    if (heading && /алгоритм/i.test(heading.textContent || "")) {
      // Keep spaces around the <br>s: the site hides them on narrow screens.
      heading.replaceChildren(
        "Алкоголь, ",
        document.createElement("br"),
        "который остаётся ",
        document.createElement("br"),
        "в почках."
      );
    }

    const features = intro.querySelector(".auth-features");
    if (features && !features.querySelector("[data-alcogym-hangover]")) {
      const item = document.createElement("span");
      item.dataset.alcogymHangover = "1";
      item.innerHTML = HANGOVER_ICON + "Жёсткий отходняк";
      features.append(item);
    }
  }

  /* ---------------------------------------------------------------- */
  /* DOM walk                                                          */
  /* ---------------------------------------------------------------- */

  function processNode(node) {
    if (!node) return;

    if (node.nodeType === Node.TEXT_NODE) {
      fixTextNode(node);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (SKIP_TAGS.has(node.tagName)) return;

    if (node.classList) {
      if (node.classList.contains("brand-name")) fixBrandName(node);
      if (node.classList.contains("brand-mark")) fixBrandMark(node);
    }

    for (const name of ATTRS) fixAttribute(node, name);

    // Meta tags (description, og:*, twitter:*) live in attributes.
    if (node.tagName === "META") fixAttribute(node, "content");
  }

  function walk(root) {
    if (!root) return;

    const start =
      root.nodeType === Node.DOCUMENT_NODE ? root.documentElement : root;
    if (!start) return;
    if (start.nodeType === Node.ELEMENT_NODE && SKIP_TAGS.has(start.tagName)) {
      return;
    }

    processNode(start);

    const walker = document.createTreeWalker(
      start,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            SKIP_TAGS.has(node.tagName)
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    let node;
    while ((node = walker.nextNode())) processNode(node);
  }

  /* ---------------------------------------------------------------- */
  /* Styling                                                           */
  /* ---------------------------------------------------------------- */

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .brand-mark[data-alcogym-mark="1"] {
        font-size: 21px;
        line-height: 1;
        font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
      }
      .auth-brand .brand-mark[data-alcogym-mark="1"] {
        font-size: 26px;
      }
      .brand-mark[data-alcogym-mark="1"] svg {
        display: none;
      }
      .catalog-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin: 9px 0 0;
        font-size: 9px;
        color: var(--ink, #2a2f45);
      }
      .catalog-stats span {
        display: inline-flex;
        align-items: baseline;
        gap: 5px;
      }
      .catalog-stats b {
        font-weight: 600;
        color: var(--ink, #2a2f45);
      }

      /* Double the code editor height. The site uses
         max(480px, 60vh) / max(960px, 90vh) on desktop and
         max(380px, 45vh) / max(750px, 80vh) on narrow screens. */
      .editor-body,
      .code-input {
        min-height: max(960px, 120vh) !important;
      }
      .code-input {
        max-height: max(1920px, 180vh) !important;
      }
      @media (max-width: 760px) {
        .editor-body,
        .code-input {
          min-height: max(760px, 90vh) !important;
        }
        .code-input {
          max-height: max(1500px, 160vh) !important;
        }
      }

      /* Pin the training timer to the top of the screen. The vertical
         padding is removed and the timer label/value share a row, which
         halves the card height while fonts and buttons keep their size. */
      .card.timer-bar {
        position: fixed !important;
        top: 0;
        right: 0;
        /* Start after the fixed sidebar so the two never overlap. */
        left: 224px;
        z-index: 70;
        margin: 0 !important;
        padding: 0 20px !important;
        border-radius: 0;
        border-top: 0;
        border-left: 0;
        border-right: 0;
        box-shadow: 0 6px 18px #22243a1f;
        height: 45px !important;
      }
      .card.timer-bar > div:first-child {
        display: flex;
        align-items: baseline;
        gap: 10px;
      }
      .card.timer-bar .timer-value {
        margin-top: 0;
      }
      @media (max-width: 1250px) {
        .card.timer-bar {
          left: 210px;
        }
      }
      @media (max-width: 760px) {
        .card.timer-bar {
          left: 0;
          padding: 0 14px !important;
        }
        .card.timer-bar > div:first-child {
          gap: 7px;
        }
      }
    `;
    (document.head || document.documentElement).append(style);
  }

  /* ---------------------------------------------------------------- */
  /* Catalog: personal record, place, and people solved per theme      */
  /* ---------------------------------------------------------------- */

  function fetchJson(path) {
    return fetch(path, { credentials: "same-origin", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  }

  let catalogStatsPromise = null;
  let catalogStatsMap = null;
  let catalogStatsCheckedAt = 0;

  // One lazy fetch: the account, then the user's public profile records —
  // {topicId: record} with bestMs, rank and totalEntries per theme.
  // While logged out, retry at most every few seconds (late logins).
  function fetchCatalogStats() {
    if (catalogStatsMap && catalogStatsPromise) return catalogStatsPromise;
    const now = Date.now();
    if (catalogStatsPromise && now - catalogStatsCheckedAt < 5000) return catalogStatsPromise;
    catalogStatsCheckedAt = now;
    catalogStatsPromise = (async () => {
      const me = await fetchJson("/api/auth/me");
      const id = me?.user?.id;
      if (!id) return null;
      const profile = await fetchJson("/api/users/" + encodeURIComponent(id));
      const map = new Map();
      for (const record of profile?.topics || []) {
        if (typeof record?.topic === "string") map.set(record.topic, record);
      }
      return map;
    })();
    return catalogStatsPromise;
  }

  // Same time text the site shows for topic leaderboards.
  function formatRankTime(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor(total / 60) % 60;
    const s = total % 60;
    const msPart = String(Math.floor(ms % 1000)).padStart(3, "0");
    return `${h ? `${String(h).padStart(2, "0")}:` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${msPart}`;
  }

  // Same place text the site's profile uses ("12", "12–15").
  function displayRank(record) {
    if (typeof record.rankLabel === "string" && record.rankLabel) return record.rankLabel;
    if (Number.isSafeInteger(record.rankEnd) && record.rankEnd > record.rank) {
      return `${record.rank}–${record.rankEnd}`;
    }
    if (Number.isSafeInteger(record.rank)) return String(record.rank);
    return null;
  }

  function catalogStat(label, value) {
    const stat = document.createElement("span");
    const labelEl = document.createElement("span");
    labelEl.className = "catalog-stat-label";
    labelEl.textContent = label;
    const valueEl = document.createElement("b");
    valueEl.textContent = value;
    stat.append(labelEl, valueEl);
    return stat;
  }

  function applyCatalogStats(card) {
    if (card.dataset.alcogymStats === "1") return;
    const id = card.querySelector("[data-id]")?.dataset?.id;
    if (!id) {
      card.dataset.alcogymStats = "1";
      return;
    }
    if (catalogStatsMap === null) return; // still loading (or logged out)

    const record = catalogStatsMap.get(id);
    if (!record) {
      card.dataset.alcogymStats = "1";
      return;
    }

    const stats = [];
    if (Number.isSafeInteger(record.bestMs) && record.bestMs >= 0) {
      stats.push(catalogStat("Ваш рекорд", formatRankTime(record.bestMs)));
    }
    if (record.isCurrent !== false) {
      const place = displayRank(record);
      if (place) stats.push(catalogStat("Место", place));
    }
    if (Number.isSafeInteger(record.totalEntries) && record.totalEntries > 0) {
      stats.push(catalogStat("Решили", String(record.totalEntries)));
    }
    if (!stats.length) {
      card.dataset.alcogymStats = "1";
      return;
    }

    card.dataset.alcogymStats = "1";
    const row = document.createElement("div");
    row.className = "catalog-stats";
    row.append(...stats);
    const meta = card.querySelector(".topic-meta");
    if (meta) meta.after(row);
    else card.append(row);
  }

  function enrichCatalog(root) {
    if (!enabled || !document.querySelector(".catalog")) return;
    const cards = root && root.querySelectorAll ? Array.from(root.querySelectorAll(".topic-card")) : [];
    if (root && root.nodeType === Node.ELEMENT_NODE && root.classList.contains("topic-card")) cards.push(root);
    fetchCatalogStats().then((map) => {
      catalogStatsMap = map;
      for (const card of cards) applyCatalogStats(card);
      // Cards can re-render while the profile was loading.
      for (const card of document.querySelectorAll(".topic-card")) applyCatalogStats(card);
    });
  }

  /* ---------------------------------------------------------------- */
  /* Observation                                                       */
  /* ---------------------------------------------------------------- */

  const observer = new MutationObserver((mutations) => {
    if (!enabled) return;

    let structural = false;

    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        fixTextNode(mutation.target);
      } else if (mutation.type === "childList") {
        structural = true;
        for (const node of mutation.addedNodes) {
          walk(node);
          enrichCatalog(node);
        }
      } else if (mutation.type === "attributes") {
        structural = true;
        processNode(mutation.target);
      }
    }

    if (structural) fixAuthIntro();
  });

  function start() {
    if (started) return;

    // Should not happen at document_start, but be safe.
    if (!document.documentElement) {
      document.addEventListener("DOMContentLoaded", start, { once: true });
      return;
    }

    started = true;

    injectStyle();
    fixIcons();
    walk(document);
    fixAuthIntro();
    enrichCatalog(document);

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS.concat("content"),
    });

    // Late logins / re-entries: re-check the profile when the route changes.
    window.addEventListener("hashchange", () => {
      catalogStatsPromise = null;
      catalogStatsCheckedAt = 0;
      enrichCatalog(document);
    });
  }

  /* ---------------------------------------------------------------- */
  /* Boot                                                              */
  /* ---------------------------------------------------------------- */

  const api = typeof browser !== "undefined" ? browser : chrome;

  api.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.enabled) return;

    if (changes.enabled.newValue !== false) {
      enabled = true;
      start();
    } else {
      enabled = false;
      if (started) location.reload();
    }
  });

  api.storage.local
    .get({ enabled: true })
    .then(({ enabled: stored }) => {
      enabled = stored !== false;
      if (enabled) start();
    })
    .catch(() => {
      enabled = true;
      start();
    });
})();
