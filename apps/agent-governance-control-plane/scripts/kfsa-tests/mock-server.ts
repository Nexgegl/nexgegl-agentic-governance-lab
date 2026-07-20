/**
 * An isolated, in-process mock HTTP server standing in for the external
 * KFSA Runtime Core, used only by the "external KFSA boundary" tests
 * (scripts/test-kfsa-integration-client.ts, scripts/test-kfsa-integration-e2e.ts)
 * per the requirement that only these tests may use a mock HTTP server for
 * the external boundary -- RLS/tenant-isolation claims must use real
 * Postgres instead (see scripts/test-kfsa-integration-db.ts). Never
 * imported by application code.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

export type MockHandler = (req: IncomingMessage, body: string, res: ServerResponse) => void;

export interface MockKfsaServer {
  url: string;
  setHandler(handler: MockHandler): void;
  lastRequest(): { headers: IncomingMessage["headers"]; body: string } | null;
  close(): Promise<void>;
}

export async function startMockKfsaServer(): Promise<MockKfsaServer> {
  let handler: MockHandler = (_req, _body, res) => {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ errors: [{ code: "no_handler_configured", message: "test did not configure a handler" }] }));
  };
  let last: { headers: IncomingMessage["headers"]; body: string } | null = null;

  const server: Server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      last = { headers: req.headers, body };
      handler(req, body, res);
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${address.port}`,
    setHandler(h) {
      handler = h;
    },
    lastRequest() {
      return last;
    },
    close() {
      return new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    },
  };
}

export function validKfsaResponseBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    promotion_request_id: "ext-pr-1",
    status: "COMPLETED",
    review_outcome: "PASS",
    evidence_status: "complete",
    authority_status: "confirmed",
    escalation_required: false,
    blocked_actions: [],
    audit_event_id: "ext-audit-1",
    formal_decision_created: false,
    errors: [],
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
