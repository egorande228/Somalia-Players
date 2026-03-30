const menuBtn = document.getElementById("menuBtn");
const siteNav = document.getElementById("siteNav");
const page = document.body.dataset.page;
const storageKey = "melbet_somalia_lang";
const mapModal = document.getElementById("mapModal");
const mapSection = document.getElementById("agentCashMap");
const modalMapNode = document.getElementById("somaliaMapModal");
const miniMapNode = document.getElementById("somaliaMapMini");

if (menuBtn && siteNav) {
  menuBtn.setAttribute("aria-expanded", "false");
  menuBtn.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  });
}

function getLang() {
  const saved = localStorage.getItem(storageKey);
  return window.SITE_DATA.languages.includes(saved) ? saved : "en";
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


function applyStaticText(lang) {
  const dict = window.SITE_DATA.text[lang];
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const [group, key] = node.dataset.i18n.split(".");
    if (dict[group] && dict[group][key] != null) {
      node.textContent = dict[group][key];
    }
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    const [group, key] = node.dataset.i18nAria.split(".");
    if (dict[group] && dict[group][key] != null) {
      node.setAttribute("aria-label", dict[group][key]);
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

function buildAssetUrl(url) {
  if (!url) return "";
  if (/^(https?:|data:)/.test(url)) return url;

  const version = window.SITE_DATA.assetVersion;
  if (!version) return url;
  return url.includes("?") ? `${url}&v=${version}` : `${url}?v=${version}`;
}

function renderTrendCards(lang, targetId, items, type) {
  const root = document.getElementById(targetId);
  if (!root) return;

  root.innerHTML = items
    .map((item) => {
      const imageUrl = buildAssetUrl(item.image);
      const mediaStyle = item.image
        ? ` style="background-image:url('${imageUrl}');background-size:cover;background-position:center;background-repeat:no-repeat"`
        : "";

      return `
        <a class="trend-card ${type}" href="${escHtml(item.href)}">
          <div class="trend-card-media"${mediaStyle}>
            <span class="trend-card-label">${type === "sport" ? "SPORT" : "GAME"}</span>
          </div>
          <div class="trend-card-body">
            <h3>${escHtml(item.title[lang])}</h3>
            <p class="card-meta">${escHtml(item.meta[lang])}</p>
            <div class="card-footer">
              <span><span class="status-dot"></span> ${escHtml(item.players)}</span>
            </div>
          </div>
        </a>
      `;
    })
    .join("");
}

function setupTrendScrollControls() {
  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.scrollTarget;
      const direction = button.dataset.scrollDir === "prev" ? -1 : 1;
      const target = document.getElementById(targetId);
      if (!target) return;

      const firstCard = target.querySelector(".trend-card");
      const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 320;
      target.scrollBy({
        left: direction * (cardWidth + 16) * 2,
        behavior: "smooth"
      });
    });
  });
}

function renderFaqs(lang, targetId, items) {
  const root = document.getElementById(targetId);
  if (!root) return;

  root.innerHTML = items
    .map((item) => {
      return `
        <article class="faq-item">
          <h3>${escHtml(item.q[lang])}</h3>
          <p>${escHtml(item.a[lang])}</p>
        </article>
      `;
    })
    .join("");
}

