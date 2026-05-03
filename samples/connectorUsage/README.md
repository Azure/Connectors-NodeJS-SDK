# Connector Usage Samples

This directory contains samples demonstrating how to use the Azure Workflows Connector SDK for TypeScript / Node.js with generated connector clients.

## Samples

### 1. Office 365 Connector (`sampleOffice365.ts`)

Demonstrates Office 365 Outlook operations:

- Getting Outlook categories
- Sending emails
- Retrieving emails from inbox
- Drafting and sending emails
- Error handling patterns

**Run:**

```bash
npx ts-node sampleOffice365.ts
```

### 2. SharePoint Online Connector (`sampleSharepoint.ts`)

Demonstrates SharePoint Online operations:

- Listing all lists and libraries
- Getting items from a list
- Creating list items
- Full CRUD cycle (create, read, update, delete)
- Getting file metadata from libraries
- Error handling patterns

**Run:**

```bash
npx ts-node sampleSharepoint.ts
```

### 3. Microsoft Teams Connector (`sampleTeams.ts`)

Demonstrates Microsoft Teams operations:

- Listing joined teams
- Listing associated teams
- Listing channels for a team
- Getting team details
- Getting messages in a channel
- Error handling patterns

**Run:**

```bash
npx ts-node sampleTeams.ts
```

## Prerequisites

1. **Node.js 18+** - Required for native `fetch` support
2. **Azure Connectors SDK** - Install via npm:

   ```bash
   npm install @azure/connectors
   ```

3. **Azure Identity** - For authentication:

   ```bash
   npm install @azure/identity
   ```

4. **ts-node** (for running samples directly):

   ```bash
   npm install -D ts-node
   ```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OFFICE365_CONNECTION_URL` | Office365 connection runtime URL | `https://westus.azure-apihub.net/apim/office365/abc123` |
| `SHAREPOINT_CONNECTION_URL` | SharePoint connection runtime URL | `https://westus.azure-apihub.net/apim/sharepointonline/abc123` |
| `SHAREPOINT_SITE_URL` | SharePoint site URL | `https://contoso.sharepoint.com/sites/mysite` |
| `TEAMS_CONNECTION_URL` | Teams connection runtime URL | `https://westus.azure-apihub.net/apim/teams/abc123` |
| `TEST_EMAIL_TO` | Email recipient for send tests | `user@contoso.com` |
| `TEST_LIST_NAME` | SharePoint list name for tests | `Tasks` |
| `TEST_LIBRARY_NAME` | SharePoint library name for tests | `Documents` |
| `TEST_TEAM_ID` | Teams team ID for tests | `550e8400-e29b-41d4-...` |
| `TEST_CHANNEL_ID` | Teams channel ID for tests | `19:abc123@thread.tacv2` |

## Usage Pattern

After generating connector code, use the typed clients directly:

```typescript
import { DefaultAzureCredential } from "@azure/identity";
import {
    Office365Client,
    SendEmailInput,
} from "@azure/connectors/generated/Office365Extensions";

async function sendEmail(): Promise<void> {
    const credential = new DefaultAzureCredential();

    const client = new Office365Client({
        connectionRuntimeUrl: "https://westus.azure-apihub.net/apim/office365/abc123",
        getToken: async () => {
            const token = await credential.getToken(
                "https://logic-apis-westus.azure-apihub.net/.default"
            );
            return token.token;
        },
    });

    const email: SendEmailInput = {
        To: "recipient@example.com",
        Subject: "Hello from SDK",
        Body: "<p>Email body</p>",
    };

    await client.sendEmailAsync(email);
}
```

## Azure Functions Integration

Generated clients work seamlessly with Azure Functions:

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import {
    Office365Client,
    SendEmailInput,
} from "@azure/connectors/generated/Office365Extensions";

app.http("send-email", {
    methods: ["POST"],
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        const credential = new DefaultAzureCredential();

        const client = new Office365Client({
            connectionRuntimeUrl: process.env.CONNECTION_RUNTIME_URL!,
            getToken: async () => {
                const token = await credential.getToken(
                    "https://logic-apis-westus.azure-apihub.net/.default"
                );
                return token.token;
            },
        });

        const body = await request.json() as { to: string };

        const email: SendEmailInput = {
            To: body.to,
            Subject: "Hello",
            Body: "<p>Sent from Azure Function!</p>",
        };

        await client.sendEmailAsync(email);

        return { status: 200, body: "Email sent!" };
    },
});
```

## Error Handling

The SDK provides typed error classes for each connector:

```typescript
import {
    Office365Client,
    Office365ConnectorError,
} from "@azure/connectors/generated/Office365Extensions";

try {
    await client.getEmailAsync("invalid-id");
} catch (error) {
    if (error instanceof Office365ConnectorError) {
        console.log(`Operation: ${error.operation}`);
        console.log(`Status: ${error.statusCode}`);
        console.log(`Body: ${error.responseBody}`);
    }
}
```

## Generating Connector Code

To generate typed TypeScript clients, use the LogicAppsCompiler CLI from the BPM repo:

```powershell
# Generate TypeScript clients (e.g., Office365)
LogicAppsCompiler.exe "<output-dir>" unused --directClientTypeScript --connectors=office365,sharepointonline,teams
```

See [GENERATION.md](../../GENERATION.md) for complete documentation.

## Available Connectors

The generator supports ~1,500 Azure managed connectors. Popular ones include:

**Microsoft 365 & Office:**

- `office365` - Office 365 Outlook
- `teams` - Microsoft Teams
- `sharepointonline` - SharePoint Online
- `onedriveforbusiness` - OneDrive for Business

**Cloud Storage:**

- `azureblob` - Azure Blob Storage
- `googledrive` - Google Drive
- `dropbox` - Dropbox

**Databases:**

- `sql` - SQL Server
- `dataverse` - Microsoft Dataverse
- `cosmosdb` - Azure Cosmos DB

See [GENERATION.md](../../GENERATION.md) for the complete list.

## Next Steps

1. Generate connector code for your needed connectors
2. Install the SDK: `npm install @azure/connectors`
3. Get connection runtime URL from Azure Portal
4. Set up authentication via Azure Identity
