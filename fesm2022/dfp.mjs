import * as i0 from '@angular/core';
import { InjectionToken, PLATFORM_ID, Injectable, Inject, EventEmitter, Directive, Optional, Output, Input, NgModule } from '@angular/core';
import * as i1 from 'rxjs';
import { of, Subject, timer, EMPTY } from 'rxjs';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { buffer, switchMap, filter, take, takeUntil } from 'rxjs/operators';
import * as i2 from '@angular/router';
import { NavigationEnd } from '@angular/router';

/* eslint-disable no-unused-vars */
const DELAY_TIME = 50;
var GPT_SOURCE;
(function (GPT_SOURCE) {
    GPT_SOURCE["STANDARD"] = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
    GPT_SOURCE["LIMITED_ADS"] = "https://pagead2.googlesyndication.com/tag/js/gpt.js";
})(GPT_SOURCE || (GPT_SOURCE = {}));
const GPT_LOADER = new InjectionToken('GPT_LOADER', {
    providedIn: 'root',
    factory: () => of(GPT_SOURCE.STANDARD),
});

class Event {
    constructor(event) {
        Object.assign(this, event);
    }
}
class ImpressionViewableEvent extends Event {
}
class RewardedSlotClosedEvent extends Event {
}
class RewardedSlotGrantedEvent extends Event {
}
class RewardedSlotReadyEvent extends Event {
}
class SlotOnloadEvent extends Event {
}
class SlotRenderEndedEvent extends Event {
}
class SlotRequestedEvent extends Event {
}
class SlotResponseReceived extends Event {
}
class SlotVisibilityChangedEvent extends Event {
}
const EVENT_TYPES = [
    'impressionViewable',
    'rewardedSlotClosed',
    'rewardedSlotGranted',
    'rewardedSlotReady',
    'slotRequested',
    'slotResponseReceived',
    'slotRenderEnded',
    'slotOnload',
    'slotVisibilityChanged',
];
function eventFactory(type, event) {
    switch (type) {
        case 'impressionViewable':
            return new ImpressionViewableEvent(event);
        case 'rewardedSlotClosed':
            return new RewardedSlotClosedEvent(event);
        case 'rewardedSlotGranted':
            return new RewardedSlotGrantedEvent(event);
        case 'rewardedSlotReady':
            return new RewardedSlotReadyEvent(event);
        case 'slotRequested':
            return new SlotRequestedEvent(event);
        case 'slotResponseReceived':
            return new SlotResponseReceived(event);
        case 'slotRenderEnded':
            return new SlotRenderEndedEvent(event);
        case 'slotOnload':
            return new SlotOnloadEvent(event);
        case 'slotVisibilityChanged':
            return new SlotVisibilityChangedEvent(event);
    }
}

class SlotRequest {
    constructor(slot) {
        this.slot = slot;
    }
}
class DisplaySlot extends SlotRequest {
}
class RefreshSlot extends SlotRequest {
}

