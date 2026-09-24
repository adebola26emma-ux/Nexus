// ============================================
// AUTHENTICATION ELEMENTS
// ============================================

const loginTab = document.getElementById("login-tab");
const signupTab = document.getElementById("signup-tab");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const authTitle = document.getElementById("auth-title");
const authDescription = document.getElementById("auth-description");
const footerText = document.getElementById("footer-text");
const switchAuth = document.getElementById("switch-auth");
const authError = document.getElementById("auth-error");

const screenAuth = document.getElementById("screen-auth");
const screenDashboard = document.getElementById("screen-dashboard");


// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

function showLogin() {
  loginTab.classList.add("active");
  signupTab.classList.remove("active");

  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");

  authTitle.textContent = "Welcome Back";
  authDescription.textContent = "Enter the Nexus and continue your journey.";
  footerText.textContent = "Don't have an account?";
  switchAuth.textContent = "Create one";
  hideAuthError();
}


function showSignup() {
  signupTab.classList.add("active");
  loginTab.classList.remove("active");

  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");

  authTitle.textContent = "Create Your Account";
  authDescription.textContent = "Begin your journey through the Nexus.";
  footerText.textContent = "Already have an account?";
  switchAuth.textContent = "Log in";
  hideAuthError();
}

function showAuthError(message) {
  authError.textContent = message;
  authError.classList.remove("hidden");
}

function hideAuthError() {
  authError.classList.add("hidden");
  authError.textContent = "";
}

function enterNexus() {
  screenAuth.classList.add("hidden");
  screenDashboard.classList.remove("hidden");
  window.scrollTo(0, 0);
}

function exitNexus() {
  screenDashboard.classList.add("hidden");
  screenAuth.classList.remove("hidden");
  window.scrollTo(0, 0);
}


// ============================================
// AUTHENTICATION EVENT LISTENERS
// ============================================

loginTab.addEventListener("click", showLogin);

signupTab.addEventListener("click", showSignup);

switchAuth.addEventListener("click", () => {
    if ( signupForm.classList.contains("hidden") ) {
      showSignup();
    } else {
      showLogin();
    }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideAuthError();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showAuthError("Enter both an email and a password to continue.");
    return;
  }

  const { ok, data } = await api("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!ok || !data.success) {
    showAuthError(data.message || "Something went wrong. Try again.");
    return;
  }

  document.getElementById("login-password").value = "";
  const loaded = await bootDashboard();
  if (loaded) enterNexus();
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideAuthError();

  const username = document.getElementById("signup-username").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById("signup-confirm-password").value;

  if (!username || !email || !password || !confirmPassword) {
    showAuthError("Fill in every field to continue.");
    return;
  }
  if (password !== confirmPassword) {
    showAuthError("Passwords don't match.");
    return;
  }

  const { ok, data } = await api("/api/signup", {
    method: "POST",
    body: JSON.stringify({ username, email, password, confirmPassword }),
  });

  if (!ok || !data.success) {
    showAuthError(data.message || "Something went wrong. Try again.");
    return;
  }

  document.getElementById("signup-password").value = "";
  document.getElementById("signup-confirm-password").value = "";
  const loaded = await bootDashboard();
  if (loaded) enterNexus();
});

document.getElementById("sign-out-button").addEventListener("click", async () => {
  await api("/api/logout", { method: "POST" });
  currentUser = null;
  quests = [];
  exitNexus();
});


// ============================================
// SMALL FETCH HELPER
// ============================================

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let data = {};
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }
  return { ok: response.ok, status: response.status, data };
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}


// ============================================
// TOAST
// ============================================

const toast = document.getElementById("toast");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 1800);
}


// ============================================
// APP STATE
// ============================================

let currentUser = null;
let quests = [];
let catalogCategories = null; // cached after first fetch
let selectedCategory = "All";
let activeQuestFilter = "active";


// ============================================
// SIDEBAR NAVIGATION
// ============================================

const navItems = document.querySelectorAll(".nav-item");
const appViews = document.querySelectorAll(".app-view");

function setView(viewName) {
  navItems.forEach(btn => btn.classList.toggle("active", btn.dataset.view === viewName));
  appViews.forEach(section => section.classList.toggle("active", section.id === `${viewName}-view`));
}

navItems.forEach(btn => {
  btn.addEventListener("click", () => setView(btn.dataset.view));
});


// ============================================
// DASHBOARD ELEMENTS
// ============================================

