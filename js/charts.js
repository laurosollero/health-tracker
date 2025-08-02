// Chart Rendering Module for Mounjaro Tracker
// Handles all visualization and chart drawing functionality

class ChartRenderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.chartViewStart = 0;
        this.chartViewDays = 14;
        this.currentData = [];
    }

    // Helper method to get CSS custom property values
    getCSS(property) {
        return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
    }

    // Initialize chart canvas
    initCanvas(canvasId = 'weightChart') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn(`Canvas element '${canvasId}' not found`);
            return false;
        }
        
        this.ctx = this.canvas.getContext('2d');
        return true;
    }

    // Main weight chart drawing function
    drawWeightChart(entries) {
        if (!this.initCanvas()) {
            return;
        }

        const container = this.canvas.parentElement;
        
        // Set canvas size to match container
        this.canvas.width = container.clientWidth - 40;
        this.canvas.height = 250;

        // Get weight data and sort by date (chronological order)
        const weightEntries = entries
            .filter(e => e.weight)
            .map(e => ({
                date: new Date(e.date),
                weight: parseFloat(e.weight),
                type: e.type
            }))
            .sort((a, b) => a.date - b.date);

        this.currentData = weightEntries;

        if (weightEntries.length === 0) {
            this.drawNoDataMessage();
            return;
        }

        // Chart dimensions
        const padding = 40;
        const chartWidth = this.canvas.width - 2 * padding;
        const chartHeight = this.canvas.height - 2 * padding;

        // Find min/max values for better scaling
        const weights = weightEntries.map(e => e.weight);
        const minWeightRaw = Math.min(...weights);
        const maxWeightRaw = Math.max(...weights);
        
        // Round to nice scale values (.0 and .5)
        const minWeight = Math.floor(minWeightRaw * 2) / 2;
        const maxWeight = Math.ceil(maxWeightRaw * 2) / 2;
        const weightRange = maxWeight - minWeight || 1;

        const dates = weightEntries.map(e => e.date);
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        const timeRange = maxDate - minDate || 1;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.drawBackground(padding, chartWidth, chartHeight);

        // Draw grid and labels
        this.drawGrid(padding, chartWidth, chartHeight, minWeight, maxWeight, weightRange, minDate, maxDate, timeRange);

        // Draw weight line
        this.drawWeightLine(weightEntries, padding, chartWidth, chartHeight, minWeight, weightRange, minDate, timeRange);

        // Draw trend line if we have enough data
        if (weightEntries.length >= 3) {
            this.drawTrendLine(weightEntries, padding, chartWidth, chartHeight, minWeight, weightRange, minDate, timeRange);
        }

        // Draw data points
        this.drawDataPoints(weightEntries, padding, chartWidth, chartHeight, minWeight, weightRange, minDate, timeRange);

        // Draw enhanced legend with trend info
        this.drawEnhancedLegend(padding, weightEntries);
    }

    // Draw background
    drawBackground(padding, chartWidth, chartHeight) {
        const backgroundColor = this.getCSS('--surface-color');
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(padding, padding, chartWidth, chartHeight);
    }

    // Draw grid lines and labels
    drawGrid(padding, chartWidth, chartHeight, minWeight, maxWeight, weightRange, minDate, maxDate, timeRange) {
        const gridColor = this.getCSS('--border-light');
        const textColor = this.getCSS('--text-secondary');
        
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;
        
        // Calculate weight step size
        const weightSteps = Math.ceil(weightRange / 0.5);
        const maxSteps = 10;
        const stepSize = weightSteps > maxSteps ? 1.0 : 0.5;
        
        // Horizontal grid lines (weight)
        for (let weight = minWeight; weight <= maxWeight; weight += stepSize) {
            const y = padding + chartHeight - ((weight - minWeight) / weightRange) * chartHeight;
            
            this.ctx.beginPath();
            this.ctx.moveTo(padding, y);
            this.ctx.lineTo(padding + chartWidth, y);
            this.ctx.stroke();
            
            // Weight labels (Y-axis)
            this.ctx.fillStyle = textColor;
            this.ctx.font = '12px var(--font-family)';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(weight.toFixed(1), padding - 10, y + 4);
        }

        // Vertical grid lines (time)
        for (let i = 0; i <= 5; i++) {
            const x = padding + (i / 5) * chartWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x, padding);
            this.ctx.lineTo(x, padding + chartHeight);
            this.ctx.stroke();
        }

        // Date labels (X-axis)
        this.ctx.fillStyle = textColor;
        this.ctx.font = '12px var(--font-family)';
        this.ctx.textAlign = 'center';
        
        for (let i = 0; i <= 4; i++) {
            const date = new Date(minDate + (i / 4) * timeRange);
            const x = padding + (i / 4) * chartWidth;
            this.ctx.fillText(
                date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 
                x, 
                this.canvas.height - 10
            );
        }
    }

    // Draw weight trend line
    drawWeightLine(weightEntries, padding, chartWidth, chartHeight, minWeight, weightRange, minDate, timeRange) {
        if (weightEntries.length <= 1) return;

        this.ctx.strokeStyle = '#2563eb';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();

        weightEntries.forEach((entry, index) => {
            const x = padding + ((entry.date - minDate) / timeRange) * chartWidth;
            const y = padding + chartHeight - ((entry.weight - minWeight) / weightRange) * chartHeight;

            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });

        this.ctx.stroke();
    }

    // Draw individual data points
    drawDataPoints(weightEntries, padding, chartWidth, chartHeight, minWeight, weightRange, minDate, timeRange) {
        weightEntries.forEach(entry => {
            const x = padding + ((entry.date - minDate) / timeRange) * chartWidth;
            const y = padding + chartHeight - ((entry.weight - minWeight) / weightRange) * chartHeight;

            // Point color based on entry type
            const primaryColor = this.getCSS('--primary-color');
            const medicationColor = this.getCSS('--medication-color');
            this.ctx.fillStyle = entry.type === 'medication' ? medicationColor : primaryColor;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
            this.ctx.fill();

            // White outline
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    }

    // Draw trend line for weight data
    drawTrendLine(weightEntries, padding, chartWidth, chartHeight, minWeight, weightRange, minDate, timeRange) {
        const trendData = this.calculateTrendLine(weightEntries);
        if (!trendData) return;

        const accentColor = this.getCSS('--accent-color');
        this.ctx.strokeStyle = accentColor;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([8, 4]);
        this.ctx.beginPath();

        // Draw trend line across the visible data range
        const firstEntry = weightEntries[0];
        const lastEntry = weightEntries[weightEntries.length - 1];
        
        const startX = padding + ((firstEntry.date - minDate) / timeRange) * chartWidth;
        const endX = padding + ((lastEntry.date - minDate) / timeRange) * chartWidth;
        
        const startWeight = trendData.intercept;
        const endWeight = trendData.intercept + trendData.slope * trendData.xValues[trendData.xValues.length - 1];
        
        const startY = padding + chartHeight - ((startWeight - minWeight) / weightRange) * chartHeight;
        const endY = padding + chartHeight - ((endWeight - minWeight) / weightRange) * chartHeight;

        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    // Draw enhanced legend with trend information
    drawEnhancedLegend(padding, weightEntries) {
        this.ctx.textAlign = 'left';
        this.ctx.font = '12px var(--font-family)';
        
        // Get colors from CSS variables
        const textColor = this.getCSS('--text-color');
        const primaryColor = this.getCSS('--primary-color');
        const medicationColor = this.getCSS('--medication-color');
        const accentColor = this.getCSS('--accent-color');
        
        // Daily entries legend
        this.ctx.fillStyle = primaryColor;
        this.ctx.fillRect(padding, 10, 12, 12);
        this.ctx.fillStyle = textColor;
        this.ctx.fillText('Daily Check-in', padding + 20, 20);
        
        // Medication entries legend
        this.ctx.fillStyle = medicationColor;
        this.ctx.fillRect(padding + 120, 10, 12, 12);
        this.ctx.fillStyle = textColor;
        this.ctx.fillText('Medication Day', padding + 140, 20);
        
        // Trend line legend and statistics
        if (weightEntries.length >= 3) {
            const trendData = this.calculateTrendLine(weightEntries);
            if (trendData) {
                // Trend line legend
                this.ctx.strokeStyle = accentColor;
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([8, 4]);
                this.ctx.beginPath();
                this.ctx.moveTo(padding + 260, 16);
                this.ctx.lineTo(padding + 272, 16);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
                
                this.ctx.fillStyle = textColor;
                this.ctx.fillText('Trend Line', padding + 280, 20);
                
                // Trend statistics
                const weightChange = trendData.slope * trendData.xValues[trendData.xValues.length - 1];
                const trendDirection = weightChange > 0.1 ? '↗ Rising' : weightChange < -0.1 ? '↘ Falling' : '→ Stable';
                const changeText = `(${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}kg)`;
                
                this.ctx.font = '11px var(--font-family)';
                this.ctx.fillStyle = accentColor;
                this.ctx.fillText(`${trendDirection} ${changeText}`, padding + 380, 20);
            }
        }
    }

    // Original simple legend (kept for compatibility)
    drawLegend(padding) {
        this.drawEnhancedLegend(padding, this.currentData || []);
    }

    // Draw "no data" message
    drawNoDataMessage() {
        const textColor = this.getCSS('--text-secondary');
        this.ctx.fillStyle = textColor;
        this.ctx.font = '16px var(--font-family)';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            'No weight data available yet', 
            this.canvas.width / 2, 
            this.canvas.height / 2
        );
    }

    // Navigate chart view (for paginated view)
    navigateChart(direction) {
        if (this.currentData.length <= this.chartViewDays) {
            return; // No need to paginate
        }

        this.chartViewStart += direction * this.chartViewDays;
        
        // Boundary checks
        if (this.chartViewStart < 0) {
            this.chartViewStart = 0;
        }
        
        const maxStart = Math.max(0, this.currentData.length - this.chartViewDays);
        if (this.chartViewStart > maxStart) {
            this.chartViewStart = maxStart;
        }

        // Redraw with new view
        this.drawPaginatedChart();
        this.updateChartControls();
    }

    // Reset chart to show all data
    resetChartView() {
        this.chartViewStart = 0;
        
        if (this.currentData.length > 0) {
            this.drawWeightChart(app.dataManager.getEntries());
        }
        
        this.updateChartControls();
    }

    // Draw paginated chart view
    drawPaginatedChart() {
        const endIndex = Math.min(this.chartViewStart + this.chartViewDays, this.currentData.length);
        const viewData = this.currentData.slice(this.chartViewStart, endIndex);
        
        // Convert back to entries format for compatibility
        const viewEntries = viewData.map(item => ({
            date: item.date.toISOString(),
            weight: item.weight.toString(),
            type: item.type
        }));
        
        this.drawWeightChart(viewEntries);
        this.updateChartInfo(this.chartViewStart, endIndex, this.currentData.length);
    }

    // Update chart navigation controls
    updateChartControls() {
        const prevBtn = document.getElementById('chartPrevBtn');
        const nextBtn = document.getElementById('chartNextBtn');
        
        if (prevBtn) {
            prevBtn.disabled = this.chartViewStart <= 0;
        }
        
        if (nextBtn) {
            const maxStart = Math.max(0, this.currentData.length - this.chartViewDays);
            nextBtn.disabled = this.chartViewStart >= maxStart;
        }
    }

    // Update chart info display
    updateChartInfo(start, end, total) {
        const chartInfo = document.getElementById('chartInfo');
        if (chartInfo && total > this.chartViewDays) {
            chartInfo.textContent = `Showing entries ${start + 1}-${end} of ${total}`;
        } else if (chartInfo) {
            chartInfo.textContent = '';
        }
    }

    // Draw trend analysis chart
    drawTrendChart(entries, canvasId = 'trendChart') {
        if (!this.initCanvas(canvasId)) {
            return;
        }

        const weightEntries = entries
            .filter(e => e.weight)
            .map(e => ({
                date: new Date(e.date),
                weight: parseFloat(e.weight),
                type: e.type
            }))
            .sort((a, b) => a.date - b.date);

        if (weightEntries.length < 2) {
            this.drawNoDataMessage();
            return;
        }

        // Calculate trend line using linear regression
        const trendData = this.calculateTrendLine(weightEntries);
        
        // Draw similar to weight chart but with trend overlay
        this.drawWeightChart(entries);
        this.drawTrendOverlay(trendData, weightEntries);
    }

    // Calculate linear regression trend line
    calculateTrendLine(data) {
        const n = data.length;
        if (n < 2) return null;

        // Convert dates to numeric values (days since first entry)
        // Handle both Date objects and timestamps
        const firstDate = typeof data[0].date === 'number' ? data[0].date : data[0].date.getTime();
        const xValues = data.map(d => {
            const dateValue = typeof d.date === 'number' ? d.date : d.date.getTime();
            return (dateValue - firstDate) / (1000 * 60 * 60 * 24);
        });
        const yValues = data.map(d => d.weight);

        // Calculate slope and intercept
        const sumX = xValues.reduce((a, b) => a + b, 0);
        const sumY = yValues.reduce((a, b) => a + b, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return { slope, intercept, xValues, firstDate };
    }

    // Draw trend line overlay
    drawTrendOverlay(trendData, weightEntries) {
        if (!trendData || !this.ctx) return;

        const padding = 40;
        const chartWidth = this.canvas.width - 2 * padding;
        const chartHeight = this.canvas.height - 2 * padding;

        // Get weight range for scaling
        const weights = weightEntries.map(e => e.weight);
        const minWeight = Math.floor(Math.min(...weights) * 2) / 2;
        const maxWeight = Math.ceil(Math.max(...weights) * 2) / 2;
        const weightRange = maxWeight - minWeight || 1;

        // Draw trend line
        this.ctx.strokeStyle = '#f59e0b';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();

        const startX = padding;
        const endX = padding + chartWidth;
        const startWeight = trendData.intercept;
        const endWeight = trendData.intercept + trendData.slope * trendData.xValues[trendData.xValues.length - 1];

        const startY = padding + chartHeight - ((startWeight - minWeight) / weightRange) * chartHeight;
        const endY = padding + chartHeight - ((endWeight - minWeight) / weightRange) * chartHeight;

        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        // Reset line dash
        this.ctx.setLineDash([]);

        // Add trend label
        const accentColor = this.getCSS('--accent-color');
        this.ctx.fillStyle = accentColor;
        this.ctx.font = '12px var(--font-family)';
        this.ctx.textAlign = 'right';
        const trendLabel = trendData.slope > 0 ? 'Trend: ↗' : trendData.slope < 0 ? 'Trend: ↘' : 'Trend: →';
        this.ctx.fillText(trendLabel, padding + chartWidth - 10, padding + 30);
    }

    // Generate chart image for export
    getChartImage(format = 'png') {
        if (!this.canvas) return null;
        
        return this.canvas.toDataURL(`image/${format}`);
    }

    // Resize chart when container changes
    handleResize() {
        if (this.canvas && this.currentData.length > 0) {
            // Redraw with current data
            setTimeout(() => {
                this.drawWeightChart(app.dataManager.getEntries());
            }, 100);
        }
    }
}

// Handle window resize for chart responsiveness
window.addEventListener('resize', Utils.debounce(() => {
    if (window.app && window.app.chartRenderer) {
        window.app.chartRenderer.handleResize();
    }
}, 250));