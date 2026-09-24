"""
Nexus backend
=============
A small Flask app that:
  1. Serves the frontend (index.html, style.css, script.js) from the
     project root.
  2. Provides auth endpoints (signup/login/logout/me) backed by SQLite
     (nexus.db, created automatically next to this file).
  3. Provides quest endpoints. Quests always come from a fixed preset
     catalog (see quest_catalog.py) so XP values are predetermined -
     players pick from the list rather than entering their own XP.
  4. Tracks level (exponential XP curve, matching the original
     front-end prototype: level N requires 100 * 2^(N-1) XP) and a
     daily streak that increments once per calendar day a quest is
     claimed.
  5. Supports recurring quests. When adding a quest the player picks
     a refresh schedule - forever (one-time), daily, weekly, or
     monthly. A quest on a schedule snaps back to 'active' once its
     cycle elapses, regardless of whether it was ever completed or
     claimed. There's no background scheduler; the check runs lazily
     (see sync_quest_recurrence) whenever a quest is read or acted on.

Run it with:
    cd backend
    pip install -r requirements.txt
    python app.py

Then open http://localhost:5000 in your browser.
"""

import calendar
import os
import secrets
import sqlite3
from datetime import date, datetime, timedelta, timezone

from flask import Flask, jsonify, request, send_from_directory, session
from werkzeug.security import check_password_hash, generate_password_hash

import quest_catalog

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)          # one level up: the folder with index.html
DB_PATH = os.path.join(BACKEND_DIR, "nexus.db")

RECURRENCES = ("forever", "daily", "weekly", "monthly")

app = Flask(__name__, static_folder=PROJECT_ROOT, static_url_path="")

# A real deployment should set this via an environment variable so the
# secret survives restarts and isn't regenerated per-process. For this
# project a generated key is fine - it just means existing sessions are
# invalidated whenever the server restarts.
app.secret_key = os.environ.get("NEXUS_SECRET_KEY") or secrets.token_hex(32)


