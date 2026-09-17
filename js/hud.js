/* ============================================================
   HUD / CONTENT LAYER — reads content from js/data.js, controls
   the intro sequence, navigation, section panels, custom cursor,
   and the contact form. All real content, no invented data.
   ============================================================ */

(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  const SECTIONS = [
    { id: "about", label: "About" },
    { id: "projects", label: "Projects" },
    { id: "skills", label: "Skills" },
     { id: "contact", label: "Contact" },
  ];

  function isPlaceholder(v) {
    return !v || /^\[.*\]$/.test(String(v).trim());
  }

  /* ---------------- Intro sequence ----------------
     Classic, brief, fully automatic: name + title fade in, hold for a
     couple of seconds like a title card, then the universe reveals
     itself on its own. No buttons, no countdown gimmick — reduced
     motion just skips straight in. */
  const intro = document.getElementById("intro");
  const introTitle = document.getElementById("intro-title");
  const introSubtitle = document.getElementById("intro-subtitle");

  introTitle.textContent = profile.name;
  introSubtitle.textContent = profile.title;

  function beginJourney() {
    intro.classList.add("intro-hidden");
    setTimeout(() => { intro.style.display = "none"; }, 900);
    document.getElementById("hud").classList.add("hud-visible");
    journeyStarted = true;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    beginJourney();
  } else {
    setTimeout(beginJourney, 2800);
  }

  /* ---------------- HUD nav ---------------- */
  const navEl = document.getElementById("hud-nav");
  const destinationLabel = document.getElementById("hud-destination");

  SECTIONS.forEach(s => {
    const btn = document.createElement("button");
    btn.className = "hud-pill";
    btn.dataset.section = s.id;
    btn.setAttribute("data-cursor-hover", "");
    btn.textContent = s.label;
    btn.addEventListener("click", () => goTo(s.id));
    navEl.appendChild(btn);
  });

  function setActivePill(id) {
    navEl.querySelectorAll(".hud-pill").forEach(p => p.classList.toggle("active", p.dataset.section === id));
  }

  function goTo(id) {
    if (!window.Universe) return;
    destinationLabel.textContent = " ";
    window.Universe.flyTo(id);
  }

  window.addEventListener("universe:arrived", (e) => {
    const id = e.detail.id;
    destinationLabel.textContent = SECTIONS.find(s => s.id === id)?.label || id;
    setActivePill(id);
    showPanel(id);
  });

  window.addEventListener("universe:left", () => {
    destinationLabel.textContent = "Overview";
    setActivePill(null);
    hideAllPanels();
  });

  window.addEventListener("universe:select", (e) => goTo(e.detail.id));

  document.getElementById("home-btn").addEventListener("click", () => {
    if (window.Universe) window.Universe.resetToOverview();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const openPanel = document.querySelector(".panel.panel-open");
      if (openPanel && window.Universe) window.Universe.resetToOverview();
    }
  });

  /* ---------------- Chained scroll / keyboard journey ----------------
     From the very first scroll (still at the sun / overview) onward,
     scrolling down travels to the next planet in order; scrolling up
     goes back one. While a panel is open with its own scrollable
     content, normal scrolling inside it still works — only scrolling
     further past its top/bottom edge continues the journey. */
  let journeyStarted = false;
  let currentIndex = -1; // -1 = overview / sun
  let scrollLocked = false;

  function lockScrollBriefly(ms) {
    scrollLocked = true;
    setTimeout(() => { scrollLocked = false; }, ms);
  }

  function travelToIndex(index) {
    if (scrollLocked || !window.Universe) return;
    const order = window.Universe.sectionOrder || SECTIONS.map(s => s.id);
    if (index < -1 || index >= order.length) return;
    lockScrollBriefly(2000);
    if (index === -1) {
      window.Universe.resetToOverview();
    } else {
      goTo(order[index]);
    }
  }

  window.addEventListener("universe:arrived", (e) => {
    const order = window.Universe.sectionOrder || SECTIONS.map(s => s.id);
    currentIndex = order.indexOf(e.detail.id);
  });
  window.addEventListener("universe:left", () => { currentIndex = -1; });

  window.addEventListener("wheel", (e) => {
    if (!journeyStarted || scrollLocked) return;
    if (Math.abs(e.deltaY) < 6) return;

    const openPanel = document.querySelector(".panel.panel-open");
    const goingDown = e.deltaY > 0;

    if (!openPanel) {
      // At the sun / overview — any downward scroll begins the journey.
      if (goingDown) { e.preventDefault(); travelToIndex(0); }
      return;
    }

    const atTop = openPanel.scrollTop <= 4;
    const atBottom = openPanel.scrollTop + openPanel.clientHeight >= openPanel.scrollHeight - 4;

    if (goingDown && atBottom) { e.preventDefault(); travelToIndex(currentIndex + 1); }
    else if (!goingDown && atTop) { e.preventDefault(); travelToIndex(currentIndex - 1); }
    // otherwise: let the panel scroll its own content normally
  }, { passive: false });

  // Keyboard equivalent (arrow keys), ignored while typing in the contact form.
  document.addEventListener("keydown", (e) => {
    if (!journeyStarted) return;
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); travelToIndex(currentIndex + 1); }
    if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); travelToIndex(currentIndex - 1); }
  });

  // Basic touch swipe support for mobile (swipe up = go deeper, swipe down = go back).
  let touchStartY = null;
  window.addEventListener("touchstart", (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener("touchend", (e) => {
    if (!journeyStarted || touchStartY === null || scrollLocked) return;
    const deltaY = touchStartY - e.changedTouches[0].clientY;
    touchStartY = null;
    if (Math.abs(deltaY) < 60) return;
    const openPanel = document.querySelector(".panel.panel-open");
    if (!openPanel) { if (deltaY > 0) travelToIndex(0); return; }
    const atTop = openPanel.scrollTop <= 4;
    const atBottom = openPanel.scrollTop + openPanel.clientHeight >= openPanel.scrollHeight - 4;
    if (deltaY > 0 && atBottom) travelToIndex(currentIndex + 1);
    else if (deltaY < 0 && atTop) travelToIndex(currentIndex - 1);
  }, { passive: true });

  /* ---------------- Panels ---------------- */
  const panelsRoot = document.getElementById("panels");

  function hideAllPanels() {
    panelsRoot.querySelectorAll(".panel").forEach(p => p.classList.remove("panel-open"));
  }

  function showPanel(id) {
    hideAllPanels();
    const panel = document.getElementById("panel-" + id);
    if (panel) panel.classList.add("panel-open");
  }

  panelsRoot.querySelectorAll("[data-return]").forEach(btn => {
    btn.addEventListener("click", () => { if (window.Universe) window.Universe.resetToOverview(); });
  });

  /* ---------------- About panel ---------------- */
  (function buildAbout() {
    const root = document.getElementById("about-content");
    const info = [
      { label: "Location", value: profile.location },
      { label: "Specialization", value: "Computer Science & AI" },
      { label: "Focus", value: " Software & Data & AI" },
      { label: "Projects", value: projects.length + "+ Projects" },
    ];
    root.innerHTML = `
      <div class="panel-copy">
        ${profile.about.map(p => `<p>${p}</p>`).join("")}
        ${!isPlaceholder(profile.cvUrl) ? `<a class="btn btn-ghost" href="${profile.cvUrl}" target="_blank" rel="noreferrer" data-cursor-hover>Download CV</a>` : ""}
      </div>
      <div class="info-grid">
        ${info.map(c => `<div class="info-card"><p class="info-label">${c.label}</p><p class="info-value">${c.value}</p></div>`).join("")}
      </div>
    `;
  })();

  /* ---------------- Projects panel (orbital layout) ---------------- */
  (function buildProjects() {
    const orbitRoot = document.getElementById("projects-orbit");
     const detailRoot = document.getElementById("project-detail");

        const activeCategory = "All";

    function render() {
      const list = projects;
            const n = list.length;
      orbitRoot.innerHTML = list.map((p, i) => {
        const angle = (360 / n) * i;
        return `
          <div class="orbit-card" style="--angle:${angle}deg" data-slug="${p.slug}" data-cursor-hover>
            <div class="orbit-card-inner">
              <img src="${p.image}" alt="${p.title}" loading="lazy" />
              <div class="orbit-card-body">
                <p class="orbit-card-cat">${p.category[0]}</p>
                <h4>${p.title}</h4>
                <p class="orbit-card-desc">${p.shortDescription}</p>
              </div>
            </div>
          </div>`;
      }).join("");

      orbitRoot.querySelectorAll(".orbit-card").forEach(card => {
        card.addEventListener("click", () => openProjectDetail(card.dataset.slug));
      });
    }

    
       
   
  

    function openProjectDetail(slug) {
      const p = projects.find(pr => pr.slug === slug);
      if (!p) return;
      const hasLive = !isPlaceholder(p.liveUrl);
      const hasGithub = !isPlaceholder(p.githubUrl);
      detailRoot.innerHTML = `
        <button class="btn btn-ghost btn-small" id="back-to-orbit" data-cursor-hover>  Back to Projects  </button>
        <div class="detail-hero"><img src="${p.image}" alt="${p.title}" /></div>
        <p class="orbit-card-cat">${p.category.join(" · ")}</p>
        <h3>${p.title}</h3>
        <p class="panel-subtitle">${p.subtitle}</p>
        <p class="panel-copy-line">${p.fullDescription}</p>
        <p class="meta-line"><strong>Role:</strong> ${p.role}</p>
        ${p.contributions.length ? `<h5>Contributions</h5><ul class="check-list">${p.contributions.map(c => `<li>${c}</li>`).join("")}</ul>` : ""}
         <h5>Technology Stack</h5>
        <div class="tag-row">${p.technologies.map(t => `<span class="tag">${t}</span>`).join("")}</div>
        <div class="detail-actions">
          ${hasLive ? `<a class="btn btn-primary" href="${p.liveUrl}" target="_blank" rel="noreferrer" data-cursor-hover>Live Website</a>` : ""}
          ${hasGithub ? `<a class="btn btn-ghost" href="${p.githubUrl}" target="_blank" rel="noreferrer" data-cursor-hover>GitHub Repository</a>` : ""}
        </div>
      `;
      document.getElementById("back-to-orbit").addEventListener("click", () => { detailRoot.classList.remove("detail-open"); });
      detailRoot.classList.add("detail-open");
    }

    render();
  })();

  /* ---------------- Skills panel — clean, always-visible grid ---------------- */
  (function buildSkills() {
    const root = document.getElementById("skills-constellation");
    root.innerHTML = skillGroups.map((group, gi) => `
      <div class="skill-card" style="--i:${gi}">
        <div class="skill-card-head">
          <h3>${group.title}</h3>
         </div>
        <div class="skill-tags">
          ${group.items.map(item => `<span class="node">${item}</span>`).join("")}
        </div>
      </div>
    `).join("");

 
  })();

  /* ---------------- Experience panel (orbital timeline) ---------------- */
 

  /* ---------------- Icon helper ----------------
     Lucide 1.x permanently removed brand/logo icons (github, linkedin,
     twitter, etc.) — see https://github.com/lucide-icons/lucide — so
     those three render as plain monospace badges instead of relying on
     a logo glyph that no longer ships. Everything else still uses lucide. */
  function iconMarkup(name) {
    const textBadges = { github: "GH", linkedin: "in", twitter: "X" };
    if (textBadges[name]) {
      return `<span class="icon-badge" aria-hidden="true">${textBadges[name]}</span>`;
    }
    return `<i data-lucide="${name}"></i>`;
  }

  /* ---------------- Contact panel (transmission console) ---------------- */
   function extractLinkedInUsername(url) {
    if (isPlaceholder(url)) return url;
    const match = url.match(/linkedin\.com\/in\/([^/?]+)/i);
    if (!match) return url;
    // Strip LinkedIn's auto-generated trailing ID segment (a dash followed
    // by a mix of letters/digits containing at least one digit), keeping
    // only the readable part of the username.
    return match[1].replace(/-[a-z0-9]*\d[a-z0-9]*$/i, "");
  }
  
  (function buildContact() {
    const methodsRoot = document.getElementById("contact-methods");
    const methods = [
      { label: "Email", value: profile.email, href: isPlaceholder(profile.email) ? null : "mailto:" + profile.email, icon: "mail" },
     // { label: "GitHub", value: socials.github?.url, href: isPlaceholder(socials.github?.url) ? null : socials.github.url, icon: "github" },
      { label: "LinkedIn", value: extractLinkedInUsername(socials.linkedin?.url), href: isPlaceholder(socials.linkedin?.url) ? null : socials.linkedin.url, icon: "linkedin" },     ];
    methodsRoot.innerHTML = methods.map(m => `
      <div class="channel-row">
        ${iconMarkup(m.icon)}
        <div>
          <p class="channel-label">${m.label}</p>
          ${m.href ? `<a href="${m.href}" target="_blank" rel="noreferrer" data-cursor-hover>${m.value}</a>` : `<p class="channel-value-muted">${m.value}</p>`}
        </div>
      </div>
    `).join("");
    if (window.lucide) window.lucide.createIcons();

    const form = document.getElementById("transmission-form");
    const statusEl = document.getElementById("transmission-status");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const errors = {};
      if (!data.name?.trim()) errors.name = "Required.";
      if (!data.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Valid email required.";
      if (!data.subject?.trim()) errors.subject = "Required.";
      if (!data.message?.trim()) errors.message = "Required.";

      form.querySelectorAll(".field-error").forEach(el => el.textContent = "");
      Object.entries(errors).forEach(([key, msg]) => {
        const el = form.querySelector(`[data-error-for="${key}"]`);
        if (el) el.textContent = msg;
      });
      if (Object.keys(errors).length) return;

      if (isPlaceholder(profile.email)) {
        statusEl.textContent = "No contact address is configured yet — add a real email in js/data.js.";
        statusEl.className = "transmission-status status-error";
        return;
      }

      

            form.classList.add("transmitting");
      statusEl.textContent = "Sending Email…";
      statusEl.className = "transmission-status status-pending";

      fetch("https://formspree.io/f/xyezywao", {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form),
      })
        .then(res => {
          form.classList.remove("transmitting");
          if (res.ok) {
            statusEl.textContent = "Email sent — I'll get back to you soon.";
            statusEl.className = "transmission-status status-success";
            form.reset();
          } else {
            statusEl.textContent = "Something went wrong — please try again or email me directly.";
            statusEl.className = "transmission-status status-error";
          }
        })
        .catch(() => {
          form.classList.remove("transmitting");
          statusEl.textContent = "Something went wrong — please try again or email me directly.";
          statusEl.className = "transmission-status status-error";
        });
    });
  
  })();

  /* ---------------- Custom cursor (desktop only) ---------------- */
  if (!isTouch && !prefersReduced) {
    const cursor = document.getElementById("cursor");
    cursor.classList.add("cursor-active");
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    window.addEventListener("mousemove", (e) => {
      cx = e.clientX; cy = e.clientY;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    });
    document.addEventListener("mouseover", (e) => {
      if (e.target.closest("[data-cursor-hover]")) cursor.classList.add("cursor-hover");
    });
    document.addEventListener("mouseout", (e) => {
      if (e.target.closest("[data-cursor-hover]")) cursor.classList.remove("cursor-hover");
    });
  }

  /* ---------------- Wire mobile/reduced-motion into the universe ---------------- */
  function applyMotionPrefs() {
    if (window.Universe) window.Universe.setReducedMotion(prefersReduced);
  }
  if (window.Universe && window.Universe.ready) applyMotionPrefs();
  window.addEventListener("universe:ready", applyMotionPrefs);
})();
