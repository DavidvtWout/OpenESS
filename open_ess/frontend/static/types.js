"use strict";
(() => {
  // open_ess/frontend/src/types.ts
  async function health() {
    const response = await fetch(`/api/health`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function servicesStatus() {
    const response = await fetch(`/api/services-status`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function batteryIds() {
    const response = await fetch(`/api/battery-ids`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function energyGraph(params) {
    const searchParams = new URLSearchParams();
    if (params.battery_id !== void 0) searchParams.set("battery_id", String(params.battery_id));
    if (params.start !== void 0) searchParams.set("start", String(params.start));
    if (params.end !== void 0) searchParams.set("end", String(params.end));
    if (params.bucket_minutes !== void 0) searchParams.set("bucket_minutes", String(params.bucket_minutes));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const response = await fetch(`/api/energy-graph${query}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function powerGraph(params) {
    const searchParams = new URLSearchParams();
    if (params.battery_id !== void 0) searchParams.set("battery_id", String(params.battery_id));
    if (params.start !== void 0) searchParams.set("start", String(params.start));
    if (params.end !== void 0) searchParams.set("end", String(params.end));
    if (params.aggregate_minutes !== void 0) searchParams.set("aggregate_minutes", String(params.aggregate_minutes));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const response = await fetch(`/api/power-graph${query}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function prices(params) {
    const searchParams = new URLSearchParams();
    if (params.area !== void 0) searchParams.set("area", String(params.area));
    if (params.start !== void 0) searchParams.set("start", String(params.start));
    if (params.end !== void 0) searchParams.set("end", String(params.end));
    if (params.aggregate_minutes !== void 0) searchParams.set("aggregate_minutes", String(params.aggregate_minutes));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const response = await fetch(`/api/prices${query}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function batteryGraph(params) {
    const searchParams = new URLSearchParams();
    if (params.battery_id !== void 0) searchParams.set("battery_id", String(params.battery_id));
    if (params.start !== void 0) searchParams.set("start", String(params.start));
    if (params.end !== void 0) searchParams.set("end", String(params.end));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const response = await fetch(`/api/battery-graph${query}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function efficiencyScatter(params) {
    const searchParams = new URLSearchParams();
    if (params.limit !== void 0) searchParams.set("limit", String(params.limit));
    if (params.aggregate_minutes !== void 0) searchParams.set("aggregate_minutes", String(params.aggregate_minutes));
    if (params.idle_threshold !== void 0) searchParams.set("idle_threshold", String(params.idle_threshold));
    if (params.balancing_threshold !== void 0) searchParams.set("balancing_threshold", String(params.balancing_threshold));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const response = await fetch(`/api/efficiency-scatter${query}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function cycles(params) {
    const searchParams = new URLSearchParams();
    if (params.battery_id !== void 0) searchParams.set("battery_id", String(params.battery_id));
    if (params.start !== void 0) searchParams.set("start", String(params.start));
    if (params.end !== void 0) searchParams.set("end", String(params.end));
    if (params.min_soc_swing !== void 0) searchParams.set("min_soc_swing", String(params.min_soc_swing));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const response = await fetch(`/api/cycles${query}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function power(params) {
    const searchParams = new URLSearchParams();
    if (params.start !== void 0) searchParams.set("start", String(params.start));
    if (params.end !== void 0) searchParams.set("end", String(params.end));
    if (params.aggregate_minutes !== void 0) searchParams.set("aggregate_minutes", String(params.aggregate_minutes));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const response = await fetch(`/api/power${query}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function energy(params) {
    const searchParams = new URLSearchParams();
    if (params.start !== void 0) searchParams.set("start", String(params.start));
    if (params.end !== void 0) searchParams.set("end", String(params.end));
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const response = await fetch(`/api/energy${query}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function systemLayout() {
    const response = await fetch(`/api/system-layout`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
  async function powerFlow() {
    const response = await fetch(`/api/power-flow`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
})();
