// Auto-generated from Pydantic models - do not edit manually
// Run `generate-types` to regenerate

// ============
// === Types ===
// ============

export type Status = "ok" | "warning" | "error";

export interface TimeSeries {
    timestamps?: Array<string>;
    values?: Array<number>;
}

export interface BatteryConfig {
    name: string | null;
    monitor_only?: boolean;
    capacity_kwh: number | null;
    max_charge_power_kw: number | null;
    max_invert_power_kw: number | null;
    idle_threshold_w?: number;
    min_soc?: number;
    max_soc?: number;
    control?: VictronControl | MqttControl;
    metrics?: MetricsConfig;
}

export interface BatteryCycle {
    start_time?: string;
    end_time?: string;
    duration_hours?: number;
    min_soc?: number;
    ac_energy_in?: number | null;
    ac_energy_out?: number | null;
    dc_energy_in?: number;
    dc_energy_out?: number;
    system_efficiency?: number | null;
    battery_efficiency?: number | null;
    charger_efficiency?: number | null;
    inverter_efficiency?: number | null;
    profit?: number | null;
    scheduled_profit?: number | null;
}

export interface BatteryEnergySeries {
    energy_to_charger?: Array<number | null>;
    energy_from_inverter?: Array<number | null>;
    energy_to_battery?: Array<number | null>;
    energy_from_battery?: Array<number | null>;
    energy_loss_to_battery?: Array<number | null>;
    energy_loss_from_battery?: Array<number | null>;
}

export interface BatteryGraphResponse {
    soc?: TimeSeries;
    schedule?: TimeSeries;
    voltage?: TimeSeries;
}

export interface EfficiencyScatterPoint {
    time?: string;
    battery_power?: number;
    inverter_charger_power?: number;
    losses?: number;
    efficiency?: number | null;
    soc?: number | null;
    category?: string;
}

export interface EnergyGraphResponse {
    timestamps?: Array<string>;
    grid_import?: Record<string, Array<number | null>>;
    grid_export?: Record<string, Array<number | null>>;
    battery_systems?: Record<string, BatteryEnergySeries>;
    solar?: Array<number | null>;
    to_consumption?: Array<number | null>;
    from_consumption?: Array<number | null>;
}

export interface EnergyResponse {
    series?: Record<string, TimeSeries>;
}

export interface HealthResponse {
    status?: string;
    database?: string;
    tables?: Array<string>;
}

export interface PowerResponse {
    series?: Record<string, TimeSeries>;
}

export interface PriceConfig {
    area?: string;
    hourly_average?: boolean;
    entsoe_api_key: string | null;
    entsoe_api_key_file: Path | null;
    buy_formula?: string;
    sell_formula?: string;
}

export interface PricePoint {
    time?: string;
    market?: number | null;
    buy?: number | null;
    sell?: number | null;
}

export interface PricesResponse {
    area?: string;
    aggregate_minutes?: number;
    unit?: string;
    timeseries?: Array<PricePoint>;
}

export interface ServiceMessage {
    timestamp?: string;
    status?: Status;
    message?: string;
}

export interface ServiceStatus {
    status?: Status;
    messages?: Array<ServiceMessage>;
}

export interface ServicesStatusResponse {
    database?: ServiceStatus | null;
    optimizer?: ServiceStatus | null;
}

export interface TimeSeries {
    timestamps?: Array<string>;
    values?: Array<number>;
}

// ===================
// === API Client ===
// ===================

