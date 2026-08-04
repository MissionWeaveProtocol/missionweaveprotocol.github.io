package org.missionweaveprotocol.examples;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import org.missionweaveprotocol.sdk.AdmissionContextValue;
import org.missionweaveprotocol.sdk.AdmissionCurrentKeyResolver;
import org.missionweaveprotocol.sdk.AdmissionLog;
import org.missionweaveprotocol.sdk.AdmissionLookup;
import org.missionweaveprotocol.sdk.AdmissionService;
import org.missionweaveprotocol.sdk.AuthenticatedAdmissionRecord;
import org.missionweaveprotocol.sdk.KeyRegistrySnapshot;
import org.missionweaveprotocol.sdk.KeyResolutionRequest;
import org.missionweaveprotocol.sdk.KeyResolver;
import org.missionweaveprotocol.sdk.Principal;
import org.missionweaveprotocol.sdk.ProtocolBundle;
import org.missionweaveprotocol.sdk.SignedDocumentKind;
import org.missionweaveprotocol.sdk.TrustedAdmissionContext;

public final class AdmissionExample {
  private static final Principal ADMISSION_SERVICE =
      new Principal("service", "urn:missionweaveprotocol:service:admission");

  private AdmissionExample() {}

  private static final class CurrentRegistry
      implements AdmissionCurrentKeyResolver, KeyResolver {
    private final byte[] registry;

    private CurrentRegistry(byte[] registry) {
      this.registry = registry.clone();
    }

    @Override
    public KeyRegistrySnapshot resolveCurrent(KeyResolutionRequest request) {
      return snapshot();
    }

    @Override
    public KeyRegistrySnapshot resolve(KeyResolutionRequest request) {
      return snapshot();
    }

    private KeyRegistrySnapshot snapshot() {
      return KeyRegistrySnapshot.organizationWide(registry);
    }
  }

  private static final class FixedTrustedContext implements TrustedAdmissionContext {
    @Override
    public AdmissionContextValue issue(String organizationId, String signingHash) {
      return new AdmissionContextValue(
          "urn:missionweaveprotocol:admission-record:website-example",
          "2026-07-15T00:05:00Z",
          ADMISSION_SERVICE);
    }
  }

  private static final class InMemoryAdmissionLog implements AdmissionLog {
    private final Map<String, AuthenticatedAdmissionRecord> records = new HashMap<>();
    private int appendCount;

    @Override
    public AdmissionLookup lookup(String organizationId, String signingHash) {
      AuthenticatedAdmissionRecord record = records.get(key(organizationId, signingHash));
      return record == null
          ? new AdmissionLookup.AuthoritativeAbsence()
          : new AdmissionLookup.Found(copy(record));
    }

    @Override
    public AuthenticatedAdmissionRecord appendOrReturnExisting(
        String organizationId, String signingHash, byte[] candidateBytes) {
      String key = key(organizationId, signingHash);
      AuthenticatedAdmissionRecord existing = records.get(key);
      if (existing != null) {
        return copy(existing);
      }

      AuthenticatedAdmissionRecord committed =
          new AuthenticatedAdmissionRecord(candidateBytes, ADMISSION_SERVICE);
      records.put(key, committed);
      appendCount += 1;
      return copy(committed);
    }

    private int appendCount() {
      return appendCount;
    }

    private static String key(String organizationId, String signingHash) {
      return organizationId + "\0" + signingHash;
    }

    private static AuthenticatedAdmissionRecord copy(AuthenticatedAdmissionRecord record) {
      return new AuthenticatedAdmissionRecord(
          record.recordBytes(), record.authenticatedService());
    }
  }

  public static void main(String[] arguments) throws Exception {
    ProtocolBundle.verifyPackaged();
    ProtocolBundle.verifyPackagedCryptographyBundle();
    ProtocolBundle.verifyPackagedAdmissionBundle();

    byte[] document = resource("cryptography/vectors/signed-documents/valid/command.json");
    CurrentRegistry currentRegistry =
        new CurrentRegistry(resource("cryptography/keys/registry-valid.json"));
    InMemoryAdmissionLog admissionLog = new InMemoryAdmissionLog();
    AdmissionService service = new AdmissionService();

    var first =
        service.admitFirst(
            SignedDocumentKind.COMMAND,
            document,
            currentRegistry,
            admissionLog,
            new FixedTrustedContext());
    var historical =
        service.verifyHistoricalAdmission(
            SignedDocumentKind.COMMAND, document, currentRegistry, admissionLog);

    if (!first.record().admissionRecordId().equals(historical.record().admissionRecordId())) {
      throw new IllegalStateException("historical replay returned a different record ID");
    }
    if (!first.verified().signingHash().equals(historical.verified().signingHash())) {
      throw new IllegalStateException("historical replay returned a different signing hash");
    }
    if (!Arrays.equals(first.recordBytes(), historical.recordBytes())) {
      throw new IllegalStateException("historical replay returned different record bytes");
    }
    if (!(admissionLog.appendCount() == 1)) {
      throw new IllegalStateException("Admission Log did not append exactly once");
    }

    System.out.println("first admission: " + first.record().admissionRecordId());
    System.out.println("historical replay: " + historical.record().admissionRecordId());
  }

  private static byte[] resource(String path) throws IOException {
    try (InputStream input = AdmissionExample.class.getClassLoader().getResourceAsStream(path)) {
      if (input == null) {
        throw new IOException("Missing packaged protocol resource: " + path);
      }
      return input.readAllBytes();
    }
  }
}
