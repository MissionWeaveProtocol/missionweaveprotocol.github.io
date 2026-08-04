#include <missionweaveprotocol/admission.hpp>
#include <missionweaveprotocol/bundle.hpp>

#include <cstddef>
#include <cstdint>
#include <iostream>
#include <optional>
#include <ranges>
#include <stdexcept>
#include <string_view>
#include <utility>
#include <vector>

namespace {

constexpr std::string_view service_id = "urn:missionweaveprotocol:service:admission";

class CurrentRegistry final : public missionweaveprotocol::AdmissionCurrentKeyResolver,
                              public missionweaveprotocol::KeyResolver {
public:
  explicit CurrentRegistry(const missionweaveprotocol::AssetBytes registry)
      : registry_(registry.begin(), registry.end()) {}

  [[nodiscard]] missionweaveprotocol::KeyRegistrySnapshot
  resolve_current(const missionweaveprotocol::KeyResolutionRequest&) const override {
    return snapshot();
  }

  [[nodiscard]] missionweaveprotocol::KeyRegistrySnapshot
  resolve(const missionweaveprotocol::KeyResolutionRequest&) const override {
    return snapshot();
  }

private:
  [[nodiscard]] missionweaveprotocol::KeyRegistrySnapshot snapshot() const {
    return missionweaveprotocol::KeyRegistrySnapshot::organization_wide(registry_);
  }

  std::vector<std::uint8_t> registry_;
};

class FixedTrustedContext final : public missionweaveprotocol::TrustedAdmissionContext {
public:
  [[nodiscard]] missionweaveprotocol::AdmissionContextValue issue(std::string_view,
                                                                  std::string_view) const override {
    return {
        .admission_record_id = "urn:missionweaveprotocol:admission-record:website-example",
        .trusted_accepted_at = "2026-07-15T00:05:00Z",
        .accepted_by = {.type = "service", .id = std::string{service_id}},
    };
  }
};

class InMemoryAdmissionLog final : public missionweaveprotocol::AdmissionLog {
public:
  [[nodiscard]] missionweaveprotocol::AdmissionLookup lookup(std::string_view,
                                                             std::string_view) const override {
    return record_ ? missionweaveprotocol::AdmissionLookup::found(*record_)
                   : missionweaveprotocol::AdmissionLookup::authoritative_absence();
  }

  [[nodiscard]] missionweaveprotocol::AuthenticatedAdmissionRecord
  append_or_return_existing(std::string_view, std::string_view,
                            const missionweaveprotocol::AssetBytes candidate_bytes) const override {
    if (record_) {
      return *record_;
    }

    record_.emplace(
        std::vector<std::uint8_t>{candidate_bytes.begin(), candidate_bytes.end()},
        missionweaveprotocol::Principal{.type = "service", .id = std::string{service_id}});
    append_count_ += 1;
    return *record_;
  }

  [[nodiscard]] std::size_t append_count() const noexcept { return append_count_; }

private:
  mutable std::optional<missionweaveprotocol::AuthenticatedAdmissionRecord> record_;
  mutable std::size_t append_count_ = 0;
};

} // namespace

int main() {
  const auto protocol = missionweaveprotocol::ProtocolBundle::verify();
  const auto cryptography = missionweaveprotocol::ProtocolBundle::verify_cryptography();
  const auto admission = missionweaveprotocol::ProtocolBundle::verify_admission();
  if (protocol.schema_files != 22 || cryptography.evaluation_count != 62 ||
      admission.evaluation_count != 30) {
    throw std::runtime_error("embedded bundle identity is inconsistent");
  }

  const auto document = missionweaveprotocol::ProtocolBundle::cryptography(
      "vectors/signed-documents/valid/command.json");
  const auto registry =
      missionweaveprotocol::ProtocolBundle::cryptography("keys/registry-valid.json");
  if (!document || !registry) {
    throw std::runtime_error("packaged Command or Registry is missing");
  }

  const CurrentRegistry current_registry{*registry};
  const InMemoryAdmissionLog admission_log;
  const FixedTrustedContext trusted_context;
  const missionweaveprotocol::AdmissionService service;

  const auto first =
      service.admit_first(missionweaveprotocol::SignedDocumentKind::command, *document,
                          current_registry, admission_log, trusted_context);
  const auto historical =
      service.verify_historical_admission(missionweaveprotocol::SignedDocumentKind::command,
                                          *document, current_registry, admission_log);

  if (first.record().admission_record_id() != historical.record().admission_record_id()) {
    throw std::runtime_error("historical replay returned a different record ID");
  }
  if (first.verified().signing_hash() != historical.verified().signing_hash()) {
    throw std::runtime_error("historical replay returned a different signing hash");
  }
  if (!std::ranges::equal(first.record_bytes(), historical.record_bytes())) {
    throw std::runtime_error("historical replay returned different record bytes");
  }
  if (!(admission_log.append_count() == 1)) {
    throw std::runtime_error("Admission Log did not append exactly once");
  }

  std::cout << "first admission: " << first.record().admission_record_id() << '\n';
  std::cout << "historical replay: " << historical.record().admission_record_id() << '\n';
}
