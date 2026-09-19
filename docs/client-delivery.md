# Client Delivery Lifecycle

| Stage | Purpose | Primary artifact |
|---|---|---|
| Intake | Capture goals, users, systems, constraints | client-input.yaml |
| Normalize | Resolve client truth | client-profile.yaml |
| Classify | Resolve industry/archetype | industry-profile.yaml |
| Benchmark | Apply best-practice blueprint | benchmark-report.yaml |
| Gap | Compare requested/current vs expected | capability-gap.yaml |
| Reuse | Resolve existing/OSS/custom strategy | reuse-decisions.yaml |
| Map | Capabilities, journeys, entities, surfaces, dependencies | derived/*.yaml |
| Solution | Select providers/modules | solution-contract.yaml |
| Directions | Generate alternative experience strategies | directions/*.yaml |
| Prototype | Build required surfaces | experience/prototypes |
| QA/Review | Validate and collect structured feedback | feedback/* |
| Change | Impact and route requested changes | changes/CHG-* |
| Freeze | Approve experience/business/solution | approved/* |
| Production | Implement contracts | production/* |
| QA/UAT | Cross-domain validation and business acceptance | qa/*, uat/* |
| Release | Human authorization and exact-candidate promotion | release/* |
| Operate | Observe, reconcile, recover | operational evidence |

Client request is an input to discovery, not a production specification.
