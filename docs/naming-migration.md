<!-- Copyright (c) Microsoft Corporation. All rights reserved. -->
# Preview SDK naming migration

The generated TypeScript SDK now uses canonical connector and model names. Update import
subpaths, class/type/constant names, and renamed method calls. Client instances
remain camelCase (`const client = new DocusignClient(...)`); class/type/import
bindings remain PascalCase. `connectorName` values, HTTP routes, raw operation IDs,
and serialized service field names are not renamed. Do not change JSON property names
or string operation IDs when adapting application source.

## Additional module changes in the naming refresh

Imports use `@azure/connectors/generated/<new module>` in both ESM and CJS.
These names are case-sensitive on non-Windows platforms.

| API ID | Previous module | New module | Previous class | New class |
| --- | --- | --- | --- | --- |
| `commondataservice` | `CommondataserviceExtensions` | `CommonDataServiceExtensions` | `CommondataserviceClient` | `CommonDataServiceClient` |
| `dataflowssms` | `DataflowsSmsExtensions` | `DataFlowsSmsExtensions` | `DataflowsSmsClient` | `DataFlowsSmsClient` |
| `documentdb` | `DocumentDbExtensions` | `DocumentDBExtensions` | `DocumentDbClient` | `DocumentDBClient` |
| `docusign` | `DocuSignExtensions` | `DocusignExtensions` | `DocuSignClient` | `DocusignClient` |
| `freshservice` | `FreshServiceExtensions` | `FreshserviceExtensions` | `FreshServiceClient` | `FreshserviceClient` |
| `jedoxodatahub` | `JedoxOdataHubExtensions` | `JedoxODataHubExtensions` | `JedoxOdataHubClient` | `JedoxODataHubClient` |
| `mailchimp` | `MailChimpExtensions` | `MailchimpExtensions` | `MailChimpClient` | `MailchimpClient` |
| `mq` | `MqExtensions` | `MQExtensions` | `MqClient` | `MQClient` |
| `msgraphgroupsanduser` | `MsGraphGroupsAndUsersExtensions` | `MSGraphGroupsAndUsersExtensions` | `MsGraphGroupsAndUsersClient` | `MSGraphGroupsAndUsersClient` |
| `revai` | `RevaiExtensions` | `RevAIExtensions` | `RevaiClient` | `RevAIClient` |
| `servicebus` | `ServicebusExtensions` | `ServiceBusExtensions` | `ServicebusClient` | `ServiceBusClient` |
| `starrezrestv1` | `StarrezRestV1Extensions` | `StarRezRestV1Extensions` | `StarrezRestV1Client` | `StarRezRestV1Client` |
| `zeptomail` | `ZeptomailExtensions` | `ZeptoMailExtensions` | `ZeptomailClient` | `ZeptoMailClient` |

## Module migration from the previous SDK preview

If updating from the previous published preview, use this complete list of
changed module and class names for the existing clients. Four additional
catalog clients have no previous module to rename.

