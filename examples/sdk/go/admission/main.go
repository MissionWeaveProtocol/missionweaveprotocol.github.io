package main

import (
	"bytes"
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"sync"

	missionweaveprotocol "github.com/missionweaveprotocol/go-sdk"
)

const (
	agentID        = "urn:missionweaveprotocol:agent:website-example"
	keyID          = "urn:missionweaveprotocol:key:website-example"
	organizationID = "urn:missionweaveprotocol:organization:website-example"
)

var admissionService = missionweaveprotocol.Principal{
	Type: "service",
	ID:   "urn:missionweaveprotocol:service:admission",
}

type deterministicSigningKey struct {
	privateKey ed25519.PrivateKey
}

func (deterministicSigningKey) Algorithm() string { return "Ed25519" }
func (deterministicSigningKey) KeyID() string     { return keyID }
func (key deterministicSigningKey) Sign(message []byte) ([]byte, error) {
	return ed25519.Sign(key.privateKey, message), nil
}

type currentRegistryFixture struct {
	registryBytes []byte
}

var _ missionweaveprotocol.AdmissionCurrentKeyResolver = currentRegistryFixture{}
var _ missionweaveprotocol.KeyResolver = currentRegistryFixture{}

func (fixture currentRegistryFixture) ResolveCurrent(
	_ missionweaveprotocol.KeyResolutionRequest,
) (missionweaveprotocol.KeyRegistrySnapshot, error) {
	return fixture.snapshot(), nil
}

func (fixture currentRegistryFixture) Resolve(
	_ missionweaveprotocol.KeyResolutionRequest,
) (missionweaveprotocol.KeyRegistrySnapshot, error) {
	return fixture.snapshot(), nil
}

func (fixture currentRegistryFixture) snapshot() missionweaveprotocol.KeyRegistrySnapshot {
	return missionweaveprotocol.KeyRegistrySnapshot{
		Completeness:  missionweaveprotocol.KeyRegistryOrganizationWide,
		RegistryBytes: append([]byte(nil), fixture.registryBytes...),
	}
}

type fixedTrustedAdmissionContext struct{}

var _ missionweaveprotocol.TrustedAdmissionContext = fixedTrustedAdmissionContext{}

func (fixedTrustedAdmissionContext) Issue(
	organizationID string,
	signingHash string,
) (missionweaveprotocol.AdmissionContextValue, error) {
	digest := sha256.Sum256([]byte(organizationID + "\x00" + signingHash))
	return missionweaveprotocol.AdmissionContextValue{
		AdmissionRecordID: fmt.Sprintf(
			"urn:missionweaveprotocol:admission-record:%x",
			digest,
		),
		TrustedAcceptedAt: "2026-07-15T00:05:00Z",
		AcceptedBy:        admissionService,
	}, nil
}

type inMemoryAdmissionLog struct {
	mu          sync.Mutex
	records     map[string]missionweaveprotocol.AuthenticatedAdmissionRecord
	appendCount int
}

var _ missionweaveprotocol.AdmissionLog = (*inMemoryAdmissionLog)(nil)

func (log *inMemoryAdmissionLog) Lookup(
	organizationID string,
	signingHash string,
) (missionweaveprotocol.AdmissionLookup, error) {
	log.mu.Lock()
	defer log.mu.Unlock()
	record, found := log.records[logKey(organizationID, signingHash)]
	if !found {
		return missionweaveprotocol.AdmissionLookup{AuthoritativeAbsence: true}, nil
	}
	copied := copyAuthenticatedRecord(record)
	return missionweaveprotocol.AdmissionLookup{Record: &copied}, nil
}

func (log *inMemoryAdmissionLog) AppendOrReturnExisting(
	organizationID string,
	signingHash string,
	candidateBytes []byte,
) (missionweaveprotocol.AuthenticatedAdmissionRecord, error) {
	log.mu.Lock()
	defer log.mu.Unlock()
	key := logKey(organizationID, signingHash)
	if existing, found := log.records[key]; found {
		return copyAuthenticatedRecord(existing), nil
	}
	candidate := missionweaveprotocol.AuthenticatedAdmissionRecord{
		RecordBytes:          append([]byte(nil), candidateBytes...),
		AuthenticatedService: admissionService,
	}
	log.records[key] = copyAuthenticatedRecord(candidate)
	log.appendCount++
	return copyAuthenticatedRecord(candidate), nil
}

