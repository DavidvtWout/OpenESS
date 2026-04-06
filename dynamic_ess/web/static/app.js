// Chart functions - depends on settings.js, utils.js, chart-utils.js

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

        const defaultLayout = getPlotlyLayout();
        const layout = {
            ...defaultLayout,
            hovermode: 'x',
            xaxis: {
                ...defaultLayout.xaxis,
                title: 'Time',
            },
            yaxis: {
                ...defaultLayout.yaxis,
                title: priceLabel,
            },
            legend: { orientation: 'h', y: -0.2 },
            shapes: currentPriceIdx >= 0 ? getNowLineShape(now, start, end, '#9b59b6') : [],
        };

        document.getElementById(elementId).innerHTML = '';
        Plotly.newPlot(elementId, [marketTrace, buyTrace, sellTrace], layout, defaultConfig);

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

// Load and display battery chart
async function loadBatteryChart(elementId, hours = 24) {
    showLoading(elementId);

    const now = new Date();
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const url = `/api/battery?start=${formatDate(start)}&end=${formatDate(now)}&aggregate_minutes=5`;
    console.log('Fetching battery:', url);

    try {
        const response = await fetch(url);
        console.log('Battery response:', response.status);
        if (!response.ok) {
            const text = await response.text();
            console.error('Battery error:', text);
            throw new Error(`Failed to fetch battery data: ${response.status}`);
        }

        const data = await response.json();
        console.log('Battery data:', data.length, 'points');

        if (data.length === 0) {
            showError(elementId, 'No battery data available');
            return;
        }

        const times = data.map(d => new Date(d.time));
        const power = data.map(d => d.battery_power);
        const soc = data.map(d => d.battery_soc);

        const powerTrace = {
            x: times,
            y: power,
            type: 'scatter',
            mode: 'lines',
            name: 'Power (W)',
            line: { color: '#3498db', width: 2 },
            yaxis: 'y',
        };

        const socTrace = {
            x: times,
            y: soc,
            type: 'scatter',
            mode: 'lines',
            name: 'SOC (%)',
            line: { color: '#2ecc71', width: 2 },
            yaxis: 'y2',
        };

        const defaultLayout = getPlotlyLayout();
        const layout = {
            ...defaultLayout,
            xaxis: { ...defaultLayout.xaxis },
            yaxis: {
                ...defaultLayout.yaxis,
                title: 'Power (W)',
                side: 'left',
            },
            yaxis2: {
                title: 'SOC (%)',
                overlaying: 'y',
                side: 'right',
                range: [0, 100],
                gridcolor: 'transparent',
                linecolor: isDarkTheme() ? '#3a3a5a' : '#dddddd',
            },
            legend: getHorizontalLegend(-0.2),
        };

        document.getElementById(elementId).innerHTML = '';
        Plotly.newPlot(elementId, [powerTrace, socTrace], layout, defaultConfig);
    } catch (error) {
        console.error('Error loading battery data:', error);
        showError(elementId, 'Failed to load battery data');
    }
}

// Load and display grid power chart
async function loadGridChart(elementId, hours = 24) {
    showLoading(elementId);

    const now = new Date();
    const start = new Date(now.getTime() - hours * 60 * 60 * 1000);

    const url = `/api/system?start=${formatDate(start)}&end=${formatDate(now)}&aggregate_minutes=5`;
    console.log('Fetching system:', url);

    try {
        const response = await fetch(url);
        console.log('System response:', response.status);
        if (!response.ok) {
            const text = await response.text();
            console.error('System error:', text);
            throw new Error(`Failed to fetch system data: ${response.status}`);
        }

        const data = await response.json();
        console.log('System data:', data.length, 'points');

        if (data.length === 0) {
            showError(elementId, 'No system data available');
            return;
        }

        // Group by phase
        const phases = {};
        for (const d of data) {
            if (!phases[d.phase]) {
                phases[d.phase] = { times: [], grid: [], consumption: [] };
            }
            phases[d.phase].times.push(new Date(d.time));
            phases[d.phase].grid.push(d.grid_power);
            phases[d.phase].consumption.push(d.ac_consumption);
        }

        const colors = { 1: '#e74c3c', 2: '#f39c12', 3: '#9b59b6' };
        const traces = [];

        for (const [phase, values] of Object.entries(phases)) {
            traces.push({
                x: values.times,
                y: values.grid,
                type: 'scatter',
                mode: 'lines',
                name: `Grid L${phase}`,
                line: { color: colors[phase], width: 2 },
            });
        }

        const defaultLayout = getPlotlyLayout();
        const layout = {
            ...defaultLayout,
            xaxis: { ...defaultLayout.xaxis },
            yaxis: {
                ...defaultLayout.yaxis,
                title: 'Power (W)',
            },
            legend: getHorizontalLegend(-0.2),
        };

        document.getElementById(elementId).innerHTML = '';
        Plotly.newPlot(elementId, traces, layout, defaultConfig);
    } catch (error) {
        console.error('Error loading system data:', error);
        showError(elementId, 'Failed to load system data');
    }
}

