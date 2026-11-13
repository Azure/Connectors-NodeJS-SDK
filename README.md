[![CI](https://github.com/Azure/Connectors-NodeJS-SDK/actions/workflows/ci.yml/badge.svg)](https://github.com/Azure/Connectors-NodeJS-SDK/actions/runs/25761945479)
[![npm version](https://badge.fury.io/js/%40azure%2Fconnectors.svg)](https://badge.fury.io/js/%40azure%2Fconnectors)
[![Node.js versions](https://img.shields.io/node/v/@azure/connectors.svg)](https://www.npmjs.com/package/@azure/connectors)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# Azure Connectors Node.js SDK

Type-safe TypeScript/JavaScript clients for [Azure connectors](https://learn.microsoft.com/connectors/connector-reference/) — call Office 365, SharePoint, Teams, Azure Resource Manager, Azure Blob Storage, and 1,000+ connectors directly from Azure Functions and other Node.js apps.

> [!CAUTION]
> **Early Preview — Not for Production Use**
>
> This SDK is currently in early preview and is under active development. It is intended for evaluation, experimentation, and feedback purposes only.
>
> - **Do not use this SDK in production environments.**
> - **Breaking changes should be expected** across APIs, data models, and behavior in future releases.
> - Features may be added, modified, or removed without prior notice.
>
> We welcome feedback and contributions — please [open an issue](https://github.com/Azure/connectors-nodejs-sdk/issues) with questions, suggestions, or bug reports.

## Why This SDK?

Azure provides a rich ecosystem of [managed connectors](https://learn.microsoft.com/connectors/connector-reference/) that bridge your code to SaaS services, PaaS resources, and on-premises systems. Originally powering Azure Logic Apps and Power Automate, these connectors are now available as **standalone, strongly-typed TypeScript/JavaScript clients** for any Node.js application — no workflow service required.

- **Fully typed** — Generated async methods with TypeScript interfaces and JSDoc for full IntelliSense
- **ESM and CommonJS** — Dual-format package with separate entry points for both module systems
- **Standard authentication** — Azure `TokenCredential` support via `@azure/core-auth` and `@azure/identity`
- **Resilient HTTP** — Azure Core pipeline with configurable retries, timeouts, tracing, and request correlation
- **Lazy pagination** — Paginated list operations follow validated `nextLink` URLs as you iterate
- **1,000+ connectors** — Any Azure managed connector available via API Hub can be generated

> **Note:** This is the Node.js SDK. A [Python SDK](https://github.com/Azure/Connectors-Python-SDK) and [.NET SDK](https://github.com/Azure/Connectors-NET-SDK) are also available.

## Preview migration notes

This refresh uses canonical client, trigger and extension-module names. For example,
import `OneDriveClient` from `@azure/connectors/generated/OneDriveExtensions`, not
`OnedriveExtensions`. The same prefix rule covers `DataFlowsSms`, `UniversalPrint`
and `VisualStudioTeamServices`; raw connector API IDs do not change. The connector
constant is `ConnectorNames.DataFlowsSms`.

For the complete module, public symbol, constant-key, and instance-method rename
map, see the [preview naming migration guide](docs/naming-migration.md).
Teams callers should import `AIInsightResponse` / `AIInsightCollectionResponse`
(instead of `AiInsightResponse` / `AiInsightCollectionResponse`); only the
TypeScript type and method names change (`listAIInsights` and `getAIInsight`);
raw operation IDs, routes, and wire fields stay unchanged.

File operations whose body schema is binary accept `Blob`. Use a media type when
known, such as `new Blob([bytes], { type: "application/pdf" })`; without one the
runtime sends `application/octet-stream`. Do not JSON-encode the file bytes.

## Documentation

The [API documentation](https://azure.github.io/Connectors-NodeJS-SDK/) covers
SDK infrastructure and every generated connector's clients, models, operation
options, and trigger metadata. It is built from `main`, so it may differ from
the npm release. For local builds and the one-time GitHub Pages setup, see
[publishing documentation](docs/publishing.md).

## How It Works

```text
┌─────────────────────────────────────┐
│  Your Azure Function / Node.js App  │
│                                     │
│  const client = new Office365Client │
│  await client.sendEmail(...)   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Generated Connector Clients       │
│   (Office365, Teams, etc.)          │
│                                     │
│  • Typed async methods per action   │
│  • Interface models from Swagger    │
│  • JSDoc from connector metadata    │
└──────────────┬──────────────────────┘
               │ depends on
               ▼
┌─────────────────────────────────────┐
│   Azure Connectors Node.js SDK      │
│   @azure/connectors                 │
│                                     │
│  • Standard TokenCredential         │
│  • ConnectorHttpClient pipeline     │
│  • ConnectorClientBase              │
└─────────────────────────────────────┘
```

## Installation

Install from npm:

```bash
npm install @azure/connectors
```

## Quick Start

### TypeScript — Send an email with Office 365

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { ConnectorError } from "@azure/connectors";
import { Office365Client, SendEmailInput } from "@azure/connectors/generated/Office365Extensions";

async function sendEmailExample(): Promise<void> {
    // Connection runtime URL from Azure Portal
    const connectionUrl = "https://example.azure.com/connections/office365";

    // Use managed identity for authentication
    const credential = new ManagedIdentityCredential();

    // Create client and send email
    const client = new Office365Client(connectionUrl, credential);

    const email: SendEmailInput = {
        To: "recipient@example.com",
        Subject: "Hello from Node.js SDK",
        Body: "<p>This email was sent using the Azure Connectors Node.js SDK!</p>",
    };

    await client.sendEmail(email);
    console.log("Email sent successfully!");
}

sendEmailExample().catch(console.error);
```

### JavaScript (ESM) — Send an email with Office 365

```javascript
import { ManagedIdentityCredential } from "@azure/identity";
import { ConnectorError } from "@azure/connectors";
import { Office365Client } from "@azure/connectors/generated/Office365Extensions";

async function sendEmailExample() {
    const connectionUrl = "https://example.azure.com/connections/office365";
    const credential = new ManagedIdentityCredential();
    const client = new Office365Client(connectionUrl, credential);

    await client.sendEmail({
        To: "recipient@example.com",
        Subject: "Hello from Node.js SDK",
        Body: "<p>This email was sent using the Azure Connectors Node.js SDK!</p>",
    });

    console.log("Email sent successfully!");
}

sendEmailExample().catch(console.error);
```

### TypeScript — List SharePoint items

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { SharePointOnlineClient } from "@azure/connectors/generated/SharePointOnlineExtensions";

async function listSharePointItems(): Promise<void> {
    const connectionUrl = "https://example.azure.com/connections/sharepointonline";
    const credential = new ManagedIdentityCredential();
    const client = new SharePointOnlineClient(connectionUrl, credential);

    for await (const item of client.getItems(
        "https://contoso.sharepoint.com/sites/MySite",
        "MyList",
    )) {
        console.log(`Item: ${item.Title}`);
    }
}

listSharePointItems().catch(console.error);
```

### JavaScript (ESM) — List SharePoint items

```javascript
import { ManagedIdentityCredential } from "@azure/identity";
import { SharePointOnlineClient } from "@azure/connectors/generated/SharePointOnlineExtensions";

async function listSharePointItems() {
    const connectionUrl = "https://example.azure.com/connections/sharepointonline";
    const credential = new ManagedIdentityCredential();
    const client = new SharePointOnlineClient(connectionUrl, credential);

    for await (const item of client.getItems(
        "https://contoso.sharepoint.com/sites/MySite",
        "MyList",
    )) {
        console.log(`Item: ${item.Title}`);
    }
}

listSharePointItems().catch(console.error);
```

### TypeScript — Iterate paginated results

Paginated list operations return a lazy `PagedAsyncIterableIterator`. Requests are made only as items or pages are consumed, and continuation links are routed through the connector connection URL.

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { ArmClient } from "@azure/connectors/generated/ArmExtensions";

const connectionUrl = "https://example.azure.com/connections/arm";
const client = new ArmClient(connectionUrl, new ManagedIdentityCredential());

for await (const subscription of client.listSubscriptions()) {
    console.log(subscription.displayName);
}

for await (const page of client.listSubscriptions().byPage()) {
    console.log(`Received ${page.length} subscriptions`);
}
```

### TypeScript — Inspect complete responses

Every generated operation accepts an `onResponse` callback through its options. The
callback exposes the complete status, headers, and raw body while the method keeps its
typed return value. HTTP failures also provide the resulting `ConnectorError` as the
third callback argument.

```typescript
const subscription = await client.getSubscription(
    "subscription-id",
    "2016-06-01",
    {
        onResponse: (rawResponse, parsedResponse, error) => {
            console.log(rawResponse.status);
            console.log(rawResponse.headers.toJSON());
            console.log(rawResponse.bodyAsText);
        },
    },
);
```

### TypeScript — Post a Teams message

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { TeamsClient } from "@azure/connectors/generated/TeamsExtensions";

async function postTeamsMessage(): Promise<void> {
    const connectionUrl = "https://example.azure.com/connections/teams";
    const credential = new ManagedIdentityCredential();
    const client = new TeamsClient(connectionUrl, credential);

    await client.postMessageToConversation(
        "team-group-id",
        "19:channel-id",
        {
            body: {
                content: "Hello from Node.js!",
                contentType: "text",
            },
        },
    );

    console.log("Message posted to Teams!");
}

postTeamsMessage().catch(console.error);
```

### JavaScript (ESM) — Post a Teams message

```javascript
import { ManagedIdentityCredential } from "@azure/identity";
import { TeamsClient } from "@azure/connectors/generated/TeamsExtensions";

async function postTeamsMessage() {
    const connectionUrl = "https://example.azure.com/connections/teams";
    const credential = new ManagedIdentityCredential();
    const client = new TeamsClient(connectionUrl, credential);

    await client.postMessageToConversation("team-group-id", "19:channel-id", {
        body: {
            content: "Hello from Node.js!",
            contentType: "text",
        },
    });

    console.log("Message posted to Teams!");
}

postTeamsMessage().catch(console.error);
```

### Multipart file uploads

Generated multipart operations accept `File` values when the filename matters,
or `Blob` values for default file metadata. The runtime escapes quotes in part
headers without percent-encoding the whole filename, and sends the structured
parts through the normal authenticated Azure Core pipeline.

```typescript
import { DocuWareClient } from "@azure/connectors/generated/DocuWareExtensions";

const client = new DocuWareClient(connectionRuntimeUrl, credential);

await client.storeToFileCabinet(
    {
        file: new File([fileBytes], 'my "invoice".docx', {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
    },
    "cabinet",
    "dialog",
);
```

Filename regressions use generated DocuWare public clients and native multipart
parsing in both CJS and ESM builds. They do not create live DocuWare documents.

## Validated Connectors

The following connectors have been generated and validated with comprehensive test coverage:

| Connector | Import Path | Status | Tests |
|-----------|-------------|--------|-------|
| **Azure Resource Manager** | `@azure/connectors/generated/ArmExtensions` | ✅ Complete | 16 tests |
| **Azure Blob Storage** | `@azure/connectors/generated/AzureBlobExtensions` | ✅ Complete | 13 tests |
| **Azure Monitor Logs** | `@azure/connectors/generated/AzureMonitorLogsExtensions` | ✅ Complete | 10 tests |
| **Azure Data Explorer** | `@azure/connectors/generated/KustoExtensions` | ✅ Complete | 17 tests |
| **IBM MQ** | `@azure/connectors/generated/MQExtensions` | ✅ Complete | 13 tests |
| **MS Graph Groups & Users** | `@azure/connectors/generated/MSGraphGroupsAndUsersExtensions` | ✅ Complete | 13 tests |
| **Office 365 Outlook** | `@azure/connectors/generated/Office365Extensions` | ✅ Complete | 14 tests |
| **Office 365 Users** | `@azure/connectors/generated/Office365UsersExtensions` | ✅ Complete | 14 tests |
| **OneDrive for Business** | `@azure/connectors/generated/OneDriveForBusinessExtensions` | ✅ Complete | 15 tests |
| **SharePoint Online** | `@azure/connectors/generated/SharePointOnlineExtensions` | ✅ Complete | 12 tests |
| **SMTP** | `@azure/connectors/generated/SmtpExtensions` | ✅ Complete | 9 tests |
| **Microsoft Teams** | `@azure/connectors/generated/TeamsExtensions` | ✅ Complete | 14 tests |
| **Docusign** | `@azure/connectors/generated/DocusignExtensions` | ✅ Complete | 6 tests |
| **GitHub** | `@azure/connectors/generated/GitHubExtensions` | ✅ Complete | 6 tests |
| **Jira** | `@azure/connectors/generated/JiraExtensions` | ✅ Complete | 6 tests |
| **Microsoft Forms** | `@azure/connectors/generated/MicrosoftFormsExtensions` | ✅ Complete | 6 tests |
| **Power BI** | `@azure/connectors/generated/PowerBIExtensions` | ✅ Complete | 6 tests |
| **Salesforce** | `@azure/connectors/generated/SalesforceExtensions` | ✅ Complete | 6 tests |
| **Shifts for Microsoft Teams** | `@azure/connectors/generated/ShiftsExtensions` | ✅ Complete | 6 tests |
| **Slack** | `@azure/connectors/generated/SlackExtensions` | ✅ Complete | 7 tests |
| **Microsoft To Do Business** | `@azure/connectors/generated/TodoExtensions` | ✅ Complete | 6 tests |
| **Box** | `@azure/connectors/generated/BoxExtensions` | ✅ Complete | 8 tests |
| **Dropbox** | `@azure/connectors/generated/DropboxExtensions` | ✅ Complete | 8 tests |
| **Excel Online** | `@azure/connectors/generated/ExcelOnlineExtensions` | ✅ Complete | 9 tests |
| **FTP** | `@azure/connectors/generated/FtpExtensions` | ✅ Complete | 8 tests |
| **Google Calendar** | `@azure/connectors/generated/GoogleCalendarExtensions` | ✅ Complete | 8 tests |
| **Google Drive** | `@azure/connectors/generated/GoogleDriveExtensions` | ✅ Complete | 8 tests |
| **Google Tasks** | `@azure/connectors/generated/GoogleTasksExtensions` | ✅ Complete | 8 tests |
| **Office 365 Groups Mail** | `@azure/connectors/generated/Office365GroupsMailExtensions` | ✅ Complete | 9 tests |
| **RSS** | `@azure/connectors/generated/RssExtensions` | ✅ Complete | 8 tests |
| **Azure Event Grid** | `@azure/connectors/generated/AzureEventGridExtensions` | ✅ Complete | 5 tests |
| **Azure IoT Central** | `@azure/connectors/generated/AzureIoTCentralExtensions` | ✅ Complete | 7 tests |
| **Cloudmersive Document Conversion** | `@azure/connectors/generated/CloudmersiveConvertExtensions` | ✅ Complete | 7 tests |
| **Fin & Ops Apps (Dynamics 365)** | `@azure/connectors/generated/DynamicsAXExtensions` | ✅ Complete | 7 tests |
| **PDF.co** | `@azure/connectors/generated/PdfCoExtensions` | ✅ Complete | 7 tests |
| **Plumsail Documents** | `@azure/connectors/generated/PlumsailExtensions` | ✅ Complete | 7 tests |
| **SQL Server** | `@azure/connectors/generated/SqlExtensions` | ✅ Complete | 7 tests |
| **Zendesk** | `@azure/connectors/generated/ZendeskExtensions` | ✅ Complete | 7 tests |
| **Pipedrive** | `@azure/connectors/generated/PipedriveExtensions` | ✅ Complete | 7 tests |
| **DocuWare** | `@azure/connectors/generated/DocuWareExtensions` | ✅ Complete | 7 tests |
| **SigningHub** | `@azure/connectors/generated/SigningHubExtensions` | ✅ Complete | 7 tests |
| **Campfire** | `@azure/connectors/generated/CampfireExtensions` | ✅ Complete | 7 tests |
| **ClickSend SMS** | `@azure/connectors/generated/ClickSendSmsExtensions` | ✅ Complete | 17 tests |
| **Freshservice** | `@azure/connectors/generated/FreshserviceExtensions` | ✅ Complete | 7 tests |
| **Infusionsoft** | `@azure/connectors/generated/InfusionsoftExtensions` | ✅ Complete | 7 tests |
| **Insightly** | `@azure/connectors/generated/InsightlyExtensions` | ✅ Complete | 7 tests |
| **Mailchimp** | `@azure/connectors/generated/MailchimpExtensions` | ✅ Complete | 7 tests |
| **Monday** | `@azure/connectors/generated/MondayExtensions` | ✅ Complete | 7 tests |
| **Projectplace** | `@azure/connectors/generated/ProjectplaceExtensions` | ✅ Complete | 7 tests |
| **SendGrid** | `@azure/connectors/generated/SendGridExtensions` | ✅ Complete | 7 tests |
| **Text Request** | `@azure/connectors/generated/TextRequestExtensions` | ✅ Complete | 7 tests |
| **Webex** | `@azure/connectors/generated/WebexExtensions` | ✅ Complete | 7 tests |

## Generated Phase 5-7 Connectors

The following clients have generated SDK coverage and compile-checked ESM/CJS
samples, but have not been validated end to end against live connector services.

| Connector | Import Path | Validation |
|-----------|-------------|------------|
| **Twitter (X)** | `@azure/connectors/generated/TwitterExtensions` | Mocked SDK tests |
| **WordPress** | `@azure/connectors/generated/WordPressExtensions` | Mocked SDK tests |
| **Plivo** | `@azure/connectors/generated/PlivoExtensions` | Mocked SDK tests |
| **Rev.ai** | `@azure/connectors/generated/RevAIExtensions` | Mocked SDK tests |
| **Starmind** | `@azure/connectors/generated/StarmindExtensions` | Mocked SDK tests |
| **Tallyfy** | `@azure/connectors/generated/TallyfyExtensions` | Mocked SDK tests |
| **Eventbrite** | `@azure/connectors/generated/EventbriteExtensions` | Mocked SDK tests |
| **Formstack Forms** | `@azure/connectors/generated/FormstackFormsExtensions` | Mocked SDK tests |
| **Typeform** | `@azure/connectors/generated/TypeformExtensions` | Mocked SDK tests |
| **Ticketmaster** | `@azure/connectors/generated/TicketmasterExtensions` | Mocked SDK tests |
| **Zoho Sign** | `@azure/connectors/generated/ZohoSignExtensions` | Mocked SDK tests |
| **Seismic Planner** | `@azure/connectors/generated/SeismicPlannerExtensions` | Mocked SDK tests |
| **Way We Do** | `@azure/connectors/generated/WayWeDoExtensions` | Mocked SDK tests |
| **Meeting Room Map** | `@azure/connectors/generated/MeetingRoomMapExtensions` | Mocked SDK tests |
| **StarRez REST V1** | `@azure/connectors/generated/StarRezRestV1Extensions` | Mocked SDK tests |
| **Replicon** | `@azure/connectors/generated/RepliconExtensions` | Mocked SDK tests |
| **Etsy** | `@azure/connectors/generated/EtsyExtensions` | Mocked SDK tests |
| **Elfsquad Data** | `@azure/connectors/generated/ElfsquadDataExtensions` | Mocked SDK tests |
| **Impexium** | `@azure/connectors/generated/ImpexiumExtensions` | Mocked SDK tests |
| **Jedox OData Hub** | `@azure/connectors/generated/JedoxODataHubExtensions` | Mocked SDK tests |
| **Orderful** | `@azure/connectors/generated/OrderfulExtensions` | Mocked SDK tests; retired connector fixture |
| **Zoho ZeptoMail** | `@azure/connectors/generated/ZeptoMailExtensions` | Mocked SDK tests |

## Additional Generated Connectors

These 24 clients were generated from live West US definitions and have mocked
request, response, error, and export tests. They have not been validated end to
end against live connector connections.

| Connector | Connector API ID | Import Path |
|-----------|------------------|-------------|
| Azure AD (Microsoft Entra ID) | `azuread` | `@azure/connectors/generated/AzureADExtensions` |
| Azure Automation | `azureautomation` | `@azure/connectors/generated/AzureAutomationExtensions` |
| Azure Cosmos DB | `documentdb` | `@azure/connectors/generated/DocumentDBExtensions` |
| Azure Data Factory | `azuredatafactory` | `@azure/connectors/generated/AzureDataFactoryExtensions` |
| Azure DevOps (VSTS) | `visualstudioteamservices` | `@azure/connectors/generated/VisualStudioTeamServicesExtensions` |
| Azure Digital Twins | `azuredigitaltwins` | `@azure/connectors/generated/AzureDigitalTwinsExtensions` |
| Azure Event Hubs | `eventhubs` | `@azure/connectors/generated/EventHubsExtensions` |
| Azure Key Vault | `keyvault` | `@azure/connectors/generated/KeyVaultExtensions` |
| Azure Queues | `azurequeues` | `@azure/connectors/generated/AzureQueuesExtensions` |
| Azure Tables | `azuretables` | `@azure/connectors/generated/AzureTablesExtensions` |
| Azure VM | `azurevm` | `@azure/connectors/generated/AzureVMExtensions` |
| CloudConvert | `cloudconvert` | `@azure/connectors/generated/CloudConvertExtensions` |
| Dataflows | `dataflows` | `@azure/connectors/generated/DataflowsExtensions` |
| DataFlows SMS | `dataflowssms` | `@azure/connectors/generated/DataFlowsSmsExtensions` |
| Excel Online (Business) | `excelonlinebusiness` | `@azure/connectors/generated/ExcelOnlineBusinessExtensions` |
| Microsoft Bookings | `microsoftbookings` | `@azure/connectors/generated/MicrosoftBookingsExtensions` |
| Microsoft Defender ATP | `wdatp` | `@azure/connectors/generated/WdatpExtensions` |
| Office 365 Groups | `office365groups` | `@azure/connectors/generated/Office365GroupsExtensions` |
| OneDrive Personal | `onedrive` | `@azure/connectors/generated/OneDriveExtensions` |
| OneNote | `onenote` | `@azure/connectors/generated/OneNoteExtensions` |
| Outlook.com | `outlook` | `@azure/connectors/generated/OutlookExtensions` |
| Planner | `planner` | `@azure/connectors/generated/PlannerExtensions` |
| Service Bus | `servicebus` | `@azure/connectors/generated/ServiceBusExtensions` |
| ServiceNow | `service-now` | `@azure/connectors/generated/ServiceNowExtensions` |
| Trello | `trello` | `@azure/connectors/generated/TrelloExtensions` |
| Word Online (Business) | `wordonlinebusiness` | `@azure/connectors/generated/WordOnlineBusinessExtensions` |
| Universal Print | `universalprint` | `@azure/connectors/generated/UniversalPrintExtensions` |
| Yammer | `yammer` | `@azure/connectors/generated/YammerExtensions` |

OneDrive Personal (`onedrive`) and Universal Print (`universalprint`) are now
available from live metadata in West US and included in the generated catalog.
The prior October 27 unavailability is historical; see [#117](https://github.com/Azure/Connectors-NodeJS-SDK/issues/117).

**Connector coverage:** 103 generated clients. See [GENERATION.md](GENERATION.md)
for live generation and independent validation provenance.

**Test coverage:** 1,694 tests across 74 test suites.

## Authentication

Generated clients accept any `TokenCredential` from `@azure/core-auth`, so
credentials from `@azure/identity` can be passed directly. The existing
`ManagedIdentityTokenProvider` and `ConnectionStringTokenProvider` classes
remain available as compatibility credentials.

### Managed Identity (Recommended for Azure)

```typescript
import { ManagedIdentityCredential } from "@azure/identity";

// System-assigned managed identity
const credential = new ManagedIdentityCredential();

// User-assigned managed identity
const credential = new ManagedIdentityCredential("your-client-id");
```

```javascript
import { ManagedIdentityCredential } from "@azure/identity";

// System-assigned managed identity
const credential = new ManagedIdentityCredential();

// User-assigned managed identity
const credential = new ManagedIdentityCredential("your-client-id");
```

### Connection String / API Key

```typescript
import { ConnectionStringTokenProvider } from "@azure/connectors";

const credential = new ConnectionStringTokenProvider("your-api-key");
```

```javascript
import { ConnectionStringTokenProvider } from "@azure/connectors";

const credential = new ConnectionStringTokenProvider("your-api-key");
```

## Configuration Options

Customize client behavior with `ConnectorClientOptions`:

```typescript
import { ConnectorClientOptions } from "@azure/connectors";
import { Office365Client } from "@azure/connectors/generated/Office365Extensions";

const options: ConnectorClientOptions = {
    retryOptions: {
        maxRetries: 4,
        retryDelayInMs: 1000,
        maxRetryDelayInMs: 60000,
    },
    telemetryOptions: {
        clientRequestIdHeaderName: "x-custom-request-id",
    },
    applicationId: "contoso-app/1.0.0",
};

const client = new Office365Client(connectionUrl, credential, options);
```

```javascript
import { Office365Client } from "@azure/connectors/generated/Office365Extensions";

const client = new Office365Client(connectionUrl, credential, {
    retryOptions: {
        maxRetries: 4,
        retryDelayInMs: 1000,
        maxRetryDelayInMs: 60000,
    },
    applicationId: "contoso-app/1.0.0",
});
```

Connector requests include the Azure SDK identifier
`azsdk-js-connectors/<version>` and Azure Core's runtime/platform information by
default. Set `applicationId` to an optional application identifier of at most
24 characters with no whitespace (for example, `contoso-app/1.0.0`). Invalid
values throw during client construction; they are never silently truncated.
The application ID is prepended to, not substituted for, the connector SDK identity.

For wrapping SDK chains, `userAgentOptions.userAgentPrefix` remains a generic
prefix with no application-ID length limit. When both are set, the order is
application ID, custom prefix, connector SDK identity, then Azure Core/platform
information. The 24-character limit applies only to `applicationId`, not the
custom prefix or the complete header.

To opt out of automatic SDK-identification telemetry, pass
`{ telemetryEnabled: false }` in the client options. Configuration is resolved
once when the client is constructed, in this order:

1. An explicit `telemetryEnabled` value wins, including `true` to override an
    environment opt-out.
2. Otherwise, `AZURE_TELEMETRY_DISABLED=true` (case-insensitive) or `1` disables
    identification. Surrounding whitespace is ignored; other values do not disable it.
3. With neither configured, identification stays enabled.

Opting out prevents the SDK from adding identification headers, including its
application ID, custom prefix, and Core/platform information. Caller-supplied
`User-Agent` or `x-ms-useragent` request headers are preserved. Authentication,
retries, request correlation (`telemetryOptions.clientRequestIdHeaderName`), and
independently configured tracing and logging remain enabled according to their
own settings. This option does not configure telemetry in a separately supplied
credential or custom HTTP transport.

For testing or a custom host transport, set `httpClient` to an implementation
of `HttpClient` from `@azure/core-rest-pipeline`. Authentication, retries,
request correlation, tracing, and logging remain pipeline policies.

## Logging

Connector requests, responses, retries, and terminal errors use the standard
`azure:connectors` logger. Logging is disabled by default; enable it with an
Azure SDK log level:

```powershell
$env:AZURE_LOG_LEVEL = "info"
```

Request URLs are logged without query strings so credentials and signed query
parameters are not written to diagnostics.

## Error Handling

All connector errors are thrown as `ConnectorError` with structured details:

```typescript
import { ConnectorError } from "@azure/connectors";

try {
    await client.sendEmail(email);
} catch (error) {
    if (error instanceof ConnectorError) {
        console.error(`Operation: '${error.message}'.`);
        console.error(`Status code: '${error.statusCode}'.`);
        console.error(`Response: '${error.responseBody}'.`);
    } else {
        throw error;
    }
}
```

```javascript
import { ConnectorError } from "@azure/connectors";

try {
    await client.sendEmail(email);
} catch (error) {
    if (error instanceof ConnectorError) {
        console.error(`Operation: '${error.message}'.`);
        console.error(`Status code: '${error.statusCode}'.`);
        console.error(`Response: '${error.responseBody}'.`);
    } else {
        throw error;
    }
}
```

## Project Structure

```text
@azure/connectors/
├── src/azureConnectors/            # Core SDK infrastructure
│   ├── authentication.ts           # Token providers
│   ├── clientBase.ts               # Base connector client
│   ├── connectorHttpClient.ts      # Azure Core HTTP pipeline
│   ├── options.ts                  # Configuration options
│   ├── connectorError.ts            # Connector error type
│   └── triggerPayload.ts           # Trigger callback types
├── src/generated/                  # Auto-generated connector clients
│   ├── ArmExtensions.ts           # Azure Resource Manager client
│   ├── AzureBlobExtensions.ts     # Azure Blob Storage client
│   ├── AzureMonitorLogsExtensions.ts # Azure Monitor Logs client
│   ├── BoxExtensions.ts           # Box client
│   ├── DocusignExtensions.ts      # Docusign client
│   ├── DropboxExtensions.ts       # Dropbox client
│   ├── ExcelOnlineExtensions.ts   # Excel Online client
│   ├── FtpExtensions.ts           # FTP client
│   ├── GitHubExtensions.ts        # GitHub client
│   ├── GoogleCalendarExtensions.ts # Google Calendar client
│   ├── GoogleDriveExtensions.ts   # Google Drive client
│   ├── GoogleTasksExtensions.ts   # Google Tasks client
│   ├── JiraExtensions.ts          # Jira client
│   ├── KustoExtensions.ts         # Azure Data Explorer client
│   ├── MicrosoftFormsExtensions.ts # Microsoft Forms client
│   ├── MQExtensions.ts            # IBM MQ client
│   ├── MSGraphGroupsAndUsersExtensions.ts # MS Graph Groups & Users client
│   ├── Office365Extensions.ts     # Office 365 Outlook client
│   ├── Office365GroupsMailExtensions.ts # Office 365 Groups Mail client
│   ├── Office365UsersExtensions.ts # Office 365 Users client
│   ├── OneDriveForBusinessExtensions.ts # OneDrive for Business client
│   ├── PowerBIExtensions.ts       # Power BI client
│   ├── RssExtensions.ts           # RSS client
│   ├── SalesforceExtensions.ts    # Salesforce client
│   ├── SharePointOnlineExtensions.ts # SharePoint Online client
│   ├── ShiftsExtensions.ts        # Shifts for Microsoft Teams client
│   ├── SlackExtensions.ts         # Slack client
│   ├── SmtpExtensions.ts          # SMTP client
│   ├── TeamsExtensions.ts         # Microsoft Teams client
│   ├── TodoExtensions.ts          # Microsoft To Do Business client
│   ├── connectorNames.ts          # Connector name constants
│   ├── index.ts                   # Generated export barrel
│   └── ManagedConnectors.ts       # Connector registry
├── tests/                          # Jest test suite
├── samples/                        # Usage examples (ESM/CJS, TS/JS)
└── docs/                           # Additional documentation
```

## Samples

Complete working samples are included for both TypeScript and JavaScript in ESM and CommonJS formats:

```text
samples/
├── esm/
│   ├── typescript/         # TypeScript ESM samples
│   │   ├── arm.ts
│   │   └── ... (52 connectors)
│   └── javascript/         # JavaScript ESM samples (.mjs)
│       ├── arm.mjs
│       └── ... (52 connectors)
└── cjs/
    ├── typescript/         # TypeScript CJS samples
    │   ├── arm.ts
    │   └── ... (52 connectors)
    └── javascript/         # JavaScript CJS samples (.cjs)
        ├── arm.cjs
        └── ... (52 connectors)
```

See [docs/connection-setup.md](docs/connection-setup.md) for instructions on creating the Azure connections required to run the samples.

## Related Projects

- **[Connectors .NET SDK](https://github.com/Azure/Connectors-NET-SDK)** — .NET implementation of this SDK
- **[Azure Functions Connector Extension](https://github.com/Azure/azure-functions-connector-extension)** - An Azure Functions trigger extension for receiving webhook callbacks from Connector Namespace

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us the rights to use your contribution. For details, visit the [Microsoft CLA website](https://cla.opensource.microsoft.com).

When you submit a pull request, a CLA bot will automatically determine whether you need to provide a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions provided by the bot.

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Support

For issues and questions:

- 🐛 **Bug reports:** [File an issue](https://github.com/Azure/Connectors-NodeJS-SDK/issues)
- 📚 **Documentation:** See [docs/](docs/) folder

See [SECURITY.md](SECURITY.md) for security-related information.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
