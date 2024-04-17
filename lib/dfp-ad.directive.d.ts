/// <reference types="googletag" />
import { DoCheck, ElementRef, EventEmitter, OnChanges, OnDestroy, SimpleChanges, TemplateRef, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { DfpService } from './dfp.service';
import { DfpAd } from './types';
import { SlotRenderEndedEvent, SlotVisibilityChangedEvent } from './events';
import * as i0 from "@angular/core";
export declare class DfpAdDirective implements DoCheck, OnChanges, OnDestroy {
    private viewContainer;
    private dfp;
    private router?;
    private elementRef?;
    private templateRef?;
    private $destroy;
    private $update;
    private element?;
    private slot?;
    renderEnded: EventEmitter<SlotRenderEndedEvent>;
    visibilityChanged: EventEmitter<SlotVisibilityChangedEvent>;
    set dfpAd(dfpAd: string | DfpAd);
    unitPath: string;
    id?: string;
    size?: googletag.GeneralSize;
    sizeMapping?: googletag.SizeMappingArray;
    categoryExclusion?: string | string[];
    /**
     * This works only for non-SRA requests.
     */
    clickUrl?: string;
    collapseEmptyDiv?: boolean | [boolean, boolean];
    forceSafeFrame?: boolean;
    safeFrameConfig?: googletag.SafeFrameConfig;
    targeting?: Record<string, string | string[]>;
    adsense?: Record<string, string>;
    constructor(platformId: object, viewContainer: ViewContainerRef, dfp: DfpService, router?: Router | undefined, elementRef?: ElementRef<HTMLElement> | undefined, templateRef?: TemplateRef<unknown> | undefined);
    private init;
    create(): void;
    display(): void;
    clear(): void;
    destroy(): void;
    ngDoCheck(): void;
    ngOnChanges(changes: SimpleChanges): void;
    ngOnDestroy(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<DfpAdDirective, [null, null, null, { optional: true; }, { optional: true; }, { optional: true; }]>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<DfpAdDirective, "[dfpAd]", ["dfpAd"], { "dfpAd": { "alias": "dfpAd"; "required": false; }; "id": { "alias": "dfpAdId"; "required": false; }; "size": { "alias": "dfpAdSize"; "required": false; }; "sizeMapping": { "alias": "dfpAdSizeMapping"; "required": false; }; "categoryExclusion": { "alias": "dfpAdCategoryExclusion"; "required": false; }; "clickUrl": { "alias": "dfpAdClickUrl"; "required": false; }; "collapseEmptyDiv": { "alias": "dfpAdCollapseEmptyDiv"; "required": false; }; "forceSafeFrame": { "alias": "dfpAdForceSafeFrame"; "required": false; }; "safeFrameConfig": { "alias": "dfpAdSafeFrameConfig"; "required": false; }; "targeting": { "alias": "dfpAdTargeting"; "required": false; }; "adsense": { "alias": "dfpAdAdsense"; "required": false; }; }, { "renderEnded": "renderEnded"; "visibilityChanged": "visibilityChanged"; }, never, never, false, never>;
}
