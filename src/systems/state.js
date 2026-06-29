// GameState — a tiny singleton that survives scene changes so XP, level, the
// shards you've collected, and unlocked achievements carry from zone to zone.
// (Phaser scenes are torn down on transition; module state is not.)

const listeners = new Set();

export const GameState = {
  xp: 0,
  level: 1,
  collectedShards: new Set(), // unique ids, so re-entering a zone can't double-count
  achievements: [], // { title, desc }
  visitedZones: new Set(),
  relics: new Set(),  // cert relics found (AZ-900 / AI-900 / SC-900) — completionist
  secrets: new Set(), // hidden beats found (the vuln hunt) — bonus achievements
  meetingCount: 0,    // running tally for the Arena meeting-gauntlet gag

  // XP needed to reach the next level grows a little each time.
  xpForLevel(level) {
    return 40 + (level - 1) * 30;
  },

  addXp(amount) {
    this.xp += amount;
    let leveled = false;
    while (this.xp >= this.xpForLevel(this.level)) {
      this.xp -= this.xpForLevel(this.level);
      this.level += 1;
      leveled = true;
    }
    this.emit({ type: leveled ? 'levelup' : 'xp' });
  },

  collectShard(id, xp = 12) {
    if (this.collectedShards.has(id)) return false;
    this.collectedShards.add(id);
    this.addXp(xp);
    return true;
  },

  unlockAchievement(a) {
    if (this.achievements.some((x) => x.title === a.title)) return false;
    this.achievements.push(a);
    this.emit({ type: 'achievement', achievement: a });
    return true;
  },

  // a hidden relic / secret — collect once, award XP + (optionally) an achievement
  collectRelic(id, xp = 14) {
    if (this.relics.has(id)) return false;
    this.relics.add(id);
    this.addXp(xp);
    this.emit({ type: 'relic', id });
    return true;
  },

  findSecret(id) {
    if (this.secrets.has(id)) return false;
    this.secrets.add(id);
    this.emit({ type: 'secret', id });
    return true;
  },

  bumpMeetings(n = 1) {
    this.meetingCount += n;
    this.emit({ type: 'meeting', count: this.meetingCount });
    return this.meetingCount;
  },

  reset() {
    this.xp = 0;
    this.level = 1;
    this.collectedShards = new Set();
    this.achievements = [];
    this.visitedZones = new Set();
    this.relics = new Set();
    this.secrets = new Set();
    this.meetingCount = 0;
    this.emit({ type: 'reset' });
  },

  on(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  emit(evt) {
    listeners.forEach((fn) => fn(evt));
  },
};