| API ID | Previous module | Current module | Previous class | Current class |
| --- | --- | --- | --- | --- |
| `azuread` | `AzureadExtensions` | `AzureADExtensions` | `AzureadClient` | `AzureADClient` |
| `azureautomation` | `AzureautomationExtensions` | `AzureAutomationExtensions` | `AzureautomationClient` | `AzureAutomationClient` |
| `azureblob` | `AzureblobExtensions` | `AzureBlobExtensions` | `AzureblobClient` | `AzureBlobClient` |
| `azuredatafactory` | `AzuredatafactoryExtensions` | `AzureDataFactoryExtensions` | `AzuredatafactoryClient` | `AzureDataFactoryClient` |
| `azuredigitaltwins` | `AzuredigitaltwinsExtensions` | `AzureDigitalTwinsExtensions` | `AzuredigitaltwinsClient` | `AzureDigitalTwinsClient` |
| `azureeventgrid` | `AzureeventgridExtensions` | `AzureEventGridExtensions` | `AzureeventgridClient` | `AzureEventGridClient` |
| `azureiotcentral` | `AzureiotcentralExtensions` | `AzureIoTCentralExtensions` | `AzureiotcentralClient` | `AzureIoTCentralClient` |
| `azuremonitorlogs` | `AzuremonitorlogsExtensions` | `AzureMonitorLogsExtensions` | `AzuremonitorlogsClient` | `AzureMonitorLogsClient` |
| `azurequeues` | `AzurequeuesExtensions` | `AzureQueuesExtensions` | `AzurequeuesClient` | `AzureQueuesClient` |
| `azuretables` | `AzuretablesExtensions` | `AzureTablesExtensions` | `AzuretablesClient` | `AzureTablesClient` |
| `azurevm` | `AzurevmExtensions` | `AzureVMExtensions` | `AzurevmClient` | `AzureVMClient` |
| `clicksendsms` | `ClicksendsmsExtensions` | `ClickSendSmsExtensions` | `ClicksendsmsClient` | `ClickSendSmsClient` |
| `cloudmersiveconvert` | `CloudmersiveconvertExtensions` | `CloudmersiveConvertExtensions` | `CloudmersiveconvertClient` | `CloudmersiveConvertClient` |
| `commondataservice` | `CommondataserviceExtensions` | `CommonDataServiceExtensions` | `CommondataserviceClient` | `CommonDataServiceClient` |
| `documentdb` | `DocumentdbExtensions` | `DocumentDBExtensions` | `DocumentdbClient` | `DocumentDBClient` |
| `dynamicsax` | `DynamicsaxExtensions` | `DynamicsAXExtensions` | `DynamicsaxClient` | `DynamicsAXClient` |
| `elfsquaddata` | `ElfsquaddataExtensions` | `ElfsquadDataExtensions` | `ElfsquaddataClient` | `ElfsquadDataClient` |
| `eventhubs` | `EventhubsExtensions` | `EventHubsExtensions` | `EventhubsClient` | `EventHubsClient` |
| `excelonline` | `ExcelonlineExtensions` | `ExcelOnlineExtensions` | `ExcelonlineClient` | `ExcelOnlineClient` |
| `excelonlinebusiness` | `ExcelonlinebusinessExtensions` | `ExcelOnlineBusinessExtensions` | `ExcelonlinebusinessClient` | `ExcelOnlineBusinessClient` |
| `formstackforms` | `FormstackformsExtensions` | `FormstackFormsExtensions` | `FormstackformsClient` | `FormstackFormsClient` |
| `github` | `GithubExtensions` | `GitHubExtensions` | `GithubClient` | `GitHubClient` |
| `googlecalendar` | `GooglecalendarExtensions` | `GoogleCalendarExtensions` | `GooglecalendarClient` | `GoogleCalendarClient` |
| `googledrive` | `GoogledriveExtensions` | `GoogleDriveExtensions` | `GoogledriveClient` | `GoogleDriveClient` |
| `googletasks` | `GoogletasksExtensions` | `GoogleTasksExtensions` | `GoogletasksClient` | `GoogleTasksClient` |
| `jedoxodatahub` | `JedoxodatahubExtensions` | `JedoxODataHubExtensions` | `JedoxodatahubClient` | `JedoxODataHubClient` |
| `keyvault` | `KeyvaultExtensions` | `KeyVaultExtensions` | `KeyvaultClient` | `KeyVaultClient` |
| `meetingroommap` | `MeetingroommapExtensions` | `MeetingRoomMapExtensions` | `MeetingroommapClient` | `MeetingRoomMapClient` |
| `microsoftbookings` | `MicrosoftbookingsExtensions` | `MicrosoftBookingsExtensions` | `MicrosoftbookingsClient` | `MicrosoftBookingsClient` |
| `microsoftforms` | `MicrosoftformsExtensions` | `MicrosoftFormsExtensions` | `MicrosoftformsClient` | `MicrosoftFormsClient` |
| `mq` | `MqExtensions` | `MQExtensions` | `MqClient` | `MQClient` |
| `msgraphgroupsanduser` | `MsgraphgroupsanduserExtensions` | `MSGraphGroupsAndUsersExtensions` | `MsgraphgroupsanduserClient` | `MSGraphGroupsAndUsersClient` |
| `office365groups` | `Office365groupsExtensions` | `Office365GroupsExtensions` | `Office365groupsClient` | `Office365GroupsClient` |
| `office365groupsmail` | `Office365groupsmailExtensions` | `Office365GroupsMailExtensions` | `Office365groupsmailClient` | `Office365GroupsMailClient` |
| `office365users` | `Office365usersExtensions` | `Office365UsersExtensions` | `Office365usersClient` | `Office365UsersClient` |
| `onedriveforbusiness` | `OnedriveforbusinessExtensions` | `OneDriveForBusinessExtensions` | `OnedriveforbusinessClient` | `OneDriveForBusinessClient` |
| `pdfco` | `PdfcoExtensions` | `PdfCoExtensions` | `PdfcoClient` | `PdfCoClient` |
| `powerbi` | `PowerbiExtensions` | `PowerBIExtensions` | `PowerbiClient` | `PowerBIClient` |
| `revai` | `RevaiExtensions` | `RevAIExtensions` | `RevaiClient` | `RevAIClient` |
| `seismicplanner` | `SeismicplannerExtensions` | `SeismicPlannerExtensions` | `SeismicplannerClient` | `SeismicPlannerClient` |
| `sendgrid` | `SendgridExtensions` | `SendGridExtensions` | `SendgridClient` | `SendGridClient` |
| `servicebus` | `ServicebusExtensions` | `ServiceBusExtensions` | `ServicebusClient` | `ServiceBusClient` |
| `sharepointonline` | `SharepointonlineExtensions` | `SharePointOnlineExtensions` | `SharepointonlineClient` | `SharePointOnlineClient` |
| `signinghub` | `SigninghubExtensions` | `SigningHubExtensions` | `SigninghubClient` | `SigningHubClient` |
| `starrezrestv1` | `Starrezrestv1Extensions` | `StarRezRestV1Extensions` | `Starrezrestv1Client` | `StarRezRestV1Client` |
| `textrequest` | `TextrequestExtensions` | `TextRequestExtensions` | `TextrequestClient` | `TextRequestClient` |
| `visualstudioteamservices` | `VisualstudioteamservicesExtensions` | `VisualStudioTeamServicesExtensions` | `VisualstudioteamservicesClient` | `VisualStudioTeamServicesClient` |
| `wordonlinebusiness` | `WordonlinebusinessExtensions` | `WordOnlineBusinessExtensions` | `WordonlinebusinessClient` | `WordOnlineBusinessClient` |
| `wordpress` | `WordpressExtensions` | `WordPressExtensions` | `WordpressClient` | `WordPressClient` |
| `zeptomail` | `ZeptomailExtensions` | `ZeptoMailExtensions` | `ZeptomailClient` | `ZeptoMailClient` |
| `zohosign` | `ZohosignExtensions` | `ZohoSignExtensions` | `ZohosignClient` | `ZohoSignClient` |

