use std::cell::{Cell, RefCell};

use missionweaveprotocol::{
    AdapterError, AdmissionAdapterError, AdmissionContextValue, AdmissionCurrentKeyResolver,
    AdmissionLog, AdmissionLookup, AdmissionService, AuthenticatedAdmissionRecord,
    KeyRegistrySnapshot, KeyResolutionRequest, KeyResolver, ProtocolBundle, SignedDocumentKind,
    TrustedAdmissionContext,
};

const SERVICE_ID: &str = "urn:missionweaveprotocol:service:admission";

struct CurrentRegistry(Vec<u8>);

impl CurrentRegistry {
    fn snapshot(&self) -> KeyRegistrySnapshot {
        KeyRegistrySnapshot::organization_wide(self.0.clone())
    }
}

impl AdmissionCurrentKeyResolver for CurrentRegistry {
    fn resolve_current(
        &self,
        _request: &KeyResolutionRequest,
    ) -> Result<KeyRegistrySnapshot, AdapterError> {
        Ok(self.snapshot())
    }
}

impl KeyResolver for CurrentRegistry {
    fn resolve(
        &self,
        _request: &KeyResolutionRequest,
    ) -> Result<KeyRegistrySnapshot, AdapterError> {
        Ok(self.snapshot())
    }
}

struct FixedTrustedContext;

impl TrustedAdmissionContext for FixedTrustedContext {
    fn issue(
        &self,
        _organization_id: &str,
        _signing_hash: &str,
    ) -> Result<AdmissionContextValue, AdmissionAdapterError> {
        Ok(AdmissionContextValue::new(
            "urn:missionweaveprotocol:admission-record:website-example",
            "2026-07-15T00:05:00Z",
            SERVICE_ID,
        ))
    }
}

struct InMemoryAdmissionLog {
    record: RefCell<Option<AuthenticatedAdmissionRecord>>,
    append_count: Cell<usize>,
}

impl InMemoryAdmissionLog {
    fn new() -> Self {
        Self {
            record: RefCell::new(None),
            append_count: Cell::new(0),
        }
    }

    fn append_count(&self) -> usize {
        self.append_count.get()
    }
}

impl AdmissionLog for InMemoryAdmissionLog {
    fn lookup(
        &self,
        _organization_id: &str,
        _signing_hash: &str,
    ) -> Result<AdmissionLookup, AdmissionAdapterError> {
        Ok(match self.record.borrow().as_ref() {
            Some(record) => AdmissionLookup::Found(record.clone()),
            None => AdmissionLookup::AuthoritativeAbsence,
        })
    }

    fn append_or_return_existing(
        &self,
        _organization_id: &str,
        _signing_hash: &str,
        candidate_bytes: &[u8],
    ) -> Result<AuthenticatedAdmissionRecord, AdmissionAdapterError> {
        if let Some(record) = self.record.borrow().as_ref() {
            return Ok(record.clone());
        }

        let committed = AuthenticatedAdmissionRecord::new(candidate_bytes.to_vec(), SERVICE_ID);
        *self.record.borrow_mut() = Some(committed.clone());
        self.append_count.set(self.append_count.get() + 1);
        Ok(committed)
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    ProtocolBundle::verify()?;
    ProtocolBundle::verify_cryptography()?;
    ProtocolBundle::verify_admission()?;

    let document = ProtocolBundle::cryptography("vectors/signed-documents/valid/command.json")
        .ok_or("packaged Command is missing")?;
    let registry = ProtocolBundle::cryptography("keys/registry-valid.json")
        .ok_or("packaged Registry is missing")?;

    let current_registry = CurrentRegistry(registry.to_vec());
    let admission_log = InMemoryAdmissionLog::new();
    let service = AdmissionService::new()?;

    let first = service.admit_first(
        SignedDocumentKind::Command,
        document,
        &current_registry,
        &admission_log,
        &FixedTrustedContext,
    )?;
    let historical = service.verify_historical_admission(
        SignedDocumentKind::Command,
        document,
        &current_registry,
        &admission_log,
    )?;

    assert!(first.record().admission_record_id() == historical.record().admission_record_id());
    assert!(first.verified().signing_hash() == historical.verified().signing_hash());
    assert!(first.record().bytes() == historical.record().bytes());
    assert!(admission_log.append_count() == 1);

    println!("first admission: {}", first.record().admission_record_id());
    println!(
        "historical replay: {}",
        historical.record().admission_record_id()
    );
    Ok(())
}