class DfpService {
    get events() {
        return this.$events.asObservable();
    }
    constructor(platformId, document, gptLoader) {
        this.platformId = platformId;
        this.document = document;
        this.gptLoader = gptLoader;
        this.$singleRequest = new Subject();
        this.$events = new Subject();
        this.disableRefreshSlots = false;
        if (isPlatformBrowser(this.platformId)) {
            this.init();
        }
    }
    init() {
        // GPT
        this.gptLoader.subscribe((gptSource) => {
            this.appendScript({ async: true, src: gptSource });
        });
        // Single Request Queue
        this.$singleRequest
            .pipe(buffer(this.$singleRequest.pipe(switchMap(() => timer(DELAY_TIME * 2)))))
            .subscribe((acts) => {
            if (this.beforeDisplay && typeof this.beforeDisplay === 'function') {
                this.beforeDisplay(acts.map(act => act.slot));
            }
            const refreshSlots = [];
            acts.forEach((act) => {
                if (act instanceof DisplaySlot) {
                    googletag.display(act.slot);
                }
                if (act instanceof RefreshSlot ||
                    googletag.pubads().isInitialLoadDisabled()) {
                    refreshSlots.push(act.slot);
                }
            });
            if (refreshSlots.length > 0 && !this.disableRefreshSlots) {
                googletag.pubads().refresh(refreshSlots);
            }
        });
        // Event Listeners
        googletag.cmd.push(() => {
            EVENT_TYPES.forEach((type) => googletag.pubads().addEventListener(type, (event) => {
                this.$events.next(eventFactory(type, event));
            }));
        });
    }
    define(ad, definedSlot) {
        const id = ad.id || '';
        let slot;
        if (definedSlot) {
            slot = definedSlot;
        }
        else {
            const exists = this.getSlot(id);
            if (exists) {
                this.destroy(exists);
            }
            if (ad.size) {
                slot = googletag.defineSlot(ad.unitPath, ad.size, id);
            }
            else {
                slot = googletag.defineOutOfPageSlot(ad.unitPath, id);
            }
        }
        slot
            .clearCategoryExclusions()
            .clearTargeting()
            .defineSizeMapping(ad.sizeMapping || [])
            .updateTargetingFromMap(ad.targeting || {})
            .setClickUrl(ad.clickUrl || '')
            .setForceSafeFrame(ad.forceSafeFrame || false)
            .setSafeFrameConfig(ad.safeFrameConfig || {});
        if (ad.categoryExclusion instanceof Array) {
            ad.categoryExclusion.forEach((cat) => slot.setCategoryExclusion(cat));
        }
        else if ('string' === typeof ad.categoryExclusion) {
            slot.setCategoryExclusion(ad.categoryExclusion);
        }
        if (ad.collapseEmptyDiv instanceof Array) {
            slot.setCollapseEmptyDiv(ad.collapseEmptyDiv[0], ad.collapseEmptyDiv[1]);
        }
        else if ('boolean' === typeof ad.collapseEmptyDiv) {
            slot.setCollapseEmptyDiv(ad.collapseEmptyDiv);
        }
        const attributes = ad.adsense || {};
        for (const key in attributes) {
            const attributeName = key;
            slot.set(attributeName, attributes[attributeName] ?? '');
        }
        slot.addService(googletag.pubads());
        googletag.enableServices();
        return slot;
    }
    display(slot) {
        this.$singleRequest.next(new DisplaySlot(slot));
    }
    refresh(slot) {
        this.$singleRequest.next(new RefreshSlot(slot));
    }
    /**
     * Displays a rewarded ad. This method should not be called until the user has consented to view the ad.
     */
    rewarded(ad) {
        const rewarded = googletag.defineOutOfPageSlot(ad.unitPath, googletag.enums.OutOfPageFormat.REWARDED);
        if (rewarded === null) {
            return EMPTY;
        }
        googletag.display(this.define(ad, rewarded));
        return this.events.pipe(filter((event) => {
            if (event.slot === rewarded) {
                if (event instanceof RewardedSlotReadyEvent) {
                    event.makeRewardedVisible();
                }
                return ((event instanceof SlotRenderEndedEvent && event.isEmpty) ||
                    event instanceof RewardedSlotGrantedEvent ||
                    event instanceof RewardedSlotClosedEvent);
            }
            return false;
        }), take(1));
    }
    destroy(slot) {
        googletag.destroySlots([slot]);
    }
    getSlot(elementId) {
        return this.getSlots().find((slot) => elementId === slot.getSlotElementId());
    }
    getSlots(elementIds) {
        const slots = googletag.pubads().getSlots();
        return slots.filter((slot) => !elementIds || elementIds.indexOf(slot.getSlotElementId()) !== -1);
    }
    /**
     * Use googletag.cmd.push() to execute the callback function.
     * @param callback
     */
    cmd(callback) {
        if (isPlatformBrowser(this.platformId)) {
            googletag.cmd.push(callback);
            return true;
        }
        return false;
    }
    appendScript(options, parentNode) {
        parentNode = parentNode || this.document.head;
        const oldScript = options.id
            ? parentNode.querySelector('#' + options.id)
            : null;
        const script = this.document.createElement('script');
        Object.assign(script, options, { type: 'text/javascript' });
        if (oldScript) {
            parentNode.replaceChild(script, oldScript);
        }
        else {
            this.appendText('\n', parentNode);
            parentNode.appendChild(script);
            this.appendText('\n', parentNode);
        }
        return script;
    }
    appendText(data, parentNode) {
        parentNode = parentNode || this.document.head;
        const text = this.document.createTextNode(data);
        parentNode.appendChild(text);
        return text;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.2", ngImport: i0, type: DfpService, deps: [{ token: PLATFORM_ID }, { token: DOCUMENT }, { token: GPT_LOADER }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "16.2.2", ngImport: i0, type: DfpService, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.2", ngImport: i0, type: DfpService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }, { type: Document, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i1.Observable, decorators: [{
                    type: Inject,
                    args: [GPT_LOADER]
                }] }]; } });

