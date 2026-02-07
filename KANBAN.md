# Kingdom Manager - Kanban Board

> Last updated: 2026-02-07 07:30 EST

---

## 🎯 Backlog

### Phase 2: Complete Turn Mechanics
- [x] ~~**Structure Bonuses** - Buildings provide item bonuses to skills~~
- [x] ~~**Settlement Level Calc** - Calculate from blocks, apply consumption~~
- [x] ~~**Storage Capacity** - Commodity caps from structures~~
- [ ] **Charter Selection** - Kingdom creation wizard step 1
- [ ] **Heartland Selection** - Kingdom creation wizard step 2  
- [ ] **Government Selection** - Kingdom creation wizard step 3
- [x] ~~**Commerce Phase: Collect Taxes** - Proper skill check~~
- [x] ~~**Commerce Phase: Trade Commodities** - Buy/sell with rates~~
- [ ] **Commerce Phase: Approve Expenses** - RP spending flow

### Phase 3: Kingdom Progression
- [x] ~~**XP Tracking** - Awards from activities/events/milestones~~
- [x] ~~**Level Up Process** - Ability boost, skill training~~
- [x] ~~**Skill Training Purchase** - Spend RP to train skills~~
- [ ] **Kingdom Feats** - Feat database + selection UI
- [x] ~~**Milestone Tracking** - First village, first city, etc.~~

### Settlement Builder ✅
- [x] Visual 4x4 grid layout
- [x] Click-to-build with modal
- [x] Structure search and level filter
- [x] Cost display with affordability
- [x] Demolition option
- [x] Effects summary

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

- [ ] **Charter/Heartland/Government Selection** - Kingdom creation wizard

---

## ✅ Done (Phase 1 MVP + Phase 2 Progress)

### Structure Bonuses ✅
- [x] getItemBonusForActivity() finds highest bonus
- [x] getItemBonusForSkill() for general checks
- [x] Bonuses displayed in ActivityModal skill breakdown
- [x] calculateTotalConsumption() with reductions
- [x] calculateStorageCapacity() from structures
- [x] calculateLeadershipActivities() from Town Hall etc.

### Commerce Phase ✅
- [x] collectTaxes() with Trade skill check
- [x] Tax amount based on degree of success
- [x] tradeCommodities() for buying/selling
- [x] Rate modifiers based on Trade check
- [x] TradeModal UI with commodity selection
- [x] Base values: Food 1, Lumber/Ore/Stone 2, Luxuries 4

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
| Phase 2: Full Mechanics | ✅ Complete | 100% |
| Phase 3: Progression | ✅ Complete | 90% |
| Phase 4: Advanced | ⏳ Planned | 0% |

**Overall: ~65% to feature-complete**

> Last updated: 2026-02-07 09:00 EST