## Trigger aliases from the previous SDK preview

Update named imports of these trigger payload, operation, and parameter
exports when migrating from the previous published preview. The string
operation IDs and parameter wire names inside these exports are unchanged.

| API ID | Previous export | Current export |
| --- | --- | --- |
| `azureblob` | `AzureblobOnUpdatedFilesTriggerPayload` | `AzureBlobOnUpdatedFilesTriggerPayload` |
| `azureblob` | `AzureblobTriggerOperations` | `AzureBlobTriggerOperations` |
| `azureblob` | `AzureblobTriggerOperation` | `AzureBlobTriggerOperation` |
| `azureblob` | `AzureblobTriggerParameters` | `AzureBlobTriggerParameters` |
| `azureeventgrid` | `AzureeventgridTriggerOperations` | `AzureEventGridTriggerOperations` |
| `azureeventgrid` | `AzureeventgridTriggerOperation` | `AzureEventGridTriggerOperation` |
| `azureeventgrid` | `AzureeventgridTriggerParameters` | `AzureEventGridTriggerParameters` |
| `azureiotcentral` | `AzureiotcentralTriggerOperations` | `AzureIoTCentralTriggerOperations` |
| `azureiotcentral` | `AzureiotcentralTriggerOperation` | `AzureIoTCentralTriggerOperation` |
| `azureiotcentral` | `AzureiotcentralTriggerParameters` | `AzureIoTCentralTriggerParameters` |
| `azurequeues` | `AzurequeuesTriggerOperations` | `AzureQueuesTriggerOperations` |
| `azurequeues` | `AzurequeuesTriggerOperation` | `AzureQueuesTriggerOperation` |
| `azurequeues` | `AzurequeuesTriggerParameters` | `AzureQueuesTriggerParameters` |
| `clicksendsms` | `ClicksendsmsTriggerOperations` | `ClickSendSmsTriggerOperations` |
| `clicksendsms` | `ClicksendsmsTriggerOperation` | `ClickSendSmsTriggerOperation` |
| `commondataservice` | `CommondataserviceOnNewItemsTriggerPayload` | `CommonDataServiceOnNewItemsTriggerPayload` |
| `commondataservice` | `CommondataserviceOnUpdatedItemsTriggerPayload` | `CommonDataServiceOnUpdatedItemsTriggerPayload` |
| `commondataservice` | `CommondataserviceTriggerOperations` | `CommonDataServiceTriggerOperations` |
| `commondataservice` | `CommondataserviceTriggerOperation` | `CommonDataServiceTriggerOperation` |
| `commondataservice` | `CommondataserviceTriggerParameters` | `CommonDataServiceTriggerParameters` |
| `dynamicsax` | `DynamicsaxTriggerOperations` | `DynamicsAXTriggerOperations` |
| `dynamicsax` | `DynamicsaxTriggerOperation` | `DynamicsAXTriggerOperation` |
| `dynamicsax` | `DynamicsaxTriggerParameters` | `DynamicsAXTriggerParameters` |
| `elfsquaddata` | `ElfsquaddataTriggerOperations` | `ElfsquadDataTriggerOperations` |
| `elfsquaddata` | `ElfsquaddataTriggerOperation` | `ElfsquadDataTriggerOperation` |
| `elfsquaddata` | `ElfsquaddataTriggerParameters` | `ElfsquadDataTriggerParameters` |
| `eventhubs` | `EventhubsOnNewEventsTriggerPayload` | `EventHubsOnNewEventsTriggerPayload` |
| `eventhubs` | `EventhubsTriggerOperations` | `EventHubsTriggerOperations` |
| `eventhubs` | `EventhubsTriggerOperation` | `EventHubsTriggerOperation` |
| `eventhubs` | `EventhubsTriggerParameters` | `EventHubsTriggerParameters` |
| `formstackforms` | `FormstackformsTriggerOperations` | `FormstackFormsTriggerOperations` |
| `formstackforms` | `FormstackformsTriggerOperation` | `FormstackFormsTriggerOperation` |
| `formstackforms` | `FormstackformsTriggerParameters` | `FormstackFormsTriggerParameters` |
| `github` | `GithubOnIssueAssignedTriggerPayload` | `GitHubOnIssueAssignedTriggerPayload` |
| `github` | `GithubOnIssueClosedTriggerPayload` | `GitHubOnIssueClosedTriggerPayload` |
| `github` | `GithubOnIssueOpenedTriggerPayload` | `GitHubOnIssueOpenedTriggerPayload` |
| `github` | `GithubTriggerOperations` | `GitHubTriggerOperations` |
| `github` | `GithubTriggerOperation` | `GitHubTriggerOperation` |
| `github` | `GithubTriggerParameters` | `GitHubTriggerParameters` |
| `googlecalendar` | `GooglecalendarTriggerOperations` | `GoogleCalendarTriggerOperations` |
| `googlecalendar` | `GooglecalendarTriggerOperation` | `GoogleCalendarTriggerOperation` |
| `googlecalendar` | `GooglecalendarTriggerParameters` | `GoogleCalendarTriggerParameters` |
| `googletasks` | `GoogletasksTriggerOperations` | `GoogleTasksTriggerOperations` |
| `googletasks` | `GoogletasksTriggerOperation` | `GoogleTasksTriggerOperation` |
| `googletasks` | `GoogletasksTriggerParameters` | `GoogleTasksTriggerParameters` |
| `microsoftbookings` | `MicrosoftbookingsTriggerOperations` | `MicrosoftBookingsTriggerOperations` |
| `microsoftbookings` | `MicrosoftbookingsTriggerOperation` | `MicrosoftBookingsTriggerOperation` |
| `microsoftbookings` | `MicrosoftbookingsTriggerParameters` | `MicrosoftBookingsTriggerParameters` |
| `microsoftforms` | `MicrosoftformsTriggerOperations` | `MicrosoftFormsTriggerOperations` |
| `microsoftforms` | `MicrosoftformsTriggerOperation` | `MicrosoftFormsTriggerOperation` |
| `microsoftforms` | `MicrosoftformsTriggerParameters` | `MicrosoftFormsTriggerParameters` |
| `office365groups` | `Office365groupsOnGroupMembershipChangeTriggerPayload` | `Office365GroupsOnGroupMembershipChangeTriggerPayload` |
| `office365groups` | `Office365groupsOnNewEventTriggerPayload` | `Office365GroupsOnNewEventTriggerPayload` |
| `office365groups` | `Office365groupsTriggerOperations` | `Office365GroupsTriggerOperations` |
| `office365groups` | `Office365groupsTriggerOperation` | `Office365GroupsTriggerOperation` |
| `office365groups` | `Office365groupsTriggerParameters` | `Office365GroupsTriggerParameters` |
| `office365groupsmail` | `Office365groupsmailOnNewEmailInGroupTriggerPayload` | `Office365GroupsMailOnNewEmailInGroupTriggerPayload` |
| `office365groupsmail` | `Office365groupsmailTriggerOperations` | `Office365GroupsMailTriggerOperations` |
| `office365groupsmail` | `Office365groupsmailTriggerOperation` | `Office365GroupsMailTriggerOperation` |
| `office365groupsmail` | `Office365groupsmailTriggerParameters` | `Office365GroupsMailTriggerParameters` |
| `onedriveforbusiness` | `OnedriveforbusinessOnNewFilesTriggerPayload` | `OneDriveForBusinessOnNewFilesTriggerPayload` |
| `onedriveforbusiness` | `OnedriveforbusinessOnUpdatedFilesTriggerPayload` | `OneDriveForBusinessOnUpdatedFilesTriggerPayload` |
| `onedriveforbusiness` | `OnedriveforbusinessTriggerOperations` | `OneDriveForBusinessTriggerOperations` |
| `onedriveforbusiness` | `OnedriveforbusinessTriggerOperation` | `OneDriveForBusinessTriggerOperation` |
| `onedriveforbusiness` | `OnedriveforbusinessTriggerParameters` | `OneDriveForBusinessTriggerParameters` |
| `powerbi` | `PowerbiTriggerOperations` | `PowerBITriggerOperations` |
| `powerbi` | `PowerbiTriggerOperation` | `PowerBITriggerOperation` |
| `powerbi` | `PowerbiTriggerParameters` | `PowerBITriggerParameters` |
| `servicebus` | `ServicebusOnGetMessagesFromQueueTriggerPayload` | `ServiceBusOnGetMessagesFromQueueTriggerPayload` |
| `servicebus` | `ServicebusOnGetMessagesFromTopicTriggerPayload` | `ServiceBusOnGetMessagesFromTopicTriggerPayload` |
| `servicebus` | `ServicebusOnGetNewMessagesFromQueueWithPeekLockTriggerPayload` | `ServiceBusOnGetNewMessagesFromQueueWithPeekLockTriggerPayload` |
| `servicebus` | `ServicebusOnGetNewMessagesFromTopicWithPeekLockTriggerPayload` | `ServiceBusOnGetNewMessagesFromTopicWithPeekLockTriggerPayload` |
| `servicebus` | `ServicebusTriggerOperations` | `ServiceBusTriggerOperations` |
| `servicebus` | `ServicebusTriggerOperation` | `ServiceBusTriggerOperation` |
| `servicebus` | `ServicebusTriggerParameters` | `ServiceBusTriggerParameters` |
| `sharepointonline` | `SharepointonlineOnChangedItemsTriggerPayload` | `SharePointOnlineOnChangedItemsTriggerPayload` |
| `sharepointonline` | `SharepointonlineOnDeletedFileItemsTriggerPayload` | `SharePointOnlineOnDeletedFileItemsTriggerPayload` |
| `sharepointonline` | `SharepointonlineOnDeletedItemsTriggerPayload` | `SharePointOnlineOnDeletedItemsTriggerPayload` |
| `sharepointonline` | `SharepointonlineOnNewFileItemsTriggerPayload` | `SharePointOnlineOnNewFileItemsTriggerPayload` |
| `sharepointonline` | `SharepointonlineOnNewItemsTriggerPayload` | `SharePointOnlineOnNewItemsTriggerPayload` |
| `sharepointonline` | `SharepointonlineOnNewItemsFromFormTriggerPayload` | `SharePointOnlineOnNewItemsFromFormTriggerPayload` |
| `sharepointonline` | `SharepointonlineOnRecurrenceDigestTriggerPayload` | `SharePointOnlineOnRecurrenceDigestTriggerPayload` |
| `sharepointonline` | `SharepointonlineOnUpdatedFileClassifiedTimesTriggerPayload` | `SharePointOnlineOnUpdatedFileClassifiedTimesTriggerPayload` |
| `sharepointonline` | `SharepointonlineOnUpdatedFileItemsTriggerPayload` | `SharePointOnlineOnUpdatedFileItemsTriggerPayload` |
| `sharepointonline` | `SharepointonlineOnUpdatedItemsTriggerPayload` | `SharePointOnlineOnUpdatedItemsTriggerPayload` |
| `sharepointonline` | `SharepointonlineTriggerOperations` | `SharePointOnlineTriggerOperations` |
| `sharepointonline` | `SharepointonlineTriggerOperation` | `SharePointOnlineTriggerOperation` |
| `sharepointonline` | `SharepointonlineTriggerParameters` | `SharePointOnlineTriggerParameters` |
| `textrequest` | `TextrequestTriggerOperations` | `TextRequestTriggerOperations` |
| `textrequest` | `TextrequestTriggerOperation` | `TextRequestTriggerOperation` |
| `textrequest` | `TextrequestTriggerParameters` | `TextRequestTriggerParameters` |
| `visualstudioteamservices` | `VisualstudioteamservicesOnBuildCompletedTriggerPayload` | `VisualStudioTeamServicesOnBuildCompletedTriggerPayload` |
| `visualstudioteamservices` | `VisualstudioteamservicesOnGitPullClosedTriggerPayload` | `VisualStudioTeamServicesOnGitPullClosedTriggerPayload` |
| `visualstudioteamservices` | `VisualstudioteamservicesOnGitPullCreatedTriggerPayload` | `VisualStudioTeamServicesOnGitPullCreatedTriggerPayload` |
| `visualstudioteamservices` | `VisualstudioteamservicesOnGitPushTriggerPayload` | `VisualStudioTeamServicesOnGitPushTriggerPayload` |
| `visualstudioteamservices` | `VisualstudioteamservicesOnTfvcCheckInTriggerPayload` | `VisualStudioTeamServicesOnTfvcCheckInTriggerPayload` |
| `visualstudioteamservices` | `VisualstudioteamservicesOnWorkItemAssignedTriggerPayload` | `VisualStudioTeamServicesOnWorkItemAssignedTriggerPayload` |
| `visualstudioteamservices` | `VisualstudioteamservicesOnWorkItemClosedTriggerPayload` | `VisualStudioTeamServicesOnWorkItemClosedTriggerPayload` |
| `visualstudioteamservices` | `VisualstudioteamservicesOnWorkItemCreatedTriggerPayload` | `VisualStudioTeamServicesOnWorkItemCreatedTriggerPayload` |
| `visualstudioteamservices` | `VisualstudioteamservicesOnWorkItemUpdatedTriggerPayload` | `VisualStudioTeamServicesOnWorkItemUpdatedTriggerPayload` |
| `visualstudioteamservices` | `VisualstudioteamservicesTriggerOperations` | `VisualStudioTeamServicesTriggerOperations` |
| `visualstudioteamservices` | `VisualstudioteamservicesTriggerOperation` | `VisualStudioTeamServicesTriggerOperation` |
| `visualstudioteamservices` | `VisualstudioteamservicesTriggerParameters` | `VisualStudioTeamServicesTriggerParameters` |
| `wordpress` | `WordpressTriggerOperations` | `WordPressTriggerOperations` |
| `wordpress` | `WordpressTriggerOperation` | `WordPressTriggerOperation` |
| `zohosign` | `ZohosignTriggerOperations` | `ZohoSignTriggerOperations` |
| `zohosign` | `ZohosignTriggerOperation` | `ZohoSignTriggerOperation` |

