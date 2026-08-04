"""Run First Admission and Historical Trust with typed in-memory adapters."""

from __future__ import annotations

import base64
import hashlib
import json
from dataclasses import dataclass
from threading import Lock

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from missionweaveprotocol import (
    AdmissionContextValue,
    AdmissionCurrentKeyResolver,
    AdmissionLog,
    AdmissionLookup,
    AdmissionLookupStatus,
    AdmissionService,
    AuthenticatedAdmissionRecord,
    KeyRegistryCompleteness,
    KeyRegistrySnapshot,
    KeyResolutionRequest,
    KeyResolver,
    PrincipalEvidence,
    SignedDocumentCodec,
    SignedDocumentKind,
    SigningKey,
    TrustedAdmissionContext,
)

AGENT_ID = "urn:missionweaveprotocol:agent:website-example"
KEY_ID = "urn:missionweaveprotocol:key:website-example"
ORGANIZATION_ID = "urn:missionweaveprotocol:organization:website-example"


class DeterministicSigningKey:
    """Demonstration-only Ed25519 signing adapter with a fixed seed."""

    algorithm = "Ed25519"

    def __init__(self, key_id: str) -> None:
        self.key_id = key_id
        self._private_key = Ed25519PrivateKey.from_private_bytes(bytes(range(1, 33)))
        self.public_key_bytes = self._private_key.public_key().public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )

    def sign(self, message: bytes) -> bytes:
        return self._private_key.sign(message)


@dataclass(frozen=True, slots=True)
class CurrentRegistryFixture:
    """Expose one complete Registry as both current and historical evidence."""

    registry_bytes: bytes

    def _snapshot(self) -> KeyRegistrySnapshot:
        return KeyRegistrySnapshot(
            completeness=KeyRegistryCompleteness.ORGANIZATION_WIDE,
            registry_bytes=self.registry_bytes,
        )

    def resolve_current(self, request: KeyResolutionRequest) -> KeyRegistrySnapshot:
        del request
        return self._snapshot()

    def resolve(self, request: KeyResolutionRequest) -> KeyRegistrySnapshot:
        del request
        return self._snapshot()


@dataclass(frozen=True, slots=True)
class FixedTrustedAdmissionContext:
    """Issue trusted acceptance metadata after authoritative log absence."""

    trusted_accepted_at: str
    accepted_by: PrincipalEvidence

    def issue(self, organization_id: str, signing_hash: str) -> AdmissionContextValue:
        logical_key_digest = hashlib.sha256(
            f"{organization_id}\0{signing_hash}".encode()
        ).hexdigest()
        return AdmissionContextValue(
            admission_record_id=(f"urn:missionweaveprotocol:admission-record:{logical_key_digest}"),
            trusted_accepted_at=self.trusted_accepted_at,
            accepted_by=self.accepted_by,
        )


class InMemoryAdmissionLog:
    """Model authenticated lookup and atomic append-or-return-existing behavior."""

    def __init__(self, authenticated_service: PrincipalEvidence) -> None:
        self._authenticated_service = authenticated_service
        self._records: dict[tuple[str, str], AuthenticatedAdmissionRecord] = {}
        self._lock = Lock()
        self.append_count = 0

    def lookup(self, organization_id: str, signing_hash: str) -> AdmissionLookup:
        with self._lock:
            record = self._records.get((organization_id, signing_hash))
        if record is None:
            return AdmissionLookup(AdmissionLookupStatus.AUTHORITATIVE_ABSENCE)
        return AdmissionLookup(AdmissionLookupStatus.FOUND, record)

    def append_or_return_existing(
        self,
        organization_id: str,
        signing_hash: str,
        candidate_bytes: bytes,
    ) -> AuthenticatedAdmissionRecord:
        key = (organization_id, signing_hash)
        with self._lock:
            existing = self._records.get(key)
            if existing is not None:
                return existing

            candidate = AuthenticatedAdmissionRecord(
                record_bytes=candidate_bytes,
                authenticated_service=self._authenticated_service,
            )
            self._records[key] = candidate
            self.append_count += 1
            return candidate


def main() -> None:
    signing_key: SigningKey = DeterministicSigningKey(KEY_ID)
    registry_bytes = json.dumps(
        {
            "organizationId": ORGANIZATION_ID,
            "bindings": [
                {
                    "keyId": KEY_ID,
                    "principal": {"type": "agent", "id": AGENT_ID},
                    "algorithm": "Ed25519",
                    "publicKey": base64.urlsafe_b64encode(signing_key.public_key_bytes)
                    .rstrip(b"=")
                    .decode("ascii"),
                    "validFrom": "2026-07-01T00:00:00Z",
                    "validityHistory": [],
                }
            ],
        },
        separators=(",", ":"),
    ).encode("utf-8")
    registry = CurrentRegistryFixture(registry_bytes)
    current_registry: AdmissionCurrentKeyResolver = registry
    historical_registry: KeyResolver = registry

    document_bytes = (
        SignedDocumentCodec()
        .sign(
            SignedDocumentKind.COMMAND,
            {
                "protocolVersion": "0.1",
                "actionId": "urn:uuid:11111111-2222-4333-8444-555555555555",
                "actor": {"type": "agent", "id": AGENT_ID},
                "sessionEpoch": 1,
                "membershipEpoch": 1,
                "groupId": "urn:missionweaveprotocol:group:website-example",
                "kind": "message.post",
                "correlationId": "urn:uuid:aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
                "issuedAt": "2026-07-15T00:00:00Z",
                "payload": {"text": "Admission example"},
            },
            signing_key,
        )
        .canonical_document_bytes
    )

    admission_service = PrincipalEvidence(
        type="service",
        id="urn:missionweaveprotocol:service:admission",
    )
    trusted_context: TrustedAdmissionContext = FixedTrustedAdmissionContext(
        trusted_accepted_at="2026-07-15T00:05:00Z",
        accepted_by=admission_service,
    )
    admission_log_impl = InMemoryAdmissionLog(admission_service)
    admission_log: AdmissionLog = admission_log_impl
    service = AdmissionService()

    first = service.admit_first(
        SignedDocumentKind.COMMAND,
        document_bytes,
        current_registry,
        admission_log,
        trusted_context,
    )
    historical = service.verify_historical_admission(
        SignedDocumentKind.COMMAND,
        document_bytes,
        historical_registry,
        admission_log,
    )

    assert first.record.admission_record_id == historical.record.admission_record_id
    assert first.verified.signing_hash == historical.verified.signing_hash
    assert first.record.raw_bytes == historical.record.raw_bytes
    assert admission_log_impl.append_count == 1
    print(f"first admission: {first.record.admission_record_id}")
    print(f"historical replay: {historical.record.admission_record_id}")


if __name__ == "__main__":
    main()
