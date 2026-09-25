import { NextResponse } from "next/server";
import { ZodError } from "zod";
export class ApiError extends Error {
  constructor(message, status = 400, code = "INVALID_INPUT") {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export const ok = (data) => NextResponse.json({ ok: true, data });
export const route =
  (fn) =>
  async (...args) => {
    try {
      return ok(await fn(...args));
    } catch (e) {
      if (e instanceof ZodError)
        return NextResponse.json(
          {
            ok: false,
            error: {
              code: "INVALID_INPUT",
              message: e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
            },
          },
          { status: 400 },
        );
      if (e instanceof ApiError)
        return NextResponse.json(
          { ok: false, error: { code: e.code, message: e.message } },
          { status: e.status },
        );
      console.error("API error", e.code || e.name);
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "SERVER_ERROR",
            message: "Unable to complete this request. Please try again.",
          },
        },
        { status: 500 },
      );
    }
  };
export async function body(req, schema) {
  const text = await req.text();
  if (text.length > 24000) throw new ApiError("Request too large", 413);
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ApiError("Request must contain valid JSON");
  }
  return schema.parse(value);
}
