export const specificationPages = [
  {
    page: "reference/specification/foundations",
    prefix: "MWP-FND",
    title: "Foundations",
    description:
      "Purpose, conventions, terminology, invariants, architecture, and persistence foundations for MissionWeaveProtocol 0.1.",
    sectionMappings: ["Preamble and §§1–5"],
    sourceSegments: [[1, 184]],
  },
  {
    page: "reference/specification/identity-registry-and-sessions",
    prefix: "MWP-IDN",
    title: "Identity, Registry, and sessions",
    description:
      "Normative Agent Card, Presence Record, authentication, and Session Epoch requirements.",
    sectionMappings: ["§§6.1–6.3"],
    sourceSegments: [[185, 246]],
  },
  {
    page: "reference/specification/signed-documents-and-trust",
    prefix: "MWP-SDV",
    title: "Signed Documents and trust verification",
    description:
      "The Signed Document Verification Profile, Registry evidence contract, semantic stages, and protected diagnostics.",
    sectionMappings: [
      "§6.4 verification profile and six stages",
      "§6.4 diagnostics and forward compatibility",
    ],
    sourceSegments: [
      [247, 410],
      [521, 536],
    ],
  },
  {
    page: "reference/specification/first-admission-and-historical-trust",
    prefix: "MWP-ADM",
    title: "First Admission and Historical Trust",
    description:
      "The authoritative Admission Log contract, first-admission flow, historical replay, and failure mapping.",
    sectionMappings: ["§6.4 First Admission and Historical Trust"],
    sourceSegments: [[411, 520]],
  },
  {
    page: "reference/specification/missions-groups-and-membership",
    prefix: "MWP-MSN",
    title: "Missions, Groups, Membership, and Conversations",
    description:
      "Mission and Group lifecycle, membership, visibility, conversation, Messages, and child Missions.",
    sectionMappings: [
      "§§7–9 Mission, Group, Membership, and Conversation",
      "§14 Parent and child Missions",
    ],
    sourceSegments: [
      [538, 691],
      [951, 976],
    ],
  },
  {
    page: "reference/specification/work-scheduling-and-recovery",
    prefix: "MWP-WRK",
    title: "Work, scheduling, and recovery",
    description:
      "WorkItems, Work Contracts, scheduling, execution, recovery, Artifacts, Evidence, replay, and acknowledgement.",
    sectionMappings: [
      "§§10–11 WorkItems, scheduling, execution, and recovery",
      "§13 Artifacts, Evidence, and Context Packages",
      "§16 Delivery, replay, and acknowledgement",
    ],
    sourceSegments: [
      [692, 869],
      [911, 950],
      [1099, 1117],
    ],
  },
  {
    page: "reference/specification/authorization-and-budgets",
    prefix: "MWP-AUT",
    title: "Authorization, budgets, and side effects",
    description:
      "Normative authorization, capability, approval, budget, and side-effect controls.",
    sectionMappings: ["§12 Authorization, budgets, and side effects"],
    sourceSegments: [[870, 910]],
  },
  {
    page: "reference/specification/commands-events-and-ordering",
    prefix: "MWP-EVT",
    title: "Commands, Events, and ordering",
    description:
      "Command and Event envelopes, concurrency, Group order, WebSocket transport, and canonical wire encoding.",
    sectionMappings: [
      "§15 Commands, Events, and concurrency",
      "§17 WebSocket binding",
    ],
    sourceSegments: [
      [977, 1098],
      [1118, 1159],
    ],
  },
  {
    page: "reference/specification/errors-extensions-and-security",
    prefix: "MWP-EXT",
    title: "Extensions, errors, controls, and conformance",
    description:
      "Extension Profiles, error codes, security controls, compatibility, conformance, proof-of-concept requirements, and licensing.",
    sectionMappings: [
      "§§18–23 Extensions, errors, controls, compatibility, conformance, and licensing",
    ],
    sourceSegments: [[1160, Number.POSITIVE_INFINITY]],
  },
];

export const sourceReplacements = [
  {
    line: 59,
    from: "Section 6.4",
    to: "[Section 6.4](../signed-documents-and-trust/)",
  },
  {
    line: 76,
    from: "Section 6.4",
    to: "[Section 6.4](../signed-documents-and-trust/#mwp-sdv-002)",
  },
  {
    line: 106,
    from: "[`../CONTEXT.md`](../CONTEXT.md)",
    to: "<a href={`${import.meta.env.BASE_URL}artifacts/0.1/protocol/CONTEXT.md`}><code>../CONTEXT.md</code></a>",
  },
  {
    line: 389,
    from: "Section 2",
    to: "[Section 2](../foundations/#mwp-fnd-006)",
  },
  {
    line: 459,
    from: "as required above",
    to: "[as required above](../signed-documents-and-trust/#mwp-sdv-010)",
  },
  {
    line: 1152,
    from: "Section 2",
    to: "[Section 2](../foundations/#mwp-fnd-006)",
  },
  {
    line: 1314,
    from: "Section 6.4",
    to: "[Section 6.4](../signed-documents-and-trust/#mwp-sdv-015)",
  },
  {
    line: 1321,
    from: "above",
    to: "[above](../commands-events-and-ordering/#core-command-kinds)",
  },
  {
    line: 1321,
    from: "Sections 7.1 and 10.2",
    to: "[Sections 7.1](../missions-groups-and-membership/#mission-transition-table) and [10.2](../work-scheduling-and-recovery/#workitem-transition-table)",
  },
];

// When a clause's wording changes so its prior SHA-256 identity no longer
// matches, map the existing stable ID to the new source paragraph explicitly.
export const clauseAssignments = {};

export const sourceInjections = [
  {
    line: 549,
    value: '<span id="mission-transition-table"></span>\n\n',
  },
  {
    line: 718,
    value: '<span id="workitem-transition-table"></span>\n\n',
  },
  {
    line: 1014,
    value: '<span id="core-command-kinds"></span>\n\n',
  },
  {
    line: 1057,
    value: '<span id="core-event-kinds"></span>\n\n',
  },
];