// Load and display combined power chart (grid, battery, inverter/charger, scheduled)
async function loadPowerChart(elementId, start, end, aggregateMinutes = 5) {
    showLoading(elementId);

    const powerUrl = `/api/power?start=${formatDate(start)}&end=${formatDate(end)}&aggregate_minutes=${aggregateMinutes}`;
    const scheduleUrl = `/api/schedule?start=${formatDate(start)}`;
    console.log('Fetching power:', powerUrl);

    try {
        const [powerResponse, scheduleResponse] = await Promise.all([
            fetch(powerUrl),
            fetch(scheduleUrl)
        ]);

        if (!powerResponse.ok) {
            throw new Error(`Failed to fetch power data: ${powerResponse.status}`);
        }

        const data = await powerResponse.json();
        const schedule = scheduleResponse.ok ? await scheduleResponse.json() : [];
        console.log('Power data:', data.length, 'points, Schedule:', schedule.length, 'entries');

        const settings = loadSettings();
        const useKw = settings.powerUnit === 'kw';
        const divisor = useKw ? 1000 : 1;
        const powerLabel = useKw ? 'Power (kW)' : 'Power (W)';
        const now = new Date();

        // Build schedule step data - only show actual schedule entries, no gap filling
        const scheduleInRange = schedule
            .map(entry => ({
                start: new Date(entry.start_time),
                end: new Date(entry.end_time),
                power: entry.power_w / divisor
            }))
            .filter(e => e.end > now && e.start <= end)
            .sort((a, b) => a.start - b.start);

        const scheduleTimes = [];
        const schedulePowers = [];

        for (const entry of scheduleInRange) {
            const entryStart = entry.start < now ? now : entry.start;
            scheduleTimes.push(entryStart, entry.end);
            schedulePowers.push(entry.power, entry.power);
        }

        // Check if we have any data to show
        if (data.length === 0 && scheduleInRange.length === 0) {
            showError(elementId, 'No power data available');
            return;
        }

        const times = data.map(d => new Date(d.time));
        const unit = useKw ? 'kW' : 'W';
        const traces = [];

        // Gap threshold: 2x the aggregate interval
        const gapThresholdMs = aggregateMinutes * 60 * 1000 * 2;

        // Add measurement traces only if we have measurement data
        if (data.length > 0) {
            const gridData = insertGapNulls(times, data.map(d => d.grid_power / divisor), gapThresholdMs);
            const batteryData = insertGapNulls(times, data.map(d => d.battery_power / divisor), gapThresholdMs);
            const invChargerData = insertGapNulls(times, data.map(d => d.inverter_charger_power / divisor), gapThresholdMs);

            traces.push(
                {
                    x: gridData.times,
                    y: gridData.values,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Grid',
                    line: { color: '#e74c3c', width: 2 },
                    hovertemplate: `%{y:.1f} ${unit}<extra>Grid</extra>`,
                },
                {
                    x: batteryData.times,
                    y: batteryData.values,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Battery',
                    line: { color: '#3498db', width: 2 },
                    hovertemplate: `%{y:.1f} ${unit}<extra>Battery</extra>`,
                },
                {
                    x: invChargerData.times,
                    y: invChargerData.values,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Inverter/Charger',
                    line: { color: '#9b59b6', width: 2 },
                    hovertemplate: `%{y:.1f} ${unit}<extra>Inverter/Charger</extra>`,
                },
            );
        }

        // Add schedule trace if we have schedule data
        if (scheduleTimes.length > 0) {
            traces.push({
                x: scheduleTimes,
                y: schedulePowers,
                type: 'scatter',
                mode: 'lines',
                name: 'Scheduled',
                line: { color: '#2ecc71', width: 2, dash: 'dot' },
                hovertemplate: `%{y:.1f} ${unit}<extra>Scheduled</extra>`,
            });
        }

        const defaultLayout = getPlotlyLayout();
        const layout = {
            ...defaultLayout,
            hovermode: 'x unified',
            xaxis: {
                ...defaultLayout.xaxis,
                range: [start, end],
            },
            yaxis: {
                ...defaultLayout.yaxis,
                title: powerLabel,
                zeroline: true,
                zerolinecolor: getZerolineColor(),
            },
            legend: getHorizontalLegend(),
            shapes: getNowLineShape(now, start, end),
        };

        document.getElementById(elementId).innerHTML = '';
        Plotly.newPlot(elementId, traces, layout, defaultConfig);
    } catch (error) {
        console.error('Error loading power data:', error);
        showError(elementId, 'Failed to load power data');
    }
}