# ---------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            xp INTEGER NOT NULL DEFAULT 0,
            level INTEGER NOT NULL DEFAULT 1,
            streak INTEGER NOT NULL DEFAULT 0,
            last_active_date TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS user_quests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            catalog_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            xp INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            recurrence TEXT NOT NULL DEFAULT 'forever',
            next_reset_date TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            completed_at TEXT,
            claimed_at TEXT
        )
        """
    )
    conn.commit()
    conn.close()


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def add_one_month(d):
    year = d.year + (1 if d.month == 12 else 0)
    month = 1 if d.month == 12 else d.month + 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def compute_next_reset(base_date, recurrence):
    """Given the date a cycle started, return the date it next resets
    on. 'forever' quests never reset (None)."""
    if recurrence == "daily":
        return base_date + timedelta(days=1)
    if recurrence == "weekly":
        return base_date + timedelta(days=7)
    if recurrence == "monthly":
        return add_one_month(base_date)
    return None


def sync_quest_recurrence(conn, quest_row):
    """Lazily refresh a recurring quest: if today has passed its
    next_reset_date, snap it back to 'active' (clearing completion /
    claim state) and roll next_reset_date forward - looping in case
    several cycles elapsed since it was last checked. 'forever' quests
    and quests without a next_reset_date are returned unchanged. This
    runs on every read/action instead of a background scheduler, so a
    reset is applied the moment anyone next looks at the quest."""
    if quest_row["recurrence"] == "forever" or not quest_row["next_reset_date"]:
        return quest_row

    today = date.today()
    next_reset = date.fromisoformat(quest_row["next_reset_date"])
    changed = False

    while today >= next_reset:
        next_reset = compute_next_reset(next_reset, quest_row["recurrence"])
        changed = True

    if changed:
        conn.execute(
            """
            UPDATE user_quests
            SET status = 'active', completed_at = NULL, claimed_at = NULL, next_reset_date = ?
            WHERE id = ?
            """,
            (next_reset.isoformat(), quest_row["id"]),
        )
        conn.commit()
        quest_row = conn.execute("SELECT * FROM user_quests WHERE id = ?", (quest_row["id"],)).fetchone()

    return quest_row


def xp_required_for_level(level):
    """Matches the original front-end curve: 100 * 2^(level-1)."""
    return 100 * (2 ** (level - 1))


def apply_xp(user_row, xp_gained):
    """Add XP to a user, rolling over levels as needed. Returns
    (new_xp, new_level, leveled_up)."""
    xp = user_row["xp"] + xp_gained
    level = user_row["level"]
    leveled_up = False
    required = xp_required_for_level(level)
    while xp >= required:
        xp -= required
        level += 1
        leveled_up = True
        required = xp_required_for_level(level)
    return xp, level, leveled_up


def bump_streak(user_row):
    """Advance the daily streak based on today's date vs the user's
    last active date. Returns the new streak value."""
    today = date.today()
    last_active = user_row["last_active_date"]
    streak = user_row["streak"]

    if last_active:
        last_date = date.fromisoformat(last_active)
        if last_date == today:
            return streak  # already counted today
        if last_date == today - timedelta(days=1):
            streak += 1  # consecutive day
        else:
            streak = 1  # streak broken, restart
    else:
        streak = 1  # first ever activity

    return streak


def user_public_dict(user_row):
    return {
        "username": user_row["username"],
        "email": user_row["email"],
        "xp": user_row["xp"],
        "level": user_row["level"],
        "xpRequired": xp_required_for_level(user_row["level"]),
        "streak": user_row["streak"],
        "memberSince": user_row["created_at"],
    }


def quest_public_dict(quest_row):
    return {
        "id": quest_row["id"],
        "catalogId": quest_row["catalog_id"],
        "name": quest_row["name"],
        "category": quest_row["category"],
        "xp": quest_row["xp"],
        "status": quest_row["status"],
        "recurrence": quest_row["recurrence"],
        "nextResetDate": quest_row["next_reset_date"],
        "createdAt": quest_row["created_at"],
        "completedAt": quest_row["completed_at"],
        "claimedAt": quest_row["claimed_at"],
    }


def require_login():
    user_id = session.get("user_id")
    if not user_id:
        return None
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return user


# ---------------------------------------------------------------------
# Frontend routes (so `python app.py` alone serves the whole app)
# ---------------------------------------------------------------------
@app.route("/")
def index():
    return send_from_directory(PROJECT_ROOT, "index.html")


# ---------------------------------------------------------------------
# Auth API
# ---------------------------------------------------------------------
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    confirm_password = data.get("confirmPassword")

    if not username or not email or not password:
        return jsonify(success=False, message="Fill in every field to continue."), 400
    if confirm_password is not None and password != confirm_password:
        return jsonify(success=False, message="Passwords don't match."), 400
    if len(password) < 6:
        return jsonify(success=False, message="Password must be at least 6 characters."), 400

    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify(success=False, message="An account with that email already exists."), 409

    password_hash = generate_password_hash(password)
    cursor = conn.execute(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        (username, email, password_hash),
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    session.clear()
    session["user_id"] = user_id

    return jsonify(success=True, message="Account created. Welcome to Nexus.")


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify(success=False, message="Email and password are required."), 400

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify(success=False, message="Invalid email or password."), 401

    session.clear()
    session["user_id"] = user["id"]

    return jsonify(success=True, message="Welcome back.")


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify(success=True)


@app.route("/api/me", methods=["GET"])
def me():
    user = require_login()
    if not user:
        return jsonify(success=False, message="Not logged in."), 401
    return jsonify(success=True, user=user_public_dict(user))


# ---------------------------------------------------------------------
# Quest catalog API (the fixed, preset list quests are added from)
# ---------------------------------------------------------------------
@app.route("/api/quest-catalog", methods=["GET"])
def get_quest_catalog():
    if not require_login():
        return jsonify(success=False, message="Not logged in."), 401
    return jsonify(success=True, categories=quest_catalog.catalog_by_category())


# ---------------------------------------------------------------------
# Quest instance API (a user's own board, built from the catalog)
# ---------------------------------------------------------------------
@app.route("/api/quests", methods=["GET"])
def get_quests():
    user = require_login()
    if not user:
        return jsonify(success=False, message="Not logged in."), 401

    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM user_quests WHERE user_id = ? ORDER BY created_at DESC",
        (user["id"],),
    ).fetchall()
    rows = [sync_quest_recurrence(conn, row) for row in rows]
    conn.close()

    return jsonify(success=True, quests=[quest_public_dict(row) for row in rows])


@app.route("/api/quests", methods=["POST"])
def add_quest():
    user = require_login()
    if not user:
        return jsonify(success=False, message="Not logged in."), 401

    data = request.get_json(silent=True) or {}
    catalog_id = data.get("catalogId")
    recurrence = data.get("recurrence", "forever")
    catalog_quest = quest_catalog.get_quest(catalog_id) if catalog_id is not None else None

    if not catalog_quest:
        return jsonify(success=False, message="Pick a quest from the list."), 400
    if recurrence not in RECURRENCES:
        return jsonify(success=False, message="Pick a valid refresh schedule."), 400

    conn = get_db()
    existing = conn.execute(
        "SELECT id FROM user_quests WHERE user_id = ? AND catalog_id = ? AND status != 'claimed'",
        (user["id"], catalog_id),
    ).fetchone()
    if existing:
        conn.close()
        return jsonify(success=False, message="That quest is already on your board."), 409

    next_reset_date = compute_next_reset(date.today(), recurrence)
    next_reset_iso = next_reset_date.isoformat() if next_reset_date else None

    cursor = conn.execute(
        """
        INSERT INTO user_quests (user_id, catalog_id, name, category, xp, status, recurrence, next_reset_date)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
        """,
        (
            user["id"], catalog_quest["id"], catalog_quest["name"], catalog_quest["category"],
            catalog_quest["xp"], recurrence, next_reset_iso,
        ),
    )
    conn.commit()
    quest_row = conn.execute("SELECT * FROM user_quests WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()

    return jsonify(success=True, quest=quest_public_dict(quest_row))


@app.route("/api/quests/<int:quest_id>/complete", methods=["POST"])
def complete_quest(quest_id):
    user = require_login()
    if not user:
        return jsonify(success=False, message="Not logged in."), 401

    conn = get_db()
    quest_row = conn.execute(
        "SELECT * FROM user_quests WHERE id = ? AND user_id = ?", (quest_id, user["id"])
    ).fetchone()

    if not quest_row:
        conn.close()
        return jsonify(success=False, message="Quest not found."), 404

    quest_row = sync_quest_recurrence(conn, quest_row)

    if quest_row["status"] != "active":
        conn.close()
        return jsonify(success=False, message="That quest isn't active."), 400

    conn.execute(
        "UPDATE user_quests SET status = 'completed', completed_at = ? WHERE id = ?",
        (now_iso(), quest_id),
    )
    conn.commit()
    quest_row = conn.execute("SELECT * FROM user_quests WHERE id = ?", (quest_id,)).fetchone()
    conn.close()

    return jsonify(success=True, quest=quest_public_dict(quest_row))


@app.route("/api/quests/<int:quest_id>/claim", methods=["POST"])
def claim_quest(quest_id):
    user = require_login()
    if not user:
        return jsonify(success=False, message="Not logged in."), 401

    conn = get_db()
    quest_row = conn.execute(
        "SELECT * FROM user_quests WHERE id = ? AND user_id = ?", (quest_id, user["id"])
    ).fetchone()

    if not quest_row:
        conn.close()
        return jsonify(success=False, message="Quest not found."), 404

    quest_row = sync_quest_recurrence(conn, quest_row)

    if quest_row["status"] != "completed":
        conn.close()
        return jsonify(success=False, message="Complete the quest before claiming it."), 400

    new_xp, new_level, leveled_up = apply_xp(user, quest_row["xp"])
    new_streak = bump_streak(user)
    today_iso = date.today().isoformat()

    conn.execute(
        "UPDATE user_quests SET status = 'claimed', claimed_at = ? WHERE id = ?",
        (now_iso(), quest_id),
    )
    conn.execute(
        "UPDATE users SET xp = ?, level = ?, streak = ?, last_active_date = ? WHERE id = ?",
        (new_xp, new_level, new_streak, today_iso, user["id"]),
    )
    conn.commit()

    quest_row = conn.execute("SELECT * FROM user_quests WHERE id = ?", (quest_id,)).fetchone()
    user_row = conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()
    conn.close()

    return jsonify(
        success=True,
        quest=quest_public_dict(quest_row),
        user=user_public_dict(user_row),
        leveledUp=leveled_up,
    )


@app.route("/api/quests/<int:quest_id>", methods=["DELETE"])
def delete_quest(quest_id):
    user = require_login()
    if not user:
        return jsonify(success=False, message="Not logged in."), 401

    conn = get_db()
    quest_row = conn.execute(
        "SELECT * FROM user_quests WHERE id = ? AND user_id = ?", (quest_id, user["id"])
    ).fetchone()
    if not quest_row:
        conn.close()
        return jsonify(success=False, message="Quest not found."), 404

    conn.execute("DELETE FROM user_quests WHERE id = ?", (quest_id,))
    conn.commit()
    conn.close()

    return jsonify(success=True)


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
