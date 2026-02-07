# Kingdom Turn System - Work Estimate

> Generated: 2026-02-07 by Vecna 💀

## Current State: ~20% Complete

The map system is solid. The kingdom mechanics are a facade.

---

## Phase 1: Minimum Viable Kingdom Turn
**Goal:** Run one complete turn by-the-book
**Estimate:** 8-12 hours of work

### 1.1 Activity Effects Engine (3-4h)
Currently activities roll dice then do nothing. Need:
- [ ] Apply RP costs when activity is performed
- [ ] Modify resources/unrest/ruin based on outcome degree
- [ ] Track activity usage limits (leadership vs region vs civic)
- [ ] Validate prerequisites (adjacent hex for Claim, etc.)
- [ ] Refactor `performSkillCheck` → `performActivity` that applies results

### 1.2 Leadership Mechanics (2-3h)
- [ ] Vacant role = +1 Unrest in Upkeep (except Ruler = +2)
- [ ] Invested leader bonus to their ability's checks
- [ ] PC leader can use their own modifier for checks
- [ ] Leadership activity limit based on Town Hall level

### 1.3 Basic Event System (2-3h)
- [ ] Random event table (20-30 common events)
- [ ] Event skill check with DC
- [ ] Apply event outcomes
- [ ] Event log entry

### 1.4 Ruin Threshold Checks (1h)
- [ ] Check each Ruin vs threshold (default 10) in Upkeep
- [ ] Trigger penalty when threshold exceeded
- [ ] Track threshold increases from structures

---

## Phase 2: Complete Turn Mechanics
**Goal:** Full RAW compliance
**Estimate:** 10-15 hours

### 2.1 Structure Bonuses (3-4h)
- [ ] Parse structure data for item bonuses
- [ ] Apply skill bonuses from buildings
- [ ] Settlement level calculation from blocks
- [ ] Storage capacity from structures
- [ ] Consumption calculation from settlement type

### 2.2 Charter/Heartland/Government (2-3h)
- [ ] Kingdom creation wizard
- [ ] Apply ability boosts/flaws from charter
- [ ] Apply heartland terrain bonus
- [ ] Government ability boost + trained skill + feat

### 2.3 Commerce Phase Proper (2-3h)
- [ ] Collect Taxes skill check (not just button)
- [ ] Trade Commodities with conversion rates
- [ ] Withdraw/Deposit from storage
- [ ] Pay for ongoing structures

### 2.4 Detailed Upkeep (2-3h)
- [ ] Step-by-step upkeep checklist
- [ ] Assign/change leadership
- [ ] Unrest from vacancies
- [ ] Ruin point assignments
- [ ] Bonus/penalty dice from structures

---

## Phase 3: Kingdom Progression
**Goal:** Level ups, feats, long-term play
**Estimate:** 8-10 hours

### 3.1 XP & Leveling (3-4h)
- [ ] Track XP from activities/events/milestones
- [ ] Level up process (ability boost, skill training)
- [ ] Skill training purchases (RP cost)
- [ ] Level-based unlocks

### 3.2 Kingdom Feats (3-4h)
- [ ] Feat database (40+ feats)
- [ ] Feat prerequisites
- [ ] Feat selection UI
- [ ] Feat effects applied to checks

### 3.3 Milestones (2h)
- [ ] Milestone tracking (first village, first city, etc.)
- [ ] XP awards for milestones
- [ ] Achievement display

---

## Phase 4: Advanced Systems
**Goal:** Full Kingmaker experience
**Estimate:** 15-20 hours

### 4.1 Army & Warfare (6-8h)
- [ ] Army creation & stats
- [ ] Tactical warfare rules
- [ ] Army upkeep costs
- [ ] War events

### 4.2 Diplomatic Relations (4-5h)
- [ ] Faction relationship tracking
- [ ] Diplomatic activities
- [ ] Trade agreements (persistent)
- [ ] Alliance/war states

### 4.3 Random Event Tables (3-4h)
- [ ] Full event database (60+ events)
- [ ] Event chains
- [ ] Recurring events
- [ ] Event modifiers based on kingdom state

### 4.4 Settlement Builder (3-4h)
- [ ] Visual block grid
- [ ] Drag-drop structure placement
- [ ] Lot requirements validation
- [ ] Adjacent structure bonuses

---

## Priority Recommendation

**If you want to use this for actual gameplay soon:**

```
Week 1: Phase 1 (MVP turn)
Week 2: Phase 2.1-2.2 (structures + kingdom setup)
Week 3: Phase 2.3-2.4 + Phase 3.1 (complete turns + leveling)
```

After that you'd have a fully functional kingdom tracker. Armies and detailed diplomacy can wait — they're rarely used in early Kingmaker.

---

## Quick Wins (< 1 hour each)

If you want visible progress fast:
1. **Activity effects** - Even just "Claim Hex adds hex + 10 XP" would be huge
2. **Vacant role penalty** - Simple unrest addition in upkeep
3. **Basic event roll** - Random DC check with flavor text
4. **Structure bonuses** - Even hardcoded "+1 to Trade from General Store"

---

## Questions for You

1. **What's your campaign timeline?** When's the next kingdom turn due?
2. **Which phase matters most?** Do you need events, or is "roll dice, track manually" okay for now?
3. **PC integration** - Do you want PC stats imported, or just use kingdom modifiers?

💀
