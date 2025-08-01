// Data Management Module for Mounjaro Tracker
// Handles all data operations, storage, and persistence

class DataManager {
    constructor() {
        this.entries = [];
        this.storageKey = 'mountaroEntries';
    }

    // Load data from localStorage
    loadData() {
        try {
            const stored = window.localStorage ? localStorage.getItem(this.storageKey) : null;
            this.entries = stored ? JSON.parse(stored) : [];
            
            // Sort entries by date (newest first)
            this.entries.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            console.log(`Loaded ${this.entries.length} entries from storage`);
        } catch (error) {
            console.error('Error loading data from storage:', error);
            this.entries = [];
        }
    }

    // Save data to localStorage
    saveData() {
        try {
            if (window.localStorage) {
                localStorage.setItem(this.storageKey, JSON.stringify(this.entries));
                console.log(`Saved ${this.entries.length} entries to storage`);
            }
        } catch (error) {
            console.error('Error saving data to storage:', error);
            Utils.showMessage('Could not save data to storage', 'warning');
        }
    }

    // Get all entries
    getEntries() {
        return this.entries;
    }

    // Add new entry
    addEntry(entry) {
        // Validate entry
        if (!this.validateEntry(entry)) {
            throw new Error('Invalid entry data');
        }

        // Ensure unique ID
        entry.id = entry.id || Date.now() + Math.random();

        // Add to beginning of array (newest first)
        this.entries.unshift(entry);

        // Save to storage
        this.saveData();

        console.log(`Added ${entry.type} entry:`, entry);
    }

    // Delete entry by ID
    deleteEntry(entryId) {
        const initialLength = this.entries.length;
        this.entries = this.entries.filter(entry => entry.id !== entryId);
        
        if (this.entries.length < initialLength) {
            this.saveData();
            console.log(`Deleted entry with ID: ${entryId}`);
            return true;
        }
        
        return false;
    }

    // Update existing entry
    updateEntry(entryId, updatedData) {
        const entryIndex = this.entries.findIndex(entry => entry.id === entryId);
        
        if (entryIndex === -1) {
            throw new Error('Entry not found');
        }

        // Validate updated data
        const updatedEntry = { ...this.entries[entryIndex], ...updatedData };
        if (!this.validateEntry(updatedEntry)) {
            throw new Error('Invalid updated entry data');
        }

        this.entries[entryIndex] = updatedEntry;
        this.saveData();

        console.log(`Updated entry with ID: ${entryId}`);
        return updatedEntry;
    }

    // Validate entry data
    validateEntry(entry) {
        // Required fields
        if (!entry.type || !entry.date) {
            console.error('Entry missing required fields:', entry);
            return false;
        }

        // Valid types
        if (!['medication', 'daily'].includes(entry.type)) {
            console.error('Invalid entry type:', entry.type);
            return false;
        }

        // Valid date
        const date = new Date(entry.date);
        if (isNaN(date.getTime())) {
            console.error('Invalid date:', entry.date);
            return false;
        }

        // Medication-specific validation
        if (entry.type === 'medication' && !entry.dose) {
            console.error('Medication entry missing dose:', entry);
            return false;
        }

        return true;
    }

    // Import multiple entries
    importEntries(newEntries) {
        if (!Array.isArray(newEntries)) {
            throw new Error('Import data must be an array');
        }

        const validEntries = [];
        const errors = [];

        newEntries.forEach((entry, index) => {
            try {
                if (this.validateEntry(entry)) {
                    // Ensure unique ID
                    entry.id = entry.id || Date.now() + Math.random() + index;
                    validEntries.push(entry);
                } else {
                    errors.push(`Entry ${index + 1}: Validation failed`);
                }
            } catch (error) {
                errors.push(`Entry ${index + 1}: ${error.message}`);
            }
        });

        if (validEntries.length === 0) {
            throw new Error('No valid entries to import');
        }

        // Merge with existing entries
        this.entries = [...validEntries, ...this.entries];

        // Remove duplicates
        this.removeDuplicates();

        // Sort by date
        this.entries.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Save to storage
        this.saveData();

        console.log(`Imported ${validEntries.length} entries, ${errors.length} errors`);
        return {
            imported: validEntries.length,
            errors: errors
        };
    }

