# Azure Connectors Node.js SDK

A TypeScript SDK for using Azure Logic Apps Connectors DirectClient functionality in Node.js applications. This SDK provides easy-to-use clients for Office 365, SharePoint Online, and Microsoft Teams connectors with **full ESM and CommonJS compatibility**.

## ✨ Features

- **🚀 Universal Module Compatibility**: Single build that works seamlessly with both ESM and CommonJS
- **Office 365 Client**: Send emails, manage calendar events, export messages, and more
- **SharePoint Online Client**: Manage files, lists, and document libraries  
- **Teams Client**: Send messages, get teams and channels, manage conversations
- **TypeScript Support**: Full type definitions for better development experience
- **Authentication**: Built-in MSAL integration for Azure AD authentication
- **Error Handling**: Connector-specific exception types with detailed error information
- **Async/Await**: Modern Promise-based API with cancellation token support
- **Simplified Build**: Single optimized build output that works everywhere

## 📦 Installation

```bash
npm install @azure/connectors-nodejs-sdk
```

## 🔧 Universal Module Support

The SDK uses a **universal build approach** - a single output that works seamlessly with both module systems:

### ESM (ECMAScript Modules)

```typescript
// TypeScript/Node.js with ESM
import { 
    Office365Client, 
    SharepointonlineClient, 
    TeamsClient,
    MsalTokenProvider 
} from '@azure/connectors-nodejs-sdk';
```

### CommonJS 

```javascript
// Node.js with CommonJS 
const { 
    Office365Client, 
    SharepointonlineClient, 
    TeamsClient,
    MsalTokenProvider 
} = require('@azure/connectors-nodejs-sdk');
```

### Why This Works

Modern Node.js can import CommonJS modules using both `import` and `require()` statements, giving you maximum compatibility without the complexity of maintaining separate builds.

## Prerequisites

- Node.js 16.0.0 or higher
- Azure AD application with appropriate Microsoft Graph permissions
- Logic Apps connector endpoints configured

## Quick Start

```typescript
import { 
    Office365Client, 
    SharepointonlineClient, 
    TeamsClient,
    MsalTokenProvider,
    ConnectorClientOptions 
} from '@azure/connectors-nodejs-sdk';

// Configure authentication
const tokenProvider = new MsalTokenProvider({
    tenantId: 'your-tenant-id',
    clientId: 'your-client-id', 
    clientSecret: 'your-client-secret'
});

// Configure client options
const options = new ConnectorClientOptions({
    enableLogging: true,
    timeout: 30000
});

// Initialize clients
const office365Client = new Office365Client(tokenProvider, options);
const sharePointClient = new SharepointonlineClient(tokenProvider, options);
const teamsClient = new TeamsClient(tokenProvider, options);
```

## Usage Examples

### Send an Email

```typescript
import { ClientSendHtmlMessage } from '@azure/connectors-nodejs-sdk';

const emailMessage: ClientSendHtmlMessage = {
    to: 'recipient@example.com',
    subject: 'Hello from Node.js SDK',
    body: '<p>This is a <strong>test email</strong> from the TypeScript SDK.</p>'
};

await office365Client.sendEmailV2Async(emailMessage);
```

### Upload a File to SharePoint

```typescript
const fileContent = Buffer.from('Hello, SharePoint!', 'utf-8');
const metadata = await sharePointClient.createFileAsync(
    'https://yourtenant.sharepoint.com/sites/yoursite',
    fileContent,
    '/Shared Documents',
    'test.txt'
);

console.log(`File uploaded: ${metadata.name}`);
```

### Post a Message to Teams

```typescript
const result = await teamsClient.postMessageToChannelAsync(
    'team-id',
    'channel-id',
    'Hello from the Node.js SDK!'
);

console.log(`Message posted: ${result.messageLink}`);
```

### Download a File from SharePoint

```typescript
const fileBytes = await sharePointClient.getFileContentByPathAsync(
    'https://yourtenant.sharepoint.com/sites/yoursite',
    '/Shared Documents/example.pdf'
);

// Save to file system or process as needed
```

