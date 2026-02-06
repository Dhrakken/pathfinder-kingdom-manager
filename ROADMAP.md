# Pathfinder Kingdom Manager - Development Roadmap

> Last updated: 2026-02-06 by Vecna

## 🎯 Vision
A unified Pathfinder 2E Kingmaker companion that combines kingdom management with interactive hex mapping — no external tools needed.

---

## 📋 Feature Backlog

### 1. 🗺️ Interactive Hex Map System
**Status:** 🟡 In Progress  
**Priority:** HIGH (Foundation for other features)  
**Estimated Effort:** Large

**Requirements:**
- SVG-based hex grid with proper hex coordinate system (axial/cube)
- Hex states: Unexplored (fog), Explored, Claimed
- Terrain types: Plains, Forest, Hills, Mountains, Swamp, Water, etc.
- Visual indicators for: Work sites, Roads, Fortifications, Settlements
- Click-to-interact: Select hex → show details → take actions
- Party token placement and movement
- Zoom and pan controls
- Integration with existing Region Activities (Claim Hex, Build Roads, etc.)

**Technical Approach:**
- Use SVG for crisp scaling
- Cube coordinates for hex math (easier neighbor calculations)
- Store hex data in kingdom state
- Lazy render visible hexes only for performance

**Sub-tasks:**
- [x] Hex grid component with proper geometry
- [x] Hex coordinate utilities (neighbors, distance, pathfinding)
- [x] Terrain rendering with icons/colors
- [x] Fog of war overlay
- [x] Hex selection and info panel
- [x] Work site icons
- [x] Settlement markers
- [x] Zoom/pan controls
- [x] Persist hex data in kingdom state
- [x] Work site placement UI modal
- [x] Terrain selection modal
- [ ] Road drawing between hexes
- [ ] Party token with drag support
- [ ] Integration with Region Activities
- [ ] Hex editing modal (terrain, notes)

---

### 2. ⚔️ Army Management System
**Status:** 🔴 Not Started  
**Priority:** MEDIUM (Depends on hex map)  
**Estimated Effort:** Medium

**Requirements:**
- Army creation with PF2E Kingmaker stats (HP, Morale, Tactics, etc.)
- Army roster view
- Army tokens on hex map
- Movement between hexes
- Basic combat tracking
- Army conditions and damage

**Technical Approach:**
- Army data model in state
- Army tokens as map overlay
- Combat as activity with rolls

**Sub-tasks:**
- [ ] Army data schema (name, type, HP, morale, tactics, level, traits)
- [ ] Army roster tab/panel
- [ ] Create/edit army UI
- [ ] Army tokens on hex map
- [ ] Army movement actions
- [ ] Combat rolls and outcomes
- [ ] Army conditions tracking

---

### 3. 🎲 Advanced Dice Rolling UI
**Status:** 🟡 Basic exists, needs enhancement  
**Priority:** MEDIUM (Quality of life)  
**Estimated Effort:** Small

**Current State:** Basic `rollDice()` function with text output

**Requirements:**
- Visual 3D-style dice with roll animation
- Sound effects (optional, toggleable)
- Clear display of: Base roll + modifiers = Total vs DC
- Degree of success with color coding
- Roll history panel
- Quick-roll buttons for common checks

**Technical Approach:**
- CSS animations for dice tumble effect
- Dice face SVGs or Unicode
- Audio API for optional sounds

**Sub-tasks:**
- [ ] Dice component with animation
- [ ] Modifier breakdown display
- [ ] Degree of success styling (crit success = gold, etc.)
- [ ] Roll history sidebar
- [ ] Sound toggle in settings
- [ ] Quick-roll from skills/activities

---

### 4. 📊 Excel Import/Export
**Status:** 🔴 Not Started  
**Priority:** LOW (Nice to have)  
**Estimated Effort:** Medium

**Requirements:**
- Export kingdom state to .xlsx format
- Worksheets for: Overview, Leadership, Settlements, Hexes, History
- Import from Excel to restore/migrate data
- Handle format validation gracefully

**Technical Approach:**
- Use SheetJS (xlsx) library
- Define clear worksheet schemas
- Validate on import

**Sub-tasks:**
- [ ] Add SheetJS dependency
- [ ] Export function with multiple worksheets
- [ ] Import function with validation
- [ ] Error handling and user feedback
- [ ] Format documentation

---

### 5. 📚 Skills System UI
**Status:** 🟡 Logic exists, needs dedicated UI  
**Priority:** LOW (Logic already works)  
**Estimated Effort:** Small

**Current State:** Skills in state, proficiency bonuses calculated, no dedicated tab

**Requirements:**
- Skills tab showing all 16 kingdom skills
- Grouped by ability (Culture, Economy, Loyalty, Stability)
- Proficiency dropdown per skill
- Calculated modifier display
- Quick-roll button per skill

**Sub-tasks:**
- [ ] Skills tab in navigation
- [ ] Skill cards grouped by ability
- [ ] Proficiency selector (Untrained→Legendary)
- [ ] Modifier calculation display
- [ ] Quick-roll integration

---

## 🚀 Recommended Build Order

1. **Hex Map System** — Foundation; biggest impact; enables army feature
2. **Army Management** — Depends on map; completes the Kingmaker experience  
3. **Dice Rolling UI** — Standalone; polish and feel
4. **Skills UI** — Quick win; logic already done
5. **Excel Export** — Nice to have; lower priority

---

## 📝 Completed Features

- ✅ Kingdom dashboard with stats
- ✅ 4-phase turn system
- ✅ Ability scores and modifiers
- ✅ Skill proficiency calculations
- ✅ Resource dice rolling
- ✅ Commodities tracking
- ✅ Work sites and consumption
- ✅ Leadership management (8 roles)
- ✅ 28 activities with outcomes
- ✅ Settlement grid view
- ✅ Turn logging and history
- ✅ JSON save/load
- ✅ Glass-morphism UI with Tailwind

---

## 🔧 Technical Debt / Fixes

- [ ] Deploy to GitHub Pages (currently 404)
- [ ] Add proper error boundaries
- [ ] Mobile responsiveness polish
- [ ] Keyboard shortcuts
- [ ] Undo/redo system

---

## 📅 Progress Log

### 2026-02-06
- Repository cloned and analyzed
- Roadmap created
- Development plan established
- **Hex Map v1 implemented:**
  - Created src/utils/hexUtils.js with coordinate system
  - Created src/components/HexMap.jsx with SVG rendering
  - Added Map tab to KingdomManager
  - Pre-populated Nauthgard's 12 claimed hexes
  - Added explored hexes from imported map data
  - Work sites and settlement markers working
  - Zoom/pan/select functionality complete
  - Added work site selection modal (farm/lumber/mine/quarry)
  - Added terrain selection modal
  - Hex info panel now interactive
