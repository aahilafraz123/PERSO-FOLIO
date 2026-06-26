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

  reset() {
    this.xp = 0;
    this.level = 1;
    this.collectedShards = new Set();
    this.achievements = [];
    this.visitedZones = new Set();
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
