# Kingmaker Kingdom Manager

A comprehensive React application for managing kingdoms in Pathfinder 2E's Kingmaker Adventure Path.

![Kingdom Manager](https://img.shields.io/badge/PF2E-Kingmaker-purple)
![React](https://img.shields.io/badge/React-18.2-blue)
![Vite](https://img.shields.io/badge/Vite-5.0-yellow)

## Features

### Dashboard
- **Kingdom Overview**: Level, XP, size, fame tracking
- **Turn Phase Tracker**: Guide through Upkeep → Commerce → Activity → Event phases
- **Ability Scores**: Culture, Economy, Loyalty, Stability with modifiers
- **Resource Points**: Integrated dice roller for resource collection
- **Commodities**: Food, Lumber, Luxuries, Ore, Stone tracking
- **Unrest & Ruin**: Visual indicators with penalty calculations

### Leadership Management
- 8 leadership positions (Ruler, Counselor, General, Emissary, Magister, Treasurer, Viceroy, Warden)
- PC/NPC tracking with invested status
- Bio fields for character notes

### Activity System
- **Leadership Activities** (12): Celebrate Holiday, Craft Luxuries, Creative Solution, Hire Adventurers, Improve Lifestyle, New Leadership, Prognostication, Provide Care, Quell Unrest, Repair Reputation, Rest and Relax, Supernatural Solution
- **Region Activities** (9): Claim Hex, Abandon Hex, Build Roads, Clear Hex, Establish Farmland, Establish Work Site, Fortify Hex, Go Fishing, Harvest Crops
- **Civic Activities** (4): Build Structure, Demolish, Establish Settlement, Relocate Capital
- **Commerce Activities** (3): Collect Taxes, Trade Commodities, Establish Trade Agreement
- Full outcome descriptions for Critical Success through Critical Failure

### Settlement Management
- Urban grid visualization (4x4 blocks)
- Structure database with 40+ buildings
- Building costs, requirements, and effects

### Data Management
- JSON export/import for save states
- Turn history tracking
- Activity logging

## Installation

```bash
# Clone the repository
git clone https://github.com/Dhrakken/pathfinder-kingdom-manager.git
cd pathfinder-kingdom-manager

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

### Each Turn Workflow

1. **Upkeep Phase**
   - Check for vacant leadership (+1 Unrest per vacancy)
   - Roll resource dice → Add to RP
   - Collect commodities from work sites
   - Pay consumption in Food

2. **Commerce Phase**
   - Collect Taxes activity
   - Trade Commodities activity

3. **Activity Phase**
   - Take Leadership activities (limited per turn)
   - Take Region activities (unlimited)
   - Take Civic activities (unlimited)

4. **Event Phase**
   - Check for random events
   - Resolve any events

### Customization

Edit the `createInitialState()` function in `KingdomManager.jsx` to set your kingdom's starting values:
- Name and capital
- Level and XP
- Ability scores
- Skill proficiencies
- Resources and commodities
- Work sites
- Leadership roster
- Settlements

## Project Structure

```
kingmaker-kingdom-manager/
├── src/
│   ├── data/
│   │   ├── activities.js      # Activity definitions with outcomes
│   │   ├── reference.js       # Game tables (sizes, DCs, skills, roles)
│   │   ├── structures.js      # Building database (40+ structures)
│   │   └── index.js           # Data exports
│   ├── App.jsx
│   ├── KingdomManager.jsx     # Main application component
│   ├── index.css              # Styles with Tailwind
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Roadmap

- [ ] Hex map visualization with explore/claim/build workflow
- [ ] Army management system
- [ ] Event deck with random events
- [ ] Settlement builder with drag-and-drop
- [ ] Multiple kingdom support
- [ ] Diplomacy tracking
- [ ] Kingdom feat selection
- [ ] Print-friendly turn summary
- [ ] Offline PWA support

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - feel free to use and modify for your own campaigns.

## Credits

- Pathfinder 2E Kingmaker rules by Paizo
- Built with React, Vite, and Tailwind CSS
- Icons from Lucide React

## Disclaimer

This is a fan-made tool for personal use. Pathfinder and Kingmaker are trademarks of Paizo Inc. This project is not affiliated with or endorsed by Paizo.