    // Remove duplicate entries
    removeDuplicates() {
        const seen = new Set();
        const uniqueEntries = [];

        this.entries.forEach(entry => {
            // Create a unique key based on type, date, and key identifying field
            const dateKey = entry.date.split('T')[0]; // Date part only
            const key = entry.type === 'medication' 
                ? `${dateKey}-${entry.dose}-${entry.type}` 
                : `${dateKey}-${entry.weight}-${entry.type}`;
                
            if (!seen.has(key)) {
                seen.add(key);
                uniqueEntries.push(entry);
            }
        });

        const duplicatesRemoved = this.entries.length - uniqueEntries.length;
        this.entries = uniqueEntries;

        if (duplicatesRemoved > 0) {
            console.log(`Removed ${duplicatesRemoved} duplicate entries`);
        }

        return duplicatesRemoved;
    }

    // Export data as JSON
    exportData() {
        try {
            const dataStr = JSON.stringify(this.entries, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `mounjaro-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            console.log(`Exported ${this.entries.length} entries`);
            Utils.showMessage(`Exported ${this.entries.length} entries successfully`, 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            Utils.showMessage('Error exporting data', 'error');
        }
    }

    // Get entries by type
    getEntriesByType(type) {
        return this.entries.filter(entry => entry.type === type);
    }

    // Get entries by date range
    getEntriesByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return this.entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= start && entryDate <= end;
        });
    }

    // Get entries with weight data
    getWeightEntries() {
        return this.entries
            .filter(entry => entry.weight)
            .map(entry => ({
                date: new Date(entry.date),
                weight: parseFloat(entry.weight),
                type: entry.type
            }))
            .sort((a, b) => a.date - b.date); // Chronological order for charts
    }

    // Get latest entry of specific type
    getLatestEntry(type) {
        return this.entries.find(entry => entry.type === type);
    }

    // Get statistics
    getStatistics() {
        const totalEntries = this.entries.length;
        const medicationEntries = this.entries.filter(e => e.type === 'medication').length;
        const dailyEntries = this.entries.filter(e => e.type === 'daily').length;
        const entriesWithWeight = this.entries.filter(e => e.weight).length;
        
        const weightEntries = this.getWeightEntries();
        const latestWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : null;
        const firstWeight = weightEntries.length > 0 ? weightEntries[0].weight : null;
        const weightChange = (latestWeight && firstWeight) ? (latestWeight - firstWeight) : null;

        // Days since last medication
        const lastMedication = this.getLatestEntry('medication');
        let daysSinceLastDose = null;
        if (lastMedication) {
            const lastDate = new Date(lastMedication.date);
            daysSinceLastDose = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
        }

        return {
            totalEntries,
            medicationEntries,
            dailyEntries,
            entriesWithWeight,
            latestWeight,
            firstWeight,
            weightChange,
            daysSinceLastDose,
            dateRange: {
                earliest: this.entries.length > 0 ? new Date(this.entries[this.entries.length - 1].date) : null,
                latest: this.entries.length > 0 ? new Date(this.entries[0].date) : null
            }
        };
    }

    // Clear all data (with confirmation)
    clearAllData() {
        if (confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
            this.entries = [];
            this.saveData();
            console.log('All data cleared');
            Utils.showMessage('All data cleared successfully', 'success');
            return true;
        }
        return false;
    }

    // Backup data to a timestamped export
    createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const dataStr = JSON.stringify({
            exportDate: new Date().toISOString(),
            version: '1.0',
            entryCount: this.entries.length,
            entries: this.entries
        }, null, 2);
        
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `mounjaro-backup-${timestamp}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        console.log('Backup created');
    }
}