## Other renamed public exports

Update named imports and type references from the same connector module. The
tables include model interfaces, aliases and trigger metadata; ordinary model fields
and serialized object keys are not covered by this rename.

| API ID | Previous export | New export |
| --- | --- | --- |
| `cloudmersiveconvert` | `RemoveWhitespaceFromTextRequest` | `RemoveWhiteSpaceFromTextRequest` |
| `cloudmersiveconvert` | `RemoveWhitespaceFromTextResponse` | `RemoveWhiteSpaceFromTextResponse` |
| `cloudmersiveconvert` | `SetConvertImageImageDPIFormData` | `SetConvertImageImageDpiFormData` |
| `commondataservice` | `CommondataserviceOnNewItemsTriggerPayload` | `CommonDataServiceOnNewItemsTriggerPayload` |
| `commondataservice` | `CommondataserviceOnUpdatedItemsTriggerPayload` | `CommonDataServiceOnUpdatedItemsTriggerPayload` |
| `commondataservice` | `CommondataserviceTriggerOperations` | `CommonDataServiceTriggerOperations` |
| `commondataservice` | `CommondataserviceTriggerOperation` | `CommonDataServiceTriggerOperation` |
| `commondataservice` | `CommondataserviceTriggerParameters` | `CommonDataServiceTriggerParameters` |
| `dataflowssms` | `DataflowsSmsTriggerOperations` | `DataFlowsSmsTriggerOperations` |
| `dataflowssms` | `DataflowsSmsTriggerOperation` | `DataFlowsSmsTriggerOperation` |
| `docusign` | `AdditionalURLForSenderView` | `AdditionalUrlForSenderView` |
| `docusign` | `AdditionalURL` | `AdditionalUrl` |
| `docusign` | `DocuSignTriggerOperations` | `DocusignTriggerOperations` |
| `docusign` | `DocuSignTriggerOperation` | `DocusignTriggerOperation` |
| `docusign` | `DocuSignTriggerParameters` | `DocusignTriggerParameters` |
| `freshservice` | `FreshServiceOnTicketCreatedTriggerPayload` | `FreshserviceOnTicketCreatedTriggerPayload` |
| `freshservice` | `FreshServiceTriggerOperations` | `FreshserviceTriggerOperations` |
| `freshservice` | `FreshServiceTriggerOperation` | `FreshserviceTriggerOperation` |
| `github` | `GeneralAPIModel` | `GeneralApiModel` |
| `github` | `InvokeMCPServerOptions` | `InvokeMcpServerOptions` |
| `jira` | `MCPQueryRequest` | `McpQueryRequest` |
| `jira` | `MCPQueryResponse` | `McpQueryResponse` |
| `jira` | `JiraOnNewIssueJQLTriggerPayload` | `JiraOnNewIssueJqlTriggerPayload` |
| `jira` | `JiraOnNewIssueJQLDatacenterTriggerPayload` | `JiraOnNewIssueJqlDatacenterTriggerPayload` |
| `kusto` | `MCPQueryRequest` | `McpQueryRequest` |
| `kusto` | `MCPQueryResponse` | `McpQueryResponse` |
| `mailchimp` | `RSSOpts` | `RssOpts` |
| `mailchimp` | `MailChimpTriggerOperations` | `MailchimpTriggerOperations` |
| `mailchimp` | `MailChimpTriggerOperation` | `MailchimpTriggerOperation` |
| `mailchimp` | `MailChimpTriggerParameters` | `MailchimpTriggerParameters` |
| `meetingroommap` | `AADMeetingRoom` | `AadMeetingRoom` |
| `meetingroommap` | `AADMeetingRoomCollection` | `AadMeetingRoomCollection` |
| `meetingroommap` | `UserDetailsDTO` | `UserDetailsDto` |
| `office365` | `MCPQueryRequest` | `McpQueryRequest` |
| `office365` | `MCPQueryResponse` | `McpQueryResponse` |
| `office365groups` | `UpdateCalendarEventHTMLRequest` | `UpdateCalendarEventHtmlRequest` |
| `pdfco` | `PDFSearchTextInput` | `PdfSearchTextInput` |
| `pdfco` | `PDFSearchTextResponse` | `PdfSearchTextResponse` |
| `pdfco` | `PDFInfoReaderInput` | `PdfInfoReaderInput` |
| `pdfco` | `PDFInfoReaderResponse` | `PdfInfoReaderResponse` |
| `pdfco` | `PDFFormsInfoReaderInput` | `PdfFormsInfoReaderInput` |
| `pdfco` | `PDFFormsInfoReaderResponse` | `PdfFormsInfoReaderResponse` |
| `pdfco` | `PDFFindTableInput` | `PdfFindTableInput` |
| `pdfco` | `PDFFindTableResponse` | `PdfFindTableResponse` |
| `pdfco` | `PDFSearchableInput` | `PdfSearchableInput` |
| `pdfco` | `PDFSearchableResponse` | `PdfSearchableResponse` |
| `pdfco` | `PDFUnSearchableInput` | `PdfUnsearchableInput` |
| `pdfco` | `PDFToCSVInput` | `PdfToCsvInput` |
| `pdfco` | `PDFToCSVResponse` | `PdfToCsvResponse` |
| `pdfco` | `PDFToJSONInput` | `PdfToJsonInput` |
| `pdfco` | `PDFToJSONResponse` | `PdfToJsonResponse` |
| `pdfco` | `PDFToJSONMetaInput` | `PdfToJsonMetaInput` |
| `pdfco` | `PDFToJSONMetaResponse` | `PdfToJsonMetaResponse` |
| `pdfco` | `PDFToTextInput` | `PdfToTextInput` |
| `pdfco` | `PDFToTextResponse` | `PdfToTextResponse` |
| `pdfco` | `PDFToTextSimpleInput` | `PdfToTextSimpleInput` |
| `pdfco` | `PDFToTextSimpleResponse` | `PdfToTextSimpleResponse` |
| `pdfco` | `PDFToXLSInput` | `PdfToXlsInput` |
| `pdfco` | `PDFToXLSResponse` | `PdfToXlsResponse` |
| `pdfco` | `PDFToXLSXInput` | `PdfToXlsxInput` |
| `pdfco` | `PDFToXLSXResponse` | `PdfToXlsxResponse` |
| `pdfco` | `PDFToXMLInput` | `PdfToXmlInput` |
| `pdfco` | `PDFToXMLResponse` | `PdfToXmlResponse` |
| `pdfco` | `PDFToJPGInput` | `PdfToJpgInput` |
| `pdfco` | `PDFToJPGResponse` | `PdfToJpgResponse` |
| `pdfco` | `PDFToPNGInput` | `PdfToPngInput` |
| `pdfco` | `PDFToPNGResponse` | `PdfToPngResponse` |
| `pdfco` | `PDFToWEBPInput` | `PdfToWebpInput` |
| `pdfco` | `PDFToWEBPResponse` | `PdfToWebpResponse` |
| `pdfco` | `PDFToTIFFInput` | `PdfToTiffInput` |
| `pdfco` | `PDFToTIFFResponse` | `PdfToTiffResponse` |
| `pdfco` | `PDFFromCSVInput` | `PdfFromCsvInput` |
| `pdfco` | `PDFFromCSVResponse` | `PdfFromCsvResponse` |
| `pdfco` | `PDFFromDocInput` | `PdfFromDocInput` |
| `pdfco` | `PDFFromDocResponse` | `PdfFromDocResponse` |
| `pdfco` | `PDFFromImagesInput` | `PdfFromImagesInput` |
| `pdfco` | `PDFFromImagesResponse` | `PdfFromImagesResponse` |
| `pdfco` | `PDFFromEmailInput` | `PdfFromEmailInput` |
| `pdfco` | `PDFFromEmailResponse` | `PdfFromEmailResponse` |
| `pdfco` | `PDFAddSecurityInput` | `PdfAddSecurityInput` |
| `pdfco` | `PDFAddSecurityResponse` | `PdfAddSecurityResponse` |
| `pdfco` | `PDFSecurityRemoveInput` | `PdfSecurityRemoveInput` |
| `pdfco` | `PDFSecurityRemoveResponse` | `PdfSecurityRemoveResponse` |
| `pdfco` | `PDFFromXLSXLSXInput` | `PdfFromXlsXlsxInput` |
| `pdfco` | `XLStoCSVInput` | `XlsToCsvInput` |
| `pdfco` | `XLStoJSONInput` | `XlsToJsonInput` |
| `pdfco` | `XLStoHTMLInput` | `XlsToHtmlInput` |
| `pdfco` | `XLStoTXTInput` | `XlsToTxtInput` |
| `pdfco` | `XLStoXMLInput` | `XlsToXmlInput` |
| `pdfco` | `PDFRotatePagesInput` | `PdfRotatePagesInput` |
| `pdfco` | `PDFRotatePagesResponse` | `PdfRotatePagesResponse` |
| `pdfco` | `PDFAutoRotatePagesInput` | `PdfAutoRotatePagesInput` |
| `pdfco` | `PDFAutoRotatePagesResponse` | `PdfAutoRotatePagesResponse` |
| `pdfco` | `PDFDeletePagesInput` | `PdfDeletePagesInput` |
| `pdfco` | `PDFDeletePagesResponse` | `PdfDeletePagesResponse` |
| `pdfco` | `PDFCompressInput` | `PdfCompressInput` |
| `pdfco` | `PDFCompressResponse` | `PdfCompressResponse` |
| `pdfco` | `PDFClassifierInput` | `PdfClassifierInput` |
| `pdfco` | `PDFClassifierResponse` | `PdfClassifierResponse` |
| `pdfco` | `PDFAttachmentExtractionInput` | `PdfAttachmentExtractionInput` |
| `pdfco` | `PDFAttachmentExtractionResponse` | `PdfAttachmentExtractionResponse` |
| `plumsail` | `FlowV1ProcessesFlowJobsExecuteProcessInput` | `FlowV1ProcessesFlowJobsExecuteProcessV2Input` |
| `plumsail` | `DocumentContentWithFilenameResponse` | `DocumentContentWithFileNameResponse` |
| `replicon` | `WebhookSubscriptionsRestAPIInput` | `WebhookSubscriptionsRestApiInput` |
| `salesforce` | `SOSLSearchQueryResponse` | `SoslSearchQueryResponse` |
| `salesforce` | `MCPQueryRequest` | `McpQueryRequest` |
| `salesforce` | `MCPQueryResponse` | `McpQueryResponse` |
| `servicebus` | `ServicebusOnGetMessagesFromQueueTriggerPayload` | `ServiceBusOnGetMessagesFromQueueTriggerPayload` |
| `servicebus` | `ServicebusOnGetMessagesFromTopicTriggerPayload` | `ServiceBusOnGetMessagesFromTopicTriggerPayload` |
| `servicebus` | `ServicebusOnGetNewMessagesFromQueueWithPeekLockTriggerPayload` | `ServiceBusOnGetNewMessagesFromQueueWithPeekLockTriggerPayload` |
| `servicebus` | `ServicebusOnGetNewMessagesFromTopicWithPeekLockTriggerPayload` | `ServiceBusOnGetNewMessagesFromTopicWithPeekLockTriggerPayload` |
| `servicebus` | `ServicebusTriggerOperations` | `ServiceBusTriggerOperations` |
| `servicebus` | `ServicebusTriggerOperation` | `ServiceBusTriggerOperation` |
| `servicebus` | `ServicebusTriggerParameters` | `ServiceBusTriggerParameters` |
| `signinghub` | `ECCLevelAPI` | `EccLevelApi` |
| `signinghub` | `EciModeAPI` | `EciModeApi` |
| `signinghub` | `AccessSecurityTOTPResponse` | `AccessSecurityTotpResponse` |
| `slack` | `SetDNDResponse` | `SetDndResponse` |
| `slack` | `SetDNDOptions` | `SetDndOptions` |
| `waywedo` | `GenerateAcceptancePDFWebHookInput` | `GenerateAcceptancePdfWebHookInput` |
| `wordonlinebusiness` | `GetFilePDFOptions` | `GetFilePdfOptions` |
| `zohosign` | `InvokeAPIInput` | `InvokeApiInput` |
| `zohosign` | `InvokeAPIResponse` | `InvokeApiResponse` |