### Create a Calendar Event

```typescript
import { GraphCalendarEventClient } from '@azure/connectors-nodejs-sdk';

const calendarEvent: GraphCalendarEventClient = {
    subject: 'Team Meeting',
    body: 'Quarterly review meeting',
    startTime: '2024-04-15T10:00:00.000Z',
    endTime: '2024-04-15T11:00:00.000Z',
    timeZone: 'UTC',
    requiredAttendees: 'attendee1@example.com;attendee2@example.com'
};

const result = await office365Client.v4CalendarPostItemAsync('Calendar', calendarEvent);
console.log(`Event created: ${result.iCalUId}`);
```

## Authentication

The SDK uses MSAL (Microsoft Authentication Library) for Azure AD authentication. You need to configure your Azure AD application with the appropriate permissions:

### Required Permissions

#### Office 365 Connector
- `Mail.ReadWrite` - Read and write access to user mail
- `Mail.Send` - Send mail as a user
- `Calendars.ReadWrite` - Read and write access to user calendars

#### SharePoint Online Connector  
- `Sites.ReadWrite.All` - Read and write items in all site collections
- `Files.ReadWrite.All` - Read and write access to all files

#### Teams Connector
- `Team.ReadBasic.All` - Read the names and descriptions of teams
- `Channel.ReadBasic.All` - Read the names and descriptions of channels  
- `ChatMessage.Send` - Send channel messages

### Environment Variables

Set the following environment variables:

```bash
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

## Error Handling

The SDK provides connector-specific exception types:

```typescript
import { 
    Office365ConnectorException,
    SharepointonlineConnectorException, 
    TeamsConnectorException 
} from '@azure/connectors-nodejs-sdk';

try {
    await office365Client.sendEmailV2Async(emailMessage);
} catch (error) {
    if (error instanceof Office365ConnectorException) {
        console.error(`Office 365 error: ${error.statusCode} - ${error.message}`);
        console.error('Response body:', error.responseBody);
    } else {
        console.error('Unexpected error:', error);
    }
}
```

## API Reference

### Office365Client

- `sendEmailV2Async(message)` - Send an HTML email
- `getOutlookCategoryNamesAsync()` - Get Outlook categories
- `v4CalendarPostItemAsync(calendarId, event)` - Create calendar event
- `exportEmailV2Async(messageId)` - Export email as RFC822 format
- `getRecentEmailsAsync(top?)` - Get recent emails
- `markEmailAsReadAsync(messageId)` - Mark email as read
- `getUserProfileAsync()` - Get user profile

### SharepointonlineClient

- `getAllTablesAsync(siteAddress)` - Get all lists/libraries
- `listRootFolderAsync(siteAddress)` - List files in root folder
- `listFolderAsync(siteAddress, folderId)` - List files in specific folder
- `getFileContentByPathAsync(siteAddress, path)` - Download file content
- `createFileAsync(siteAddress, content, folderPath, fileName)` - Upload file
- `updateFileByPathAsync(siteAddress, path, content)` - Update file content
- `deleteFileByPathAsync(siteAddress, path)` - Delete file
- `getListItemsAsync(siteAddress, listName)` - Get list items
- `createListItemAsync(siteAddress, listName, item)` - Create list item

### TeamsClient

- `getAllTeamsAsync()` - Get all teams user is member of
- `getChannelsForGroupAsync(teamId)` - Get channels for team
- `postMessageToConversationAsync(poster, location, message)` - Post message
- `postMessageToChannelAsync(teamId, channelId, body)` - Post simple message
- `getTeamAsync(teamId)` - Get team information
- `getChannelAsync(teamId, channelId)` - Get channel information

## Development

### Building from Source

```bash
git clone https://github.com/yourorg/connectors-nodejs-sdk.git
cd connectors-nodejs-sdk
npm install
npm run build
```

### Running Tests

```bash
npm test
```

### Development Server

```bash
npm run dev
```

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions, please use the [GitHub Issues](https://github.com/yourorg/connectors-nodejs-sdk/issues) page.