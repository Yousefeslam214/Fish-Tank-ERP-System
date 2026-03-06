import axios from "axios";

const API = axios.create({
  baseURL: "/api/v1",
});


export const getFeedInventory = () => API.get("/inventory/feed");

export const createFeed = (data: any) =>
  API.post("/inventory/feed", data);

export const getFeedByFoodType = (foodId: string) =>
  API.get(`/inventory/feed/food-type/${foodId}`);


export const getBatches = () =>
  API.get("/inventory/batches");

export const getBatchById = (id: string) =>
  API.get(`/inventory/batches/${id}`);

export const quarantineBatch = (id: string) =>
  API.patch(`/inventory/batches/${id}/quarantine`);

export const healthCheckBatch = (id: string, data: any) =>
  API.patch(`/inventory/batches/${id}/health-check`, data);

export const allocateBatch = (id: string, data: any) =>
  API.patch(`/inventory/batches/${id}/allocate`, data);