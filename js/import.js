// Import Management Module for Mounjaro Tracker
// Handles text parsing and JSON import functionality

class ImportManager {
    constructor() {
        this.parsedEntries = [];
        this.currentImportMethod = 'text';
    }

    // Switch between import methods
    switchImportMethod(method) {
        // Hide all import methods
        document.querySelectorAll('.import-method').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('#import .tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected method and activate button
        const targetSection = document.getElementById(method + 'Import');
        const targetButton = document.querySelector(`[onclick="switchImportMethod('${method}')"]`);
        
        if (targetSection) targetSection.classList.add('active');
        if (targetButton) targetButton.classList.add('active');
        
        this.currentImportMethod = method;
        
        // Clear any previous messages and previews
        Utils.clearMessages('importMessages');
        this.clearImportPreview();
    }

    // Parse text data import
    parseTextData() {
        const importData = document.getElementById('importData').value.trim();
        const year = document.getElementById('importYear').value;
        
        if (!importData) {
            Utils.showMessage('Please paste your data first', 'error', 'importMessages');
            return;
        }

        try {
            const parsedEntries = [];
            const lines = importData.split('\n');
            let currentEntry = null;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                if (line === '') continue;
                
                // Check if this is a date line (DD/MM - weight)
                const dateMatch = line.match(/^(\d{2})\/(\d{2})\s*-\s*([\d.,]+)\s*kg/);
                
                if (dateMatch) {
                    // Save previous entry if exists
                    if (currentEntry) {
                        parsedEntries.push(currentEntry);
                    }
                    
                    // Start new entry
                    const day = parseInt(dateMatch[1]);
                    const month = parseInt(dateMatch[2]);
                    const weight = parseFloat(dateMatch[3].replace(',', '.'));
                    
                    // Validate date
                    if (day < 1 || day > 31 || month < 1 || month > 12) {
                        console.warn(`Invalid date: ${day}/${month}`);
                        continue;
                    }
                    
                    // Create date (set to noon to avoid timezone issues)
                    const date = new Date(parseInt(year), month - 1, day, 12, 0);
                    
                    currentEntry = {
                        id: Date.now() + Math.random(),
                        date: date.toISOString().slice(0, 16),
                        weight: weight,
                        notes: [],
                        type: 'daily',
                        dose: null
                    };
                }
                // Check if this is a note line (starts with -)
                else if (line.startsWith('-') && currentEntry) {
                    const note = line.substring(1).trim();
                    
                    // Check if it's a medication note
                    const medMatch = note.match(/mounjaro\s+([\d.,]+)\s*mg/i);
                    if (medMatch) {
                        const dose = parseFloat(medMatch[1].replace(',', '.'));
                        currentEntry.type = 'medication';
                        currentEntry.dose = dose + 'mg';
                    } else if (note !== '') {
                        currentEntry.notes.push(note);
                    }
                }
            }
            
            // Don't forget the last entry
            if (currentEntry) {
                parsedEntries.push(currentEntry);
            }
            
            // Convert notes array to string
            parsedEntries.forEach(entry => {
                if (entry.notes.length > 0) {
                    entry.notes = entry.notes.join('. ');
                } else {
                    entry.notes = null;
                }
            });
            
            this.parsedEntries = parsedEntries;
            this.displayImportPreview(parsedEntries);
            
        } catch (error) {
            Utils.showMessage(`Error parsing data: ${error.message}`, 'error', 'importMessages');
        }
    }

    // Parse JSON import
    parseJsonImport() {
        const fileInput = document.getElementById('jsonFileInput');
        const textInput = document.getElementById('jsonTextInput');
        
        // Handle file input
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            
            // Validate file type
            if (!file.type.includes('json') && !file.name.endsWith('.json')) {
                Utils.showMessage('Please select a valid JSON file', 'error', 'importMessages');
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    this.processJsonImport(jsonData);
                } catch (error) {
                    Utils.showMessage(`Error reading file: ${error.message}`, 'error', 'importMessages');
                }
            };
            
            reader.onerror = () => {
                Utils.showMessage('Error reading file', 'error', 'importMessages');
            };
            
