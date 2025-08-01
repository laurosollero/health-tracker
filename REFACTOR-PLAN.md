# Mounjaro Tracker Refactor Plan

## 🎯 **Project Goals**

Transform the single-file Mounjaro Tracker into a multi-file PWA application using the established design system from body-metrics and ui-components-library, creating a foundation for a suite of health tracking applications.

## 📊 **Current State Analysis**

### ✅ **Existing Features to Preserve**
- Medication tracking (Mounjaro doses: 2.5mg, 5mg)
- Daily health check-ins with weight and symptoms
- Days since last dose calculation
- Data import from manual text format
- Weight progress visualization with charts
- Data export functionality
- Local storage persistence
- Form validation and error handling

### 🔄 **Current Architecture (Single File)**
- **HTML**: All markup in index.html (~1,200 lines)
- **CSS**: Embedded styles (~400 lines)
- **JavaScript**: Embedded scripts (~700 lines)
- **Storage**: localStorage only
- **No PWA**: No service worker or manifest

## 🏗️ **Target Architecture**

### **Design System Integration**
- **UI Components Library**: `/personal/ui-components-library`
- **Design Tokens**: Colors, typography, spacing, shadows from existing system
- **Color Palette**: 
  - Primary: `#2563eb` (Blue)
  - Secondary: `#10b981` (Green) 
  - Accent: `#f59e0b` (Amber)
  - Success: `#22c55e`, Error: `#ef4444`, Warning: `#f59e0b`
- **Typography**: System fonts with established size scale
- **Components**: Cards, buttons, forms following body-metrics patterns

### **File Structure** (Based on body-metrics)
```
/personal/health-tracker/
├── index.html                    # Main HTML entry point
├── manifest.json                 # PWA manifest
├── sw.js                        # Service worker
├── styles/
│   ├── main.css                 # Core styles using design tokens
│   ├── mobile.css               # Mobile-responsive styles
│   └── components.css           # Component-specific styles
├── js/
│   ├── app.js                   # Main application controller (class-based)
│   ├── data.js                  # Data management and storage
│   ├── charts.js                # Chart rendering and visualization
│   ├── import.js                # Data import parsing functionality
│   └── utils.js                 # Utility functions and helpers
├── icons/                       # PWA icons and assets
│   ├── icon-*.png              # Various PWA icons (16x16 to 512x512)
│   ├── logo.svg                # Main app logo
│   └── sprite.svg              # Icon sprite for UI elements
├── assets/                      # Additional static assets
└── README.md                    # Documentation
```

## 🎨 **Design System Implementation**

### **CSS Architecture**
```css
/* Design Tokens (from ui-components-library) */
:root {
  /* Colors */
  --primary-color: #2563eb;
  --secondary-color: #10b981;
  --accent-color: #f59e0b;
  --background-color: #f8fafc;
  --surface-color: #ffffff;
  --text-color: #1e293b;
  --text-secondary: #64748b;
  
  /* Spacing Scale */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  /* Typography */
  --font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  
  /* Layout */
  --header-height: 60px;
  --bottom-nav-height: 70px;
  --content-padding: var(--spacing-md);
}
```

### **Component Standards**
- **Cards**: Consistent border-radius, shadows, padding
- **Buttons**: Primary, secondary, success variants with consistent styling
- **Forms**: Unified input styling with focus states
- **Navigation**: Tab-based navigation with active states
- **Charts**: Canvas-based with consistent color scheme

## 💊 **Application Structure**

### **Main App Class** (`js/app.js`)
```javascript
class MounjaroTracker {
    constructor() {
        this.currentView = 'daily';
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.loadInitialData();
        this.updateUI();
        this.initServiceWorker();
        this.initIcons();
    }
    
    // Navigation, form handling, UI updates
}
```

### **Data Management** (`js/data.js`)
```javascript
class DataManager {
    constructor() {
        this.entries = [];
        this.storageKey = 'mountaroEntries';
    }
    
    // CRUD operations, localStorage, export/import
    loadData() { /* ... */ }
    saveData() { /* ... */ }
    addEntry(entry) { /* ... */ }
    deleteEntry(id) { /* ... */ }
    exportData() { /* ... */ }
}
```

### **Chart System** (`js/charts.js`)
```javascript
class ChartRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
    }
    
    // Weight progress charts with medication correlation
    drawWeightChart(data) { /* ... */ }
    drawTrendChart(data) { /* ... */ }
}
```

### **Data Import** (`js/import.js`)
```javascript
class DataImporter {
    constructor() {
        this.parsedEntries = [];
    }
    
    // Parse manual data format
    parseTextData(text, year) { /* ... */ }
    validateEntries(entries) { /* ... */ }
    previewImport(entries) { /* ... */ }
}
```

