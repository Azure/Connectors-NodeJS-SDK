# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-preview.1] - 2026-05-04

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
