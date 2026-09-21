// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { TokenCredential } from "@azure/core-auth";
import * as fs from "node:fs";
import * as path from "node:path";
import {
    TeamsClient,
    TeamsTriggerOperations,
    TeamsTriggerParameters,
} from "../src/generated/TeamsExtensions.ts";

// ──────────────────────────────────────────────
// Test helpers
// ──────────────────────────────────────────────

const TeamsConnectionUrl = "https://connection-runtime.azure.com/apim/teams/abc123";
const GeneratedDirectory = path.join(process.cwd(), "src", "generated");
const StandardActionVerbs = new Set([
    "add", "approve", "cancel", "copy", "create", "decline", "delete", "disable", "download", "enable",
    "execute", "export", "finish", "forward", "get", "list", "move", "patch", "register", "reject",
    "remove", "rename", "replace", "resume", "rerun", "run", "search", "send", "set", "start", "stop",
    "submit", "test", "unregister", "update", "upload", "upsert", "validate",
]);
const CuratedActionMethodNames = new Set([
    "Sendgrid.checkEmailIsInUnsubscribesList",
]);

/**
 * A single generated connector extension file paired with its raw source text.
 */
interface GeneratedExtensionFile {
    connector: string;
    content: string;
}

function createMockCredential(): TokenCredential {
    return {
        getToken: async () => ({ token: "mock-bearer-token", expiresOnTimestamp: Number.MAX_SAFE_INTEGER }),
    };
}

/**
 * Reads every generated <c>*Extensions.ts</c> file so tests can assert on the emitted surface.
 */
function loadGeneratedExtensionFiles(): GeneratedExtensionFile[] {
    return fs
        .readdirSync(GeneratedDirectory)
        .filter(entry => entry.endsWith("Extensions.ts"))
        .map(entry => ({
            connector: entry.replace("Extensions.ts", ""),
            content: fs.readFileSync(path.join(GeneratedDirectory, entry), "utf8"),
        }));
}

/**
 * Converts a swagger operation identifier to the client method name the generator would emit for it.
 */
function toClientMethodName(operationId: string): string {
    return operationId.length > 0
        ? operationId.charAt(0).toLowerCase() + operationId.slice(1)
        : operationId;
}

/**
 * Extracts the names of every generated public client method in the source text.
 */
function extractClientMethodNames(content: string): string[] {
    const methodNames: string[] = [];
    const methodRegex = /public\s+(?:async\s+)?(\w+)\s*\(/g;
    let match: RegExpExecArray | null;
    while ((match = methodRegex.exec(content)) !== null) {
        methodNames.push(match[1]);
    }

    return methodNames;
}

function splitIdentifierWords(identifier: string): string[] {
    return identifier.match(/[A-Z]+(?=[A-Z][a-z]|\d|$)|[A-Z]?[a-z]+|[A-Z]?\d+/g) ?? [];
}

/**
 * Extracts both the simplified names and operation IDs declared in every <c>*TriggerOperations</c> block.
 */
function extractTriggerOperationIdentifiers(content: string): string[] {
    const identifiers: string[] = [];
    const blockRegex = /export const \w+TriggerOperations\s*=\s*\{([\s\S]*?)\}\s*as const;/g;
    let blockMatch: RegExpExecArray | null;
    while ((blockMatch = blockRegex.exec(content)) !== null) {
        const entryRegex = /(\w+)\s*:\s*"([^"]+)"/g;
        let entryMatch: RegExpExecArray | null;
        while ((entryMatch = entryRegex.exec(blockMatch[1])) !== null) {
            identifiers.push(entryMatch[1], entryMatch[2]);
        }
    }

    return identifiers;
}

// ──────────────────────────────────────────────
// 1. Teams generated trigger metadata
// ──────────────────────────────────────────────

describe("Teams generated surface — trigger operation IDs", () => {
    it("should map representative trigger operations to their swagger operation IDs", () => {
        expect(TeamsTriggerOperations.OnNewChannelMessage).toBe("OnNewChannelMessage");
        expect(TeamsTriggerOperations.OnNewChannelMessageMentioningMe).toBe("OnNewChannelMessageMentioningMe");
        expect(TeamsTriggerOperations.OnWebhookKeywordTrigger).toBe("WebhookKeywordTrigger");
    });

    it("should preserve simplified names that differ from the operation ID", () => {
        expect(TeamsTriggerOperations.OnTeamMemberAdded).toBe("OnGroupMembershipAdd");
        expect(TeamsTriggerOperations.OnTeamMemberRemoved).toBe("OnGroupMembershipRemoval");
    });
});

