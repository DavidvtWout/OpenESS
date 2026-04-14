// API Types - mirrors Pydantic models from api.py
// TODO: Auto-generate with `npm run generate-types` once server is running

export type Status = 'ok' | 'warning' | 'error';

export interface ServiceMessage {
    timestamp: string;
    status: Status;
    message: string;
}

export interface ServiceStatus {
    status: Status;
    messages: ServiceMessage[];
}

export interface ServicesStatusResponse {
    database: ServiceStatus | null;
    optimizer: ServiceStatus | null;
}
