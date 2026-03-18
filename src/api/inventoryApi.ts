import { apiGet, apiPost, apiPatch, apiDelete } from "../api";

export const getFeedInventory = () => apiGet<any>("/inventory/feed");

export const createFeed = (data: any) =>
  apiPost<any>("/inventory/feed", data);

export const getFeedByFoodType = (foodId: string) =>
  apiGet<any>(`/inventory/feed/food-type/${foodId}`);


export const getBatches = () =>
  apiGet<any>("/inventory/batches");

export const getBatchById = (id: string) =>
  apiGet<any>(`/inventory/batches/${id}`);

export const quarantineBatch = (id: string) =>
  apiPatch<any>(`/inventory/batches/${id}/quarantine`, {});

export const healthCheckBatch = (id: string, data: any) =>
  apiPatch<any>(`/inventory/batches/${id}/health-check`, data);

export const allocateBatch = (id: string, data: any) =>
  apiPatch<any>(`/inventory/batches/${id}/allocate`, data);

export const deleteFeed = (id: string) =>
  apiDelete<any>(`/inventory/feed/${id}`);