// Load and display battery SoC chart with scheduled SoC
async function loadSocChart(elementId, start, end, aggregateMinutes = 5) {
    showLoading(elementId);

    const batterySocUrl = `/api/battery-soc?start=${formatDate(start)}&end=${formatDate(end)}`;
    console.log('Fetching SoC:', batterySocUrl);

    try {
        const response = await fetch(batterySocUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch battery SoC: ${response.status}`);
        }

        const data = await response.json();
        console.log('SoC data:', data.actual.length, 'actual,', data.scheduled.length, 'scheduled');

        const now = new Date();

        // Check if we have any data to show
        if (data.actual.length === 0 && data.scheduled.length === 0) {
            showError(elementId, 'No SoC data available');
            return;
        }

        const traces = [];

        // Add actual SoC trace with step interpolation
        if (data.actual.length > 0) {
            const times = data.actual.map(d => new Date(d.time));
            const socs = data.actual.map(d => d.soc);

            // Extend the line to "now" with the last known SOC value
            const lastTime = times[times.length - 1];
            if (now > lastTime) {
                times.push(now);
                socs.push(socs[socs.length - 1]);
            }

            traces.push({
                x: times,
                y: socs,
                type: 'scatter',
                mode: 'lines',
                name: 'SoC',
                line: { color: '#3498db', width: 2, shape: 'hv' },
                hovertemplate: '%{y}%<extra>SoC</extra>',
            });
        }

        // Add scheduled SoC trace
        if (data.scheduled.length > 0) {
            traces.push({
                x: data.scheduled.map(d => new Date(d.time)),
                y: data.scheduled.map(d => d.soc),
                type: 'scatter',
                mode: 'lines',
                name: 'Scheduled',
                line: { color: '#2ecc71', width: 2, dash: 'dot' },
                hovertemplate: '%{y}%<extra>Scheduled</extra>',
            });
        }

        const defaultLayout = getPlotlyLayout();
        const layout = {
            ...defaultLayout,
            hovermode: 'x unified',
            xaxis: {
                ...defaultLayout.xaxis,
                range: [start, end],
            },
            yaxis: {
                ...defaultLayout.yaxis,
                title: 'SoC (%)',
                range: [0, 100],
            },
            legend: getHorizontalLegend(),
            shapes: getNowLineShape(now, start, end),
        };

        document.getElementById(elementId).innerHTML = '';
        Plotly.newPlot(elementId, traces, layout, defaultConfig);
    } catch (error) {
        console.error('Error loading SoC data:', error);
        showError(elementId, 'Failed to load SoC data');
    }
}

// Render energy flow chart from pre-fetched data (for caching)
function renderEnergyFlowChart(elementId, data, start, end, frameOfReference = 'multiplus', schedule = [], bucketMinutes = 60) {
    const settings = loadSettings();
    const useKw = settings.powerUnit === 'kw';

    // Convert Wh based on unit preference
    const toDisplay = useKw ? (wh) => wh / 1000 : (wh) => wh;
    const fmtEnergy = useKw ? (wh) => (wh / 1000).toFixed(2) : (wh) => Math.round(wh);
    const energyUnit = useKw ? 'kWh' : 'Wh';

    // Build scheduled energy data aligned with time buckets
    const bucketMs = bucketMinutes * 60 * 1000;

    // Generate time buckets from data if available, otherwise from schedule range
    let times;
    if (data && data.length > 0) {
        times = data.map(d => new Date(d.time));
    } else if (schedule.length > 0) {
        // Generate time buckets covering the schedule range
        times = [];
        const scheduleStart = Math.min(...schedule.map(s => new Date(s.start_time).getTime()));
        const scheduleEnd = Math.max(...schedule.map(s => new Date(s.end_time).getTime()));
        const bucketStartTime = Math.floor(scheduleStart / bucketMs) * bucketMs + bucketMs / 2;
        for (let t = bucketStartTime; t < scheduleEnd; t += bucketMs) {
            times.push(new Date(t));
        }
    } else {
        showError(elementId, 'No energy flow data available');
        return;
    }

    // Only show scheduled energy for future time (starting from "now")
    const now = new Date().getTime();

    const scheduledData = times.map(t => {
        const bucketStart = t.getTime() - bucketMs / 2;
        const bucketEnd = bucketStart + bucketMs;
        let chargerInputWh = 0;
        let chargerLossWh = 0;
        let inverterOutputWh = 0;
        let inverterLossWh = 0;

        // Only calculate scheduled energy for the future portion of the bucket
        const effectiveBucketStart = Math.max(bucketStart, now);
        if (effectiveBucketStart >= bucketEnd) {
            return { chargerInputWh, chargerLossWh, inverterOutputWh, inverterLossWh };
        }

        for (const entry of schedule) {
            const entryStart = new Date(entry.start_time).getTime();
            const entryEnd = new Date(entry.end_time).getTime();
            const overlapStart = Math.max(effectiveBucketStart, entryStart);
            const overlapEnd = Math.min(bucketEnd, entryEnd);
            if (overlapEnd > overlapStart) {
                const overlapHours = (overlapEnd - overlapStart) / 3600000;
                if (entry.power_w > 0) {
                    chargerInputWh += entry.charger_input_w * overlapHours;
                    chargerLossWh += entry.charger_loss_w * overlapHours;
                } else if (entry.power_w < 0) {
                    inverterOutputWh += entry.inverter_output_w * overlapHours;
                    inverterLossWh += entry.inverter_loss_w * overlapHours;
                }
            }
        }
        return { chargerInputWh, chargerLossWh, inverterOutputWh, inverterLossWh };
    });

    // Build FoR-specific hover text
    function buildHoverText(d, forType) {
        const time = new Date(d.time).toLocaleString();
        if (forType === 'multiplus') {
            return `<b>${time}</b><br>` +
                `Inverter Output: ${fmtEnergy(d.inverter_output_wh)} ${energyUnit}<br>` +
                `Inverter Losses: ${fmtEnergy(d.inverter_losses_wh)} ${energyUnit}<br>` +
                `Charger Input: ${fmtEnergy(d.charger_input_wh)} ${energyUnit}<br>` +
                `Charger Losses: ${fmtEnergy(d.charger_losses_wh)} ${energyUnit}`;
        } else if (forType === 'grid') {
            return `<b>${time}</b><br>` +
                `Grid Export: ${fmtEnergy(d.grid_export_wh)} ${energyUnit}<br>` +
                `Grid Import: ${fmtEnergy(d.grid_import_wh)} ${energyUnit}<br>` +
                `Conversion Losses: ${fmtEnergy(d.charger_losses_wh + d.inverter_losses_wh)} ${energyUnit}`;
        } else {
            return `<b>${time}</b><br>` +
                `Consumption: ${fmtEnergy(d.consumption_wh)} ${energyUnit}<br>` +
                `MultiPlus Losses: ${fmtEnergy(d.charger_losses_wh + d.inverter_losses_wh)} ${energyUnit}`;
        }
    }

    const hasData = data && data.length > 0;
    const dataTimes = hasData ? data.map(d => new Date(d.time)) : [];
    const hoverTexts = hasData ? data.map(d => buildHoverText(d, frameOfReference)) : [];

    let traces = [];

    if (frameOfReference === 'multiplus') {
        if (hasData) {
            traces = [
                {
                    x: dataTimes,
                    y: data.map(d => toDisplay(d.inverter_output_wh)),
                    type: 'bar',
                    name: 'Inverter Output',
                    marker: { color: '#f39c12' },
                    text: hoverTexts,
                    hoverinfo: 'text',
                    textposition: 'none',
                },
                {
                    x: dataTimes,
                    y: data.map(d => -toDisplay(d.inverter_losses_wh)),
                    type: 'bar',
                    name: 'Inverter Losses',
                    marker: { color: '#e67e22' },
                    text: hoverTexts,
                    hoverinfo: 'text',
                    textposition: 'none',
                },
                {
                    x: dataTimes,
                    y: data.map(d => -toDisplay(d.charger_input_wh)),
                    type: 'bar',
                    name: 'Charger Input',
                    marker: { color: '#3498db' },
                    text: hoverTexts,
                    hoverinfo: 'text',
                    textposition: 'none',
                },
                {
                    x: dataTimes,
                    y: data.map(d => -toDisplay(d.charger_losses_wh)),
                    type: 'bar',
                    name: 'Charger Losses',
                    marker: { color: '#2980b9' },
                    text: hoverTexts,
                    hoverinfo: 'text',
                    textposition: 'none',
                },
            ];
        }

        const hasScheduledData = scheduledData.some(d => d.chargerInputWh > 0 || d.inverterOutputWh > 0);
        if (hasScheduledData) {
            traces.push(
                {
                    x: times,
                    y: scheduledData.map(d => toDisplay(d.inverterOutputWh)),
                    type: 'bar',
                    name: 'Sched. Inverter',
                    marker: { color: '#f39c12', opacity: 0.4, line: { color: '#f39c12', width: 1 } },
                    hovertemplate: `%{y:.1f} ${energyUnit}<extra>Scheduled Inverter Output</extra>`,
                },
                {
                    x: times,
                    y: scheduledData.map(d => toDisplay(d.inverterLossWh)),
                    type: 'bar',
                    name: 'Sched. Inv. Losses',
                    marker: { color: '#e67e22', opacity: 0.4, line: { color: '#e67e22', width: 1 } },
                    hovertemplate: `%{y:.1f} ${energyUnit}<extra>Scheduled Inverter Losses</extra>`,
                },
                {
                    x: times,
                    y: scheduledData.map(d => -toDisplay(d.chargerInputWh)),
                    type: 'bar',
                    name: 'Sched. Charger',
                    marker: { color: '#3498db', opacity: 0.4, line: { color: '#3498db', width: 1 } },
                    hovertemplate: `%{y:.1f} ${energyUnit}<extra>Scheduled Charger Input</extra>`,
                },
                {
                    x: times,
                    y: scheduledData.map(d => -toDisplay(d.chargerLossWh)),
                    type: 'bar',
                    name: 'Sched. Chg. Losses',
                    marker: { color: '#2980b9', opacity: 0.4, line: { color: '#2980b9', width: 1 } },
                    hovertemplate: `%{y:.1f} ${energyUnit}<extra>Scheduled Charger Losses</extra>`,
                },
            );
        }
    } else if (frameOfReference === 'grid') {
        if (hasData) {
            traces = [
                {
                    x: dataTimes,
                    y: data.map(d => toDisplay(d.grid_export_wh)),
                    type: 'bar',
                    name: 'Grid Export',
                    marker: { color: '#27ae60' },
                    text: hoverTexts,
                    hoverinfo: 'text',
                    textposition: 'none',
                },
                {
                    x: dataTimes,
                    y: data.map(d => -toDisplay(d.grid_import_wh)),
                    type: 'bar',
                    name: 'Grid Import',
                    marker: { color: '#3498db' },
                    text: hoverTexts,
                    hoverinfo: 'text',
                    textposition: 'none',
                },
                {
                    x: dataTimes,
                    y: data.map(d => -toDisplay(d.charger_losses_wh + d.inverter_losses_wh)),
                    type: 'bar',
                    name: 'Conversion Losses',
                    marker: { color: '#e74c3c' },
                    text: hoverTexts,
                    hoverinfo: 'text',
                    textposition: 'none',
                },
            ];
        }
    } else if (frameOfReference === 'consumption') {
        if (hasData) {
            traces = [
                {
                    x: dataTimes,
                    y: data.map(d => -toDisplay(d.consumption_wh)),
                    type: 'bar',
                    name: 'Consumption',
                    marker: { color: '#9b59b6' },
                    text: hoverTexts,
                    hoverinfo: 'text',
                    textposition: 'none',
                },
                {
                    x: dataTimes,
                    y: data.map(d => -toDisplay(d.charger_losses_wh + d.inverter_losses_wh)),
                    type: 'bar',
                    name: 'MultiPlus Losses',
                    marker: { color: '#e74c3c' },
                    text: hoverTexts,
                    hoverinfo: 'text',
                    textposition: 'none',
                },
            ];
        }
    }

    const defaultLayout = getPlotlyLayout();
    const layout = {
        ...defaultLayout,
        barmode: 'relative',
        bargap: 0.02,
        xaxis: {
            ...defaultLayout.xaxis,
            range: [start, end],
        },
        yaxis: {
            ...defaultLayout.yaxis,
            title: `Energy (${energyUnit})`,
            zeroline: true,
            zerolinecolor: getZerolineColor(),
        },
        legend: getHorizontalLegend(),
        shapes: getNowLineShape(now, start, end),
    };

    document.getElementById(elementId).innerHTML = '';
    Plotly.newPlot(elementId, traces, layout, defaultConfig);
}

// Load and display energy flow stacked bar chart with frame of reference
async function loadEnergyFlowChart(elementId, start, end, bucketMinutes = 60, frameOfReference = 'multiplus') {
    showLoading(elementId);

    const energyUrl = `/api/energy-flow?start=${formatDate(start)}&end=${formatDate(end)}&bucket_minutes=${bucketMinutes}`;
    const scheduleUrl = `/api/schedule?start=${formatDate(start)}`;
    console.log('Fetching energy flow:', energyUrl);

    try {
        const [energyResponse, scheduleResponse] = await Promise.all([
            fetch(energyUrl),
            fetch(scheduleUrl)
        ]);

        if (!energyResponse.ok) {
            throw new Error(`Failed to fetch energy flow: ${energyResponse.status}`);
        }

        const data = await energyResponse.json();
        const schedule = scheduleResponse.ok ? await scheduleResponse.json() : [];
        console.log('Energy flow data:', data.length, 'buckets, Schedule:', schedule.length, 'entries');

        renderEnergyFlowChart(elementId, data, start, end, frameOfReference, schedule, bucketMinutes);
    } catch (error) {
        console.error('Error loading energy flow:', error);
        showError(elementId, 'Failed to load energy flow');
    }
}

// Load prices chart with start/end range (for dashboard alignment)
async function loadPricesChartRange(elementId, start, end) {
    showLoading(elementId);

    // Extend end by 2 days for future prices
    const extendedEnd = new Date(end.getTime() + 2 * 24 * 60 * 60 * 1000);

    const url = `/api/prices?start=${formatDate(start)}&end=${formatDate(extendedEnd)}`;
    console.log('Fetching prices:', url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
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

        // Extend the last price by 1 hour
        if (times.length > 0) {
            const lastTime = times[times.length - 1];
            const extendedTime = new Date(lastTime.getTime() + 60 * 60 * 1000);
            times.push(extendedTime);
            marketPrices.push(marketPrices[marketPrices.length - 1]);
            buyPrices.push(buyPrices[buyPrices.length - 1]);
            sellPrices.push(sellPrices[sellPrices.length - 1]);
        }

        const now = new Date();

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

        const defaultLayout = getPlotlyLayout();
        const layout = {
            ...defaultLayout,
            hovermode: 'x',
            xaxis: {
                ...defaultLayout.xaxis,
                range: [start, end],
            },
            yaxis: {
                ...defaultLayout.yaxis,
                title: priceLabel,
            },
            legend: { orientation: 'h', y: -0.2 },
            shapes: getNowLineShape(now, start, end),
        };

        document.getElementById(elementId).innerHTML = '';
        Plotly.newPlot(elementId, [marketTrace, buyTrace, sellTrace], layout, defaultConfig);
    } catch (error) {
        console.error('Error loading prices:', error);
        showError(elementId, 'Failed to load prices');
    }
}
