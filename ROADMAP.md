# Pathfinder Kingdom Manager - Development Roadmap

> Last updated: 2026-02-07 by Vecna

## 🎯 Vision
A unified Pathfinder 2E Kingmaker companion that combines kingdom management with interactive hex mapping — no external tools needed.

---

## ✅ Completed Features

### Core Kingdom Management
- ✅ Kingdom dashboard with stats
- ✅ 4-phase turn system (Upkeep, Commerce, Activity, Event)
- ✅ Ability scores and modifiers (Culture, Economy, Loyalty, Stability)
- ✅ All 16 kingdom skills with proficiency calculations
- ✅ Resource dice rolling based on kingdom size
- ✅ Commodities tracking (Food, Lumber, Luxuries, Ore, Stone)
- ✅ Work sites and dynamic consumption calculation
- ✅ Leadership management (8 roles with investment)
- ✅ 40+ activities with mechanical outcomes
- ✅ Settlement grid view with structures
- ✅ Turn logging and history
- ✅ JSON save/load with full state export

### Progression System
- ✅ XP thresholds and level advancement
- ✅ Level-up modal with ability boost + skill training
- ✅ Kingdom feats system (30+ feats with prerequisites)
- ✅ Milestone achievements with XP awards

### Engines (Game Logic)
- ✅ Upkeep Engine: Leadership vacancies, ruin thresholds, resources, consumption
- ✅ Commerce Engine: Tax collection, commodity trading
- ✅ Event Engine: 12 random events with skill checks and outcomes
- ✅ Activity Engine: Skill checks, degree of success, effect application
- ✅ Structure Engine: Item bonuses, consumption reduction, storage
- ✅ Progression Engine: XP, level-up, feats, milestones

### Map System
- ✅ Interactive Stolen Lands hex map
- ✅ POI markers with drag-and-drop
- ✅ Party token placement
- ✅ Fog of war toggle
- ✅ Faction system with territory colors
- ✅ Context menu for hex actions
- ✅ Multi-map system with custom map upload

### Kingdom Creation
- ✅ 6-step wizard (name, charter, heartland, government, boosts, review)
- ✅ Charter-based ability boosts and skill training
- ✅ Government type selection

---

## 📋 Remaining Features

### High Priority

#### 1. Feat Bonus Integration
**Status:** 🟡 Partially Done (UI complete, bonuses not applied)
**Effort:** Small

Wire up feat bonuses to the activity and engine systems:
- [ ] `getItemBonusForActivity` should check kingdom feats
- [ ] Consumption reduction from Quality of Life feat
- [ ] Celebrate Holiday cost reduction from Celebratory Traditions
- [ ] Trade bonus from Free and Fair / Insider Trading

#### 2. Army Management System
**Status:** 🔴 Not Started
**Priority:** MEDIUM
**Effort:** Large

Requirements:
- [ ] Army data schema (HP, Morale, Tactics, level, traits)
- [ ] Army roster tab
- [ ] Create/edit army UI
- [ ] Army tokens on hex map
- [ ] Army movement actions
- [ ] Combat rolls and outcomes
- [ ] War phase activities

### Medium Priority

#### 3. Road & Travel System
**Status:** 🔴 Not Started
**Effort:** Medium

- [ ] Road drawing between hexes
- [ ] Travel time calculation
- [ ] Road bonuses to movement

#### 4. Diplomacy System
**Status:** 🔴 Not Started
**Effort:** Medium

- [ ] Faction relationships tracking
- [ ] Diplomatic activities (Embassy, Envoys)
- [ ] Trade agreements management
- [ ] Alliance/War states

#### 5. Enhanced Dice Rolling UI
**Status:** 🟡 Basic exists
**Effort:** Small

- [ ] Visual dice animation
- [ ] Roll history panel
- [ ] Modifier breakdown display
- [ ] Quick-roll from activities

### Low Priority

#### 6. Excel Import/Export
**Status:** 🔴 Not Started
**Effort:** Medium

- [ ] Export to .xlsx with worksheets
- [ ] Import from Excel

#### 7. Camping System
**Status:** 🔴 Not Started
**Effort:** Medium

Reference: pf2e-kingmaker-tools camping module
- [ ] Camp activities
- [ ] Random encounter rolls
- [ ] Camping bonuses

---

## 🔧 Technical Debt

- [ ] Deploy to GitHub Pages (currently returns 404)
- [ ] Mobile responsiveness polish
- [ ] Error boundaries
- [ ] Keyboard shortcuts
- [ ] Undo/redo system

---

## 📅 Progress Log

### 2026-02-07
- Dynamic consumption calculation wired up
- Kingdom feats system complete with 30+ feats
- Feat selection integrated into level-up flow
- Feats display on dashboard

### 2026-02-06
- Repository cloned and analyzed
- Full hex map with POI system built
- Party token and fog of war
- Multi-map system with custom uploads
- Faction territory system
- Kingdom creation wizard
- All engines built (upkeep, commerce, event, activity, structure, progression)
- Level-up modal with ability/skill selection