## 📱 **PWA Implementation**

### **Manifest Configuration**
```json
{
  "name": "Mounjaro Tracker - Medication & Health Log",
  "short_name": "Mounjaro",
  "description": "Privacy-first Mounjaro medication and health tracking",
  "theme_color": "#10b981",
  "background_color": "#f8fafc",
  "display": "standalone",
  "start_url": "./",
  "categories": ["health", "medical", "lifestyle"],
  "shortcuts": [
    {
      "name": "Log Medication",
      "url": "./#medication"
    },
    {
      "name": "Daily Check-in", 
      "url": "./#daily"
    }
  ]
}
```

### **Service Worker Features**
- **Offline Capability**: Cache static assets and core functionality
- **Background Sync**: Queue data when offline
- **Push Notifications**: Medication reminders (optional)
- **Auto-updates**: Update app when new version available

### **Icon System**
- **App Icons**: 16x16 to 512x512 for various platforms
- **UI Icons**: SVG sprite system for interface elements
- **Theming**: Support for light/dark mode icons

## 🔄 **Migration Strategy**

### **Phase 1: Structure Setup**
1. Create file structure matching body-metrics pattern
2. Extract CSS into separate files with design tokens
3. Split JavaScript into modular files
4. Create basic HTML structure with proper semantic markup

### **Phase 2: Component Integration**
1. Implement design system components (cards, buttons, forms)
2. Apply consistent styling and spacing
3. Ensure responsive design for mobile/desktop
4. Integrate icon system

### **Phase 3: PWA Implementation**
1. Create manifest.json with proper configuration
2. Implement service worker for offline functionality
3. Generate and optimize icons for all platforms
4. Add PWA meta tags and configuration

### **Phase 4: Feature Enhancement**
1. Improve data visualization with consistent chart styling
2. Enhanced import/export functionality
3. Better error handling and user feedback
4. Performance optimization

## 🎯 **Success Metrics**

### **Technical**
- ✅ Lighthouse PWA score: 100
- ✅ Lighthouse Performance score: >90
- ✅ All existing functionality preserved
- ✅ Consistent design system implementation
- ✅ Mobile-first responsive design
- ✅ Offline functionality working

### **User Experience**
- ✅ Fast loading and smooth interactions
- ✅ Intuitive navigation and consistent UI
- ✅ Reliable data persistence and export
- ✅ Professional medical app appearance
- ✅ Installation and standalone usage

## 📋 **Implementation Checklist**

### **Phase 1: Foundation** 
- [ ] Create project file structure
- [ ] Set up HTML template with proper meta tags
- [ ] Extract and organize CSS with design tokens
- [ ] Split JavaScript into modular files
- [ ] Implement basic routing and navigation

### **Phase 2: Design System**
- [ ] Apply design tokens throughout
- [ ] Implement component library styles
- [ ] Create responsive layouts
- [ ] Add icon system and SVG sprites
- [ ] Ensure accessibility compliance

### **Phase 3: PWA Setup**
- [ ] Create manifest.json
- [ ] Generate all required icon sizes
- [ ] Implement service worker
- [ ] Add offline functionality
- [ ] Test installation and standalone mode

### **Phase 4: Feature Parity**
- [ ] Port all existing functionality
- [ ] Implement data import/export
- [ ] Add chart visualization
- [ ] Test medication and daily tracking
- [ ] Verify data persistence

### **Phase 5: Enhancement**
- [ ] Add push notifications for reminders
- [ ] Implement data sync capabilities
- [ ] Add advanced analytics and insights
- [ ] Performance optimization
- [ ] Comprehensive testing

## 🔮 **Future Health Tracker Suite**

This refactor creates the foundation for additional health tracking apps:

### **Planned Applications**
- **BloodPressure Tracker**: Blood pressure, heart rate monitoring
- **Glucose Tracker**: Blood sugar, insulin tracking for diabetes
- **Symptom Tracker**: General symptom logging and correlation
- **Medication Manager**: Multi-medication tracking and interactions
- **Wellness Dashboard**: Aggregated health metrics and insights

### **Shared Architecture**
- **Common Design System**: Consistent UI across all apps
- **Shared Components**: Reusable charts, forms, navigation
- **Data Standards**: Common data formats and export capabilities
- **PWA Framework**: Standardized offline and installation experience

---

**Next Steps**: Begin Phase 1 implementation with file structure setup and CSS extraction, maintaining all existing functionality while establishing the new architecture foundation.