from __future__ import annotations
from pathlib import Path
import yaml
ROOT=Path(__file__).resolve().parents[2]

def _load(path: Path):
    return yaml.safe_load(path.read_text(encoding="utf-8"))

def evaluate(client: str, root: Path=ROOT):
    base=root/"client-projects"/client
    blockers=[]
    design=base/"contracts"/"design-contract.yaml"
    integration=base/"contracts"/"integration-contract.yaml"
    if not design.exists(): blockers.append("design-contract-missing")
    if not integration.exists(): blockers.append("integration-contract-missing")
    for adr in (base/"solution"/"decisions").glob("ADR-*.yaml"):
        doc=_load(adr)
        if str(doc.get("status","")).lower() not in {"accepted","approved"}:
            blockers.append(f"adr-not-accepted:{adr.name}")
    runtime=base/"experience"/"prototype-core-runtime.yaml"
    if runtime.exists():
        doc=_load(runtime)
        for row in doc.get("runtimes",[]):
            if not row.get("healthy", row.get("status") in {"healthy","ready"}):
                blockers.append(f"runtime-not-ready:{row.get('id') or row.get('provider')}")
    return {"status":"complete" if not blockers else "blocked","blocking_items":blockers}

def main():
    import argparse,json
    p=argparse.ArgumentParser(); p.add_argument("--client",required=True); a=p.parse_args()
    r=evaluate(a.client); print(json.dumps(r,indent=2)); return 0 if r["status"]=="complete" else 2
if __name__=="__main__": raise SystemExit(main())
