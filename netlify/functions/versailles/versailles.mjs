// The Paris Peace Conference, 1919: the only server code on teachercolin.com.
// Serves /api/versailles. All game logic runs in the teacher's browser; this
// function is a small authenticated mailbox in front of Netlify Blobs.
import { getStore } from "@netlify/blobs";
import { handle } from "./core.mjs";

export default async (req) => {
  const store = getStore({ name: "versailles", consistency: "strong" });
  return handle(req, store);
};

export const config = { path: "/api/versailles" };
