import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

type OpsData = {
  client_id: string;
  delivery_exceptions: Array<Record<string, unknown>>;
  reconciliation_exceptions: Array<Record<string, unknown>>;
  provider_health: Array<Record<string, unknown>>;
};

function loadOps(): OpsData {
  const file = path.resolve(
    process.cwd(),
    "../../client-projects/reference-retail/production/ops/exceptions.yaml",
  );
  return parse(fs.readFileSync(file, "utf8")) as OpsData;
}

export default function OpsConsolePage() {
  const data = loadOps();

  return (
    <main className="agency-page ops-page">
      <header>
        <p className="eyebrow">Operations</p>
        <h1>{data.client_id}</h1>
        <p>Delivery, reconciliation and provider-health exceptions.</p>
      </header>

      <section>
        <h2>Delivery exceptions</h2>
        <div className="ops-grid">
          {data.delivery_exceptions.map((item) => (
            <article className="agency-card" key={String(item.dead_letter_id)}>
              <strong>{String(item.command_type)}</strong>
              <p>{String(item.entity_id)}</p>
              <p>{String(item.reason)}</p>
              <small>{String(item.attempts)} attempts · {String(item.status)}</small>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Reconciliation exceptions</h2>
        <div className="ops-grid">
          {data.reconciliation_exceptions.map((item) => (
            <article className="agency-card" key={String(item.record_id)}>
              <strong>{String(item.flow)}</strong>
              <p>{String(item.entity_id)}</p>
              <pre>{JSON.stringify(item.difference, null, 2)}</pre>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Provider health</h2>
        <div className="ops-grid">
          {data.provider_health.map((item) => (
            <article className="agency-card" key={String(item.provider)}>
              <strong>{String(item.provider)}</strong>
              <p>{String(item.status)}</p>
              <small>{String(item.latency_ms)} ms</small>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
