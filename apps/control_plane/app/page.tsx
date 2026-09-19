import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

type ClientSummary = {
  client_id: string;
  workflow_stage: string;
  blocked: boolean;
  candidate_id?: string;
  candidate_status?: string;
  production_authorization: string;
  delivery_exceptions: number;
  reconciliation_exceptions: number;
  operational_attention: boolean;
};

function loadYaml(file: string): Record<string, unknown> {
  if (!fs.existsSync(file)) return {};
  return parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
}

function summarizeClient(project: string): ClientSummary {
  const client_id = path.basename(project);
  const workflow = loadYaml(path.join(project, "workflow/workflow-state.yaml"));
  const auth = loadYaml(path.join(project, "release/production-authorization.yaml"));
  const ops = loadYaml(path.join(project, "production/ops/exceptions.yaml"));
  const candidatesDir = path.join(project, "release/candidates");
  const candidates = fs.existsSync(candidatesDir)
    ? fs.readdirSync(candidatesDir).filter((f) => f.endsWith(".yaml")).sort()
    : [];
  const candidate = candidates.length
    ? loadYaml(path.join(candidatesDir, candidates[candidates.length - 1]))
    : {};

  const delivery = Array.isArray(ops.delivery_exceptions) ? ops.delivery_exceptions : [];
  const reconciliation = Array.isArray(ops.reconciliation_exceptions) ? ops.reconciliation_exceptions : [];

  return {
    client_id,
    workflow_stage: String(workflow.current_stage || "unknown"),
    blocked: Boolean(workflow.blocked),
    candidate_id: candidate.candidate_id ? String(candidate.candidate_id) : undefined,
    candidate_status: candidate.status ? String(candidate.status) : undefined,
    production_authorization: String(auth.decision || "not-recorded"),
    delivery_exceptions: delivery.length,
    reconciliation_exceptions: reconciliation.length,
    operational_attention: delivery.length + reconciliation.length > 0,
  };
}

function loadClients(): ClientSummary[] {
  const root = path.resolve(process.cwd(), "../../client-projects");
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root)
    .map((name) => path.join(root, name))
    .filter((project) => fs.statSync(project).isDirectory() && fs.existsSync(path.join(project, "workflow")))
    .map(summarizeClient);
}

export default function ControlPlane() {
  const clients = loadClients();

  return (
    <main className="agency-page control-page">
      <header>
        <p className="eyebrow">Agency Control Plane</p>
        <h1>Client delivery portfolio</h1>
        <p>Read-only aggregation of repository-authoritative client state.</p>
      </header>

      <section className="summary-grid">
        <article className="agency-card"><strong>{clients.length}</strong><span>Clients</span></article>
        <article className="agency-card"><strong>{clients.filter(c => c.blocked).length}</strong><span>Blocked</span></article>
        <article className="agency-card"><strong>{clients.filter(c => c.operational_attention).length}</strong><span>Need ops attention</span></article>
        <article className="agency-card"><strong>{clients.filter(c => c.production_authorization === "approved").length}</strong><span>Authorized</span></article>
      </section>

      <section className="client-grid">
        {clients.map((client) => (
          <article className="agency-card client-card" key={client.client_id}>
            <div className="client-title">
              <strong>{client.client_id}</strong>
              <span>{client.blocked ? "Blocked" : "Active"}</span>
            </div>
            <dl>
              <dt>Stage</dt><dd>{client.workflow_stage}</dd>
              <dt>Candidate</dt><dd>{client.candidate_id || "—"}</dd>
              <dt>Candidate status</dt><dd>{client.candidate_status || "—"}</dd>
              <dt>Production authorization</dt><dd>{client.production_authorization}</dd>
              <dt>Delivery exceptions</dt><dd>{client.delivery_exceptions}</dd>
              <dt>Reconciliation exceptions</dt><dd>{client.reconciliation_exceptions}</dd>
            </dl>
          </article>
        ))}
      </section>
    </main>
  );
}