const playerName = document.getElementById("player-name");
const playerLevel = document.getElementById("player-level");
const playerXp = document.getElementById("player-xp");
const xpRequired = document.getElementById("xp-required");
const playerStreak = document.getElementById("player-streak");
const xpCurrent = document.getElementById("xp-current");
const xpTotal = document.getElementById("xp-total");
const xpProgress = document.getElementById("xp-progress");


// ============================================
// DASHBOARD / SIDEBAR / PROFILE UPDATE
// ============================================

function renderStatus() {
  if (!currentUser) return;

  playerName.textContent = currentUser.username;
  playerLevel.textContent = currentUser.level;
  playerXp.textContent = currentUser.xp;
  xpRequired.textContent = currentUser.xpRequired;
  playerStreak.textContent = currentUser.streak;
  xpCurrent.textContent = currentUser.xp;
  xpTotal.textContent = currentUser.xpRequired;
  const xpPercentage = Math.min(100, (currentUser.xp / currentUser.xpRequired) * 100);
  xpProgress.style.width = `${xpPercentage}%`;

  document.getElementById("sidebar-level").textContent = currentUser.level;
  document.getElementById("sidebar-xp-progress").style.width = `${xpPercentage}%`;
  document.getElementById("sidebar-xp-label").textContent = `${currentUser.xp} / ${currentUser.xpRequired} XP`;
}

function renderProfile() {
  if (!currentUser) return;

  document.getElementById("profile-level").textContent = currentUser.level;
  document.getElementById("profile-total-xp").textContent = currentUser.xp;
  document.getElementById("profile-streak").textContent = currentUser.streak;
  document.getElementById("profile-username").textContent = currentUser.username;
  document.getElementById("profile-email").textContent = currentUser.email;

  const since = new Date(currentUser.memberSince);
  document.getElementById("profile-since").textContent = isNaN(since)
    ? "-"
    : since.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const xpPercentage = Math.min(100, (currentUser.xp / currentUser.xpRequired) * 100);
  document.getElementById("profile-xp-progress").style.width = `${xpPercentage}%`;
  document.getElementById("profile-xp-label").textContent = `${currentUser.xp} / ${currentUser.xpRequired} XP`;
}

