// Copyright (c) Microsoft Corporation.  All rights reserved.

import type { HandSignature } from "../src/generated/SigninghubExtensions.ts";
import type { ChannelWithOwnerTeamId, ChatMessageList } from "../src/generated/TeamsExtensions.ts";

describe("generated root schema shapes", () => {
    it("should preserve array roots as typed arrays on the wire", () => {
        const messages: ChatMessageList = [
            { id: "message-1", summary: "Hello" },
        ];

        expect(JSON.parse(JSON.stringify(messages))).toEqual([
            { id: "message-1", summary: "Hello" },
        ]);
    });

    it("should preserve integer enum roots as numbers on the wire", () => {
        const signature: HandSignature = 3;

        expect(JSON.parse(JSON.stringify(signature))).toBe(3);
        expect(typeof JSON.parse(JSON.stringify(signature))).toBe("number");
    });

    it("should preserve referenced and inline allOf fields on the wire", () => {
        const channel: ChannelWithOwnerTeamId = {
            id: "channel-1",
            displayName: "General",
            ownerTeamId: "team-1",
        };

        expect(JSON.parse(JSON.stringify(channel))).toEqual({
            id: "channel-1",
            displayName: "General",
            ownerTeamId: "team-1",
        });
    });
});
