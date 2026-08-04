import {
  createPrivateKey,
  createPublicKey,
  sign as nodeSign,
  type KeyObject,
} from "node:crypto";

import {
  AdmissionService,
  SignedDocumentCodec,
  SignedDocumentKind,
  canonicalJsonBytes,
  encodeBase64Url,
  sha256Hex,
  type AdmissionContextValue,
  type AdmissionCurrentKeyResolver,
  type AdmissionLog,
  type AdmissionLookup,
  type AuthenticatedAdmissionRecord,
  type KeyRegistrySnapshot,
  type KeyResolutionRequest,
  type KeyResolver,
  type Principal,
  type SigningKey,
  type TrustedAdmissionContext,
} from "@missionweaveprotocol/sdk";

const AGENT_ID = "urn:missionweaveprotocol:agent:website-example";
const KEY_ID = "urn:missionweaveprotocol:key:website-example";
const ORGANIZATION_ID = "urn:missionweaveprotocol:organization:website-example";
const ADMISSION_SERVICE: Principal = Object.freeze({
  type: "service",
  id: "urn:missionweaveprotocol:service:admission",
});

class DeterministicSigningKey implements SigningKey {
  public readonly algorithm = "Ed25519" as const;
  public readonly keyId = KEY_ID;
  public readonly publicKeyBytes: Uint8Array;
  readonly #privateKey: KeyObject;

  public constructor() {
    // prettier-ignore
    const seed = Buffer.from(Array.from({ length: 32 }, (_, index) => index + 1));
    this.#privateKey = createPrivateKey({
      format: "der",
      key: Buffer.concat([
        Buffer.from("302e020100300506032b657004220420", "hex"),
        seed,
      ]),
      type: "pkcs8",
    });
    const spki = createPublicKey(this.#privateKey).export({
      format: "der",
      type: "spki",
    });
    this.publicKeyBytes = new Uint8Array(spki.subarray(-32));
  }

  public sign(bytes: Uint8Array): Uint8Array {
    return new Uint8Array(nodeSign(null, Buffer.from(bytes), this.#privateKey));
  }
}

class CurrentRegistryFixture
  implements AdmissionCurrentKeyResolver, KeyResolver
{
  readonly #snapshot: KeyRegistrySnapshot;

  public constructor(snapshot: KeyRegistrySnapshot) {
    this.#snapshot = snapshot;
  }

  public resolveCurrent(request: KeyResolutionRequest): KeyRegistrySnapshot {
    void request;
    return this.copySnapshot();
  }

  public resolve(request: KeyResolutionRequest): KeyRegistrySnapshot {
    void request;
    return this.copySnapshot();
  }

  private copySnapshot(): KeyRegistrySnapshot {
    return {
      completeness: "organization-wide",
      organizationId: this.#snapshot.organizationId,
      bindings: this.#snapshot.bindings.map((binding) => ({
        ...binding,
        principal: { ...binding.principal },
        validityHistory: binding.validityHistory.map((entry) => ({ ...entry })),
      })),
    };
  }
}

class FixedTrustedAdmissionContext implements TrustedAdmissionContext {
  public issue(
    organizationId: string,
    signingHash: string,
  ): AdmissionContextValue {
    const logicalKeyDigest = sha256Hex(`${organizationId}\0${signingHash}`);
    return {
      admissionRecordId: `urn:missionweaveprotocol:admission-record:${logicalKeyDigest}`,
      trustedAcceptedAt: "2026-07-15T00:05:00Z",
      acceptedBy: ADMISSION_SERVICE,
    };
  }
}

function copyRecord(
  record: AuthenticatedAdmissionRecord,
): AuthenticatedAdmissionRecord {
  return {
    recordBytes: Uint8Array.from(record.recordBytes),
    authenticatedService: { ...record.authenticatedService },
  };
}

class InMemoryAdmissionLog implements AdmissionLog {
  readonly #records = new Map<string, AuthenticatedAdmissionRecord>();
  public appendCount = 0;

  public async lookup(
    organizationId: string,
    signingHash: string,
  ): Promise<AdmissionLookup> {
    const record = this.#records.get(this.key(organizationId, signingHash));
    return record
      ? { status: "found", record: copyRecord(record) }
      : { status: "authoritative-absence" };
  }

  public async appendOrReturnExisting(
    organizationId: string,
    signingHash: string,
    candidateBytes: Uint8Array,
  ): Promise<AuthenticatedAdmissionRecord> {
    const key = this.key(organizationId, signingHash);
    const existing = this.#records.get(key);
    if (existing) return copyRecord(existing);

    const candidate = copyRecord({
      recordBytes: candidateBytes,
      authenticatedService: ADMISSION_SERVICE,
    });
    this.#records.set(key, candidate);
    this.appendCount += 1;
    return copyRecord(candidate);
  }

  private key(organizationId: string, signingHash: string): string {
    return `${organizationId}\0${signingHash}`;
  }
}

async function main(): Promise<void> {
  const signingKey: SigningKey & { readonly publicKeyBytes: Uint8Array } =
    new DeterministicSigningKey();
  const registry = new CurrentRegistryFixture({
    completeness: "organization-wide",
    organizationId: ORGANIZATION_ID,
    bindings: [
      {
        keyId: KEY_ID,
        principal: { type: "agent", id: AGENT_ID },
        algorithm: "Ed25519",
        publicKey: encodeBase64Url(signingKey.publicKeyBytes),
        validFrom: "2026-07-01T00:00:00Z",
        validityHistory: [],
      },
    ],
  });

  const signedDocument = new SignedDocumentCodec().sign(
    SignedDocumentKind.Command,
    {
      protocolVersion: "0.1",
      actionId: "urn:uuid:11111111-2222-4333-8444-555555555555",
      actor: { type: "agent", id: AGENT_ID },
      sessionEpoch: 1,
      membershipEpoch: 1,
      groupId: "urn:missionweaveprotocol:group:website-example",
      kind: "message.post",
      correlationId: "urn:uuid:aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      issuedAt: "2026-07-15T00:00:00Z",
      payload: { text: "Admission example" },
    },
    signingKey,
  );
  const documentBytes = canonicalJsonBytes(signedDocument);
  const admissionLog = new InMemoryAdmissionLog();
  const service = new AdmissionService();

  const first = await service.admitFirst(
    SignedDocumentKind.Command,
    documentBytes,
    registry,
    admissionLog,
    new FixedTrustedAdmissionContext(),
  );
  const historical = await service.verifyHistoricalAdmission(
    SignedDocumentKind.Command,
    documentBytes,
    registry,
    admissionLog,
  );

  if (
    !(first.record.admissionRecordId === historical.record.admissionRecordId)
  ) {
    throw new Error("historical replay returned a different Admission record");
  }
  if (!(first.verified.signingHash === historical.verified.signingHash)) {
    throw new Error("historical replay returned a different signing hash");
  }
  if (!(Buffer.compare(first.recordBytes, historical.recordBytes) === 0)) {
    throw new Error("historical replay returned different record bytes");
  }
  if (!(admissionLog.appendCount === 1)) {
    throw new Error("Admission Log did not append exactly once");
  }

  console.log("first admission:", first.record.admissionRecordId);
  console.log("historical replay:", historical.record.admissionRecordId);
}

await main();
