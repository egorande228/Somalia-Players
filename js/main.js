const menuBtn = document.getElementById("menuBtn");
const siteNav = document.getElementById("siteNav");
const page = document.body.dataset.page;
const storageKey = "melbet_somalia_lang";
const mapModal = document.getElementById("mapModal");

if (menuBtn && siteNav) {
  menuBtn.addEventListener("click", () => {
    siteNav.classList.toggle("is-open");
  });
}

function getLang() {
  const saved = localStorage.getItem(storageKey);
  return window.SITE_DATA.languages.includes(saved) ? saved : "en";
}

function setText(selector, value, allowHtml = false) {
  const node = document.querySelector(selector);
  if (!node || value == null) return;
  if (allowHtml) {
    node.innerHTML = value;
    return;
  }
  node.textContent = value;
}

function applyStaticText(lang) {
  const dict = window.SITE_DATA.text[lang];
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const [group, key] = node.dataset.i18n.split(".");
    if (dict[group] && dict[group][key] != null) {
      node.textContent = dict[group][key];
    }
  });
}

function setMeta(lang) {
  const meta = window.SITE_DATA.meta[page][lang];
  document.title = meta.title;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", meta.description);
  document.documentElement.lang = lang;
}

function markActiveNav() {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.classList.toggle("active", link.dataset.nav === page);
  });
}

function setActiveLangButtons(lang) {
  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === lang);
  });
}

function renderTrendCards(lang, targetId, items, type) {
  const root = document.getElementById(targetId);
  if (!root) return;

  root.innerHTML = items
    .map((item) => {
      return `
        <a class="trend-card ${type}" href="${item.href}">
          <div class="trend-card-media">
            <span class="trend-card-label">${type === "sport" ? "SPORT" : "GAME"}</span>
          </div>
          <div class="trend-card-body">
            <h3>${item.title[lang]}</h3>
            <p class="card-meta">${item.meta[lang]}</p>
            <div class="card-footer">
              <span><span class="status-dot"></span> ${item.players}</span>
              <span>${lang === "so" ? "Link dambe" : "Link later"}</span>
            </div>
          </div>
        </a>
      `;
    })
    .join("");
}

function renderFaqs(lang, targetId, items) {
  const root = document.getElementById(targetId);
  if (!root) return;

  root.innerHTML = items
    .map((item) => {
      return `
        <article class="faq-item">
          <h3>${item.q[lang]}</h3>
          <p>${item.a[lang]}</p>
        </article>
      `;
    })
    .join("");
}

function renderPrograms(lang) {
  const root = document.getElementById("programGrid");
  if (!root) return;

  root.innerHTML = window.SITE_DATA.partnership.programs
    .map((item) => {
      const points = item.points[lang].map((point) => `<li>${point}</li>`).join("");
      return `
        <article class="program-card">
          <span class="program-label">${item.label[lang]}</span>
          <h3>${item.title[lang]}</h3>
          <p>${item.copy[lang]}</p>
          <ul>${points}</ul>
        </article>
      `;
    })
    .join("");
}

function renderWorkflow(lang) {
  const root = document.getElementById("workflowGrid");
  if (!root) return;

  root.innerHTML = window.SITE_DATA.partnership.workflow
    .map((item, index) => {
      return `
        <article class="workflow-card">
          <span class="workflow-step">${String(index + 1).padStart(2, "0")}</span>
          <h3>${item.title[lang]}</h3>
          <p>${item.copy[lang]}</p>
        </article>
      `;
    })
    .join("");
}

function renderPageData(lang) {
  if (page === "home") {
    renderTrendCards(lang, "gamesGrid", window.SITE_DATA.home.games, "game");
    renderTrendCards(lang, "sportsGrid", window.SITE_DATA.home.sports, "sport");
    renderFaqs(lang, "faqList", window.SITE_DATA.home.faqs);
  }

  if (page === "partnership") {
    renderPrograms(lang);
    renderWorkflow(lang);
    renderFaqs(lang, "partnershipFaqList", window.SITE_DATA.partnership.faqs);
  }
}

function applyLanguage(lang) {
  setMeta(lang);
  applyStaticText(lang);
  renderPageData(lang);
  setActiveLangButtons(lang);
  localStorage.setItem(storageKey, lang);
}

function setupMapModal() {
  if (!mapModal) return;

  const openers = [document.getElementById("openMapModal"), document.getElementById("openMapModalInline")].filter(Boolean);
  const closers = [document.getElementById("closeMapModal"), document.getElementById("closeMapModalBtn")].filter(Boolean);

  openers.forEach((button) => {
    button.addEventListener("click", () => {
      mapModal.hidden = false;
      document.body.style.overflow = "hidden";
    });
  });

  closers.forEach((button) => {
    button.addEventListener("click", () => {
      mapModal.hidden = true;
      document.body.style.overflow = "";
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !mapModal.hidden) {
      mapModal.hidden = true;
      document.body.style.overflow = "";
    }
  });
}

function setupMapPan() {
  document.querySelectorAll("[data-map-viewport]").forEach((viewport) => {
    const panzoom = viewport.querySelector("[data-map-panzoom]");
    if (!panzoom) return;

    const state = { x: 0, y: 0, dragging: false, startX: 0, startY: 0, moved: false };

    const applyTransform = () => {
      const scale = viewport.classList.contains("is-modal") ? 1.28 : 0.92;
      panzoom.style.transform = `translate(${state.x}px, ${state.y}px) scale(${scale})`;
    };

    const onPointerDown = (event) => {
      state.dragging = true;
      state.moved = false;
      state.startX = event.clientX - state.x;
      state.startY = event.clientY - state.y;
      viewport.classList.add("is-dragging");
    };

    const onPointerMove = (event) => {
      if (!state.dragging) return;
      state.x = event.clientX - state.startX;
      state.y = event.clientY - state.startY;
      state.moved = true;
      applyTransform();
    };

    const onPointerUp = () => {
      state.dragging = false;
      viewport.classList.remove("is-dragging");
    };

    viewport.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    applyTransform();
  });
}

document.querySelectorAll(".lang-btn").forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.lang);
  });
});

markActiveNav();
applyLanguage(getLang());
setupMapModal();
setupMapPan();
