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

        // Medication checkbox toggle
        const medicationCheckbox = document.getElementById('includeMedication');
        const medicationFields = document.getElementById('medicationFields');
        const submitBtn = document.getElementById('dailySubmitBtn');
        
        if (medicationCheckbox && medicationFields && submitBtn) {
            medicationCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    medicationFields.style.display = 'block';
                    submitBtn.innerHTML = '💊 Log Check-in + Medication';
                    submitBtn.className = 'btn btn-success';
                    
                    // Make dose required when medication is checked
                    const doseSelect = document.getElementById('dose');
                    if (doseSelect) doseSelect.required = true;
                } else {
                    medicationFields.style.display = 'none';
                    submitBtn.innerHTML = '📊 Log Daily Check-in';
                    submitBtn.className = 'btn btn-primary';
                    
                    // Remove dose requirement
                    const doseSelect = document.getElementById('dose');
                    if (doseSelect) {
                        doseSelect.required = false;
                        doseSelect.value = '';
                    }
                    
                    // Clear medication fields
                    const medicationNotes = document.getElementById('medicationNotes');
                    if (medicationNotes) medicationNotes.value = '';
                }
            });
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
        const targetButton = document.querySelector(`[aria-controls="${tabName}"]`);
        
        if (targetTab) targetTab.classList.add('active');
        if (targetButton) {
            targetButton.classList.add('active');
            targetButton.setAttribute('aria-selected', 'true');
        }
        
        // Update other buttons' aria-selected
        document.querySelectorAll('.tab-button').forEach(btn => {
            if (btn !== targetButton) {
                btn.setAttribute('aria-selected', 'false');
            }
        });
        
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
            const includeMedication = document.getElementById('includeMedication').checked;
            const date = document.getElementById('dailyDate').value;
            const weight = document.getElementById('dailyWeight').value || null;
            const dailyNotes = document.getElementById('dailyNotes').value || null;
            
            // Always create a daily entry
            const dailyEntry = {
                id: Date.now(),
                type: 'daily',
                date: date,
                weight: weight,
                notes: dailyNotes
            };
            
            this.dataManager.addEntry(dailyEntry);
            let entriesAdded = 1;
            let message = 'Daily check-in logged!';
            
            // If medication is included, create a separate medication entry
            if (includeMedication) {
                const dose = document.getElementById('dose').value;
                const medicationNotes = document.getElementById('medicationNotes').value || null;
                
                if (!dose) {
                    Utils.showMessage('Please select a dose when logging medication', 'error', 'dailyMessages');
                    return;
                }
                
                const medicationEntry = {
                    id: Date.now() + 1, // Ensure unique ID
                    type: 'medication',
                    date: date,
                    dose: dose,
                    weight: weight, // Include weight in both entries if provided
                    notes: medicationNotes
                };
                
                this.dataManager.addEntry(medicationEntry);
                entriesAdded = 2;
                message = `Check-in + medication (${dose}) logged!`;
            }

            // Reset form and set defaults
            document.getElementById('dailyForm').reset();
            document.getElementById('includeMedication').checked = false;
            document.getElementById('medicationFields').style.display = 'none';
            document.getElementById('dailySubmitBtn').innerHTML = '📊 Log Daily Check-in';
            document.getElementById('dailySubmitBtn').className = 'btn btn-primary';
            
            // Remove dose requirement
            const doseSelect = document.getElementById('dose');
            if (doseSelect) doseSelect.required = false;
            
            this.setCurrentDateTime();

            Utils.showMessage(`${message} Total entries: ${this.dataManager.getEntries().length}`, 'success', 'dailyMessages');
            this.updateUI();
            this.updateDaysSinceLastDose();
            
        } catch (error) {
            Utils.showMessage(`Error saving entry: ${error.message}`, 'error', 'dailyMessages');
        }
    }


    // Utility methods
    setCurrentDateTime() {
        const now = new Date();
        const currentTime = now.toISOString().slice(0, 16);
        const dailyDate = document.getElementById('dailyDate');
        
        if (dailyDate) dailyDate.value = currentTime;
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

        // Calculate weight trend
        const weightEntries = entries
            .filter(entry => entry.weight && !isNaN(parseFloat(entry.weight)))
            .map(entry => ({
                ...entry,
                weight: parseFloat(entry.weight),
                date: new Date(entry.date).getTime()
            }))
            .sort((a, b) => a.date - b.date);

        let trendInfo = { text: 'N/A', class: 'neutral' };
        if (weightEntries.length >= 3) {
            const trendData = this.chartRenderer.calculateTrendLine(weightEntries);
            if (trendData) {
                const totalChange = trendData.slope * trendData.xValues[trendData.xValues.length - 1];
                const changeText = `${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)}kg`;
                
                if (totalChange > 0.1) {
                    trendInfo = { text: `↗ ${changeText}`, class: 'rising' };
                } else if (totalChange < -0.1) {
                    trendInfo = { text: `↘ ${changeText}`, class: 'falling' };
                } else {
                    trendInfo = { text: '→ Stable', class: 'stable' };
                }
            }
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
                <div class="stat-card trend-${trendInfo.class}">
                    <div class="stat-value">${trendInfo.text}</div>
                    <div class="stat-label">Weight Trend</div>
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