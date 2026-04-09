# Azure Functions Sample

This sample demonstrates how to use the Azure Connectors Node.js SDK in Azure Functions to send emails via the Office 365 connector.

## Features

- **ESM Compatible**: Uses the modern ESM import syntax supported by the SDK
- **Office 365 Integration**: Demonstrates email sending functionality
- **Azure Functions v4**: Compatible with the latest Azure Functions runtime
- **TypeScript**: Fully typed implementation for better development experience
- **Error Handling**: Proper error handling and HTTP responses

## Prerequisites

- Node.js 18+ (required for ESM support in Azure Functions)
- Azure subscription with Office 365 access
- Azure AD app registration with appropriate permissions

## Module System Compatibility

This sample uses **ESM imports** which work seamlessly with the dual-build SDK:

```typescript
import { Office365Client, MsalTokenProvider } from '@azure/connectors-nodejs-sdk';
```

The SDK automatically resolves to the correct build (ESM) and provides full type support.

## Setup

1. Clone the repository and navigate to the sample:
   ```bash
   cd samples/azure-functions
   npm install
   ```

2. Create a `local.settings.json` file (copy from `local.settings.example.json`):
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "UseDevelopmentStorage=true",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "AZURE_CLIENT_ID": "your-client-id",
       "AZURE_CLIENT_SECRET": "your-client-secret",
       "AZURE_TENANT_ID": "your-tenant-id"
     }
   }
   ```

3. Build and run locally:
   ```bash
   npm run build
   npm run start
   ```

4. Test the function:
   ```bash
   curl -X POST "http://localhost:7071/api/sendEmail" \
        -H "Content-Type: application/json" \
        -d '{
          "to": "recipient@example.com",
          "subject": "Test Email",
          "body": "This is a test email sent via Azure Connectors SDK!"
        }'
   ```

## Deployment

Deploy to Azure using Azure Functions Core Tools:

```bash
func azure functionapp publish <your-function-app-name>
```

Make sure to configure the environment variables in your Azure Function App settings.

## ESM vs CommonJS

This sample demonstrates **ESM usage** of the SDK. For **CommonJS** usage in Azure Functions, you can modify the imports:

```javascript
// CommonJS (if using .cjs files or setting "type": "commonjs" in package.json)
const { Office365Client, MsalTokenProvider } = require('@azure/connectors-nodejs-sdk');
```

The SDK supports both module systems seamlessly!