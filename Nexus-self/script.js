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
}


// ============================================
// AUTHENTICATION EVENT LISTENERS
// ============================================

loginTab.addEventListener("click", showLogin);

signupTab.addEventListener("click", showSignup);

switchAuth.addEventListener("click", () => {
  if (signupForm.classList.contains("hidden")) {
    showSignup();
  } else {
    showLogin();
  }
});


// ============================================
// PLAYER DATA
// ============================================

const player = {
  username: "Emmanuel",
  level: 4,
  xp: 275,
  xpRequired: 400,
  streak: 7

};


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
// DASHBOARD UPDATE
// ============================================

function getXPRequired(level) {
  return 100 * (2 ** (level - 1));
}

function updateDashboard() {
  playerName.textContent = player.username;
  playerLevel.textContent = player.level;
  playerXp.textContent = player.xp;
  const requiredXP = getXPRequired(player.level);
  xpRequired.textContent = requiredXP;
  playerStreak.textContent = player.streak;
  xpCurrent.textContent = player.xp;
  xpTotal.textContent = player.xpRequired;
  const xpPercentage = (player.xp / requiredXP) * 100;
  xpProgress.style.width = `${xpPercentage}%`;
}

function processLevelUp() {
  let leveledUp = false;
  let requiredXP = getXPRequired(player.level);
  while (player.xp >= requiredXP) {
    player.xp -= requiredXP;
    player.level += 1;
    leveledUp = true;
    requiredXP = getXPRequired(player.level);
  }
  return leveledUp;
}

function showLevelUp() {
  const overlay = document.createElement("div");
  overlay.classList.add("level-up-overlay");
  overlay.innerHTML = `
    <div class="level-up-panel">
      <span class='level-up-label'>NEXUS ASCENSION</span>
      <h2>LEVEL UP</h2>
      <div class='level-up-number'>${player.level}</div>
      <p>Your progression continues.</p>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.remove();
  }, 2500);
}

updateDashboard();

// ============================================
// QUEST DATA
// ============================================

const questLibrary = [
  {
    id: 1,
    name: "Study Python",
    description: "Complete today's Python lesson.",
    category: "Education",
    difficulty: 3,
    xpReward: 30
  },
  {
    id: 2,
    name: "Read a Book",
    description: "Read for at least 30 minutes.",
    category: "Education",
    difficulty: 2,
    xpReward: 15
  },
  {
    id: 3,
    name: "Exercise",
    description: "Complete today's exercise session.",
    category: "Health",
    difficulty: 3,
    xpReward: 30
  },
  {
    id: 4,
    name: "Complete Assignment",
    description: "Finish an important assignment.",
    category: "Education",
    difficulty: 4,
    xpReward: 60
  }
];

const quests = [
    {
        libraryId: 1,
        name: "Study Python",
        description: "Complete today's Python lesson.",
        category: "Education",
        difficulty: 3,
        xpReward: 30,
        frequency: "daily",
        deadline: "18:00",
        completed: false,
        claimed: false
    }
];

function addQuest(libraryQuestId) {

    const libraryQuest =
        getLibraryQuest(libraryQuestId);

    if (!libraryQuest) {
        return;
    }


    const newQuest = {

        id: quests.length + 1,

        libraryId: libraryQuest.id,

        name: libraryQuest.name,

        description: libraryQuest.description,

        category: libraryQuest.category,

        difficulty: libraryQuest.difficulty,

        xpReward: libraryQuest.xpReward,

        frequency: "daily",

        deadline: "18:00",

        completed: false,

        claimed: false
    };


    quests.push(newQuest);

    renderQuests();
}

// ============================================
// QUEST RENDERING
// ============================================

function renderQuests() {
  const questList = document.getElementById("quest-list");
  questList.innerHTML = "";
  if (quests.length === 0) {
    questList.innerHTML = `

            <div class="empty-state">

                <span class="empty-state-symbol">
                    ◇
                </span>

                <h3>NO QUESTS</h3>

                <p>
                    Your journey has not been written.
                </p>

                <button
                    id="empty-add-quest"
                    class="primary-button"
                >
                    + COMMENCE A JOURNEY
                </button>

            </div>

        `;
    return;
  }
  quests.forEach(quest => {
    const questCard = document.createElement("article");
    questCard.classList.add("quest-card");
    questCard.innerHTML = `

            <div class="quest-info">

                <span class="quest-category">
                    ${quest.category}
                </span>

                <h3>
                    ${quest.name}
                </h3>

                <p>
                    ${quest.description}
                </p>

            </div>

            <div class="quest-meta">

                <span>
                    ${quest.xpReward} XP
                </span>

                <span>
                    ${quest.deadline}
                </span>

                <button
                    class="quest-complete-button"
                    data-quest-id="${quest.id}"
                >
                   ${!quest.completed ? 'COMPLETE' : !quest.claimed ? 'CLAIM XP' : 'CLAIMED'
      } 
                </button>

            </div>

        `;
    questList.appendChild(questCard);
  });
}

renderQuests();

// ============================================
// QUEST COMPLETION
// ============================================

function completeQuest(questId) {
  const quest = quests.find(quest => quest.id === questId);
  if (!quest) {
    return;
  }
  if (quest.completed) {
    return;
  }
  quest.completed = true;
  renderQuests();
}

function claimXP(questId) {
  const quest = quests.find(quest => quest.id === questId);
  if (!quest) {
    return;
  }
  if (!quest.completed || quest.claimed) {
    return;
  }
  player.xp += quest.xpReward;
  const leveledUp = processLevelUp();
  quest.claimed = true;
  updateDashboard();
  renderQuests();
  if (leveledUp) {
    showLevelUp();
  }
}

// ============================================
// QUEST EVENT DELEGATION
// ============================================

const questList = document.getElementById("quest-list");
questList.addEventListener("click", event => {
  if (
    !event.target.classList.contains("quest-action-button")
  ) {
    return;
  }
  const questId = Number(event.target.dataset.questId);
  const quest = quests.find(quest => quest.id === questId);
  if (!quest) {
    return;
  }
  if (!quest.completed) {
    completeQuest(questId);
    return;
  }
  if (!quest.claimed) {
    claimXP(questId);
    return;
  }
}
);