            reader.readAsText(file);
            return;
        }
        
        // Handle text input
        const jsonText = textInput.value.trim();
        if (!jsonText) {
            Utils.showMessage('Please select a file or paste JSON data', 'error', 'importMessages');
            return;
        }
        
        try {
            const jsonData = JSON.parse(jsonText);
            this.processJsonImport(jsonData);
        } catch (error) {
            Utils.showMessage(`Invalid JSON format: ${error.message}`, 'error', 'importMessages');
        }
    }

    // Process parsed JSON data
    processJsonImport(jsonData) {
        try {
            // Handle backup format (object with entries array)
            let entries = jsonData;
            if (jsonData.entries && Array.isArray(jsonData.entries)) {
                entries = jsonData.entries;
                console.log('Detected backup format, extracting entries');
            }
            
            // Validate JSON structure
            if (!Array.isArray(entries)) {
                throw new Error('JSON data must be an array of entries or backup object with entries array');
            }
            
            // Validate each entry
            const validatedEntries = [];
            let errorCount = 0;
            
            entries.forEach((entry, index) => {
                try {
                    // Required fields validation
                    if (!entry.id || !entry.type || !entry.date) {
                        throw new Error(`Entry ${index + 1}: Missing required fields (id, type, date)`);
                    }
                    
                    // Type validation
                    if (!['medication', 'daily'].includes(entry.type)) {
                        throw new Error(`Entry ${index + 1}: Invalid type "${entry.type}". Must be "medication" or "daily"`);
                    }
                    
                    // Date validation
                    const date = new Date(entry.date);
                    if (isNaN(date.getTime())) {
                        throw new Error(`Entry ${index + 1}: Invalid date format "${entry.date}"`);
                    }
                    
                    // Medication-specific validation
                    if (entry.type === 'medication' && !entry.dose) {
                        throw new Error(`Entry ${index + 1}: Medication entries must have a dose`);
                    }
                    
                    // Create clean entry object
                    const cleanEntry = {
                        id: parseInt(entry.id) || Date.now() + Math.random(),
                        type: entry.type,
                        date: entry.date,
                        weight: entry.weight || null,
                        notes: entry.notes || null
                    };
                    
                    if (entry.type === 'medication') {
                        cleanEntry.dose = entry.dose;
                    }
                    
                    validatedEntries.push(cleanEntry);
                    
                } catch (error) {
                    console.error(`Validation error for entry ${index + 1}:`, error.message);
                    errorCount++;
                }
            });
            
            if (validatedEntries.length === 0) {
                throw new Error('No valid entries found in JSON data');
            }
            
            // Show results
            if (errorCount > 0) {
                Utils.showMessage(
                    `Warning: ${errorCount} entries had validation errors and were skipped. ${validatedEntries.length} valid entries found.`, 
                    'warning', 
                    'importMessages'
                );
            } else {
                Utils.showMessage(
                    `Successfully parsed ${validatedEntries.length} entries from JSON data.`, 
                    'success', 
                    'importMessages'
                );
            }
            
            this.parsedEntries = validatedEntries;
            this.displayImportPreview(validatedEntries);
            
        } catch (error) {
            Utils.showMessage(`Error processing JSON data: ${error.message}`, 'error', 'importMessages');
        }
    }

    // Display import preview
    displayImportPreview(entries) {
        const previewDiv = document.getElementById('importPreview');
        if (!previewDiv) return;
        
        if (entries.length === 0) {
            previewDiv.innerHTML = '<div class="no-data">No entries could be parsed</div>';
            return;
        }
        
        const medicationCount = entries.filter(e => e.type === 'medication').length;
        const dailyCount = entries.filter(e => e.type === 'daily').length;
        
        let html = `
            <div class="import-preview">
                <div class="import-stats">
                    Found ${entries.length} entries: ${medicationCount} medication doses, ${dailyCount} daily check-ins
                </div>
                
                <h3>Preview:</h3>
        `;
        
        // Show first 5 entries as preview
        const previewEntries = entries.slice(0, 5);
        
        previewEntries.forEach(entry => {
            const date = new Date(entry.date);
            const formattedDate = date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            html += `
                <div class="import-entry ${entry.type}">
                    <strong>${formattedDate}</strong><br>
                    <strong>Weight:</strong> ${entry.weight ? entry.weight + ' kg' : 'Not recorded'}<br>
                    ${entry.dose ? `<strong>Dose:</strong> ${entry.dose}<br>` : ''}
                    ${entry.notes ? `<strong>Notes:</strong> ${entry.notes}<br>` : ''}
                    <small><em>Type: ${entry.type}</em></small>
                </div>
            `;
        });
        
        if (entries.length > 5) {
            html += `
                <div class="import-entry">
                    <em>... and ${entries.length - 5} more entries</em>
                </div>
            `;
        }
        
        html += `
                <button class="btn btn-success" onclick="app.importManager.confirmImport()">
                    ✅ Import These ${entries.length} Entries
                </button>
            </div>
        `;
        
        previewDiv.innerHTML = html;
    }

    // Clear import preview
    clearImportPreview() {
        const previewDiv = document.getElementById('importPreview');
        if (previewDiv) {
            previewDiv.innerHTML = '';
        }
        this.parsedEntries = [];
    }

    // Confirm and execute import
    confirmImport() {
        if (this.parsedEntries.length === 0) {
            Utils.showMessage('No entries to import', 'error', 'importMessages');
            return;
        }

        try {
            // Use DataManager to import entries
            const result = app.dataManager.importEntries(this.parsedEntries);
            
            // Clear import form
            this.clearImportForms();
            this.clearImportPreview();
            
            // Update displays
            app.updateUI();
            app.updateDaysSinceLastDose();
            
            let message = `Successfully imported ${result.imported} entries!`;
            if (result.errors.length > 0) {
                message += ` (${result.errors.length} entries had errors and were skipped)`;
                console.warn('Import errors:', result.errors);
            }
            
            Utils.showMessage(message, 'success', 'importMessages');
            
        } catch (error) {
            Utils.showMessage(`Error importing data: ${error.message}`, 'error', 'importMessages');
        }
    }

    // Clear import forms
    clearImportForms() {
        // Clear text import
        const importData = document.getElementById('importData');
        if (importData) importData.value = '';
        
        // Clear JSON import
        const jsonFileInput = document.getElementById('jsonFileInput');
        if (jsonFileInput) jsonFileInput.value = '';
        
        const jsonTextInput = document.getElementById('jsonTextInput');
        if (jsonTextInput) jsonTextInput.value = '';
    }

    // Validate import data before processing
    validateImportData(entries) {
        const errors = [];
        
        entries.forEach((entry, index) => {
            // Required fields
            if (!entry.type || !entry.date) {
                errors.push(`Entry ${index + 1}: Missing required fields`);
            }
            
            // Valid type
            if (entry.type && !['medication', 'daily'].includes(entry.type)) {
                errors.push(`Entry ${index + 1}: Invalid type "${entry.type}"`);
            }
            
            // Valid date
            if (entry.date && isNaN(new Date(entry.date).getTime())) {
                errors.push(`Entry ${index + 1}: Invalid date "${entry.date}"`);
            }
            
            // Medication dose
            if (entry.type === 'medication' && !entry.dose) {
                errors.push(`Entry ${index + 1}: Medication entry missing dose`);
            }
        });
        
        return errors;
    }

    // Export sample format for users
    exportSampleData() {
        const sampleData = [
            {
                id: Date.now(),
                type: 'medication',
                date: '2025-01-01T12:00',
                dose: '5mg',
                weight: '70.5',
                notes: 'First dose of the month'
            },
            {
                id: Date.now() + 1,
                type: 'daily',
                date: '2025-01-02T12:00',
                weight: '70.2',
                notes: 'Feeling good today, no side effects'
            }
        ];
        
        const dataStr = JSON.stringify(sampleData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'mounjaro-sample-data.json';
        link.click();
        
        URL.revokeObjectURL(url);
        Utils.showMessage('Sample data format downloaded', 'success', 'importMessages');
    }
}

// Import manager class handles all import functionality
// Event listeners are managed by the main app class