# Azure Connectors Node.js SDK

Type-safe TypeScript and JavaScript clients for Azure managed connectors,
with asynchronous operations, typed models, pagination, and trigger metadata.

> **Early preview:** This SDK is not intended for production use. Breaking
> changes are expected. These docs describe the current `main` branch, which
> may differ from the version published on npm.

## Install

```bash
npm install @azure/connectors
```

Node.js 20 or later is required.

## Use a connector

```typescript
import { ManagedIdentityCredential } from "@azure/identity";
import { Office365Client } from "@azure/connectors/generated/Office365Extensions";

const credential = new ManagedIdentityCredential();
const client = new Office365Client(
    "https://example.azure.com/connections/office365",
    credential,
);

await client.sendEmail({
    To: "recipient@example.com",
    Subject: "Hello from Node.js",
    Body: "<p>Hello from Azure Connectors!</p>",
});
```

Create and authorize a Connector Namespace connection before calling an
operation. See the
[connection setup guide](https://github.com/Azure/Connectors-NodeJS-SDK/blob/main/docs/connection-setup.md).

## Browse the API reference

- **SDK infrastructure:** The `azureConnectors` module documents the
  package-root exports, including client options, authentication, errors,
  pagination, and trigger payloads.
- **Generated connectors:** Each `generated/*Extensions` module documents a
  connector client, its operation options, models, and trigger metadata.
  Import these using `@azure/connectors/generated/<ModuleName>`.
- **Connector catalogs:** `generated/connectorNames` and
  `generated/ManagedConnectors` document the shared connector registries.

Use the navigation and search to find a client, operation, or model. Generated
APIs reflect each connector's service contract; not every connector has live
end-to-end validation.

## More resources

- [README and examples](https://github.com/Azure/Connectors-NodeJS-SDK#readme)
- [Runnable samples](https://github.com/Azure/Connectors-NodeJS-SDK/tree/main/samples)
- [Report an issue](https://github.com/Azure/Connectors-NodeJS-SDK/issues)
- [Python SDK documentation](https://azure.github.io/connectors-python-sdk/)
- [.NET SDK](https://github.com/Azure/Connectors-NET-SDK)
