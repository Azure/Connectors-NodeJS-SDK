# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0-preview] - 2026-05-21

### Changed (BREAKING)

- Renamed every `ConnectorNames` key to its display-name PascalCase form
  (string values unchanged): `Arm` → `AzureResourceManager`, `Azureblob` →
  `AzureBlobStorage`, `Azuremonitorlogs` → `AzureMonitorLogs`, `Kusto` →
  `AzureDataExplorer`, `Mq` → `MQ`, `Msgraphgroupsanduser` →
  `MSGraphGroupsAndUsers`, `Office365` → `Office365Outlook`,
  `Office365users` → `Office365Users`, `Onedriveforbusiness` →
  `OneDriveForBusiness`, `Sharepointonline` → `SharePoint`, `Smtp` →
  `SMTP`, `Teams` → `MicrosoftTeams`.
- Renamed exported generated types: `EmailV3` → `Email`, `AttachmentV2` →
  `Attachment` (Smtp); `ClientSendHtmlMessage` → `SendEmailInput`,
  `ClientDraftHtmlMessage` → `DraftEmailInput` (Office365);
  `GraphUserUpdateableV1` → `GraphUserUpdateable` (Office365users); and
  similar simplifications across other clients.
- `CreateBlockBlobInput`, `CreateFileInput`, and `UpdateFileInput` are now
  `string` aliases (previously empty object types).

### Added

- `ManagedIdentityTokenProvider` test suite covering both constructor
  variants, scope validation, null-token handling, and the success path.
- `ConnectorHttpClient` retry/backoff/abort test coverage: transient
  retry, retry exhaustion, exponential backoff, no-retry on `TypeError` /
  `SyntaxError`, pre-aborted signal, and mid-flight abort.

### Changed

- Regenerated all 12 connector extensions in `src/generated/` from the
  latest AzureUX-BPM swagger via `LogicAppsCompiler.exe`.

## [0.1.2-preview] - 2026-05-15

### Added

- Azure Resource Manager (ARM) connector client
- Azure Blob Storage connector client
- Azure Monitor Logs connector client
- IBM MQ connector client
- Microsoft Graph Groups & Users connector client
- Office 365 Users connector client
- OneDrive for Business connector client
- SMTP connector client
- Comprehensive test suites for all 12 connector clients (188 tests across 19 suites)
- Samples for all 12 connectors in 4 module formats (ESM TypeScript, ESM JavaScript, CJS TypeScript, CJS JavaScript)

### Changed

- Regenerated existing connector clients (Kusto, Office 365, SharePoint Online, Teams) from latest CodefulSdkGenerator output
- Updated connector registry (`ConnectorNames`, `ManagedConnectors`) to include all 12 connectors
- Updated README with full connector table and sample directory listing

## [0.1.1-preview] - 2026-05-07

### Changed

- Migrated package to dual ESM/CJS format with separate entry points
- Updated package exports for `@azure/connectors` and `@azure/connectors/generated/*` subpath imports
- Bumped devDependencies (npm-minor-patch group)
- Updated README and CI workflow

## [0.1.0-preview] - 2026-05-04

### Added

- Initial SDK release with core abstractions (`ConnectorClientBase`, `ConnectorClientOptions`, `ConnectorHttpClient`)
- Token providers: `ManagedIdentityTokenProvider` for Azure Managed Identity authentication
- HTTP pipeline with configurable retry policies, exponential backoff, and per-request timeouts
- `ConnectorException` for structured error handling with status codes and response bodies
- Azure Data Explorer (Kusto) connector client (generated)
- Office 365 connector client (generated)
- SharePoint Online connector client (generated)
- Teams connector client (generated)
- Connector registry (`ConnectorNames`, `ManagedConnectors`) for programmatic connector discovery
- Sample usage scripts for Office 365, SharePoint, and Teams connectors
