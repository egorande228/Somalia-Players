const menuBtn = document.getElementById("menuBtn");
const siteNav = document.getElementById("siteNav");
const page = document.body.dataset.page;
const storageKey = "melbet_somalia_lang";
const mapModal = document.getElementById("mapModal");
const mapSection = document.getElementById("agentCashMap");
const modalMapNode = document.getElementById("somaliaMapModal");
const miniMapNode = document.getElementById("somaliaMapMini");

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

  const mountModalMap = () => {
    if (!modalMapNode) return;
    if (window.__somaliaModalMap) {
      window.__somaliaModalMap.remove();
      window.__somaliaModalMap = null;
    }
    modalMapNode.innerHTML = "";
    window.__somaliaModalMap = createSomaliaMap("somaliaMapModal", 6);
  };

  const unmountModalMap = () => {
    if (window.__somaliaModalMap) {
      window.__somaliaModalMap.remove();
      window.__somaliaModalMap = null;
    }
    if (modalMapNode) {
      modalMapNode.innerHTML = "";
    }
  };

  const hideMiniMap = () => {
    if (!miniMapNode) return;
    miniMapNode.style.visibility = "hidden";
    miniMapNode.style.opacity = "0";
    miniMapNode.style.pointerEvents = "none";
    const viewport = miniMapNode.closest(".map-viewport");
    if (viewport) {
      viewport.style.visibility = "hidden";
      viewport.style.opacity = "0";
    }
    const card = miniMapNode.closest(".map-card");
    if (card) {
      card.style.visibility = "hidden";
    }
  };

  const showMiniMap = () => {
    if (!miniMapNode) return;
    miniMapNode.style.visibility = "";
    miniMapNode.style.opacity = "";
    miniMapNode.style.pointerEvents = "";
    const viewport = miniMapNode.closest(".map-viewport");
    if (viewport) {
      viewport.style.visibility = "";
      viewport.style.opacity = "";
    }
    const card = miniMapNode.closest(".map-card");
    if (card) {
      card.style.visibility = "";
    }
  };

  openers.forEach((button) => {
    button.addEventListener("click", () => {
      mapModal.hidden = false;
      mapModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("map-modal-open");
      document.body.style.overflow = "hidden";
      hideMiniMap();
      setTimeout(() => {
        mountModalMap();
        if (window.__somaliaModalMap) {
          window.__somaliaModalMap.invalidateSize();
        }
      }, 80);
    });
  });

  closers.forEach((button) => {
    button.addEventListener("click", () => {
      unmountModalMap();
      mapModal.hidden = true;
      mapModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("map-modal-open");
      document.body.style.overflow = "";
      showMiniMap();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !mapModal.hidden) {
      unmountModalMap();
      mapModal.hidden = true;
      mapModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("map-modal-open");
      document.body.style.overflow = "";
      showMiniMap();
    }
  });
}

function createSomaliaMap(nodeId, zoom) {
  const container = document.getElementById(nodeId);
  if (!container || typeof window.L === "undefined") return null;

  const somaliaBounds = [
    [-1.85, 40.5],
    [12.2, 51.7]
  ];

  const map = window.L.map(container, {
    zoomControl: true,
    scrollWheelZoom: true,
    attributionControl: true
  });

  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  map.fitBounds(somaliaBounds, { padding: [18, 18] });
  if (zoom) {
    map.setZoom(zoom);
  }

  const badge = window.L.control({ position: "topleft" });
  badge.onAdd = function onAdd() {
    const div = window.L.DomUtil.create("div", "map-country-badge");
    div.textContent = "Somalia";
    return div;
  };
  badge.addTo(map);

  return map;
}

function setupLeafletMaps() {
  if (page !== "home") return;

  window.__somaliaMiniMap = createSomaliaMap("somaliaMapMini", 5);
}

document.querySelectorAll(".lang-btn").forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.lang);
  });
});

markActiveNav();
applyLanguage(getLang());
setupMapModal();
setupLeafletMaps();