describe("Teams generated surface — trigger parameter metadata", () => {
    it("should expose the expected parameters for OnNewChannelMessage", () => {
        expect(Object.keys(TeamsTriggerParameters.OnNewChannelMessage)).toEqual(["groupId", "channelId", "top"]);
    });

    it("should carry dynamic value lookups for team and channel parameters", () => {
        expect(TeamsTriggerParameters.OnNewChannelMessage.groupId.name).toBe("groupId");
        expect(TeamsTriggerParameters.OnNewChannelMessage.groupId.type).toBe("string");
        expect(TeamsTriggerParameters.OnNewChannelMessage.groupId.required).toBe(true);
        expect(TeamsTriggerParameters.OnNewChannelMessage.groupId.dynamicValuesOperationId).toBe("GetAllTeams");
        expect(TeamsTriggerParameters.OnNewChannelMessage.channelId.dynamicValuesOperationId).toBe("GetChannelsForGroup");
    });

    it("should carry the optional $top parameter with its default value", () => {
        expect(TeamsTriggerParameters.OnNewChannelMessage.top.name).toBe("$top");
        expect(TeamsTriggerParameters.OnNewChannelMessage.top.type).toBe("integer");
        expect(TeamsTriggerParameters.OnNewChannelMessage.top.required).toBe(false);
        expect(TeamsTriggerParameters.OnNewChannelMessage.top.defaultValue).toBe("50");
    });

    it("should carry the required $search keyword parameter for the keyword trigger", () => {
        expect(TeamsTriggerParameters.OnWebhookKeywordTrigger.search.name).toBe("$search");
        expect(TeamsTriggerParameters.OnWebhookKeywordTrigger.search.required).toBe(true);
    });

    it("should carry allowed values for constrained parameters", () => {
        expect(TeamsTriggerParameters.OnWebhookAtMentionTrigger.threadType.allowedValues).toEqual(["groupchat", "channel"]);
    });
});

// ──────────────────────────────────────────────
// 2. Trigger operations are not invokable client methods
// ──────────────────────────────────────────────

describe("Teams generated surface — triggers are not data-plane methods", () => {
    it("should not expose onNewChannelMessage on TeamsClient", () => {
        const client = new TeamsClient(TeamsConnectionUrl, createMockCredential());
        const clientMembers = client as unknown as Record<string, unknown>;

        expect(clientMembers.onNewChannelMessage).toBeUndefined();
        expect(Object.getOwnPropertyNames(Object.getPrototypeOf(client))).not.toContain("onNewChannelMessage");
    });

    it("should not expose any Teams trigger operation as a client method", () => {
        const client = new TeamsClient(TeamsConnectionUrl, createMockCredential());
        const clientMembers = client as unknown as Record<string, unknown>;

        const triggerOperationIds = [
            ...Object.keys(TeamsTriggerOperations),
            ...Object.values(TeamsTriggerOperations),
        ];

        for (const operationId of triggerOperationIds) {
            expect(clientMembers[toClientMethodName(operationId)]).toBeUndefined();
        }
    });
});

// ──────────────────────────────────────────────
// 3. No generated client invokes a trigger route directly
// ──────────────────────────────────────────────

