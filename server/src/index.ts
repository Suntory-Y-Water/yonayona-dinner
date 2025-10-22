import { Hono } from "hono";
import { cors } from "hono/cors";

type ApiResponse = {
  message: string;
  success: boolean;
};

export const app = new Hono()

  .use(cors())

  .get("/", (c) => {
    return c.text("Hello Hono!");
  })

  .get("/hello", async (c) => {
    const data: ApiResponse = {
      message: "Hello BHVR!",
      success: true,
    };

    return c.json(data, { status: 200 });
  });

export default {
  port: 8787,
  fetch: app.fetch,
};
