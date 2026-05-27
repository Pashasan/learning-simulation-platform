// Data generation for Regression volume
// This module handles the SportsBrand marketing data

export const dataParams = {
    trueIntercept: 5200,
    trueSlope: 195,
    noise: 800,
    spendMin: 5,
    spendMax: 50,
    dataPoints: 100
};

export const challengeParams = {
    intercept: 3000,
    slope: 150,
    testSpend: 25
};

// Generate main dataset
export function generateData(params = dataParams) {
    const data = [];
    for (let i = 0; i < params.dataPoints; i++) {
        const spend = params.spendMin + Math.random() * (params.spendMax - params.spendMin);
        const traffic = params.trueIntercept + params.trueSlope * spend + (Math.random() - 0.5) * 2 * params.noise;
        data.push({ spend, traffic: Math.max(traffic, 1000) });
    }
    return data;
}

// Generate challenge dataset
export function generateChallengeData(params = challengeParams) {
    const data = [];
    const xValues = [10, 15, 20, 30, 35];
    xValues.forEach(x => {
        const y = params.intercept + params.slope * x + (Math.random() - 0.5) * 400;
        data.push({ x, y: Math.round(y) });
    });
    return data;
}

// Calculate best fit parameters using least squares
export function calculateBestFit(data) {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    data.forEach(p => {
        sumX += p.spend;
        sumY += p.traffic;
        sumXY += p.spend * p.traffic;
        sumX2 += p.spend * p.spend;
    });
    const n = data.length;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
}

// Calculate SSE for given parameters
export function calculateSSE(data, intercept, slope) {
    let sse = 0;
    data.forEach(p => {
        const pred = intercept + slope * p.spend;
        sse += Math.pow(p.traffic - pred, 2);
    });
    return sse;
}

// Calculate R-squared
export function calculateR2(data, intercept, slope) {
    const meanY = data.reduce((s, p) => s + p.traffic, 0) / data.length;
    let sse = 0, sst = 0;
    data.forEach(p => {
        const pred = intercept + slope * p.spend;
        sse += Math.pow(p.traffic - pred, 2);
        sst += Math.pow(p.traffic - meanY, 2);
    });
    return 1 - sse / sst;
}