describe("Generated clients — no trigger operation is invoked as a data-plane method", () => {
    const generatedFiles = loadGeneratedExtensionFiles();

    it("should discover the generated extension files", () => {
        expect(generatedFiles.length).toBeGreaterThanOrEqual(10);
    });

    it("should discover Promise and pageable client methods", () => {
        const arm = generatedFiles.find(file => file.connector === "Arm");
        expect(arm).toBeDefined();

        const methodNames = extractClientMethodNames(arm!.content);
        expect(methodNames).toEqual(expect.arrayContaining(["getSubscription", "listSubscriptions"]));
    });

    it("should project standardized action verbs before resource nouns", () => {
        const violations = generatedFiles.flatMap(file => extractClientMethodNames(file.content).flatMap(methodName => {
            if (CuratedActionMethodNames.has(`${file.connector}.${methodName}`)) {
                return [];
            }

            const words = splitIdentifierWords(methodName).map(word => word.toLowerCase());
            if (StandardActionVerbs.has(words[0])) {
                return [];
            }

            const actionVerb = words.slice(1).find(word => StandardActionVerbs.has(word));
            return actionVerb === undefined
                ? []
                : [`${file.connector}.${methodName} contains '${actionVerb}' after its resource noun`];
        }));

        expect(violations).toEqual([]);
    });

    it("should collect optional service parameters in method-specific options bags", () => {
        const violations = generatedFiles.flatMap(file => {
            const methodRegex = /public\s+(?:async\s+)?(\w+)\s*\(([^)]*)\)/g;
            const fileViolations: string[] = [];
            let match: RegExpExecArray | null;
            while ((match = methodRegex.exec(file.content)) !== null) {
                if (/\b\w+\?:/.test(match[2])) {
                    fileViolations.push(`${file.connector}.${match[1]} has a positional optional parameter`);
                }
            }

            return fileViolations;
        });

        expect(violations).toEqual([]);
    });

    it("should expose semantic Teams list operations as iterators", () => {
        const teams = generatedFiles.find(file => file.connector === "Teams");
        expect(teams).toBeDefined();
        expect(teams!.content).toMatch(
            /public getAllChannelsForTeam\([^)]*\): ConnectorPagedAsyncIterableIterator<ChannelWithOwnerTeamId>/,
        );
        expect(teams!.content).toMatch(
            /public getChats\([^)]*\): ConnectorPagedAsyncIterableIterator<Record<string, unknown>>/,
        );
    });

    it("should emit query and header service options without leaking transport types", () => {
        const arm = generatedFiles.find(file => file.connector === "Arm");
        const revai = generatedFiles.find(file => file.connector === "Revai");
        expect(arm).toBeDefined();
        expect(revai).toBeDefined();
        expect(arm!.content).toContain("export interface ListResourceGroupsOptions extends ConnectorOperationOptions");
        expect(arm!.content).toContain("options.filter");
        expect(revai!.content).toContain("export interface GetCaptionsOptions extends ConnectorOperationOptions");
        expect(revai!.content).toContain("requestHeaders[\"Accept\"] = String(options.accept);");
    });

    it("should preserve named empty-object model references", () => {
        const commonDataService = generatedFiles.find(file => file.connector === "Commondataservice");
        expect(commonDataService).toBeDefined();
        expect(commonDataService!.content).toContain("schema?: ObjectEntity;");
        expect(commonDataService!.content).toContain("export interface ObjectEntity");
    });

    it("should preserve curated connector action names", () => {
        const clickSend = generatedFiles.find(file => file.connector === "Clicksendsms");
        const googleTasks = generatedFiles.find(file => file.connector === "Googletasks");
        const sendGrid = generatedFiles.find(file => file.connector === "Sendgrid");
        expect(clickSend).toBeDefined();
        expect(googleTasks).toBeDefined();
        expect(sendGrid).toBeDefined();

        expect(extractClientMethodNames(clickSend!.content)).toEqual(expect.arrayContaining([
            "createList",
            "deleteList",
            "createListContact",
            "deleteListContact",
        ]));
        expect(extractClientMethodNames(googleTasks!.content)).toContain("getTask");
        expect(extractClientMethodNames(sendGrid!.content)).toContain("checkEmailIsInUnsubscribesList");
    });

    it("should project CreateOrUpdate operations as upserts", () => {
        const arm = generatedFiles.find(file => file.connector === "Arm");
        expect(arm).toBeDefined();
        expect(extractClientMethodNames(arm!.content)).toEqual(expect.arrayContaining([
            "upsertDeployment",
            "upsertResourceGroup",
            "upsertResourceById",
            "upsertTag",
            "upsertTagValue",
        ]));
        expect(arm!.content).not.toMatch(/public async create\w+OrUpdate/);
    });

    it("should not emit self-extending operation options types", () => {
        const violations = generatedFiles.flatMap(file => {
            const selfExtendingInterface = /export interface (\w+) extends \1\b/g;
            return [...file.content.matchAll(selfExtendingInterface)].map(match => `${file.connector}.${match[1]}`);
        });

        expect(violations).toEqual([]);
    });

    it.each(generatedFiles)(
        "should not expose a trigger operation as a client method in $connector",
        (file: GeneratedExtensionFile) => {
            const methodNames = new Set(extractClientMethodNames(file.content));
            const triggerMethodCandidates = extractTriggerOperationIdentifiers(file.content).map(toClientMethodName);
            const violations = triggerMethodCandidates.filter(candidate => methodNames.has(candidate));

            expect(violations).toEqual([]);
        },
    );

    // NOTE(swapnilnagar): Docusign's 'triggerMaestroFlow' is a real action on a '/trigger/' path,
    // so the guard cross-references trigger operation IDs instead of substring-matching the route.
    it("should treat the Docusign Maestro action as an action, not a trigger", () => {
        const docusign = generatedFiles.find(file => file.connector === "Docusign");
        expect(docusign).toBeDefined();

        const methodNames = new Set(extractClientMethodNames(docusign!.content));
        const triggerMethodCandidates = extractTriggerOperationIdentifiers(docusign!.content).map(toClientMethodName);

        // NOTE(swapnilnagar): Anchor the naming convention — round-tripping a known action operationId through
        // toClientMethodName must land on a real emitted method. Otherwise a convention drift leaves
        // triggerMethodCandidates matching nothing and the violations check passes vacuously.
        expect(methodNames.has(toClientMethodName("TriggerMaestroFlow"))).toBe(true);
        expect(methodNames.has("triggerMaestroFlow")).toBe(true);
        expect(triggerMethodCandidates).not.toContain("triggerMaestroFlow");
    });
});
