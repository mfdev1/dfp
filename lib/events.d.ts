/// <reference types="googletag" />
export declare class Event implements googletag.events.Event {
    serviceName: string;
    slot: googletag.Slot;
    constructor(event: googletag.events.Event);
}
export declare class ImpressionViewableEvent extends Event {
}
export declare class RewardedSlotClosedEvent extends Event {
}
export declare class RewardedSlotGrantedEvent extends Event implements googletag.events.RewardedSlotGrantedEvent {
    payload: googletag.RewardedPayload | null;
}
export declare class RewardedSlotReadyEvent extends Event implements googletag.events.RewardedSlotReadyEvent {
    makeRewardedVisible: () => void;
}
export declare class SlotOnloadEvent extends Event {
}
export declare class SlotRenderEndedEvent extends Event implements googletag.events.SlotRenderEndedEvent {
    companyIds: number[] | null;
    creativeTemplateId: number | null;
    isBackfill: boolean;
    labelIds: number[] | null;
    slotContentChanged: boolean;
    yieldGroupIds: number[] | null;
    advertiserId: number | null;
    campaignId: number | null;
    creativeId: number | null;
    isEmpty: boolean;
    lineItemId: number | null;
    size: string | number[] | null;
    sourceAgnosticCreativeId: number | null;
    sourceAgnosticLineItemId: number | null;
}
export declare class SlotRequestedEvent extends Event {
}
export declare class SlotResponseReceived extends Event {
}
export declare class SlotVisibilityChangedEvent extends Event implements googletag.events.SlotVisibilityChangedEvent {
    inViewPercentage: number;
}
export declare const EVENT_TYPES: Array<keyof googletag.events.EventTypeMap>;
export declare function eventFactory(type: keyof googletag.events.EventTypeMap, event: googletag.events.Event): Event;
