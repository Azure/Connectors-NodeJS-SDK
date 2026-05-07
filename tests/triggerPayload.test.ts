// Copyright (c) Microsoft Corporation.  All rights reserved.

import { TriggerCallbackPayload, TriggerCallbackBody } from "../src/azureConnectors/triggerPayload.ts";
import { GraphClientReceiveMessage } from "../src/generated/Office365Extensions.ts";

describe("TriggerCallbackPayload", () => {
    it("should match AI Gateway trigger callback structure", () => {
        const payload: TriggerCallbackPayload<GraphClientReceiveMessage> = {
            body: {
                value: [
                    {
                        id: "msg-1",
                        subject: "Hello",
                        isRead: false,
                    },
                    {
                        id: "msg-2",
                        subject: "World",
                        isRead: true,
                    },
                ],
            },
        };

        expect(payload.body?.value).toHaveLength(2);
        expect(payload.body?.value?.[0].subject).toBe("Hello");
        expect(payload.body?.value?.[1].isRead).toBe(true);
    });

    it("should handle empty trigger payload", () => {
        const payload: TriggerCallbackPayload<GraphClientReceiveMessage> = {};
        expect(payload.body).toBeUndefined();
    });

    it("should handle body with empty value array", () => {
        const body: TriggerCallbackBody<GraphClientReceiveMessage> = {
            value: [],
        };

        expect(body.value).toHaveLength(0);
    });
});