func copyAuthenticatedRecord(
	record missionweaveprotocol.AuthenticatedAdmissionRecord,
) missionweaveprotocol.AuthenticatedAdmissionRecord {
	return missionweaveprotocol.AuthenticatedAdmissionRecord{
		RecordBytes:          append([]byte(nil), record.RecordBytes...),
		AuthenticatedService: record.AuthenticatedService,
	}
}

func logKey(organizationID string, signingHash string) string {
	return organizationID + "\x00" + signingHash
}

func main() {
	seed := make([]byte, ed25519.SeedSize)
	for index := range seed {
		seed[index] = byte(index + 1)
	}
	privateKey := ed25519.NewKeyFromSeed(seed)
	publicKey := privateKey.Public().(ed25519.PublicKey)
	signingKey := deterministicSigningKey{privateKey: privateKey}

	registryBytes, err := json.Marshal(map[string]any{
		"organizationId": organizationID,
		"bindings": []any{map[string]any{
			"keyId":           keyID,
			"principal":       map[string]any{"type": "agent", "id": agentID},
			"algorithm":       "Ed25519",
			"publicKey":       base64.RawURLEncoding.EncodeToString(publicKey),
			"validFrom":       "2026-07-01T00:00:00Z",
			"validityHistory": []any{},
		}},
	})
	if err != nil {
		panic(err)
	}
	registry := currentRegistryFixture{registryBytes: registryBytes}

	codec, err := missionweaveprotocol.NewSignedDocumentCodec()
	if err != nil {
		panic(err)
	}
	signedDocument, err := codec.Sign(
		missionweaveprotocol.SignedDocumentCommand,
		map[string]any{
			"protocolVersion": "0.1",
			"actionId":        "urn:uuid:11111111-2222-4333-8444-555555555555",
			"actor":           map[string]any{"type": "agent", "id": agentID},
			"sessionEpoch":    float64(1),
			"membershipEpoch": float64(1),
			"groupId":         "urn:missionweaveprotocol:group:website-example",
			"kind":            "message.post",
			"correlationId":   "urn:uuid:aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
			"issuedAt":        "2026-07-15T00:00:00Z",
			"payload":         map[string]any{"text": "Admission example"},
		},
		signingKey,
	)
	if err != nil {
		panic(err)
	}
	documentBytes, err := missionweaveprotocol.MarshalCanonicalJSON(signedDocument)
	if err != nil {
		panic(err)
	}

	admissionLog := &inMemoryAdmissionLog{
		records: make(map[string]missionweaveprotocol.AuthenticatedAdmissionRecord),
	}
	service := missionweaveprotocol.NewAdmissionService()
	first, err := service.AdmitFirst(
		missionweaveprotocol.SignedDocumentCommand,
		documentBytes,
		registry,
		admissionLog,
		fixedTrustedAdmissionContext{},
	)
	if err != nil {
		panic(err)
	}
	historical, err := service.VerifyHistoricalAdmission(
		missionweaveprotocol.SignedDocumentCommand,
		documentBytes,
		registry,
		admissionLog,
	)
	if err != nil {
		panic(err)
	}

	if !(first.Record().AdmissionRecordID() == historical.Record().AdmissionRecordID()) {
		panic("historical replay returned a different Admission record")
	}
	if !(first.Verified().SigningHash() == historical.Verified().SigningHash()) {
		panic("historical replay returned a different signing hash")
	}
	if !bytes.Equal(first.RecordBytes(), historical.RecordBytes()) {
		panic("historical replay returned different record bytes")
	}
	if !(admissionLog.appendCount == 1) {
		panic("Admission Log did not append exactly once")
	}

	fmt.Printf("first admission: %s\n", first.Record().AdmissionRecordID())
	fmt.Printf("historical replay: %s\n", historical.Record().AdmissionRecordID())
}