function renderPartnershipShowcase(lang) {
  const data = window.SITE_DATA.partnership;
  const heroRoot = document.getElementById("partnershipHeroCards");
  const sharedRoot = document.getElementById("sharedPillarsGrid");
  const agentRoot = document.getElementById("agentDifferenceGrid");
  const partnerRoot = document.getElementById("partnerDifferenceGrid");
  const agentDetailRoot = document.getElementById("agentDetailGrid");
  const partnerDetailRoot = document.getElementById("partnerDetailGrid");

  if (heroRoot) {
    heroRoot.innerHTML = data.heroCards
      .map((item) => {
        const stats = item.stats
          .map(
            (stat) => `
              <article class="partner-mini-card">
                <h3>${stat.title[lang]}</h3>
                <p>${stat.copy[lang]}</p>
              </article>
            `
          )
          .join("");

        return `
          <article class="partner-card partner-card-${item.tone}">
            <div class="partner-card-shell">
              <div class="partner-card-badge">${item.label[lang]}</div>
              <div class="partner-card-glow"></div>
              <div class="partner-card-main">
                <h2>${item.title[lang]}</h2>
                <p>${item.copy[lang]}</p>
                <a class="partner-cta" href="#">${item.cta[lang]}</a>
              </div>
              <div class="partner-mini-grid">${stats}</div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  if (sharedRoot) {
    sharedRoot.innerHTML = data.sharedCards
      .map(
        (item) => `
          <article class="partner-pillar-card">
            <h3>${item.title[lang]}</h3>
            <p>${item.copy[lang]}</p>
          </article>
        `
      )
      .join("");
  }

  const renderDifferenceCards = (root, items) => {
    if (!root) return;
    root.innerHTML = items
      .map(
        (item) => `
          <article class="difference-card">
            <h3>${item.title[lang]}</h3>
            <p>${item.copy[lang]}</p>
          </article>
        `
      )
      .join("");
  };

  renderDifferenceCards(agentRoot, data.differences.agent);
  renderDifferenceCards(partnerRoot, data.differences.partner);
  renderDifferenceCards(agentDetailRoot, data.details.agent);
  renderDifferenceCards(partnerDetailRoot, data.details.partner);
}

function renderPageData(lang) {
  if (page === "home") {
    renderTrendCards(lang, "gamesGrid", window.SITE_DATA.home.games, "game");
    renderTrendCards(lang, "sportsGrid", window.SITE_DATA.home.sports, "sport");
    renderFaqs(lang, "faqList", window.SITE_DATA.home.faqs);
  }

  if (page === "partnership") {
    renderPartnershipShowcase(lang);
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

function createStaticSomaliaMap(nodeId) {
  const container = document.getElementById(nodeId);
  if (!container) return null;

  container.innerHTML = `
    <div class="map-panzoom">
      <svg class="somalia-map" viewBox="0 0 320 420" aria-label="Somalia map">
        <defs>
          <linearGradient id="${nodeId}Fill" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stop-color="#8fe0ff" />
            <stop offset="55%" stop-color="#2aa7ff" />
            <stop offset="100%" stop-color="#0f6fd5" />
          </linearGradient>
          <filter id="${nodeId}Glow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#7fd5ff" flood-opacity="0.45" />
          </filter>
        </defs>
        <g filter="url(#${nodeId}Glow)">
          <path
            class="somalia-shape"
            style="fill:url(#${nodeId}Fill)"
            d="M155 24 C172 34 184 58 188 87 C193 121 190 150 196 178 C203 212 220 237 233 269 C247 303 253 338 245 365 C239 384 226 395 213 391 C196 386 186 360 181 332 C176 303 167 276 155 247 C146 226 137 199 132 170 C126 136 124 104 126 77 C129 49 139 29 155 24 Z"
          />
        </g>
        <path d="M116 72 C132 78 146 85 162 104" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2" stroke-dasharray="5 8" />
        <path d="M152 238 C167 250 181 274 192 314" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2" stroke-dasharray="5 8" />
        <circle class="map-pin" cx="141" cy="78" r="7" />
        <circle class="map-pin" cx="176" cy="112" r="7" />
        <circle class="map-pin" cx="160" cy="242" r="7" />
        <circle class="map-pin" cx="198" cy="323" r="7" />
        <text class="map-label" x="78" y="70">Hargeisa</text>
        <text class="map-label" x="190" y="104">Bosaso</text>
        <text class="map-label" x="92" y="238">Mogadishu</text>
        <text class="map-label" x="208" y="318">Kismayo</text>
      </svg>
    </div>
  `;

  return {
    remove() {
      container.innerHTML = "";
    },
    invalidateSize() {}

  };
}

function createAgentMarker(agent) {
  const isElite = agent.tier === "elite";
  const icon = window.L.divIcon({
    className: "",
    html: `<div class="agent-marker agent-marker--${agent.tier}"></div>`,
    iconSize: isElite ? [20, 24] : [18, 18],
    iconAnchor: isElite ? [10, 24] : [9, 9],
    popupAnchor: [0, -4]
  });

  const svgWa = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.553 4.103 1.522 5.829L.057 23.196a.75.75 0 0 0 .92.92l5.429-1.456A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.717 9.717 0 0 1-4.964-1.361l-.355-.212-3.685.988.997-3.598-.232-.371A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>`;
  const svgTg = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/></svg>`;

  const links = [];
  if (agent.whatsapp) {
    links.push(`<a class="agent-contact-btn agent-contact-btn--wa" href="https://wa.me/${agent.whatsapp.replace(/\+/g, "")}" target="_blank" rel="noopener" title="WhatsApp">${svgWa}</a>`);
  }
  if (agent.telegram) {
    links.push(`<a class="agent-contact-btn agent-contact-btn--tg" href="https://t.me/${agent.telegram}" target="_blank" rel="noopener" title="Telegram">${svgTg}</a>`);
  }

  const popup = `<div class="agent-popup">
    <strong>${agent.name}</strong>
    <span class="agent-popup-tier agent-popup-tier--${agent.tier}">${agent.tier}</span>
    <div class="agent-popup-links">${links.join("")}</div>
  </div>`;

  return window.L.marker([agent.lat, agent.lng], { icon }).bindPopup(popup);
}

function createSomaliaMap(nodeId, zoom) {
  const container = document.getElementById(nodeId);
  if (!container) return null;
  if (typeof window.L === "undefined") {
    return createStaticSomaliaMap(nodeId);
  }

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

  (window.SITE_DATA.agents || []).forEach((agent) => {
    createAgentMarker(agent).addTo(map);
  });

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
setupTrendScrollControls();
setupMapModal();
setupLeafletMaps();
