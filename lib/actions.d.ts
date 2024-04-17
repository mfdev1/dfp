/// <reference types="googletag" />
declare class SlotRequest {
    slot: googletag.Slot;
    constructor(slot: googletag.Slot);
}
export declare class DisplaySlot extends SlotRequest {
}
export declare class RefreshSlot extends SlotRequest {
}
export type Request = DisplaySlot | RefreshSlot;
export {};
