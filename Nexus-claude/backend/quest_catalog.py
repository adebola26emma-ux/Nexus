"""
Nexus quest catalog
====================
A fixed, preset list of quests players can add to their board. Because
every quest comes from this list, XP is predetermined here rather than
entered by the player, keeping the economy consistent.

XP tiers (roughly):
  Quick        10-15 XP  (a few minutes)
  Standard     20-30 XP  (a focused chunk of time)
  Challenging  40-60 XP  (real effort / a full session)
  Epic         75-100 XP (a big push / rare undertaking)

Each entry: id (stable, never reuse/renumber), category, name, xp.
"""

CATALOG = [
    # ---------------- Education ----------------
    {"id": 1, "category": "Education", "name": "Study for 30 minutes", "xp": 20},
    {"id": 2, "category": "Education", "name": "Read one chapter of a book", "xp": 15},
    {"id": 3, "category": "Education", "name": "Watch an educational video or lecture", "xp": 15},
    {"id": 4, "category": "Education", "name": "Practice a language for 15 minutes", "xp": 15},
    {"id": 5, "category": "Education", "name": "Complete one online course module", "xp": 25},
    {"id": 6, "category": "Education", "name": "Study for a full 2-hour session", "xp": 50},
    {"id": 7, "category": "Education", "name": "Finish an entire book", "xp": 80},
    {"id": 8, "category": "Education", "name": "Complete an online course", "xp": 100},
    {"id": 9, "category": "Education", "name": "Prepare flashcards or a study guide", "xp": 25},

    # ---------------- Fitness ----------------
    {"id": 20, "category": "Fitness", "name": "Take a 15-minute walk", "xp": 10},
    {"id": 21, "category": "Fitness", "name": "Do a 10-minute stretch routine", "xp": 10},
    {"id": 22, "category": "Fitness", "name": "Do a 20-minute workout", "xp": 25},
    {"id": 23, "category": "Fitness", "name": "Go for a 30-minute run", "xp": 30},
    {"id": 24, "category": "Fitness", "name": "Complete a full gym session", "xp": 40},
    {"id": 25, "category": "Fitness", "name": "Hit 10,000 steps in a day", "xp": 35},
    {"id": 26, "category": "Fitness", "name": "Try a new sport or exercise class", "xp": 45},
    {"id": 27, "category": "Fitness", "name": "Complete a week-long workout streak", "xp": 90},

    # ---------------- Productivity ----------------
    {"id": 40, "category": "Productivity", "name": "Make a to-do list for the day", "xp": 10},
    {"id": 41, "category": "Productivity", "name": "Clear your inbox to zero", "xp": 20},
    {"id": 42, "category": "Productivity", "name": "Do a 25-minute focused work sprint", "xp": 20},
    {"id": 43, "category": "Productivity", "name": "Tidy your desk or workspace", "xp": 15},
    {"id": 44, "category": "Productivity", "name": "Plan out your week ahead", "xp": 25},
    {"id": 45, "category": "Productivity", "name": "Finish a task you've been procrastinating on", "xp": 40},
    {"id": 46, "category": "Productivity", "name": "Complete a full day with no social media", "xp": 45},
    {"id": 47, "category": "Productivity", "name": "Finish a major project milestone", "xp": 75},

    # ---------------- Mindfulness ----------------
    {"id": 60, "category": "Mindfulness", "name": "Meditate for 10 minutes", "xp": 15},
    {"id": 61, "category": "Mindfulness", "name": "Write in a journal", "xp": 15},
    {"id": 62, "category": "Mindfulness", "name": "Write down 3 things you're grateful for", "xp": 10},
    {"id": 63, "category": "Mindfulness", "name": "Spend 30 minutes with no screens", "xp": 20},
    {"id": 64, "category": "Mindfulness", "name": "Go outside and get some fresh air", "xp": 10},
    {"id": 65, "category": "Mindfulness", "name": "Have a digital detox for the whole day", "xp": 50},
    {"id": 66, "category": "Mindfulness", "name": "Reflect on your goals for 15 minutes", "xp": 20},

    # ---------------- Creativity ----------------
    {"id": 80, "category": "Creativity", "name": "Sketch or doodle for 15 minutes", "xp": 15},
    {"id": 81, "category": "Creativity", "name": "Write a page of a story or journal prompt", "xp": 20},
    {"id": 82, "category": "Creativity", "name": "Practice a musical instrument for 20 minutes", "xp": 20},
    {"id": 83, "category": "Creativity", "name": "Try a new recipe or craft", "xp": 25},
    {"id": 84, "category": "Creativity", "name": "Finish a piece of art or writing", "xp": 45},
    {"id": 85, "category": "Creativity", "name": "Learn a new song or piece", "xp": 40},

    # ---------------- Home ----------------
    {"id": 100, "category": "Home", "name": "Make your bed", "xp": 5},
    {"id": 101, "category": "Home", "name": "Wash the dishes", "xp": 10},
    {"id": 102, "category": "Home", "name": "Do a load of laundry", "xp": 15},
    {"id": 103, "category": "Home", "name": "Vacuum or sweep a room", "xp": 15},
    {"id": 104, "category": "Home", "name": "Declutter one drawer or shelf", "xp": 20},
    {"id": 105, "category": "Home", "name": "Deep clean the kitchen", "xp": 35},
    {"id": 106, "category": "Home", "name": "Do a full room reorganization", "xp": 60},
    {"id": 107, "category": "Home", "name": "Meal prep for the week", "xp": 40},

    # ---------------- Social ----------------
    {"id": 120, "category": "Social", "name": "Call or message a friend or family member", "xp": 10},
    {"id": 121, "category": "Social", "name": "Have a meaningful conversation with someone", "xp": 20},
    {"id": 122, "category": "Social", "name": "Do something kind for someone unprompted", "xp": 20},
    {"id": 123, "category": "Social", "name": "Reconnect with someone you've lost touch with", "xp": 30},
    {"id": 124, "category": "Social", "name": "Attend a social event or gathering", "xp": 30},
    {"id": 125, "category": "Social", "name": "Volunteer your time for a cause", "xp": 50},

    # ---------------- Finance ----------------
    {"id": 140, "category": "Finance", "name": "Track your spending for the day", "xp": 10},
    {"id": 141, "category": "Finance", "name": "Review your budget", "xp": 20},
    {"id": 142, "category": "Finance", "name": "Pay a bill before it's due", "xp": 15},
    {"id": 143, "category": "Finance", "name": "Cancel an unused subscription", "xp": 20},
    {"id": 144, "category": "Finance", "name": "Set aside money into savings", "xp": 25},
    {"id": 145, "category": "Finance", "name": "Do a full monthly budget review", "xp": 50},

    # ---------------- Coding ----------------
    {"id": 160, "category": "Coding", "name": "Code for 30 minutes", "xp": 20},
    {"id": 161, "category": "Coding", "name": "Fix a bug in a personal project", "xp": 25},
    {"id": 162, "category": "Coding", "name": "Learn a new tool, library, or framework", "xp": 30},
    {"id": 163, "category": "Coding", "name": "Contribute to an open-source project", "xp": 40},
    {"id": 164, "category": "Coding", "name": "Ship a small feature or project", "xp": 60},
    {"id": 165, "category": "Coding", "name": "Complete a coding challenge or puzzle", "xp": 25},
]

_CATALOG_BY_ID = {quest["id"]: quest for quest in CATALOG}


def get_quest(catalog_id):
    return _CATALOG_BY_ID.get(catalog_id)


def catalog_by_category():
    grouped = {}
    for quest in CATALOG:
        grouped.setdefault(quest["category"], []).append(
            {"id": quest["id"], "name": quest["name"], "xp": quest["xp"]}
        )
    return [{"category": category, "quests": items} for category, items in grouped.items()]
