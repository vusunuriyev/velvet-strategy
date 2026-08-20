(function () {
  const LANGS = ["en", "ar", "ru"];
  const STORAGE = "northline-lang";
  let activeKind = "";
  let activeOutlet = "";
  let currentStory = -1;
  let refreshArticle = () => {};

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function path(obj, key) {
    return key.split(".").reduce((acc, part) => (acc == null ? acc : acc[part]), obj);
  }

  function currentLang() {
    const stored = localStorage.getItem(STORAGE);
    if (LANGS.includes(stored)) return stored;
    const nav = (navigator.language || "en").toLowerCase();
    if (nav.startsWith("ar")) return "ar";
    if (nav.startsWith("ru")) return "ru";
    return "en";
  }

  function applyBrand() {
    const s = window.SITE;
    $$("[data-brand='name']").forEach((el) => {
      el.textContent = s.brand.name;
    });
    $$("[data-brand='legal']").forEach((el) => {
      el.textContent = s.brand.legal;
    });
    $$("[data-brand='line1']").forEach((el) => {
      el.textContent = s.brand.nameLine1;
    });
    $$("[data-brand='line2']").forEach((el) => {
      el.textContent = s.brand.nameLine2;
    });
    $$("[data-contact='phone']").forEach((el) => {
      el.textContent = s.contact.phoneDisplay;
      if (el.tagName === "A") el.href = "tel:" + s.contact.phoneHref;
    });
    $$("[data-contact='email']").forEach((el) => {
      el.textContent = s.contact.email;
      if (el.tagName === "A") el.href = "mailto:" + s.contact.email;
    });
    $$("[data-contact='office1']").forEach((el) => {
      el.textContent = s.contact.office1;
    });
    $$("[data-contact='office2']").forEach((el) => {
      el.textContent = s.contact.office2;
    });
    $$("[data-year]").forEach((el) => {
      el.textContent = String(new Date().getFullYear());
    });
    if (!document.body.dataset.legal) {
      document.title = s.brand.name;
    }

    const waHref = "https://wa.me/" + String(s.contact.whatsapp).replace(/\D/g, "");
    $$("[data-wa]").forEach((el) => {
      el.href = waHref;
    });

    $$("[data-if-email]").forEach((el) => {
      el.hidden = !s.contact.email;
    });
    $$("[data-if-calendly]").forEach((el) => {
      el.hidden = !s.contact.calendlyUrl;
    });

    const banner = $("#placeholder-banner");
    if (banner && s.showPlaceholderBanner) banner.classList.add("is-on");
  }

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function newsLang() {
    const lang = document.documentElement.lang || "en";
    if (lang.startsWith("ar")) return "ar";
    if (lang.startsWith("ru")) return "ru";
    return "en";
  }

  function formatNewsDate(iso, lang) {
    const date = new Date(iso + "T12:00:00");
    const locale = lang === "ar" ? "ar" : lang === "ru" ? "ru-RU" : "en-GB";
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  function visibleNews() {
    const items = Array.isArray(window.NEWS) ? window.NEWS : [];
    return items
      .map((item, i) => ({ item, i }))
      .filter((entry) => !activeKind || entry.item.kind === activeKind)
      .filter((entry) => !activeOutlet || entry.item.outlet === activeOutlet);
  }

  function filterLabel(dict) {
    const parts = [];
    if (activeKind) parts.push(kindLabel(dict, activeKind));
    if (activeOutlet) parts.push(activeOutlet);
    return parts.join(" · ");
  }

  function syncFilters(dict) {
    const clear = !activeKind && !activeOutlet;
    $$(".ribbon-all").forEach((btn) => {
      btn.classList.toggle("is-on", clear);
      btn.setAttribute("aria-pressed", clear ? "true" : "false");
    });
    $$(".press-mark").forEach((btn) => {
      const on = activeOutlet === btn.dataset.outlet;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function layoutRole(index) {
    if (index === 0) return "lead";
    if (index === 1 || index === 2) return "column";
    if (index % 6 === 4) return "banner";
    if (index % 5 === 3) return "brief";
    return "standard";
  }

  function kindLabel(dict, kind) {
    return (dict.desk && dict.desk.kind && dict.desk.kind[kind]) || kind;
  }

  function renderTypeRail(dict) {
    const rail = $("#type-rail");
    const types = window.NEWS_TYPES;
    if (!rail || !Array.isArray(types)) return;

    const makeUnit = (hidden) =>
      types
        .map((kind) => {
          const on = activeKind === kind;
          const tab = hidden ? ' tabindex="-1"' : "";
          return `<button type="button"${tab} class="ribbon-item${on ? " is-on" : ""}" data-kind="${kind}" aria-pressed="${on ? "true" : "false"}">${esc(kindLabel(dict, kind))}</button><span class="ribbon-sep" aria-hidden="true">†</span>`;
        })
        .join("");

    rail.innerHTML =
      `<div class="ribbon-unit">${makeUnit(false)}</div>` +
      `<div class="ribbon-unit" aria-hidden="true">${makeUnit(true)}</div>`;

    $$(".ribbon-all").forEach((btn) => {
      const on = !activeKind && !activeOutlet;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function renderHome(dict) {
    const grid = $("#news-grid");
    if (!grid) return;

    const lang = newsLang();
    const list = visibleNews();
    renderTypeRail(dict);
    syncFilters(dict);

    const titleEl = $("#desk-title");
    const leadEl = $("#desk-lead");
    const countEl = $("#desk-count");
    const showing = $("#desk-showing");
    const filtered = Boolean(activeKind || activeOutlet);
    const label = filterLabel(dict);
    if (titleEl) {
      titleEl.textContent = label || dict.desk.title;
    }
    if (leadEl) {
      leadEl.textContent = filtered
        ? dict.ribbon.showing + " · " + list.length + " " + dict.ribbon.pieces
        : dict.desk.body;
    }
    if (countEl) {
      countEl.textContent = filtered
        ? String(list.length).padStart(2, "0")
        : dict.desk.folio;
    }
    if (showing) showing.hidden = true;

    $$("[data-edition-date]").forEach((el) => {
      el.dateTime = new Date().toISOString().slice(0, 10);
      el.textContent = new Intl.DateTimeFormat(lang === "ar" ? "ar" : lang === "ru" ? "ru-RU" : "en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date());
    });

    if (!list.length) {
      grid.innerHTML = `<p class="news-empty">${esc(dict.desk.empty || "")}</p>`;
      return;
    }

    grid.innerHTML = list
      .map((entry, pos) => {
        const item = entry.item;
        const i = entry.i;
        const n = String(i + 1).padStart(2, "0");
        const title = item.title[lang] || item.title.en;
        const lede = item.lede[lang] || item.lede.en;
        const kind = kindLabel(dict, item.kind);
        const date = formatNewsDate(item.date, lang);
        const src = "assets/news/news-" + item.img + ".jpg";
        const lazy = pos < 4 ? "eager" : "lazy";
        const role = layoutRole(pos);
        const deck =
          role === "lead" || role === "banner"
            ? `<span class="news-deck">${esc(lede)}</span>`
            : "";
        return `<button type="button" class="news-card is-${role}" data-news-index="${i}" data-kind="${item.kind}" style="--i:${pos}" aria-haspopup="dialog">
  <span class="news-frame">
    <img src="${src}" alt="" width="900" height="1200" loading="${lazy}" decoding="async" />
    <span class="news-index" aria-hidden="true">${n}</span>
  </span>
  <span class="news-copy">
    <span class="news-meta">
      <span class="news-outlet">${esc(item.outlet)}</span>
      <time datetime="${esc(item.date)}">${esc(date)}</time>
    </span>
    <span class="news-kind">${esc(kind)}</span>
    <span class="news-headline">${esc(title)}</span>
    ${deck}
  </span>
</button>`;
      })
      .join("");
  }

  function renderLegal(dict, kind) {
    const root = $("#legal-sections");
    if (!root || !dict[kind]) return;
    const data = dict[kind];
    $("#legal-title") && ($("#legal-title").textContent = data.title);
    $("#legal-updated") && ($("#legal-updated").textContent = data.updated);
    $("#legal-lead") && ($("#legal-lead").textContent = data.lead);
    root.innerHTML = data.sections
      .map((s) => `<h2>${s.h}</h2><p>${s.p}</p>`)
      .join("");
  }

  function applyLang(lang) {
    const dict = window.I18N[lang] || window.I18N.en;
    document.documentElement.lang = dict.locale;
    document.documentElement.dir = dict.dir;
    localStorage.setItem(STORAGE, lang);

    $$("[data-i18n]").forEach((el) => {
      const value = path(dict, el.getAttribute("data-i18n"));
      if (typeof value === "string") el.textContent = value;
    });

    $$("[data-i18n-aria]").forEach((el) => {
      const value = path(dict, el.getAttribute("data-i18n-aria"));
      if (typeof value === "string") el.setAttribute("aria-label", value);
    });

    $$(".lang-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.lang === lang);
      btn.setAttribute("aria-pressed", btn.dataset.lang === lang ? "true" : "false");
    });

    renderHome(dict);
    refreshArticle();
    const legalKind = document.body.dataset.legal;
    if (legalKind) renderLegal(dict, legalKind);
  }

  function setupMenu() {
    const toggle = $("#menu-toggle");
    const menu = $("#site-menu");
    const closeBtn = $("#menu-close");
    if (!toggle || !menu) return;

    const setOpen = (open) => {
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
      menu.inert = !open;
      if (open) closeBtn?.focus();
      else toggle.focus();
    };

    toggle.addEventListener("click", () => setOpen(!menu.classList.contains("is-open")));
    closeBtn?.addEventListener("click", () => setOpen(false));
    $$(".menu-link", menu).forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) setOpen(false);
    });
  }

  function setupForm() {
    const form = $("#contact-form");
    if (!form) return;
    const status = $("#form-status");
    const submit = $("#form-submit");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const dict = window.I18N[currentLang()] || window.I18N.en;
      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const message = String(data.get("message") || "").trim();
      const consent = $("#consent")?.checked;

      status.className = "form-status";
      if (!name || !email || !message) {
        status.textContent = dict.contact.form.error;
        status.classList.add("is-error");
        return;
      }
      if (!consent) {
        status.textContent = dict.contact.form.consentError;
        status.classList.add("is-error");
        return;
      }

      submit.disabled = true;
      submit.textContent = dict.contact.form.sending;

      const endpoint = window.SITE.formEndpoint;
      try {
        if (endpoint) {
          const res = await fetch(endpoint, {
            method: "POST",
            body: data,
            headers: { Accept: "application/json" },
          });
          if (!res.ok) throw new Error("send");
        } else {
          await new Promise((r) => setTimeout(r, 500));
        }
        form.reset();
        status.textContent = dict.contact.form.success;
        status.classList.add("is-ok");
      } catch {
        status.textContent = dict.contact.form.error;
        status.classList.add("is-error");
      } finally {
        submit.disabled = false;
        submit.textContent = dict.contact.form.submit;
      }
    });
  }

  function setupBooking() {
    const btn = $("#book-call");
    if (!btn) return;
    const url = window.SITE.contact.calendlyUrl;
    if (!url) return;
    btn.href = url;
    btn.target = "_blank";
    btn.rel = "noopener noreferrer";
  }

  function setupNews() {
    const grid = $("#news-grid");
    const article = $("#article");
    const closeBtn = $("#article-close");
    const backBtn = $("#article-back");
    const scrollEl = $("#article-scroll");
    const progress = $("#article-progress");
    if (!grid || !article) return;

    let ignoreHash = false;
    let lastFocus = null;
    const chrome = [
      $("#site-header"),
      $("#main"),
      document.querySelector(".site-footer"),
      document.querySelector(".ribbon"),
      document.querySelector(".skip"),
      $("#placeholder-banner"),
    ];

    const setOpen = (open) => {
      const already = article.classList.contains("is-open");
      article.classList.toggle("is-open", open);
      document.body.classList.toggle("article-open", open);
      article.setAttribute("aria-hidden", open ? "false" : "true");
      article.inert = !open;
      chrome.forEach((el) => {
        if (el) el.inert = open;
      });
      if (open) {
        if (scrollEl) scrollEl.scrollTop = 0;
        updateProgress();
        if (!already) closeBtn?.focus();
      } else {
        currentStory = -1;
      }
    };

    function updateProgress() {
      if (!scrollEl || !progress) return;
      const max = scrollEl.scrollHeight - scrollEl.clientHeight;
      const p = max > 0 ? scrollEl.scrollTop / max : 0;
      progress.style.transform = "scaleX(" + Math.min(1, Math.max(0, p)) + ")";
    }

    function storyHash(index) {
      return "#story-" + String(index + 1).padStart(2, "0");
    }

    function parseStoryHash() {
      const m = String(location.hash || "").match(/^#story-0*(\d+)$/);
      if (!m) return -1;
      return Number(m[1]) - 1;
    }

    function grafsFor(item, lang) {
      const pack = window.ARTICLE_GRAFS && window.ARTICLE_GRAFS[item.kind];
      if (!pack) return [];
      return pack[lang] || pack.en || [];
    }

    function navList(index) {
      const vis = visibleNews().map((entry) => entry.i);
      if ((activeKind || activeOutlet) && vis.includes(index)) return vis;
      return (window.NEWS || []).map((_, i) => i);
    }

    function relatedFor(index) {
      const items = window.NEWS || [];
      const current = items[index];
      if (!current) return [];
      const others = items.map((item, i) => ({ item, i })).filter((entry) => entry.i !== index);
      const sameKind = others.filter((entry) => entry.item.kind === current.kind);
      const sameOutlet = others.filter((entry) => entry.item.outlet === current.outlet);
      const pool = sameKind.length ? sameKind : sameOutlet.length ? sameOutlet : others;
      return pool.slice(0, 3);
    }

    function fillNav(button, label, title, disabled) {
      if (!button) return;
      button.disabled = disabled;
      const dir = button.querySelector(".article-nav-dir");
      const name = button.querySelector(".article-nav-title");
      if (dir) dir.textContent = label;
      if (name) name.textContent = disabled ? "" : title;
    }

    function fillArticle(index) {
      const item = window.NEWS[index];
      if (!item) return;
      const lang = newsLang();
      const dict = window.I18N[lang] || window.I18N.en;
      const title = item.title[lang] || item.title.en;
      const lede = item.lede[lang] || item.lede.en;
      const kind = kindLabel(dict, item.kind);
      const date = formatNewsDate(item.date, lang);
      const n = String(index + 1).padStart(2, "0");
      const total = String(window.NEWS.length).padStart(2, "0");
      const img = $("#article-image");
      const folio = $("#article-folio");
      const printed = $("#article-printed");
      const kicker = $("#article-kicker");
      const heading = $("#article-title");
      const standfirst = $("#article-standfirst");
      const byline = $("#article-byline");
      const body = $("#article-body");
      const meta = $("#article-bar-meta");
      const prev = $("#article-prev");
      const next = $("#article-next");
      const related = $("#article-related");
      const moreWrap = $("#article-more");
      const list = navList(index);
      const pos = list.indexOf(index);

      if (img) {
        img.src = "assets/news/news-" + item.img + ".jpg";
        img.alt = title;
      }
      if (folio) folio.textContent = n;
      if (printed) printed.textContent = (dict.desk.printed || "") + " " + item.outlet;
      if (kicker) kicker.textContent = kind;
      if (heading) heading.textContent = title;
      if (standfirst) standfirst.textContent = lede;
      if (byline) {
        byline.textContent =
          date + "  ·  " + (dict.article && dict.article.byline ? dict.article.byline : "");
      }
      if (meta) meta.textContent = item.outlet + "  ·  " + n + " / " + total;
      if (body) {
        const grafs = grafsFor(item, lang);
        body.innerHTML = grafs
          .map((p, i) => `<p${i === 0 ? ' class="is-drop"' : ""}>${esc(p)}</p>`)
          .join("");
      }
      const prevIndex = pos > 0 ? list[pos - 1] : -1;
      const nextIndex = pos >= 0 && pos < list.length - 1 ? list[pos + 1] : -1;
      const prevItem = prevIndex >= 0 ? window.NEWS[prevIndex] : null;
      const nextItem = nextIndex >= 0 ? window.NEWS[nextIndex] : null;
      fillNav(
        prev,
        dict.article ? dict.article.prev : "Previous",
        prevItem ? prevItem.title[lang] || prevItem.title.en : "",
        prevIndex < 0
      );
      fillNav(
        next,
        dict.article ? dict.article.next : "Next",
        nextItem ? nextItem.title[lang] || nextItem.title.en : "",
        nextIndex < 0
      );
      prev && (prev.dataset.target = String(prevIndex));
      next && (next.dataset.target = String(nextIndex));
      if (related) {
        const more = relatedFor(index);
        if (moreWrap) moreWrap.hidden = more.length === 0;
        related.innerHTML = more
          .map((entry) => {
            const t = entry.item.title[lang] || entry.item.title.en;
            const k = kindLabel(dict, entry.item.kind);
            return `<button type="button" class="article-related-card" data-news-index="${entry.i}">
  <img src="assets/news/news-${entry.item.img}.jpg" alt="" width="400" height="533" loading="lazy" />
  <span>${esc(k)} · ${esc(entry.item.outlet)}</span>
  <b>${esc(t)}</b>
</button>`;
          })
          .join("");
      }
    }

    function openItem(index, fromHash) {
      if (!window.NEWS || !window.NEWS[index]) return;
      if (!fromHash && !article.classList.contains("is-open")) {
        lastFocus = document.activeElement;
      }
      currentStory = index;
      fillArticle(index);
      setOpen(true);
      if (!fromHash && location.hash !== storyHash(index)) {
        ignoreHash = true;
        location.hash = storyHash(index);
        ignoreHash = false;
      }
    }

    function closeArticle() {
      const restore = lastFocus;
      setOpen(false);
      lastFocus = null;
      if (/^#story-/.test(location.hash)) {
        ignoreHash = true;
        history.replaceState(null, "", location.pathname + location.search);
        ignoreHash = false;
      }
      if (restore && typeof restore.focus === "function") restore.focus();
    }

    refreshArticle = () => {
      if (currentStory >= 0) fillArticle(currentStory);
    };

    grid.addEventListener("click", (e) => {
      const card = e.target.closest("[data-news-index]");
      if (!card) return;
      openItem(Number(card.dataset.newsIndex), false);
    });
    closeBtn?.addEventListener("click", closeArticle);
    backBtn?.addEventListener("click", closeArticle);
    $("#article-prev")?.addEventListener("click", () => {
      const target = Number($("#article-prev")?.dataset.target);
      if (target >= 0) openItem(target, false);
    });
    $("#article-next")?.addEventListener("click", () => {
      const target = Number($("#article-next")?.dataset.target);
      if (target >= 0) openItem(target, false);
    });
    $("#article-related")?.addEventListener("click", (e) => {
      const card = e.target.closest("[data-news-index]");
      if (!card) return;
      openItem(Number(card.dataset.newsIndex), false);
      if (scrollEl) scrollEl.scrollTop = 0;
    });
    scrollEl?.addEventListener("scroll", updateProgress, { passive: true });
    document.addEventListener("keydown", (e) => {
      if (!article.classList.contains("is-open")) return;
      if (e.key === "Escape") closeArticle();
      const rtl = document.documentElement.dir === "rtl";
      if (e.key === "ArrowLeft") (rtl ? $("#article-next") : $("#article-prev"))?.click();
      if (e.key === "ArrowRight") (rtl ? $("#article-prev") : $("#article-next"))?.click();
    });
    article.addEventListener("keydown", (e) => {
      if (e.key !== "Tab" || !article.classList.contains("is-open")) return;
      const nodes = [...article.querySelectorAll("button")].filter((el) => !el.disabled);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    window.addEventListener("hashchange", () => {
      if (ignoreHash) return;
      const index = parseStoryHash();
      if (index >= 0) openItem(index, true);
      else if (article.classList.contains("is-open")) {
        const restore = lastFocus;
        setOpen(false);
        lastFocus = null;
        if (restore && typeof restore.focus === "function") restore.focus();
      }
    });

    const initial = parseStoryHash();
    if (initial >= 0) openItem(initial, true);
  }

  function setupTypes() {
    const ribbon = $("#editions");
    if (!ribbon) return;

    ribbon.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-kind]");
      if (!btn) return;
      const next = btn.dataset.kind || "";
      if (btn.classList.contains("ribbon-all") || next === "") {
        activeKind = "";
        activeOutlet = "";
      } else {
        activeKind = activeKind === next ? "" : next;
      }
      const dict = window.I18N[newsLang()] || window.I18N.en;
      renderHome(dict);
      scrollToDesk();
    });
  }

  function setupPress() {
    const row = $("#press-marks");
    if (!row) return;
    row.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-outlet]");
      if (!btn) return;
      const next = btn.dataset.outlet || "";
      activeOutlet = activeOutlet === next ? "" : next;
      const dict = window.I18N[newsLang()] || window.I18N.en;
      renderHome(dict);
      scrollToDesk();
    });
  }

  function scrollToDesk() {
    const desk = $("#desk");
    const ribbon = $("#editions");
    if (!desk) return;
    const offset = (ribbon ? ribbon.getBoundingClientRect().height : 56) + 52;
    const top = desk.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  function setupHeader() {
    const header = $("#site-header");
    if (!header) return;
    const root = document.documentElement;
    const onScroll = () => {
      const compact = window.scrollY > 28;
      header.classList.toggle("is-scrolled", compact);
      header.classList.toggle("is-compact", compact);
      root.style.setProperty("--header-h", compact ? "3.15rem" : "4.75rem");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  function setupLangButtons() {
    $$(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => applyLang(btn.dataset.lang));
    });
  }

  applyBrand();
  applyLang(currentLang());
  setupMenu();
  setupForm();
  setupBooking();
  setupNews();
  setupTypes();
  setupPress();
  setupHeader();
  setupLangButtons();
})();
