(function () {
  const LANGS = ["en", "ar", "ru"];
  const STORAGE = "northline-lang";
  let activeKind = "";
  let activeOutlet = "";

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
    const clipping = $("#clipping");
    const closeBtn = $("#clipping-close");
    if (!grid || !clipping) return;

    const setOpen = (open) => {
      clipping.classList.toggle("is-open", open);
      document.body.classList.toggle("clipping-open", open);
      clipping.setAttribute("aria-hidden", open ? "false" : "true");
      clipping.inert = !open;
      if (open) closeBtn?.focus();
    };

    const openItem = (index) => {
      const item = window.NEWS[index];
      if (!item) return;
      const lang = newsLang();
      const dict = window.I18N[lang] || window.I18N.en;
      const title = item.title[lang] || item.title.en;
      const lede = item.lede[lang] || item.lede.en;
      const kind = (dict.desk && dict.desk.kind && dict.desk.kind[item.kind]) || item.kind;
      const date = formatNewsDate(item.date, lang);
      const n = String(index + 1).padStart(2, "0");
      const img = $("#clipping-image");
      const kicker = $("#clipping-kicker");
      const heading = $("#clipping-title");
      const body = $("#clipping-lede");
      const pull = $("#clipping-pull");
      const printed = $("#clipping-printed");
      const folio = $("#clipping-folio");
      if (img) {
        img.src = "assets/news/news-" + item.img + ".jpg";
        img.alt = title;
      }
      if (printed) printed.textContent = (dict.desk.printed || "As printed in") + " " + item.outlet;
      if (kicker) kicker.textContent = kind + "  ·  " + date;
      if (heading) heading.textContent = title;
      if (pull) {
        const first = lede.split(/(?<=[.؟!])\s+/)[0] || lede;
        pull.textContent = first;
      }
      if (body) body.textContent = lede;
      if (folio) folio.textContent = n;
      setOpen(true);
    };

    grid.addEventListener("click", (e) => {
      const card = e.target.closest("[data-news-index]");
      if (!card) return;
      openItem(Number(card.dataset.newsIndex));
    });
    closeBtn?.addEventListener("click", () => setOpen(false));
    clipping.addEventListener("click", (e) => {
      if (e.target === clipping) setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && clipping.classList.contains("is-open")) {
        setOpen(false);
      }
    });
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
