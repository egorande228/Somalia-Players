const menuBtn = document.getElementById("menuBtn");
const siteNav = document.getElementById("siteNav");
const page = document.body.dataset.page;
const storageKey = "melbet_somalia_lang";
const mapModal = document.getElementById("mapModal");
const mapSection = document.getElementById("agentCashMap");
const modalMapNode = document.getElementById("somaliaMapModal");
const miniMapNode = document.getElementById("somaliaMapMini");
const contactModal = document.getElementById("contactModal");
const contactForm = document.getElementById("contactForm");
const contactSelectedPoint = document.getElementById("contactSelectedPoint");
const contactFormStatus = document.getElementById("contactFormStatus");

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
  // Keep placeholders localized too, because the contact form is rendered once and reused for both languages.
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const [group, key] = node.dataset.i18nPlaceholder.split(".");
    if (dict[group] && dict[group][key] != null) {
      node.setAttribute("placeholder", dict[group][key]);
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

  if (targetId === "partnershipFaqList") {
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
    return;
  }

  root.innerHTML = items
    .map((item, index) => {
      return `
        <details class="home-faq-item"${index === 0 ? " open" : ""}>
          <summary class="home-faq-summary">
            <h3>${escHtml(item.q[lang])}</h3>
            <span class="home-faq-toggle" aria-hidden="true">+</span>
          </summary>
          <div class="home-faq-content">
            <p>${escHtml(item.a[lang])}</p>
          </div>
        </details>
      `;
    })
    .join("");
}

function renderPartnershipShowcase(lang) {
  const data = window.SITE_DATA.partnership;
  const copy = window.SITE_DATA.text[lang].partnership;
  const programsRoot = document.getElementById("partnershipPrograms");
  if (!programsRoot) return;

  const mediaMarkup = {
    affiliate: `
      <div class="program-visual program-visual-affiliate is-animating" aria-hidden="true">
        <div class="affiliate-flow">
          <div class="affiliate-node affiliate-node-code">
            <span class="affiliate-node-label">${escHtml(copy.affiliatePromoCode)}</span>
            <strong class="affiliate-node-value">MELBET7</strong>
          </div>
          <div class="affiliate-flow-arrow affiliate-flow-arrow-top"></div>
          <div class="affiliate-node affiliate-node-link">
            <span class="affiliate-node-label">${escHtml(copy.affiliateReferral)}</span>
            <strong class="affiliate-node-value">melbet.link/7</strong>
          </div>
          <div class="affiliate-flow-arrow affiliate-flow-arrow-middle"></div>
          <div class="affiliate-node affiliate-node-player">
            <span class="affiliate-node-label">${escHtml(copy.affiliatePlayerJoins)}</span>
            <strong class="affiliate-node-value">+128</strong>
          </div>
          <div class="affiliate-flow-arrow affiliate-flow-arrow-bottom"></div>
          <div class="affiliate-node affiliate-node-commission">
            <span class="affiliate-node-label">${escHtml(copy.affiliateCommission)}</span>
            <strong class="affiliate-node-value">25%-50%</strong>
          </div>
        </div>
      </div>
    `,
    agent: `
      <div class="program-visual program-visual-flow is-animating" aria-hidden="true">
        <svg class="flow-diagram" viewBox="0 0 420 228" role="presentation" aria-hidden="true">
          <defs>
            <marker id="flowArrowGold" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <polygon points="0,0 8,4 0,8" fill="#ffd33d"></polygon>
            </marker>
          </defs>
          <circle cx="64" cy="56" r="42" class="flow-node-shape"></circle>
          <circle cx="210" cy="56" r="48" class="flow-node-shape flow-node-shape-center"></circle>
          <circle cx="356" cy="56" r="42" class="flow-node-shape"></circle>
          <circle cx="210" cy="176" r="34" class="flow-node-shape flow-node-shape-agent"></circle>
          <text x="64" y="50" class="flow-node-text">Melbet</text>
          <text x="64" y="66" class="flow-node-text">${escHtml(copy.flowAccount)}</text>
          <text x="210" y="50" class="flow-node-text flow-node-text-center">${escHtml(copy.flowCash)}</text>
          <text x="210" y="67" class="flow-node-text flow-node-text-center">${escHtml(copy.flowAgent)}</text>
          <text x="356" y="60" class="flow-node-text">${escHtml(copy.flowPlayer)}</text>
          <text x="210" y="180" class="flow-node-text">${escHtml(copy.flowLocal)}</text>
          <line x1="160" y1="40" x2="112" y2="40" class="flow-line" marker-end="url(#flowArrowGold)"></line>
          <text x="136" y="31" class="flow-line-label">${escHtml(copy.flowDeposits)}</text>
          <line x1="112" y1="72" x2="160" y2="72" class="flow-line" marker-end="url(#flowArrowGold)"></line>
          <text x="136" y="87" class="flow-line-label">${escHtml(copy.flowWithdrawals)}</text>
          <line x1="260" y1="40" x2="308" y2="40" class="flow-line" marker-end="url(#flowArrowGold)"></line>
          <text x="284" y="31" class="flow-line-label">${escHtml(copy.flowCashOut)}</text>
          <line x1="308" y1="72" x2="260" y2="72" class="flow-line" marker-end="url(#flowArrowGold)"></line>
          <text x="284" y="87" class="flow-line-label">${escHtml(copy.flowCashIn)}</text>
          <line x1="188" y1="104" x2="188" y2="160" class="flow-line" marker-end="url(#flowArrowGold)"></line>
          <text x="150" y="136" class="flow-line-label flow-line-label-bottom flow-line-label-bottom-left">${escHtml(copy.flowCommission)}</text>
          <line x1="232" y1="160" x2="232" y2="104" class="flow-line" marker-end="url(#flowArrowGold)"></line>
          <text x="264" y="144" class="flow-line-label flow-line-label-bottom flow-line-label-bottom-right">${escHtml(copy.flowSupport)}</text>
        </svg>
      </div>
    `
  };

  programsRoot.innerHTML = data.programs
    .map((item) => {
      const bullets = item.bullets
        .map((bullet) => `<li>${escHtml(bullet[lang])}</li>`)
        .join("");

      return `
        <article class="program-card-compact program-tone-${item.tone}">
          ${mediaMarkup[item.media] || ""}
          <div class="program-card-copy">
            <h3>${escHtml(item.title[lang])}</h3>
            <p>${escHtml(item.copy[lang])}</p>
            <ul>${bullets}</ul>
            <a class="program-cta-link" href="./partnership.html">${escHtml(item.cta[lang])}</a>
          </div>
        </article>
      `;
    })
    .join("");
}

