import axios from "axios";
import { config } from "../config.js";

export async function ringbaRequest(method, path, data) {
  const url = `https://api.ringba.com/v2/${config.ringbaAccountId}${path}`;
  const headers = {
    Authorization: `Token ${config.ringbaToken}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios({ method, url, data, headers });
    return response.data;
  } catch (error) {
    if (error?.response?.status !== 401) throw error;
    const response = await axios({
      method,
      url,
      data,
      headers: { ...headers, Authorization: `Bearer ${config.ringbaToken}` },
    });
    return response.data;
  }
}

export async function ringbaGet(path) {
  return ringbaRequest("get", path);
}

export async function ringbaPost(path, body) {
  return ringbaRequest("post", path, body);
}