/* eslint-disable @angular-eslint/no-conflicting-lifecycle */
class DfpAdDirective {
    set dfpAd(dfpAd) {
        if (typeof dfpAd === 'string') {
            this.unitPath = dfpAd;
        }
        else {
            Object.assign(this, dfpAd);
        }
    }
    constructor(platformId, viewContainer, dfp, router, elementRef, templateRef) {
        this.viewContainer = viewContainer;
        this.dfp = dfp;
        this.router = router;
        this.elementRef = elementRef;
        this.templateRef = templateRef;
        this.$destroy = new Subject();
        this.$update = new Subject();
        this.renderEnded = new EventEmitter();
        this.visibilityChanged = new EventEmitter();
        if (isPlatformBrowser(platformId)) {
            this.init();
        }
    }
    init() {
        this.$update
            .pipe(switchMap(() => timer(DELAY_TIME)), takeUntil(this.$destroy))
            .subscribe(() => {
            this.dfp.cmd(() => this.display());
        });
        this.dfp.events
            .pipe(filter((event) => event.slot === this.slot), takeUntil(this.$destroy))
            .subscribe((event) => {
            if (event instanceof SlotRenderEndedEvent) {
                this.renderEnded.emit(event);
            }
            else if (event instanceof SlotVisibilityChangedEvent) {
                this.visibilityChanged.emit(event);
            }
        });
        this.router &&
            this.router.events
                .pipe(filter((event) => event instanceof NavigationEnd), takeUntil(this.$destroy))
                .subscribe(() => {
                this.$update.next();
            });
    }
    create() {
        if (this.unitPath) {
            if (!this.element) {
                if (this.templateRef) {
                    const view = this.viewContainer.createEmbeddedView(this.templateRef);
                    this.element = view.rootNodes[0];
                }
                else if (this.elementRef) {
                    this.element = this.elementRef.nativeElement;
                }
            }
            this.$update.next();
        }
        else {
            this.clear();
        }
    }
    display() {
        if (!this.element || this.element.innerText.match(/\S+/)) {
            return;
        }
        let parentElement = this.element.parentElement;
        while (parentElement) {
            if (parentElement.getAttribute('ng-version')) {
                break;
            }
            if (parentElement.style.visibility === 'hidden' ||
                parentElement.style.display === 'none') {
                return;
            }
            parentElement = parentElement.parentElement;
        }
        if (this.slot && this.id === this.element.id) {
            this.dfp.define(this, this.slot);
            this.dfp.refresh(this.slot);
        }
        else {
            this.destroy();
            const id = this.element.id || this.id;
            this.slot = this.dfp.define(Object.assign({}, this, { id: id }));
            this.element.id = id || this.slot.getSlotElementId();
            this.id = this.element.id;
            this.dfp.display(this.slot);
        }
    }
    clear() {
        this.viewContainer.clear();
        this.element = undefined;
        this.destroy();
    }
    destroy() {
        if (this.slot) {
            this.dfp.destroy(this.slot);
            this.slot = undefined;
        }
    }
    ngDoCheck() {
        if (this.element && this.element.id && this.id !== this.element.id) {
            this.id = this.element.id;
            this.destroy();
            this.create();
        }
    }
    ngOnChanges(changes) {
        const change = changes['dfpAd'] || changes['id'] || changes['size'];
        if (change && !change.isFirstChange()) {
            this.clear();
        }
        this.create();
    }
    ngOnDestroy() {
        this.$destroy.next();
        this.clear();
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.2", ngImport: i0, type: DfpAdDirective, deps: [{ token: PLATFORM_ID }, { token: i0.ViewContainerRef }, { token: DfpService }, { token: i2.Router, optional: true }, { token: i0.ElementRef, optional: true }, { token: i0.TemplateRef, optional: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.2.2", type: DfpAdDirective, selector: "[dfpAd]", inputs: { dfpAd: "dfpAd", id: ["dfpAdId", "id"], size: ["dfpAdSize", "size"], sizeMapping: ["dfpAdSizeMapping", "sizeMapping"], categoryExclusion: ["dfpAdCategoryExclusion", "categoryExclusion"], clickUrl: ["dfpAdClickUrl", "clickUrl"], collapseEmptyDiv: ["dfpAdCollapseEmptyDiv", "collapseEmptyDiv"], forceSafeFrame: ["dfpAdForceSafeFrame", "forceSafeFrame"], safeFrameConfig: ["dfpAdSafeFrameConfig", "safeFrameConfig"], targeting: ["dfpAdTargeting", "targeting"], adsense: ["dfpAdAdsense", "adsense"] }, outputs: { renderEnded: "renderEnded", visibilityChanged: "visibilityChanged" }, exportAs: ["dfpAd"], usesOnChanges: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.2", ngImport: i0, type: DfpAdDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[dfpAd]',
                    exportAs: 'dfpAd',
                }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }, { type: i0.ViewContainerRef }, { type: DfpService }, { type: i2.Router, decorators: [{
                    type: Optional
                }] }, { type: i0.ElementRef, decorators: [{
                    type: Optional
                }] }, { type: i0.TemplateRef, decorators: [{
                    type: Optional
                }] }]; }, propDecorators: { renderEnded: [{
                type: Output
            }], visibilityChanged: [{
                type: Output
            }], dfpAd: [{
                type: Input
            }], id: [{
                type: Input,
                args: ['dfpAdId']
            }], size: [{
                type: Input,
                args: ['dfpAdSize']
            }], sizeMapping: [{
                type: Input,
                args: ['dfpAdSizeMapping']
            }], categoryExclusion: [{
                type: Input,
                args: ['dfpAdCategoryExclusion']
            }], clickUrl: [{
                type: Input,
                args: ['dfpAdClickUrl']
            }], collapseEmptyDiv: [{
                type: Input,
                args: ['dfpAdCollapseEmptyDiv']
            }], forceSafeFrame: [{
                type: Input,
                args: ['dfpAdForceSafeFrame']
            }], safeFrameConfig: [{
                type: Input,
                args: ['dfpAdSafeFrameConfig']
            }], targeting: [{
                type: Input,
                args: ['dfpAdTargeting']
            }], adsense: [{
                type: Input,
                args: ['dfpAdAdsense']
            }] } });

const DFP_DIRECTIVES = [DfpAdDirective];
class DfpModule {
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.2", ngImport: i0, type: DfpModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule }); }
    static { this.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "16.2.2", ngImport: i0, type: DfpModule, declarations: [DfpAdDirective], exports: [DfpAdDirective] }); }
    static { this.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "16.2.2", ngImport: i0, type: DfpModule }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.2.2", ngImport: i0, type: DfpModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: DFP_DIRECTIVES,
                    exports: DFP_DIRECTIVES,
                }]
        }] });

/*
 * Public API Surface of dfp
 */
globalThis.googletag = globalThis.googletag || { cmd: [] };

/**
 * Generated bundle index. Do not edit.
 */

export { DELAY_TIME, DfpAdDirective, DfpModule, DfpService, EVENT_TYPES, Event, GPT_LOADER, GPT_SOURCE, ImpressionViewableEvent, RewardedSlotClosedEvent, RewardedSlotGrantedEvent, RewardedSlotReadyEvent, SlotOnloadEvent, SlotRenderEndedEvent, SlotRequestedEvent, SlotResponseReceived, SlotVisibilityChangedEvent, eventFactory };
//# sourceMappingURL=dfp.mjs.map