function setupProgramAnimations() {
  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;
}

function setupIncomeCalculator(lang) {
  if (page !== "partnership") return;

  const volumeRange = document.getElementById("volumeRange");
  const daysRange = document.getElementById("daysRange");
  const volumeValue = document.getElementById("volumeValue");
  const daysValue = document.getElementById("daysValue");
  const commissionValue = document.getElementById("commissionValue");
  const copy = window.SITE_DATA.text[lang].partnership;
  const commissionRate = 0.07;

  if (!volumeRange || !daysRange || !volumeValue || !daysValue || !commissionValue) return;

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });

  const render = () => {
    const volume = Number(volumeRange.value);
    const days = Number(daysRange.value);
    const total = volume * days * commissionRate;

    volumeValue.textContent = formatter.format(volume);
    daysValue.textContent = `${days} ${copy.dayUnit}`;
    commissionValue.textContent = formatter.format(total);
  };

  if (!volumeRange.dataset.bound) {
    volumeRange.addEventListener("input", render);
    volumeRange.dataset.bound = "true";
  }

  if (!daysRange.dataset.bound) {
    daysRange.addEventListener("input", render);
    daysRange.dataset.bound = "true";
  }

  render();
}

function renderPageData(lang) {
  if (page === "home") {
    renderTrendCards(lang, "gamesGrid", window.SITE_DATA.home.games, "game");
    renderTrendCards(lang, "sportsGrid", window.SITE_DATA.home.sports, "sport");
    renderFaqs(lang, "faqList", window.SITE_DATA.home.faqs);
  }

  if (page === "partnership") {
    renderPartnershipShowcase(lang);
    setupProgramAnimations();
    setupIncomeCalculator(lang);
    renderFaqs(lang, "partnershipFaqList", window.SITE_DATA.partnership.faqs);
  }
}

function applyLanguage(lang) {
  setMeta(lang);
  applyStaticText(lang);
  renderPageData(lang);
  setActiveLangButtons(lang);
  updateSelectedPointLabel(lang);
  localStorage.setItem(storageKey, lang);
}

function updateSelectedPointLabel(lang) {
  if (!contactSelectedPoint) return;
  const agent = window.__selectedAgent;
  if (!agent) {
    contactSelectedPoint.innerHTML = "";
    return;
  }

  const label = window.SITE_DATA.text[lang].home.formSelectedPoint;
  const tier = agent.tier ? `${agent.tier.charAt(0).toUpperCase()}${agent.tier.slice(1)}` : "";
  contactSelectedPoint.innerHTML = `
    <span class="contact-selected-label">${escHtml(label)}</span>
    <strong>${escHtml(agent.city || agent.name)}</strong>
    <span>${escHtml(tier)}</span>
  `;
}

