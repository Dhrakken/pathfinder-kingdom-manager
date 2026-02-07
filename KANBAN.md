# Kingdom Manager - Kanban Board

> Last updated: 2026-02-07 07:30 EST

---

## 🎯 Backlog

### Phase 2: Complete Turn Mechanics
- [ ] **Structure Bonuses** - Buildings provide item bonuses to skills
- [ ] **Settlement Level Calc** - Calculate from blocks, apply consumption
- [ ] **Storage Capacity** - Commodity caps from structures
- [ ] **Charter Selection** - Kingdom creation wizard step 1
- [ ] **Heartland Selection** - Kingdom creation wizard step 2  
- [ ] **Government Selection** - Kingdom creation wizard step 3
- [ ] **Commerce Phase: Collect Taxes** - Proper skill check
- [ ] **Commerce Phase: Trade Commodities** - Buy/sell with rates
- [ ] **Commerce Phase: Approve Expenses** - RP spending flow

### Phase 3: Kingdom Progression
- [ ] **XP Tracking** - Awards from activities/events/milestones
- [ ] **Level Up Process** - Ability boost, skill training
- [ ] **Skill Training Purchase** - Spend RP to train skills
- [ ] **Kingdom Feats** - Feat database + selection UI
- [ ] **Milestone Tracking** - First village, first city, etc.

### Phase 4: Advanced Systems
- [ ] **Army Creation** - Stats, tactics, upkeep
- [ ] **Warfare System** - Battle resolution
- [ ] **Diplomatic Relations** - Faction relationships
- [ ] **Trade Agreements** - Persistent trade routes
- [ ] **Full Event Tables** - 60+ events with chains

### Map Enhancements
- [ ] **Hex Grid for Custom Maps** - Currently only square works
- [ ] **Split Party Tokens** - Multiple party markers
- [ ] **Player vs GM View** - Hide/show information
- [ ] **Grid Anchor UX Polish** - Drag to align grid

### Future Ideas
- [ ] **Multiplayer (Firebase)** - Real-time sync
- [ ] **Mobile Responsive** - Touch-friendly UI
- [ ] **Export to PDF** - Kingdom sheet printout
- [ ] **Import from Foundry** - pf2e-kingmaker-tools compat

---

## 🚧 In Progress

- [ ] **Structure Bonuses Engine** - Parse structure data, apply to checks

---

## ✅ Done (Phase 1 MVP)

### Activity Engine ✅
- [x] Activities modify state (not just cosmetic)
- [x] RP costs deducted on use
- [x] Skill checks with degree of success
- [x] Effects applied per outcome
- [x] Prerequisite validation (adjacent hex, terrain, etc.)
- [x] Hex selection dropdown for region activities
- [x] Settlement name input for new settlements
- [x] Refund on failure for certain activities

### Upkeep Engine ✅
- [x] Leadership vacancy check (+2 Ruler, +1 others)
- [x] Ruin threshold check (ability damage + unrest)
- [x] Resource dice roll
- [x] Work site collection
- [x] Consumption payment with shortage penalties
- [x] "Run Full Upkeep" button

### Leadership Mechanics ✅
- [x] Invested leader bonus (+1 to ability's skills)
- [x] Skill modifier breakdown display
- [x] Unrest penalty shown in checks

### Event Engine ✅
- [x] 12 random events
- [x] Skill checks per event
- [x] Four degrees of success
- [x] Effect application (RP, unrest, fame, ruin, etc.)
- [x] Event result display in UI
- [x] "Roll Random Event" button

### Map System ✅
- [x] Stolen Lands hex map with POIs
- [x] Fog of war (explored/unexplored)
- [x] Claimed territory colors
- [x] Faction system with colors
- [x] Right-click context menus
- [x] POI editor with icon categories
- [x] Party token (draggable)
- [x] Visibility toggles
- [x] Custom map upload
- [x] Square grid overlay
- [x] Save/Load with full state

### Data & Reference ✅
- [x] 16 kingdom skills (RAW compliant)
- [x] Leadership roles
- [x] Charter/Heartland/Government data
- [x] Structure database
- [x] Activity definitions with effects

---

## 🐛 Known Issues

- [ ] Telegram bot not responding in groups (needs investigation)
- [ ] Custom map hex grid not implemented
- [ ] Grid anchor drag UX is rough

---

## 📊 Progress

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: MVP Turn | ✅ Complete | 100% |
| Phase 2: Full Mechanics | 🚧 In Progress | 10% |
| Phase 3: Progression | ⏳ Planned | 0% |
| Phase 4: Advanced | ⏳ Planned | 0% |

**Overall: ~35% to feature-complete**