## Renamed instance methods

Call the new camelCase method on the same client. These are source identifier
changes; do not rewrite raw operation IDs or service payload keys. Plumsail
process V2 names reflect the refreshed live definition as well as naming changes;
verify that operation contract before switching a Plumsail caller.

| API ID | Previous method | New method |
| --- | --- | --- |
| `cloudmersiveconvert` | `setConvertImageImageDPI` | `setConvertImageImageDpi` |
| `docusign` | `generateEmbeddedSenderURL` | `generateEmbeddedSenderUrl` |
| `docusign` | `generateEmbeddedSigningURL` | `generateEmbeddedSigningUrl` |
| `github` | `invokeMCPServer` | `invokeMcpServer` |
| `pdfco` | `searchPDFText` | `searchPdfText` |
| `pdfco` | `pdfinfoReader` | `pdfInfoReader` |
| `pdfco` | `pdfformsInfoReader` | `pdfFormsInfoReader` |
| `pdfco` | `pdffindTable` | `pdfFindTable` |
| `pdfco` | `pdfsearchable` | `pdfSearchable` |
| `pdfco` | `pdfunSearchable` | `pdfUnsearchable` |
| `pdfco` | `pdftoCSV` | `pdfToCsv` |
| `pdfco` | `pdftoJSON` | `pdfToJson` |
| `pdfco` | `pdftoJSONMeta` | `pdfToJsonMeta` |
| `pdfco` | `pdftoText` | `pdfToText` |
| `pdfco` | `pdftoTextSimple` | `pdfToTextSimple` |
| `pdfco` | `pdftoXLS` | `pdfToXls` |
| `pdfco` | `pdftoXLSX` | `pdfToXlsx` |
| `pdfco` | `pdftoXML` | `pdfToXml` |
| `pdfco` | `pdftoJPG` | `pdfToJpg` |
| `pdfco` | `pdftoPNG` | `pdfToPng` |
| `pdfco` | `pdftoWEBP` | `pdfToWebp` |
| `pdfco` | `pdftoTIFF` | `pdfToTiff` |
| `pdfco` | `pdffromCSV` | `pdfFromCsv` |
| `pdfco` | `pdffromDoc` | `pdfFromDoc` |
| `pdfco` | `pdffromImages` | `pdfFromImages` |
| `pdfco` | `pdffromEmail` | `pdfFromEmail` |
| `pdfco` | `addPDFSecurity` | `addPdfSecurity` |
| `pdfco` | `removePDFSecurity` | `removePdfSecurity` |
| `pdfco` | `pdffromXLSXLSX` | `pdfFromXlsXlsx` |
| `pdfco` | `xlstoCSV` | `xlsToCsv` |
| `pdfco` | `xlstoJSON` | `xlsToJson` |
| `pdfco` | `xlstoHTML` | `xlsToHtml` |
| `pdfco` | `xlstoTXT` | `xlsToTxt` |
| `pdfco` | `xlstoXML` | `xlsToXml` |
| `pdfco` | `pdfrotatePages` | `pdfRotatePages` |
| `pdfco` | `pdfautoRotatePages` | `pdfAutoRotatePages` |
| `pdfco` | `deletePDFPages` | `deletePdfPages` |
| `pdfco` | `pdfcompress` | `pdfCompress` |
| `pdfco` | `pdfclassifier` | `pdfClassifier` |
| `pdfco` | `pdfattachmentExtraction` | `pdfAttachmentExtraction` |
| `plumsail` | `executeFlowV1ProcessesFlowJobsProcess` | `executeFlowV1ProcessesFlowJobsProcessV2` |
| `plumsail` | `executeFlowV1ProcessesFlowJobsProcessWithGeneratedData` | `executeFlowV1ProcessesFlowJobsProcessWithGeneratedDataMultipleOutputs` |
| `salesforce` | `executeSOSLQuery` | `executeSoslQuery` |
| `signinghub` | `addQRQRCode` | `addQrqrCode` |
| `signinghub` | `updateQRQRCode` | `updateQrqrCode` |
| `slack` | `setDND` | `setDnd` |
| `wordonlinebusiness` | `getFilePDF` | `getFilePdf` |
| `zohosign` | `invokeAPI` | `invokeApi` |

