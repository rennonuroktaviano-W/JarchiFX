import { config } from "./config.js";

async function post(path, body) {
  const response = await fetch(`${config.apiUrl}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  return { httpStatus: response.status, data };
}

export function redeem(code, discordUserId) {
  return post("/api/internal/redeem", {
    code,
    discord_user_id: discordUserId,
  });
}

export function fetchStatus(discordUserId) {
  return post("/api/internal/status", {
    discord_user_id: discordUserId,
  });
}
