// Load and display prices chart
async function loadPricesChart(elementId, days = 7, showStats = false) {
    showLoading(elementId);

    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const url = `/api/prices?start=${formatDate(start)}&end=${formatDate(end)}`;
    console.log('Fetching prices:', url);

    try {
        const response = await fetch(url);
        console.log('Prices response:', response.status);
        if (!response.ok) {
            const text = await response.text();
            console.error('Prices error:', text);
            throw new Error(`Failed to fetch prices: ${response.status}`);
        }

        const data = await response.json();
        console.log('Prices data:', data.length, 'points');

        if (data.length === 0) {
            showError(elementId, 'No price data available');
            return;
        }

        const settings = loadSettings();
        const priceMultiplier = settings.priceUnit === 'cent' ? 100 : 1;
        const priceLabel = settings.priceUnit === 'cent' ? 'ct/kWh' : 'EUR/kWh';

        const times = data.map(d => new Date(d.time));
        const marketPrices = data.map(d => d.market_price * priceMultiplier);
        const buyPrices = data.map(d => d.buy_price * priceMultiplier);
        const sellPrices = data.map(d => d.sell_price * priceMultiplier);

        // Extend the last price by 1 hour so the step chart shows the full last hour
        if (times.length > 0) {
            const lastTime = times[times.length - 1];
            const extendedTime = new Date(lastTime.getTime() + 60 * 60 * 1000);
            times.push(extendedTime);
            marketPrices.push(marketPrices[marketPrices.length - 1]);
            buyPrices.push(buyPrices[buyPrices.length - 1]);
            sellPrices.push(sellPrices[sellPrices.length - 1]);
        }

        // Find current price
        const currentTime = now.getTime();
        let currentPriceIdx = times.findIndex((t, i) =>
            t.getTime() <= currentTime &&
            (i === times.length - 1 || times[i + 1].getTime() > currentTime)
        );

        const marketTrace = {
            x: times,
            y: marketPrices,
            type: 'scatter',
            mode: 'lines',
            line: { shape: 'hv', color: '#95a5a6', width: 1 },
            name: 'Market',
            hovertemplate: `Market: %{y:.2f} ${priceLabel}<extra></extra>`,
        };

        const buyTrace = {
            x: times,
            y: buyPrices,
            type: 'scatter',
            mode: 'lines',
            line: { shape: 'hv', color: '#e74c3c', width: 2 },
            opacity: 0.5,
            name: 'Buy',
            hovertemplate: `Buy: %{y:.2f} ${priceLabel}<extra></extra>`,
        };

        const sellTrace = {
            x: times,
            y: sellPrices,
            type: 'scatter',
            mode: 'lines',
            line: { shape: 'hv', color: '#2ecc71', width: 2 },
            opacity: 0.5,
            name: 'Sell',
            hovertemplate: `Sell: %{y:.2f} ${priceLabel}<extra></extra>`,
        };

        const layout = getDefaultLayout();
        layoutSetXRange(layout, start, end);
        layoutAddNowLine(layout, start, end)
        layout.hovermode = 'x';
        makePlot(elementId, [marketTrace, buyTrace, sellTrace], layout);

        // Update stats if requested (use buy prices)
        if (showStats) {
            const statsEl = document.getElementById('price-stats');
            if (statsEl) {
                const min = Math.min(...buyPrices);
                const max = Math.max(...buyPrices);
                const avg = buyPrices.reduce((a, b) => a + b, 0) / buyPrices.length;
                const current = currentPriceIdx >= 0 ? buyPrices[currentPriceIdx] : null;
                const decimals = settings.priceUnit === 'cent' ? 2 : 4;

                statsEl.innerHTML = `
                    <div class="stat-card">
                        <div class="stat-value">${current !== null ? current.toFixed(decimals) : '-'}</div>
                        <div class="stat-label">Current (${priceLabel})</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${min.toFixed(decimals)}</div>
                        <div class="stat-label">Minimum</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${max.toFixed(decimals)}</div>
                        <div class="stat-label">Maximum</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${avg.toFixed(decimals)}</div>
                        <div class="stat-label">Average</div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading prices:', error);
        showError(elementId, 'Failed to load prices');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const daysSelect = document.getElementById('days-select');

    function updateChart() {
        const days = parseInt(daysSelect.value);
        loadPricesChart('prices-chart', days, true);
    }

    daysSelect.addEventListener('change', updateChart);
    updateChart();
});