## Renamed `ConnectorNames` keys

Only the TypeScript constant keys change; the associated connector API ID stays
the same.

| API ID | Previous key | New key |
| --- | --- | --- |
| `ftp` | `FTP` | `Ftp` |
| `mailchimp` | `MailChimp` | `Mailchimp` |
| `rss` | `RSS` | `Rss` |
| `smtp` | `SMTP` | `Smtp` |
| `sql` | `SQLServer` | `SqlServer` |
| `starrezrestv1` | `StarRezRESTV1` | `StarRezRestV1` |
| `wdatp` | `MicrosoftDefenderATP` | `MicrosoftDefenderAtp` |

## Removed work-item operation in the prior refresh

`GetWorkItemDetailsV2Options` and `getWorkItemDetailsV2` on the Visual Studio
Team Services client were removed by the earlier catalog refresh, not renamed.
Do not substitute `getWorkItemDetails` without verifying its service contract;
callers needing V2 must retain an earlier SDK until it is supported again.

## Teams type-only migration

Teams imports of `AiInsightResponse` and `AiInsightCollectionResponse` must
become `AIInsightResponse` and `AIInsightCollectionResponse`. The
`listAIInsights` and `getAIInsight` methods replace `listAiInsights` and
`getAiInsight`; their raw operation IDs, routes, and wire fields stay
unchanged. The paged `listAIInsights` return type refers to
`AIInsightResponse`. No request-body or JSON key migration is needed.

## Binary bodies

Binary-root operations accept a `Blob`, not a JSON string. Pass file bytes via
`new Blob([bytes], { type: "application/pdf" })` when the type is known; the
SDK uses `application/octet-stream` when no media type is supplied. The default
Node transport sends the Blob bytes, not a JSON-serialized representation.
