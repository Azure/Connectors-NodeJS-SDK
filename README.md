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
- **Built-in authentication** — Managed identity and API key token providers via `@azure/identity`
- **Resilient HTTP** — Configurable retry policies with exponential backoff for transient failures
- **1,000+ connectors** — Any Azure managed connector available via API Hub can be generated

> **Note:** This is the Node.js SDK. A [Python SDK](https://github.com/Azure/Connectors-Python-SDK) and [.NET SDK](https://github.com/Azure/Connectors-NET-SDK) are also available.

## How It Works

```text
┌─────────────────────────────────────┐
│  Your Azure Function / Node.js App  │
│                                     │
│  const client = new Office365Client │
│  await client.sendEmailAsync(...)   │
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
│  • ManagedIdentityTokenProvider     │
│  • ConnectorHttpClient + retry      │
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
import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { Office365Client, SendEmailInput } from "@azure/connectors/generated/Office365Extensions";

async function sendEmailExample(): Promise<void> {
    // Connection runtime URL from Azure Portal
    const connectionUrl = "https://example.azure.com/connections/office365";

    // Use managed identity for authentication
    const tokenProvider = new ManagedIdentityTokenProvider();

    // Create client and send email
    const client = new Office365Client(connectionUrl, tokenProvider);

    const email: SendEmailInput = {
        To: "recipient@example.com",
        Subject: "Hello from Node.js SDK",
        Body: "<p>This email was sent using the Azure Connectors Node.js SDK!</p>",
    };

    await client.sendEmailAsync(email);
    console.log("Email sent successfully!");
}

sendEmailExample().catch(console.error);
```

### JavaScript (ESM) — Send an email with Office 365

```javascript
import { ManagedIdentityTokenProvider, ConnectorException } from "@azure/connectors";
import { Office365Client } from "@azure/connectors/generated/Office365Extensions";

async function sendEmailExample() {
    const connectionUrl = "https://example.azure.com/connections/office365";
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new Office365Client(connectionUrl, tokenProvider);

    await client.sendEmailAsync({
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
import { ManagedIdentityTokenProvider } from "@azure/connectors";
import { SharepointonlineClient, ItemsList } from "@azure/connectors/generated/SharepointonlineExtensions";

async function listSharePointItems(): Promise<void> {
    const connectionUrl = "https://example.azure.com/connections/sharepointonline";
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new SharepointonlineClient(connectionUrl, tokenProvider);

    const items: ItemsList = await client.getItemsAsync(
        "https://contoso.sharepoint.com/sites/MySite",
        "MyList",
    );

    for (const item of (items.value ?? []) as Array<Record<string, unknown>>) {
        console.log(`Item: ${item.Title}`);
    }
}

listSharePointItems().catch(console.error);
```

### JavaScript (ESM) — List SharePoint items

```javascript
import { ManagedIdentityTokenProvider } from "@azure/connectors";
import { SharepointonlineClient } from "@azure/connectors/generated/SharepointonlineExtensions";

async function listSharePointItems() {
    const connectionUrl = "https://example.azure.com/connections/sharepointonline";
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new SharepointonlineClient(connectionUrl, tokenProvider);

    const items = await client.getItemsAsync(
        "https://contoso.sharepoint.com/sites/MySite",
        "MyList",
    );

    for (const item of items.value ?? []) {
        console.log(`Item: ${item.Title}`);
    }
}

listSharePointItems().catch(console.error);
```

### TypeScript — Post a Teams message

```typescript
import { ManagedIdentityTokenProvider } from "@azure/connectors";
import { TeamsClient } from "@azure/connectors/generated/TeamsExtensions";

async function postTeamsMessage(): Promise<void> {
    const connectionUrl = "https://example.azure.com/connections/teams";
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new TeamsClient(connectionUrl, tokenProvider);

    await client.postMessageToConversationAsync(
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
import { ManagedIdentityTokenProvider } from "@azure/connectors";
import { TeamsClient } from "@azure/connectors/generated/TeamsExtensions";

async function postTeamsMessage() {
    const connectionUrl = "https://example.azure.com/connections/teams";
    const tokenProvider = new ManagedIdentityTokenProvider();
    const client = new TeamsClient(connectionUrl, tokenProvider);

    await client.postMessageToConversationAsync("team-group-id", "19:channel-id", {
        body: {
            content: "Hello from Node.js!",
            contentType: "text",
        },
    });

    console.log("Message posted to Teams!");
}

postTeamsMessage().catch(console.error);
```

## Validated Connectors

The following connectors have been generated and validated with comprehensive test coverage:

| Connector | Import Path | Status | Tests |
|-----------|-------------|--------|-------|
| **Azure Resource Manager** | `@azure/connectors/generated/ArmExtensions` | ✅ Complete | 16 tests |
| **Azure Blob Storage** | `@azure/connectors/generated/AzureblobExtensions` | ✅ Complete | 13 tests |
| **Azure Monitor Logs** | `@azure/connectors/generated/AzuremonitorlogsExtensions` | ✅ Complete | 10 tests |
| **Azure Data Explorer** | `@azure/connectors/generated/KustoExtensions` | ✅ Complete | 17 tests |
| **IBM MQ** | `@azure/connectors/generated/MqExtensions` | ✅ Complete | 13 tests |
| **MS Graph Groups & Users** | `@azure/connectors/generated/MsgraphgroupsanduserExtensions` | ✅ Complete | 13 tests |
| **Office 365 Outlook** | `@azure/connectors/generated/Office365Extensions` | ✅ Complete | 14 tests |
| **Office 365 Users** | `@azure/connectors/generated/Office365usersExtensions` | ✅ Complete | 14 tests |
| **OneDrive for Business** | `@azure/connectors/generated/OnedriveforbusinessExtensions` | ✅ Complete | 15 tests |
| **SharePoint Online** | `@azure/connectors/generated/SharepointonlineExtensions` | ✅ Complete | 12 tests |
| **SMTP** | `@azure/connectors/generated/SmtpExtensions` | ✅ Complete | 9 tests |
| **Microsoft Teams** | `@azure/connectors/generated/TeamsExtensions` | ✅ Complete | 14 tests |
| **DocuSign** | `@azure/connectors/generated/DocusignExtensions` | ✅ Complete | 6 tests |
| **GitHub** | `@azure/connectors/generated/GithubExtensions` | ✅ Complete | 6 tests |
| **Jira** | `@azure/connectors/generated/JiraExtensions` | ✅ Complete | 6 tests |
| **Microsoft Forms** | `@azure/connectors/generated/MicrosoftformsExtensions` | ✅ Complete | 6 tests |
| **Power BI** | `@azure/connectors/generated/PowerbiExtensions` | ✅ Complete | 6 tests |
| **Salesforce** | `@azure/connectors/generated/SalesforceExtensions` | ✅ Complete | 6 tests |
| **Shifts for Microsoft Teams** | `@azure/connectors/generated/ShiftsExtensions` | ✅ Complete | 6 tests |
| **Slack** | `@azure/connectors/generated/SlackExtensions` | ✅ Complete | 6 tests |
| **Microsoft To Do Business** | `@azure/connectors/generated/TodoExtensions` | ✅ Complete | 6 tests |

**Total:** 318 tests (all passing) across 29 test suites and 21 generated connectors

## Authentication

The SDK supports multiple authentication methods:

### Managed Identity (Recommended for Azure)

```typescript
import { ManagedIdentityTokenProvider } from "@azure/connectors";

// System-assigned managed identity
const tokenProvider = new ManagedIdentityTokenProvider();

// User-assigned managed identity
const tokenProvider = new ManagedIdentityTokenProvider("your-client-id");
```

```javascript
import { ManagedIdentityTokenProvider } from "@azure/connectors";

// System-assigned managed identity
const tokenProvider = new ManagedIdentityTokenProvider();

// User-assigned managed identity
const tokenProvider = new ManagedIdentityTokenProvider("your-client-id");
```

### Connection String / API Key

```typescript
import { ConnectionStringTokenProvider } from "@azure/connectors";

const tokenProvider = new ConnectionStringTokenProvider("your-api-key");
```

```javascript
import { ConnectionStringTokenProvider } from "@azure/connectors";

const tokenProvider = new ConnectionStringTokenProvider("your-api-key");
```

## Configuration Options

Customize client behavior with `ConnectorClientOptions`:

```typescript
import { ConnectorClientOptions } from "@azure/connectors";
import { Office365Client } from "@azure/connectors/generated/Office365Extensions";

const options: ConnectorClientOptions = {
    timeoutMs: 60000,                   // Request timeout (default: 30000)
    maxRetryAttempts: 5,                // Max retry count (default: 3)
    useExponentialBackoff: true,        // Exponential backoff (default: true)
    initialRetryDelayMs: 1000,          // Initial retry delay (default: 500)
};

const client = new Office365Client(connectionUrl, tokenProvider, options);
```

```javascript
import { Office365Client } from "@azure/connectors/generated/Office365Extensions";

const client = new Office365Client(connectionUrl, tokenProvider, {
    timeoutMs: 60000,
    maxRetryAttempts: 5,
    useExponentialBackoff: true,
    initialRetryDelayMs: 1000,
});
```

## Error Handling

All connector errors are thrown as `ConnectorException` with structured details:

```typescript
import { ConnectorException } from "@azure/connectors";

try {
    await client.sendEmailAsync(email);
} catch (error) {
    if (error instanceof ConnectorException) {
        console.error(`Operation: '${error.message}'.`);
        console.error(`Status code: '${error.statusCode}'.`);
        console.error(`Response: '${error.responseBody}'.`);
    } else {
        throw error;
    }
}
```

```javascript
import { ConnectorException } from "@azure/connectors";

try {
    await client.sendEmailAsync(email);
} catch (error) {
    if (error instanceof ConnectorException) {
        console.error(`Operation: '${error.message}'.`);
        console.error(`Status code: '${error.statusCode}'.`);
        console.error(`Response: '${error.responseBody}'.`);
    } else {
        throw error;
    }
}
```

## Project Structure

```
@azure/connectors/
├── src/azureConnectors/            # Core SDK infrastructure
│   ├── authentication.ts           # Token providers
│   ├── clientBase.ts               # Base connector client
│   ├── connectorHttpClient.ts      # HTTP client with retry
│   ├── options.ts                  # Configuration options
│   ├── connectorException.ts       # Exception types
│   └── triggerPayload.ts           # Trigger callback types
├── src/generated/                  # Auto-generated connector clients
│   ├── ArmExtensions.ts           # Azure Resource Manager client
│   ├── AzureblobExtensions.ts     # Azure Blob Storage client
│   ├── AzuremonitorlogsExtensions.ts # Azure Monitor Logs client
│   ├── DocusignExtensions.ts      # DocuSign client
│   ├── GithubExtensions.ts        # GitHub client
│   ├── JiraExtensions.ts          # Jira client
│   ├── KustoExtensions.ts         # Azure Data Explorer client
│   ├── MicrosoftformsExtensions.ts # Microsoft Forms client
│   ├── MqExtensions.ts            # IBM MQ client
│   ├── MsgraphgroupsanduserExtensions.ts # MS Graph Groups & Users client
│   ├── Office365Extensions.ts     # Office 365 Outlook client
│   ├── Office365usersExtensions.ts # Office 365 Users client
│   ├── OnedriveforbusinessExtensions.ts # OneDrive for Business client
│   ├── PowerbiExtensions.ts       # Power BI client
│   ├── SalesforceExtensions.ts    # Salesforce client
│   ├── SharepointonlineExtensions.ts # SharePoint Online client
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

```
samples/
├── esm/
│   ├── typescript/         # TypeScript ESM samples
│   │   ├── arm.ts
│   │   ├── azureblob.ts
│   │   ├── azuremonitorlogs.ts
│   │   ├── docusign.ts
│   │   ├── github.ts
│   │   ├── jira.ts
│   │   ├── kusto.ts
│   │   ├── microsoftforms.ts
│   │   ├── mq.ts
│   │   ├── msgraphgroupsanduser.ts
│   │   ├── office365.ts
│   │   ├── office365users.ts
│   │   ├── onedriveforbusiness.ts
│   │   ├── powerbi.ts
│   │   ├── salesforce.ts
│   │   ├── sharepoint.ts
│   │   ├── shifts.ts
│   │   ├── slack.ts
│   │   ├── smtp.ts
│   │   └── teams.ts
│   └── javascript/         # JavaScript ESM samples (.mjs)
│       ├── arm.mjs
│       ├── azureblob.mjs
│       └── ... (21 connectors)
└── cjs/
    ├── typescript/         # TypeScript CJS samples
    │   ├── arm.ts
    │   └── ... (21 connectors)
    └── javascript/         # JavaScript CJS samples (.cjs)
        ├── arm.cjs
        └── ... (21 connectors)
```

See [docs/connection-setup.md](docs/connection-setup.md) for instructions on creating the Azure connections required to run the samples.

## Related Projects

- **[Connectors .NET SDK](https://github.com/Azure/Connectors-NET-SDK)** — .NET implementation of this SDK
- **[Azure Functions Connector Extension](https://github.com/Azure/azure-functions-connector-extension)** - An Azure Functions trigger extension for receiving webhook callbacks from Connector Namespace

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

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
