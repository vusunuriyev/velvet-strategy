(function () {
  const LANGS = ["en", "ar", "ru"];
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  const STORAGE = "northline-lang";

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

    const banner = $("#placeholder-banner");
    if (banner && s.showPlaceholderBanner) banner.classList.add("is-on");
  }

  function renderHome(dict) {
    const offer = $("#offer-grid");
    if (offer) {
      offer.innerHTML = dict.offer.items
        .map(
          (item, i) =>
            `<article class="offer-row"><span class="offer-num">${ROMAN[i] || i + 1}</span><div><h3>${item.title}</h3><p>${item.body}</p></div></article>`
        )
        .join("");
    }

    const mandates = $("#mandate-list");
    if (mandates && dict.mandates) {
      mandates.innerHTML = dict.mandates.items
        .map(
          (m) =>
            `<article class="mandate"><time>${m.year}</time><strong>${m.title}</strong><span>${m.sector}</span></article>`
        )
        .join("");
    }
    const sectors = $("#sector-list");
    if (sectors) {
      sectors.innerHTML = dict.sectors.items
        .map((name) => `<span class="sector">${name}</span>`)
        .join("");
    }

    const stats = $("#stats");
    if (stats) {
      stats.innerHTML = dict.proof.stats
        .map(
          (s) =>
            `<div class="stat"><strong>${s.value}</strong><span>${s.label}</span></div>`
        )
        .join("");
    }

    const why = $("#why-grid");
    if (why) {
      why.innerHTML = dict.why.items
        .map(
          (item, i) =>
            `<article class="why-card"><span class="why-index">0${i + 1}</span><h3>${item.title}</h3><p>${item.body}</p></article>`
        )
        .join("");
    }

    const global = $("#media-global");
    if (global) {
      global.innerHTML = dict.coverage.globalNames.map((n) => `<li>${n}</li>`).join("");
    }
    const regional = $("#media-regional");
    if (regional) {
      regional.innerHTML = dict.coverage.regionalNames.map((n) => `<li>${n}</li>`).join("");
    }
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
    const toast = $("#toast");
    if (!btn) return;
    const url = window.SITE.contact.calendlyUrl;
    if (url) {
      btn.href = url;
      btn.target = "_blank";
      btn.rel = "noopener noreferrer";
      return;
    }
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!toast) return;
      const dict = window.I18N[currentLang()] || window.I18N.en;
      toast.textContent = dict.contact.bookingSoon;
      toast.classList.add("is-on");
      setTimeout(() => toast.classList.remove("is-on"), 4200);
    });
  }

  function setupFilm() {
    const film = $("#film");
    const closeBtn = $("#film-close");
    if (!film) return;

    const setOpen = (open) => {
      film.classList.toggle("is-open", open);
      document.body.classList.toggle("film-open", open);
      film.setAttribute("aria-hidden", open ? "false" : "true");
      film.inert = !open;
      if (open) closeBtn?.focus();
    };

    $$("[data-open-film]").forEach((btn) => {
      btn.addEventListener("click", () => setOpen(true));
    });
    closeBtn?.addEventListener("click", () => setOpen(false));
    film.addEventListener("click", (e) => {
      if (e.target === film) setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && film.classList.contains("is-open")) {
        setOpen(false);
      }
    });
  }

  function setupHeader() {
    const header = $("#site-header");
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
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
  setupFilm();
  setupHeader();
  setupLangButtons();
})();
