# Agency Control Plane

The Agency Control Plane is a read model over all `client-projects/*`.

It summarizes:
- workflow stage
- blocked status
- latest release candidate
- production authorization
- delivery exceptions
- reconciliation exceptions

The dashboard is not a source of record. All authoritative decisions remain in the client project's contracts, workflow, release and operations artifacts.

OpenCode may use the control-plane index to identify missing evidence or operational attention, but it must update the underlying governed artifacts rather than editing dashboard state.