function setupContactForm() {
  if (!contactModal || !contactForm) return;
  const name = document.getElementById("contactName");
  const telegram = document.getElementById("contactTelegram");
  const whatsapp = document.getElementById("contactWhatsapp");

  const closeButtons = [document.getElementById("closeContactModal"), document.getElementById("closeContactModalBtn")].filter(Boolean);

  const closeContactModal = () => {
    contactModal.hidden = true;
    contactModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("contact-modal-open");
    document.body.style.overflow = "";
    if (contactFormStatus) {
      contactFormStatus.textContent = "";
      contactFormStatus.classList.remove("is-error", "is-success");
    }
  };

  // The modal is opened from a map marker, so we keep the selected point visible inside the form.
  window.openContactModal = (agent) => {
    window.__selectedAgent = agent;
    updateSelectedPointLabel(getLang());
    contactModal.hidden = false;
    contactModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("contact-modal-open");
    document.body.style.overflow = "hidden";
  };

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeContactModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && contactModal && !contactModal.hidden) {
      closeContactModal();
    }
  });

  // Require at least one messenger contact: Telegram or WhatsApp.
  const validateContactChannels = () => {
    const lang = getLang();
    const dict = window.SITE_DATA.text[lang].home;
    const hasTelegram = telegram && telegram.value.trim();
    const hasWhatsapp = whatsapp && whatsapp.value.trim();
    const valid = Boolean(hasTelegram || hasWhatsapp);
    const message = valid ? "" : dict.formValidationContact;
    if (telegram) telegram.setCustomValidity(message);
    if (whatsapp) whatsapp.setCustomValidity(message);
    return valid;
  };

  if (telegram) {
    telegram.addEventListener("input", validateContactChannels);
  }

  if (whatsapp) {
    whatsapp.addEventListener("input", validateContactChannels);
  }

  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const lang = getLang();
    const dict = window.SITE_DATA.text[lang].home;
    const hasName = name && name.value.trim();

    if (contactFormStatus) {
      contactFormStatus.classList.remove("is-error", "is-success");
    }

    if (!hasName) {
      if (contactFormStatus) {
        contactFormStatus.textContent = dict.formValidationName;
        contactFormStatus.classList.add("is-error");
      }
      if (name) name.focus();
      return;
    }

    if (!validateContactChannels()) {
      if (contactFormStatus) {
        contactFormStatus.textContent = dict.formValidationContact;
        contactFormStatus.classList.add("is-error");
      }
      if (telegram) telegram.focus();
      return;
    }

    if (contactFormStatus) {
      contactFormStatus.textContent = dict.formSuccess;
      contactFormStatus.classList.add("is-success");
    }

    contactForm.reset();
    updateSelectedPointLabel(lang);
  });
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

  // Clicking a marker opens the unified contact form instead of exposing direct messenger links.
  const marker = window.L.marker([agent.lat, agent.lng], { icon });
  marker.on("click", () => {
    if (typeof window.openContactModal === "function") {
      window.openContactModal(agent);
    }
  });
  marker.bindTooltip(`${agent.city || agent.name}`, { direction: "top", offset: [0, -12] });
  return marker;
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

function ensureHomeVisualIntegrity() {
  if (page !== "home") return;

  const lang = getLang();
  const gamesRoot = document.getElementById("gamesGrid");
  const sportsRoot = document.getElementById("sportsGrid");

  if (gamesRoot && !gamesRoot.querySelector(".trend-card")) {
    renderTrendCards(lang, "gamesGrid", window.SITE_DATA.home.games, "game");
  }

  if (sportsRoot && !sportsRoot.querySelector(".trend-card")) {
    renderTrendCards(lang, "sportsGrid", window.SITE_DATA.home.sports, "sport");
  }

  if (miniMapNode) {
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

    if (!window.__somaliaMiniMap) {
      window.__somaliaMiniMap = createSomaliaMap("somaliaMapMini", 5);
    } else if (typeof window.__somaliaMiniMap.invalidateSize === "function") {
      window.__somaliaMiniMap.invalidateSize();
    }
  }
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
setupContactForm();
setupLeafletMaps();
setTimeout(ensureHomeVisualIntegrity, 180);
setTimeout(ensureHomeVisualIntegrity, 900);
