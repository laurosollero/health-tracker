// Main Application Controller for Mounjaro Tracker
// Based on body-metrics app architecture

class MounjaroTracker {
    constructor() {
        this.currentView = 'daily';
        this.isInitialized = false;
        this.chartViewStart = 0;
        this.chartViewDays = 14;
        
        // Initialize other modules
        this.dataManager = new DataManager();
        this.chartRenderer = new ChartRenderer();
        this.importManager = new ImportManager();
        
        // Bind methods
        this.handleDailySubmission = this.handleDailySubmission.bind(this);
        this.handleMedicationSubmission = this.handleMedicationSubmission.bind(this);
        
        this.init();
    }

    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
                return;
            }

            // Initialize components
            this.setupEventListeners();
            this.loadInitialData();
            this.updateUI();
            
            // Set initial form values
            this.setCurrentDateTime();
            
            // Initialize service worker for PWA functionality
            this.initServiceWorker();
            
            this.isInitialized = true;
            console.log('Mounjaro Tracker initialized successfully');
            
        } catch (error) {
            Utils.handleError(error, 'Application initialization');
        }
    }

    setupEventListeners() {
        // Tab navigation
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = button.getAttribute('aria-controls');
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });

        // Form submissions
        const dailyForm = document.getElementById('dailyForm');
        if (dailyForm) {
            dailyForm.addEventListener('submit', this.handleDailySubmission.bind(this));
        }

        const medicationForm = document.getElementById('medicationForm');
        if (medicationForm) {
            medicationForm.addEventListener('submit', this.handleMedicationSubmission.bind(this));
        }

        // Import method switching
        const importMethodButtons = document.querySelectorAll('#import .tab-button');
        importMethodButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const method = button.getAttribute('data-method');
                if (method) {
                    this.importManager.switchImportMethod(method);
                }
            });
        });

        // Import parsing buttons
        const parseTextBtn = document.getElementById('parseTextBtn');
        if (parseTextBtn) {
            parseTextBtn.addEventListener('click', () => {
                this.importManager.parseTextData();
            });
        }

        const parseJsonBtn = document.getElementById('parseJsonBtn');
        if (parseJsonBtn) {
            parseJsonBtn.addEventListener('click', () => {
                this.importManager.parseJsonImport();
            });
        }
    }

    loadInitialData() {
        this.dataManager.loadData();
        this.updateDaysSinceLastDose();
        this.setLastUsedDose();
    }

    updateUI() {
        this.displayEntries();
        this.displayStats();
    }

    // Navigation
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab and activate button
        const targetTab = document.getElementById(tabName);
        const targetButton = document.querySelector(`[onclick="switchTab('${tabName}')"]`);
        
        if (targetTab) targetTab.classList.add('active');
        if (targetButton) targetButton.classList.add('active');
        
        this.currentView = tabName;
        
        // Refresh data when switching tabs
        if (tabName === 'daily') {
            this.updateDaysSinceLastDose();
        }
        if (tabName === 'history') this.displayEntries();
        if (tabName === 'stats') this.displayStats();
    }

    // Form handling
    handleDailySubmission(e) {
        e.preventDefault();
        
        try {
            const entry = {
                id: Date.now(),
                type: 'daily',
                date: document.getElementById('dailyDate').value,
                weight: document.getElementById('dailyWeight').value || null,
                notes: document.getElementById('dailyNotes').value || null
            };

            this.dataManager.addEntry(entry);

            // Reset form and set defaults
            document.getElementById('dailyForm').reset();
            this.setCurrentDateTime();

            Utils.showMessage(`Daily check-in logged! Total entries: ${this.dataManager.getEntries().length}`, 'success', 'dailyMessages');
            this.updateUI();
            this.updateDaysSinceLastDose();
            
        } catch (error) {
            Utils.showMessage(`Error saving entry: ${error.message}`, 'error', 'dailyMessages');
        }
    }

    handleMedicationSubmission(e) {
        e.preventDefault();
        
        try {
            const entry = {
                id: Date.now(),
                type: 'medication',
                date: document.getElementById('medDate').value,
                dose: document.getElementById('dose').value,
                weight: document.getElementById('medWeight').value || null,
                notes: document.getElementById('medNotes').value || null
            };

            if (!entry.dose) {
                Utils.showMessage('Please select a dose', 'error', 'medicationMessages');
                return;
            }

            this.dataManager.addEntry(entry);

            // Reset form and set defaults
            document.getElementById('medicationForm').reset();
            this.setCurrentDateTime();
            this.setLastUsedDose();

            Utils.showMessage(`Medication dose logged! Total entries: ${this.dataManager.getEntries().length}`, 'success', 'medicationMessages');
            this.updateDaysSinceLastDose();
            this.updateUI();
            
        } catch (error) {
            Utils.showMessage(`Error saving entry: ${error.message}`, 'error', 'medicationMessages');
        }
    }

    // Utility methods
    setCurrentDateTime() {
        const now = new Date();
        const currentTime = now.toISOString().slice(0, 16);
        const dailyDate = document.getElementById('dailyDate');
        const medDate = document.getElementById('medDate');
        
        if (dailyDate) dailyDate.value = currentTime;
        if (medDate) medDate.value = currentTime;
    }

    setLastUsedDose() {
        const entries = this.dataManager.getEntries();
        const lastMedication = entries.find(entry => entry.type === 'medication');
        const doseSelect = document.getElementById('dose');
        
        if (lastMedication && doseSelect) {
            doseSelect.value = lastMedication.dose;
        }
    }

    updateDaysSinceLastDose() {
        const entries = this.dataManager.getEntries();
        const lastMedication = entries.find(entry => entry.type === 'medication');
        const daysSinceDiv = document.getElementById('daysSinceLastDose');
        
        if (!daysSinceDiv) return;
        
        if (lastMedication) {
            const lastDate = new Date(lastMedication.date);
            const now = new Date();
            const daysSince = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
            
            daysSinceDiv.innerHTML = `<div class="days-since">
                ${daysSince} day${daysSince !== 1 ? 's' : ''} since last Mounjaro dose (${lastMedication.dose})
            </div>`;
        } else {
            daysSinceDiv.innerHTML = `<div class="days-since">
                No medication doses logged yet
            </div>`;
        }
    }

    // Display methods
    displayEntries() {
        const entriesList = document.getElementById('entriesList');
        if (!entriesList) return;
        
        const entries = this.dataManager.getEntries();
        
        if (entries.length === 0) {
            entriesList.innerHTML = '<div class="no-data">No entries yet. Start by logging your daily check-in or medication dose!</div>';
            return;
        }

        entriesList.innerHTML = entries.map(entry => {
            const date = new Date(entry.date);
            const formattedDate = date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            if (entry.type === 'medication') {
                return `
                    <div class="entry-card medication">
                        <div class="entry-header">
                            <span class="entry-type medication">💊 Medication</span>
                        </div>
                        <div class="entry-date">${formattedDate}</div>
                        <div class="entry-details">
                            <div class="entry-detail">
                                <strong>${entry.dose}</strong>
                                <span>Dose</span>
                            </div>
                            ${entry.weight ? `
                                <div class="entry-detail">
                                    <strong>${entry.weight}</strong>
                                    <span>Weight</span>
                                </div>
                            ` : '<div class="entry-detail"><strong>-</strong><span>Weight</span></div>'}
                        </div>
                        ${entry.notes ? `<div class="entry-notes">${entry.notes}</div>` : ''}
                        <button class="delete-btn" onclick="app.deleteEntry(${entry.id})">🗑️</button>
                    </div>
                `;
            } else {
                return `
                    <div class="entry-card daily">
                        <div class="entry-header">
                            <span class="entry-type">📊 Daily Check-in</span>
                        </div>
                        <div class="entry-date">${formattedDate}</div>
                        <div class="entry-details">
                            <div class="entry-detail">
                                <strong>${entry.weight || '-'}</strong>
                                <span>Weight</span>
                            </div>
                            <div class="entry-detail">
                                <strong>${entry.notes ? 'Yes' : 'No'}</strong>
                                <span>Notes</span>
                            </div>
                        </div>
                        ${entry.notes ? `<div class="entry-notes">${entry.notes}</div>` : ''}
                        <button class="delete-btn" onclick="app.deleteEntry(${entry.id})">🗑️</button>
                    </div>
                `;
            }
        }).join('');
    }

    displayStats() {
        const statsContent = document.getElementById('statsContent');
        if (!statsContent) return;
        
        const entries = this.dataManager.getEntries();
        
        if (entries.length === 0) {
            statsContent.innerHTML = '<div class="no-data">No data available yet.</div>';
            return;
        }

        const totalEntries = entries.length;
        const medicationEntries = entries.filter(e => e.type === 'medication').length;
        const dailyEntries = entries.filter(e => e.type === 'daily').length;
        const latestWeight = entries.find(e => e.weight)?.weight || 'N/A';
        
        // Days since last dose
        const lastMedication = entries.find(entry => entry.type === 'medication');
        let daysSinceLastDose = 'N/A';
        if (lastMedication) {
            const lastDate = new Date(lastMedication.date);
            daysSinceLastDose = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
        }

        statsContent.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${medicationEntries}</div>
                    <div class="stat-label">Doses Logged</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${dailyEntries}</div>
                    <div class="stat-label">Daily Check-ins</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${daysSinceLastDose}</div>
                    <div class="stat-label">Days Since Last Dose</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${latestWeight}</div>
                    <div class="stat-label">Latest Weight</div>
                </div>
            </div>

            <div class="chart-container">
                <div class="chart-title">Weight Progress</div>
                <div class="chart-controls">
                    <button class="chart-nav-btn" id="chartPrevBtn" onclick="app.navigateChart(-1)">← Previous</button>
                    <button class="chart-nav-btn" onclick="app.resetChartView()">Show All</button>
                    <button class="chart-nav-btn" id="chartNextBtn" onclick="app.navigateChart(1)">Next →</button>
                </div>
                <div class="chart-info" id="chartInfo"></div>
                <canvas id="weightChart" class="chart-canvas"></canvas>
            </div>
            
            <button class="btn export-btn" onclick="app.exportData()">Export Data</button>
        `;

        // Draw weight chart after DOM is updated
        setTimeout(() => {
            this.chartRenderer.drawWeightChart(entries);
        }, 100);
    }

    // Chart navigation
    navigateChart(direction) {
        // This will be implemented with the chart renderer
        this.chartRenderer.navigateChart(direction);
    }

    resetChartView() {
        this.chartRenderer.resetChartView();
    }

    // Data actions
    deleteEntry(entryId) {
        if (confirm('Are you sure you want to delete this entry?')) {
            this.dataManager.deleteEntry(entryId);
            this.displayEntries();
            this.displayStats();
            this.updateDaysSinceLastDose();
            Utils.showMessage('Entry deleted successfully', 'success', 'dailyMessages');
        }
    }

    exportData() {
        this.dataManager.exportData();
    }

    // Service Worker initialization
    async initServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered successfully:', registration.scope);
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }
}

// Initialize the app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MounjaroTracker();
    // Make app globally available for onclick handlers
    window.app = app;
});