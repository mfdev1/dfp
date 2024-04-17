/// <reference types="googletag" />
import { Observable } from 'rxjs';
import { GPT_SOURCE } from './consts';
import { Event, RewardedSlotGrantedEvent, RewardedSlotClosedEvent, SlotRenderEndedEvent } from './events';
import { ScriptOptions, DfpAd } from './types';
import * as i0 from "@angular/core";
export declare class DfpService {
    private platformId;
    private document;
    private gptLoader;
    private $singleRequest;
    private $events;
    get events(): Observable<Event>;
    beforeDisplay?: (slots: Array<googletag.Slot>) => void;
    disableRefreshSlots: boolean;
    constructor(platformId: object, document: Document, gptLoader: Observable<GPT_SOURCE>);
    private init;
    define(ad: DfpAd, definedSlot?: googletag.Slot): googletag.Slot;
    display(slot: googletag.Slot): void;
    refresh(slot: googletag.Slot): void;
    /**
     * Displays a rewarded ad. This method should not be called until the user has consented to view the ad.
     */
    rewarded(ad: DfpAd): Observable<RewardedSlotClosedEvent | RewardedSlotGrantedEvent | SlotRenderEndedEvent>;
    destroy(slot: googletag.Slot): void;
    getSlot(elementId: string): googletag.Slot | undefined;
    getSlots(elementIds?: string[]): googletag.Slot[];
    /**
     * Use googletag.cmd.push() to execute the callback function.
     * @param callback
     */
    cmd(callback: () => void): boolean;
    appendScript(options: ScriptOptions, parentNode?: Element): HTMLScriptElement;
    appendText(data: string, parentNode?: Element): Text;
    static ɵfac: i0.ɵɵFactoryDeclaration<DfpService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<DfpService>;
}