function showLevelUp() {
  const overlay = document.createElement("div");
  overlay.classList.add("level-up-overlay");
  overlay.innerHTML = `
    <div class="level-up-panel">
      <span class='level-up-label'>NEXUS ASCENSION</span>
      <h2>LEVEL UP</h2>
      <div class='level-up-number'>${currentUser.level}</div>
      <p>Your progression continues.</p>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.remove();
  }, 2500);
}


// ============================================
// QUEST CARD RENDERING (shared by dashboard + quests view)
// ============================================

function questCardHtml(quest, { showRemove }) {
  let actionHtml;
  if (quest.status === "claimed") {
    actionHtml = `<span class="quest-claimed-label">CLAIMED</span>`;
  } else if (quest.status === "completed") {
    actionHtml = `<button class="quest-complete-button quest-claim-button" data-quest-id="${quest.id}">CLAIM XP</button>`;
  } else {
    actionHtml = `<button class="quest-complete-button quest-complete-action" data-quest-id="${quest.id}">COMPLETE</button>`;
  }

  const removeHtml = showRemove
    ? `<button class="quest-remove-button" data-quest-id="${quest.id}">Remove</button>`
    : "";

  const recurrenceLabels = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };
  const recurrenceBadge = recurrenceLabels[quest.recurrence]
    ? `<span class="recurrence-badge">${recurrenceLabels[quest.recurrence]}</span>`
    : "";

  return `
    <article class="quest-card">
      <div class="quest-info">
        <span class="quest-category">${escapeHtml(quest.category)}${recurrenceBadge}</span>
        <h3>${escapeHtml(quest.name)}</h3>
      </div>
      <div class="quest-meta">
        <span>${quest.xp} XP</span>
        ${actionHtml}
        ${removeHtml}
      </div>
    </article>
  `;
}

function emptyStateHtml(title, subtitle, { showAddButton }) {
  return `
    <div class="empty-state">
      <span class="empty-state-symbol">&#9671;</span>
      <h3>${title}</h3>
      <p>${subtitle}</p>
      ${showAddButton ? `<button id="empty-add-quest" class="primary-button">+ COMMENCE A JOURNEY</button>` : ""}
    </div>
  `;
}


// ============================================
// DASHBOARD QUEST LIST (today's board)
// ============================================

const questListEl = document.getElementById("quest-list");

function renderDashboardQuests() {
  const activeQuests = quests.filter(q => q.status !== "claimed");

  if (activeQuests.length === 0) {
    questListEl.innerHTML = emptyStateHtml(
      "NO QUESTS",
      "Your journey has not been written.",
      { showAddButton: true }
    );
    return;
  }

  questListEl.innerHTML = activeQuests.map(q => questCardHtml(q, { showRemove: true })).join("");
}


// ============================================
// QUESTS VIEW (tabs: active / completed / claimed)
// ============================================

const questsFullListEl = document.getElementById("quests-full-list");
const questTabs = document.querySelectorAll(".quest-tab");

questTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    activeQuestFilter = tab.dataset.filter;
    questTabs.forEach(t => t.classList.toggle("active", t === tab));
    renderQuestsView();
  });
});

function renderQuestsView() {
  const filtered = quests.filter(q => q.status === activeQuestFilter);

  if (filtered.length === 0) {
    questsFullListEl.innerHTML = emptyStateHtml(
      "NOTHING HERE",
      "Quests you add or finish will show up in this tab.",
      { showAddButton: false }
    );
    return;
  }

  questsFullListEl.innerHTML = filtered.map(q => questCardHtml(q, { showRemove: true })).join("");
}


// ============================================
// RENDER EVERYTHING
// ============================================

function renderAll() {
  renderStatus();
  renderDashboardQuests();
  renderQuestsView();
  renderProfile();
}


// ============================================
// QUEST ACTIONS: complete / claim / remove
// ============================================

async function handleComplete(questId) {
  const { ok, data } = await api(`/api/quests/${questId}/complete`, { method: "POST" });
  if (!ok || !data.success) {
    showToast(data.message || "Could not complete that quest.");
    return;
  }
  const idx = quests.findIndex(q => q.id === questId);
  if (idx !== -1) quests[idx] = data.quest;
  renderAll();
}

async function handleClaim(questId) {
  const { ok, data } = await api(`/api/quests/${questId}/claim`, { method: "POST" });
  if (!ok || !data.success) {
    showToast(data.message || "Could not claim that quest.");
    return;
  }
  const idx = quests.findIndex(q => q.id === questId);
  if (idx !== -1) quests[idx] = data.quest;
  currentUser = data.user;
  showToast(`+${data.quest.xp} XP claimed`);
  renderAll();
  if (data.leveledUp) {
    showLevelUp();
  }
}

async function handleRemove(questId) {
  const { ok, data } = await api(`/api/quests/${questId}`, { method: "DELETE" });
  if (!ok || !data.success) {
    showToast(data.message || "Could not remove that quest.");
    return;
  }
  quests = quests.filter(q => q.id !== questId);
  renderAll();
}

function bindQuestListEvents(container) {
  container.addEventListener("click", (event) => {
    const completeBtn = event.target.closest(".quest-complete-action");
    const claimBtn = event.target.closest(".quest-claim-button");
    const removeBtn = event.target.closest(".quest-remove-button");
    const emptyAddBtn = event.target.closest("#empty-add-quest");

    if (completeBtn) handleComplete(Number(completeBtn.dataset.questId));
    if (claimBtn) handleClaim(Number(claimBtn.dataset.questId));
    if (removeBtn) handleRemove(Number(removeBtn.dataset.questId));
    if (emptyAddBtn) openAddQuestModal();
  });
}

bindQuestListEvents(questListEl);
bindQuestListEvents(questsFullListEl);


// ============================================
// ADD QUEST MODAL
// ============================================

const addQuestModal = document.getElementById("add-quest-modal");
const catalogCategoriesEl = document.getElementById("catalog-categories");
const catalogBodyEl = document.getElementById("catalog-body");

async function openAddQuestModal() {
  addQuestModal.classList.remove("hidden");

  if (!catalogCategories) {
    catalogBodyEl.innerHTML = `<div class="catalog-empty">Loading quests&hellip;</div>`;
    const { ok, data } = await api("/api/quest-catalog");
    if (!ok || !data.success) {
      catalogBodyEl.innerHTML = `<div class="catalog-empty">Could not load the quest list.</div>`;
      return;
    }
    catalogCategories = data.categories;
    renderCategoryTabs();
  }

  renderCatalogBody();
}

function closeAddQuestModal() {
  addQuestModal.classList.add("hidden");
}

function renderCategoryTabs() {
  const names = ["All", ...catalogCategories.map(c => c.category)];
  catalogCategoriesEl.innerHTML = names.map(name => `
    <button type="button" class="catalog-category-button ${name === selectedCategory ? "active" : ""}" data-category="${escapeHtml(name)}">${escapeHtml(name)}</button>
  `).join("");

  catalogCategoriesEl.querySelectorAll(".catalog-category-button").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedCategory = btn.dataset.category;
      catalogCategoriesEl.querySelectorAll(".catalog-category-button").forEach(b => b.classList.toggle("active", b === btn));
      renderCatalogBody();
    });
  });
}

function renderCatalogBody() {
  if (!catalogCategories) return;

  const onBoardCatalogIds = new Set(quests.filter(q => q.status !== "claimed").map(q => q.catalogId));

  const groups = selectedCategory === "All"
    ? catalogCategories
    : catalogCategories.filter(c => c.category === selectedCategory);

  const items = groups.flatMap(group => group.quests.map(quest => ({ ...quest, category: group.category })));

  if (items.length === 0) {
    catalogBodyEl.innerHTML = `<div class="catalog-empty">No quests in this category.</div>`;
    return;
  }

  catalogBodyEl.innerHTML = items.map(quest => {
    const onBoard = onBoardCatalogIds.has(quest.id);
    return `
      <div class="catalog-item">
        <div>
          <span class="catalog-item-name">${escapeHtml(quest.name)}</span>
          <span class="catalog-item-category">${escapeHtml(quest.category)}</span>
        </div>
        <div style="display:flex; align-items:center; gap:14px;">
          <span class="catalog-item-xp">+${quest.xp} XP</span>
          <button type="button" class="catalog-add-button quest-catalog-add-button" data-catalog-id="${quest.id}" data-quest-name="${escapeHtml(quest.name)}" ${onBoard ? "disabled" : ""}>
            ${onBoard ? "On board" : "Add"}
          </button>
        </div>
      </div>
    `;
  }).join("");
}

catalogBodyEl.addEventListener("click", (event) => {
  const addBtn = event.target.closest(".quest-catalog-add-button");
  if (!addBtn || addBtn.disabled) return;

  openRecurrencePopover(Number(addBtn.dataset.catalogId), addBtn.dataset.questName);
});

document.getElementById("add-quest-button").addEventListener("click", openAddQuestModal);
document.getElementById("add-quest-button-2").addEventListener("click", openAddQuestModal);
document.getElementById("close-add-quest-modal").addEventListener("click", closeAddQuestModal);
addQuestModal.addEventListener("click", (event) => {
  if (event.target === addQuestModal) closeAddQuestModal();
});


// ============================================
// RECURRENCE POPOVER (pick forever/daily/weekly/monthly
// right after choosing a quest from the catalog)
// ============================================

const recurrencePopover = document.getElementById("recurrence-popover");
const recurrenceQuestNameEl = document.getElementById("recurrence-quest-name");
let pendingCatalogId = null;

function openRecurrencePopover(catalogId, questName) {
  pendingCatalogId = catalogId;
  recurrenceQuestNameEl.textContent = questName || "";
  recurrencePopover.classList.remove("hidden");
}

function closeRecurrencePopover() {
  recurrencePopover.classList.add("hidden");
  pendingCatalogId = null;
}

document.getElementById("cancel-recurrence").addEventListener("click", closeRecurrencePopover);
recurrencePopover.addEventListener("click", (event) => {
  if (event.target === recurrencePopover) closeRecurrencePopover();
});

document.querySelectorAll(".recurrence-option").forEach(btn => {
  btn.addEventListener("click", async () => {
    if (pendingCatalogId === null) return;
    const catalogId = pendingCatalogId;
    const recurrence = btn.dataset.recurrence;
    closeRecurrencePopover();

    const { ok, data } = await api("/api/quests", {
      method: "POST",
      body: JSON.stringify({ catalogId, recurrence }),
    });

    if (!ok || !data.success) {
      showToast(data.message || "Could not add that quest.");
      return;
    }

    quests.unshift(data.quest);
    showToast("Quest added to your board");
    renderCatalogBody();
    renderAll();
  });
});


// ============================================
// BOOT
// ============================================

async function bootDashboard() {
  const meResult = await api("/api/me");
  if (!meResult.ok || !meResult.data.success) return false;
  currentUser = meResult.data.user;

  const questsResult = await api("/api/quests");
  quests = (questsResult.ok && questsResult.data.success) ? questsResult.data.quests : [];

  renderAll();
  return true;
}

(async function init() {
  const loggedIn = await bootDashboard();
  if (loggedIn) enterNexus();
})();