export async function health(): Promise<HealthResponse> {
    const response = await fetch(`/api/health`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();}

export async function servicesStatus(): Promise<ServicesStatusResponse> {
    const response = await fetch(`/api/services-status`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();}

export async function batteryIds(): Promise<Array<string>> {
    const response = await fetch(`/api/battery-ids`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();}

export async function energyGraph(params: { battery_id?: string | null; start?: string | null; end?: string | null; bucket_minutes?: number }): Promise<EnergyGraphResponse> {
    const searchParams = new URLSearchParams();
    if (params.battery_id !== undefined) searchParams.set('battery_id', String(params.battery_id));
    if (params.start !== undefined) searchParams.set('start', String(params.start));
    if (params.end !== undefined) searchParams.set('end', String(params.end));
    if (params.bucket_minutes !== undefined) searchParams.set('bucket_minutes', String(params.bucket_minutes));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`/api/energy-graph${query}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();}

export async function powerGraph(params: { battery_id?: string | null; start?: string | null; end?: string | null; aggregate_minutes?: number }): Promise<PowerResponse> {
    const searchParams = new URLSearchParams();
    if (params.battery_id !== undefined) searchParams.set('battery_id', String(params.battery_id));
    if (params.start !== undefined) searchParams.set('start', String(params.start));
    if (params.end !== undefined) searchParams.set('end', String(params.end));
    if (params.aggregate_minutes !== undefined) searchParams.set('aggregate_minutes', String(params.aggregate_minutes));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`/api/power-graph${query}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();}

export async function prices(params: { area?: string | null; start?: string | null; end?: string | null; aggregate_minutes?: number | null }): Promise<PricesResponse> {
    const searchParams = new URLSearchParams();
    if (params.area !== undefined) searchParams.set('area', String(params.area));
    if (params.start !== undefined) searchParams.set('start', String(params.start));
    if (params.end !== undefined) searchParams.set('end', String(params.end));
    if (params.aggregate_minutes !== undefined) searchParams.set('aggregate_minutes', String(params.aggregate_minutes));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`/api/prices${query}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();}

export async function batteryGraph(params: { battery_id?: string | null; start?: string | null; end?: string | null }): Promise<Record<string, BatteryGraphResponse>> {
    const searchParams = new URLSearchParams();
    if (params.battery_id !== undefined) searchParams.set('battery_id', String(params.battery_id));
    if (params.start !== undefined) searchParams.set('start', String(params.start));
    if (params.end !== undefined) searchParams.set('end', String(params.end));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`/api/battery-graph${query}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();}

export async function efficiencyScatter(params: { limit?: number; aggregate_minutes?: number; idle_threshold?: number; balancing_threshold?: number }): Promise<Array<EfficiencyScatterPoint>> {
    const searchParams = new URLSearchParams();
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params.aggregate_minutes !== undefined) searchParams.set('aggregate_minutes', String(params.aggregate_minutes));
    if (params.idle_threshold !== undefined) searchParams.set('idle_threshold', String(params.idle_threshold));
    if (params.balancing_threshold !== undefined) searchParams.set('balancing_threshold', String(params.balancing_threshold));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`/api/efficiency-scatter${query}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();}

export async function cycles(params: { battery_id?: string | null; start?: string | null; end?: string | null; min_soc_swing?: number }): Promise<Array<BatteryCycle>> {
    const searchParams = new URLSearchParams();
    if (params.battery_id !== undefined) searchParams.set('battery_id', String(params.battery_id));
    if (params.start !== undefined) searchParams.set('start', String(params.start));
    if (params.end !== undefined) searchParams.set('end', String(params.end));
    if (params.min_soc_swing !== undefined) searchParams.set('min_soc_swing', String(params.min_soc_swing));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`/api/cycles${query}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();}

export async function power(params: { start?: string | null; end?: string | null; aggregate_minutes?: number }): Promise<PowerResponse> {
    const searchParams = new URLSearchParams();
    if (params.start !== undefined) searchParams.set('start', String(params.start));
    if (params.end !== undefined) searchParams.set('end', String(params.end));
    if (params.aggregate_minutes !== undefined) searchParams.set('aggregate_minutes', String(params.aggregate_minutes));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`/api/power${query}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();}

export async function energy(params: { start?: string | null; end?: string | null }): Promise<EnergyResponse> {
    const searchParams = new URLSearchParams();
    if (params.start !== undefined) searchParams.set('start', String(params.start));
    if (params.end !== undefined) searchParams.set('end', String(params.end));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await fetch(`/api/energy${query}`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();}
