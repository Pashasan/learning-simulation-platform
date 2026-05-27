// Canvas utility functions for drawing charts and visualizations

/**
 * CanvasPlotter - A helper class for drawing charts
 */
class CanvasPlotter {
    /**
     * Create a new CanvasPlotter
     * @param {string} canvasId - The ID of the canvas element
     * @param {Object} options - Configuration options
     */
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas not found: ${canvasId}`);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Default margins
        this.margin = options.margin || { top: 30, right: 30, bottom: 50, left: 70 };

        // Default colors
        this.colors = {
            background: options.backgroundColor || '#1a1a2e',
            grid: options.gridColor || 'rgba(255,255,255,0.1)',
            axis: options.axisColor || '#fff',
            text: options.textColor || '#fff',
            point: options.pointColor || 'rgba(78, 204, 163, 0.7)',
            pointStroke: options.pointStrokeColor || 'rgba(78, 204, 163, 1)',
            line: options.lineColor || '#e94560',
            ...options.colors
        };

        // Data range
        this.xRange = options.xRange || [0, 100];
        this.yRange = options.yRange || [0, 100];

        // Labels
        this.xLabel = options.xLabel || '';
        this.yLabel = options.yLabel || '';
    }

    /**
     * Get the plot area dimensions
     */
    get plotWidth() {
        return this.width - this.margin.left - this.margin.right;
    }

    get plotHeight() {
        return this.height - this.margin.top - this.margin.bottom;
    }

    /**
     * Scale a data value to canvas X coordinate
     */
    scaleX(value) {
        const [min, max] = this.xRange;
        return this.margin.left + ((value - min) / (max - min)) * this.plotWidth;
    }

    /**
     * Scale a data value to canvas Y coordinate
     */
    scaleY(value) {
        const [min, max] = this.yRange;
        return this.height - this.margin.bottom - ((value - min) / (max - min)) * this.plotHeight;
    }

    /**
     * Clear the canvas with background color
     */
    clear() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Draw grid lines
     * @param {Array} xTicks - X-axis tick values
     * @param {Array} yTicks - Y-axis tick values
     */
    drawGrid(xTicks, yTicks) {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;

        // Vertical grid lines
        xTicks.forEach(x => {
            this.ctx.beginPath();
            this.ctx.moveTo(this.scaleX(x), this.margin.top);
            this.ctx.lineTo(this.scaleX(x), this.height - this.margin.bottom);
            this.ctx.stroke();
        });

        // Horizontal grid lines
        yTicks.forEach(y => {
            this.ctx.beginPath();
            this.ctx.moveTo(this.margin.left, this.scaleY(y));
            this.ctx.lineTo(this.width - this.margin.right, this.scaleY(y));
            this.ctx.stroke();
        });
    }

    /**
     * Draw axes
     */
    drawAxes() {
        this.ctx.strokeStyle = this.colors.axis;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        // Y-axis
        this.ctx.moveTo(this.margin.left, this.margin.top);
        this.ctx.lineTo(this.margin.left, this.height - this.margin.bottom);
        // X-axis
        this.ctx.lineTo(this.width - this.margin.right, this.height - this.margin.bottom);
        this.ctx.stroke();
    }

    /**
     * Draw axis labels
     * @param {Array} xTicks - X-axis tick values
     * @param {Array} yTicks - Y-axis tick values
     * @param {Function} formatX - Optional function to format X labels
     * @param {Function} formatY - Optional function to format Y labels
     */
    drawLabels(xTicks, yTicks, formatX = String, formatY = String) {
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '12px Segoe UI';

        // X-axis tick labels
        this.ctx.textAlign = 'center';
        xTicks.forEach(x => {
            this.ctx.fillText(formatX(x), this.scaleX(x), this.height - this.margin.bottom + 20);
        });

        // X-axis label
        if (this.xLabel) {
            this.ctx.fillText(this.xLabel, this.width / 2, this.height - 10);
        }

        // Y-axis tick labels
        this.ctx.textAlign = 'right';
        yTicks.forEach(y => {
            this.ctx.fillText(formatY(y), this.margin.left - 10, this.scaleY(y) + 4);
        });

        // Y-axis label (rotated)
        if (this.yLabel) {
            this.ctx.save();
            this.ctx.translate(15, this.height / 2);
            this.ctx.rotate(-Math.PI / 2);
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.yLabel, 0, 0);
            this.ctx.restore();
        }
    }

    /**
     * Draw data points (scatter plot)
     * @param {Array} data - Array of {x, y} objects
     * @param {Object} options - Point options (radius, color, etc.)
     */
    drawPoints(data, options = {}) {
        const radius = options.radius || 5;
        const fillColor = options.fillColor || this.colors.point;
        const strokeColor = options.strokeColor || this.colors.pointStroke;
        const strokeWidth = options.strokeWidth || 1;

        data.forEach(point => {
            this.ctx.beginPath();
            this.ctx.arc(this.scaleX(point.x), this.scaleY(point.y), radius, 0, Math.PI * 2);
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
            if (strokeWidth > 0) {
                this.ctx.strokeStyle = strokeColor;
                this.ctx.lineWidth = strokeWidth;
                this.ctx.stroke();
            }
        });
    }

    /**
     * Draw a line between two points
     * @param {number} x1 - Start X value (data coords)
     * @param {number} y1 - Start Y value (data coords)
     * @param {number} x2 - End X value (data coords)
     * @param {number} y2 - End Y value (data coords)
     * @param {Object} options - Line options
     */
    drawLine(x1, y1, x2, y2, options = {}) {
        const color = options.color || this.colors.line;
        const width = options.width || 3;
        const dashed = options.dashed || false;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        if (dashed) {
            this.ctx.setLineDash(options.dashPattern || [5, 5]);
        } else {
            this.ctx.setLineDash([]);
        }

        this.ctx.beginPath();
        this.ctx.moveTo(this.scaleX(x1), this.scaleY(y1));
        this.ctx.lineTo(this.scaleX(x2), this.scaleY(y2));
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    /**
     * Draw a regression line given intercept and slope
     * @param {number} intercept - Y-intercept
     * @param {number} slope - Slope
     * @param {Object} options - Line options
     */
    drawRegressionLine(intercept, slope, options = {}) {
        const [xMin, xMax] = this.xRange;
        const y1 = intercept + slope * xMin;
        const y2 = intercept + slope * xMax;
        this.drawLine(xMin, y1, xMax, y2, options);
    }

    /**
     * Draw a filled area between two lines (e.g., confidence interval)
     * @param {number} intercept - Center line intercept
     * @param {number} slope - Center line slope
     * @param {number} width - Width of the band (± from center)
     * @param {Object} options - Fill options
     */
    drawConfidenceBand(intercept, slope, width, options = {}) {
        const color = options.color || 'rgba(78, 204, 163, 0.2)';
        const [xMin, xMax] = this.xRange;

        this.ctx.fillStyle = color;
        this.ctx.beginPath();

        // Upper bound
        this.ctx.moveTo(this.scaleX(xMin), this.scaleY(intercept + slope * xMin + width));
        this.ctx.lineTo(this.scaleX(xMax), this.scaleY(intercept + slope * xMax + width));

        // Lower bound (reversed)
        this.ctx.lineTo(this.scaleX(xMax), this.scaleY(intercept + slope * xMax - width));
        this.ctx.lineTo(this.scaleX(xMin), this.scaleY(intercept + slope * xMin - width));

        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * Draw text at a specific data point
     * @param {string} text - Text to draw
     * @param {number} x - X value (data coords)
     * @param {number} y - Y value (data coords)
     * @param {Object} options - Text options
     */
    drawText(text, x, y, options = {}) {
        this.ctx.fillStyle = options.color || this.colors.text;
        this.ctx.font = options.font || '12px Segoe UI';
        this.ctx.textAlign = options.align || 'center';
        this.ctx.textBaseline = options.baseline || 'middle';
        this.ctx.fillText(text, this.scaleX(x), this.scaleY(y));
    }

    /**
     * Draw a complete scatter plot with regression line
     * @param {Array} data - Data points [{x, y}, ...]
     * @param {Object} regression - {intercept, slope} or null
     * @param {Array} xTicks - X-axis ticks
     * @param {Array} yTicks - Y-axis ticks
     * @param {Object} options - Additional options
     */
    drawScatterPlot(data, regression, xTicks, yTicks, options = {}) {
        this.clear();
        this.drawGrid(xTicks, yTicks);
        this.drawAxes();
        this.drawLabels(
            xTicks,
            yTicks,
            options.formatX || String,
            options.formatY || String
        );

        if (regression) {
            if (options.confidenceBand) {
                this.drawConfidenceBand(
                    regression.intercept,
                    regression.slope,
                    options.confidenceBand.width,
                    { color: options.confidenceBand.color }
                );
            }
            this.drawRegressionLine(regression.intercept, regression.slope, options.lineOptions);
        }

        // Transform data if needed
        const points = data.map(d => ({
            x: options.xField ? d[options.xField] : d.x,
            y: options.yField ? d[options.yField] : d.y
        }));
        this.drawPoints(points, options.pointOptions);
    }
}

/**
 * Generate evenly spaced tick values
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} count - Number of ticks
 * @returns {Array} Array of tick values
 */
function generateTicks(min, max, count = 5) {
    const step = (max - min) / (count - 1);
    return Array.from({ length: count }, (_, i) => min + i * step);
}

/**
 * Calculate linear regression
 * @param {Array} data - Array of {x, y} objects
 * @returns {Object} {intercept, slope, r2}
 */
function calculateRegression(data) {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

    data.forEach(d => {
        sumX += d.x;
        sumY += d.y;
        sumXY += d.x * d.y;
        sumX2 += d.x * d.x;
        sumY2 += d.y * d.y;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R²
    const meanY = sumY / n;
    let ssTotal = 0, ssResidual = 0;
    data.forEach(d => {
        const predicted = intercept + slope * d.x;
        ssTotal += (d.y - meanY) ** 2;
        ssResidual += (d.y - predicted) ** 2;
    });
    const r2 = 1 - (ssResidual / ssTotal);

    return { intercept, slope, r2 };
}

/**
 * Calculate Sum of Squared Errors
 * @param {Array} data - Array of {x, y} objects
 * @param {number} intercept - Line intercept
 * @param {number} slope - Line slope
 * @returns {number} SSE value
 */
function calculateSSE(data, intercept, slope) {
    return data.reduce((sum, d) => {
        const predicted = intercept + slope * d.x;
        return sum + (d.y - predicted) ** 2;
    }, 0);
}
