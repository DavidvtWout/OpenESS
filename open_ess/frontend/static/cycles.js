// Cycles page - Efficiency scatter chart and cycles table
(function() {
    'use strict';

    var cyclesTable = null;

    function getEfficiencyClass(efficiency) {
        if (efficiency == null) return '';
        if (efficiency >= 90) return 'efficiency-good';
        if (efficiency >= 80) return 'efficiency-ok';
        return 'efficiency-poor';
    }

    function formatEfficiency(eff) {
        if (eff == null) return '-';
        return eff.toFixed(1) + '%';
    }

    function formatScatterTime(isoString) {
        var date = new Date(isoString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    async function loadScatterChart() {
        var elementId = 'scatter-chart';
        var aggregate = document.getElementById('scatter-aggregate-select').value;
        var limit = document.getElementById('scatter-limit-select').value;

        document.getElementById(elementId).innerHTML = '<div class="loading">Loading...</div>';

        try {
            var data = await Api.efficiencyScatter({
                aggregate_minutes: parseInt(aggregate),
                limit: parseInt(limit),
            });

            if (data.length === 0) {
                document.getElementById(elementId).innerHTML = '<div class="no-data">No data available</div>';
                return;
            }

            var isDark = Utils.isDarkTheme();
            var settings = Settings.load();
            var useKw = settings.powerUnit === 'kw';
            var divisor = useKw ? 1000 : 1;
            var powerUnit = useKw ? 'kW' : 'W';

            var categories = {
                charging: { data: [], color: 'rgba(52, 152, 219, 0.5)', name: 'Charging' },
                discharging: { data: [], color: 'rgba(231, 76, 60, 0.5)', name: 'Discharging' },
                idling: { data: [], color: 'rgba(149, 165, 166, 0.5)', name: 'Idling' },
                balancing: { data: [], color: 'rgba(155, 89, 182, 0.5)', name: 'Balancing' },
            };

            for (var i = 0; i < data.length; i++) {
                var d = data[i];
                if (d.category && categories[d.category]) {
                    categories[d.category].data.push(d);
                }
            }

            function fmtPower(w) {
                return useKw ? (w / 1000).toFixed(2) : Math.round(w).toString();
            }

            function buildHoverText(d) {
                var eff = d.efficiency != null ? d.efficiency.toFixed(1) + '%' : 'N/A';
                var soc = d.soc != null ? d.soc + '%' : 'N/A';
                var time = formatScatterTime(d.time || '');

                switch (d.category) {
                    case 'charging':
                        return 'Time: ' + time + '<br>SOC: ' + soc + '<br>Battery: ' + fmtPower(d.battery_power || 0) + ' ' + powerUnit + '<br>Charger: ' + fmtPower(d.inverter_charger_power || 0) + ' ' + powerUnit + '<br>Losses: ' + fmtPower(d.losses || 0) + ' ' + powerUnit + '<br>Efficiency: ' + eff;
                    case 'discharging':
                        return 'Time: ' + time + '<br>SOC: ' + soc + '<br>Battery: ' + fmtPower(d.battery_power || 0) + ' ' + powerUnit + '<br>Inverter: ' + fmtPower(Math.abs(d.inverter_charger_power || 0)) + ' ' + powerUnit + '<br>Losses: ' + fmtPower(d.losses || 0) + ' ' + powerUnit + '<br>Efficiency: ' + eff;
                    case 'balancing':
                        return 'Time: ' + time + '<br>SOC: ' + soc + '<br>Battery: ' + fmtPower(d.battery_power || 0) + ' ' + powerUnit + '<br>Balancing power';
                    case 'idling':
                        return 'Time: ' + time + '<br>SOC: ' + soc + '<br>Idle consumption: ' + fmtPower(d.losses || 0) + ' ' + powerUnit;
                    default:
                        return 'Time: ' + time;
                }
            }

            var traces = Object.keys(categories).map(function(key) {
                var cat = categories[key];
                return {
                    x: cat.data.map(function(d) { return (d.battery_power || 0) / divisor; }),
                    y: cat.data.map(function(d) { return (d.losses || 0) / divisor; }),
                    type: 'scatter',
                    mode: 'markers',
                    name: cat.name,
                    marker: { color: cat.color, size: 8 },
                    text: cat.data.map(buildHoverText),
                    hoverinfo: 'text',
                };
            });

            var layout = {
                margin: { t: 30, r: 30, b: 60, l: 60 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: {
                    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    color: isDark ? '#e4e4e4' : '#333333',
                },
                xaxis: {
                    title: 'Battery Power (' + powerUnit + ')',
                    gridcolor: isDark ? '#2a2a4a' : '#eeeeee',
                    linecolor: isDark ? '#3a3a5a' : '#dddddd',
                    rangemode: 'tozero',
                },
                yaxis: {
                    title: 'Losses (' + powerUnit + ')',
                    gridcolor: isDark ? '#2a2a4a' : '#eeeeee',
                    linecolor: isDark ? '#3a3a5a' : '#dddddd',
                    rangemode: 'tozero',
                },
                legend: {
                    orientation: 'h',
                    y: -0.15,
                    font: { color: isDark ? '#e4e4e4' : '#333333' },
                },
                hovermode: 'closest',
            };

            document.getElementById(elementId).innerHTML = '';
            Plotly.newPlot(elementId, traces, layout, { responsive: true, displayModeBar: false });

        } catch (error) {
            console.error('Error loading scatter chart:', error);
            document.getElementById(elementId).innerHTML = '<div class="error">Failed to load scatter chart</div>';
        }
    }

    function efficiencyRenderer(data) {
        if (data == null) return '-';
        var cls = getEfficiencyClass(data);
        return '<span class="' + cls + '">' + data.toFixed(1) + '%</span>';
    }

    function initCyclesTable() {
        cyclesTable = new DataTable('#cycles-table', {
            data: [],
            columns: [
                { data: 'start_time', render: function(data) { return Utils.formatDateTime(data); } },
                { data: 'end_time', render: function(data) { return Utils.formatDateTime(data); }, visible: false },
                { data: 'duration_hours', render: function(data) { return Utils.formatDuration(data); } },
                { data: 'min_soc', render: function(data) { return data + '%'; }, visible: false },
                { data: 'max_soc', render: function(data) { return data + '%'; }, visible: false },
                { data: 'ac_energy_in', render: function(data) { return Utils.formatEnergy(data); } },
                { data: 'ac_energy_out', render: function(data) { return Utils.formatEnergy(data); } },
                { data: 'dc_energy_in', render: function(data) { return Utils.formatEnergy(data); }, visible: false },
                { data: 'dc_energy_out', render: function(data) { return Utils.formatEnergy(data); }, visible: false },
                { data: 'charger_efficiency', render: efficiencyRenderer },
                { data: 'battery_efficiency', render: efficiencyRenderer },
                { data: 'inverter_efficiency', render: efficiencyRenderer },
                { data: 'system_efficiency', render: efficiencyRenderer },
                { data: 'profit', render: function(data) { return data != null ? data.toFixed(2) : '-'; } },
                { data: 'scheduled_profit', render: function(data) { return data != null ? data.toFixed(2) : '-'; }, visible: false },
            ],
            order: [[0, 'desc']],
            colReorder: true,
            stateSave: true,
            stateDuration: -1,
            language: {
                emptyTable: 'No cycles found',
                loadingRecords: 'Loading...',
            },
            layout: {
                topStart: null,
                topEnd: {
                    buttons: [
                        {
                            extend: 'colvis',
                            text: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg>',
                            titleAttr: 'Select columns',
                            className: 'btn-colvis',
                        }
                    ]
                },
            },
        });

        return cyclesTable;
    }

    async function loadCycles() {
        var days = parseInt(document.getElementById('days-select').value);
        var minSwing = parseInt(document.getElementById('swing-select').value);

        var now = new Date();
        var start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        try {
            var cyclesData = await Api.cycles({
                start: Utils.formatDate(start),
                end: Utils.formatDate(now),
                min_soc_swing: minSwing,
            });

            cyclesTable.clear();
            cyclesTable.rows.add(cyclesData);
            cyclesTable.draw();

            if (cyclesData.length === 0) {
                document.getElementById('cycle-stats').innerHTML = '';
                return;
            }

            var totalAcIn = cyclesData.reduce(function(sum, c) { return sum + (c.ac_energy_in || 0); }, 0);
            var totalAcOut = cyclesData.reduce(function(sum, c) { return sum + (c.ac_energy_out || 0); }, 0);
            var avgEfficiency = totalAcIn > 0 ? (totalAcOut / totalAcIn) * 100 : null;

            document.getElementById('cycle-stats').innerHTML =
                '<div class="stat-card">' +
                    '<div class="stat-value">' + cyclesData.length + '</div>' +
                    '<div class="stat-label">Total Cycles</div>' +
                '</div>' +
                '<div class="stat-card">' +
                    '<div class="stat-value">' + Utils.formatEnergy(totalAcIn) + '</div>' +
                    '<div class="stat-label">Total AC In</div>' +
                '</div>' +
                '<div class="stat-card">' +
                    '<div class="stat-value">' + Utils.formatEnergy(totalAcOut) + '</div>' +
                    '<div class="stat-label">Total AC Out</div>' +
                '</div>' +
                '<div class="stat-card">' +
                    '<div class="stat-value">' + formatEfficiency(avgEfficiency) + '</div>' +
                    '<div class="stat-label">Avg Efficiency</div>' +
                '</div>';

        } catch (error) {
            console.error('Error loading cycles:', error);
            cyclesTable.clear().draw();
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('scatter-aggregate-select').value = Settings.loadPagePref('cycles', 'aggregate', '10');
        document.getElementById('scatter-limit-select').value = Settings.loadPagePref('cycles', 'limit', '2000');
        document.getElementById('days-select').value = Settings.loadPagePref('cycles', 'days', '30');
        document.getElementById('swing-select').value = Settings.loadPagePref('cycles', 'swing', '10');

        document.getElementById('scatter-aggregate-select').addEventListener('change', function(e) {
            Settings.savePagePref('cycles', 'aggregate', e.target.value);
            loadScatterChart();
        });
        document.getElementById('scatter-limit-select').addEventListener('change', function(e) {
            Settings.savePagePref('cycles', 'limit', e.target.value);
            loadScatterChart();
        });
        loadScatterChart();

        initCyclesTable();

        document.getElementById('days-select').addEventListener('change', function(e) {
            Settings.savePagePref('cycles', 'days', e.target.value);
            loadCycles();
        });
        document.getElementById('swing-select').addEventListener('change', function(e) {
            Settings.savePagePref('cycles', 'swing', e.target.value);
            loadCycles();
        });
        loadCycles();
    });
})();
