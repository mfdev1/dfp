import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { EMPTY, Subject, timer } from 'rxjs';
import { buffer, filter, switchMap, take } from 'rxjs/operators';
import { DELAY_TIME, GPT_LOADER } from './consts';
import { EVENT_TYPES, eventFactory, RewardedSlotReadyEvent, RewardedSlotGrantedEvent, RewardedSlotClosedEvent, SlotRenderEndedEvent, } from './events';
import { DisplaySlot, RefreshSlot } from './actions';
import * as i0 from "@angular/core";
import * as i1 from "rxjs";
export class DfpService {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGZwLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2RmcC5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUM5RCxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFFaEUsT0FBTyxFQUFFLEtBQUssRUFBYyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQ3pELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUVqRSxPQUFPLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBYyxNQUFNLFVBQVUsQ0FBQztBQUM5RCxPQUFPLEVBRUwsV0FBVyxFQUNYLFlBQVksRUFDWixzQkFBc0IsRUFDdEIsd0JBQXdCLEVBQ3hCLHVCQUF1QixFQUN2QixvQkFBb0IsR0FDckIsTUFBTSxVQUFVLENBQUM7QUFDbEIsT0FBTyxFQUFXLFdBQVcsRUFBRSxXQUFXLEVBQUUsTUFBTSxXQUFXLENBQUM7OztBQU05RCxNQUFNLE9BQU8sVUFBVTtJQUdyQixJQUFJLE1BQU07UUFDUixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDckMsQ0FBQztJQUtELFlBQytCLFVBQWtCLEVBQ3JCLFFBQWtCLEVBQ2hCLFNBQWlDO1FBRmhDLGVBQVUsR0FBVixVQUFVLENBQVE7UUFDckIsYUFBUSxHQUFSLFFBQVEsQ0FBVTtRQUNoQixjQUFTLEdBQVQsU0FBUyxDQUF3QjtRQVp2RCxtQkFBYyxHQUFHLElBQUksT0FBTyxFQUFXLENBQUM7UUFDeEMsWUFBTyxHQUFHLElBQUksT0FBTyxFQUFTLENBQUM7UUFNdkMsd0JBQW1CLEdBQUcsS0FBSyxDQUFDO1FBTzFCLElB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QU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQzs4R0FuTlUsVUFBVSxrQkFXWCxXQUFXLGFBQ1gsUUFBUSxhQUNSLFVBQVU7a0hBYlQsVUFBVSxjQUZULE1BQU07OzJGQUVQLFVBQVU7a0JBSHRCLFVBQVU7bUJBQUM7b0JBQ1YsVUFBVSxFQUFFLE1BQU07aUJBQ25COzswQkFZSSxNQUFNOzJCQUFDLFdBQVc7OzBCQUNsQixNQUFNOzJCQUFDLFFBQVE7OzBCQUNmLE1BQU07MkJBQUMsVUFBVSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERPQ1VNRU5ULCBpc1BsYXRmb3JtQnJvd3NlciB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQgeyBJbmplY3QsIEluamVjdGFibGUsIFBMQVRGT1JNX0lEIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7IEVNUFRZLCBPYnNlcnZhYmxlLCBTdWJqZWN0LCB0aW1lciB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgYnVmZmVyLCBmaWx0ZXIsIHN3aXRjaE1hcCwgdGFrZSB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHsgREVMQVlfVElNRSwgR1BUX0xPQURFUiwgR1BUX1NPVVJDRSB9IGZyb20gJy4vY29uc3RzJztcbmltcG9ydCB7XG4gIEV2ZW50LFxuICBFVkVOVF9UWVBFUyxcbiAgZXZlbnRGYWN0b3J5LFxuICBSZXdhcmRlZFNsb3RSZWFkeUV2ZW50LFxuICBSZXdhcmRlZFNsb3RHcmFudGVkRXZlbnQsXG4gIFJld2FyZGVkU2xvdENsb3NlZEV2ZW50LFxuICBTbG90UmVuZGVyRW5kZWRFdmVudCxcbn0gZnJvbSAnLi9ldmVudHMnO1xuaW1wb3J0IHsgUmVxdWVzdCwgRGlzcGxheVNsb3QsIFJlZnJlc2hTbG90IH0gZnJvbSAnLi9hY3Rpb25zJztcbmltcG9ydCB7IFNjcmlwdE9wdGlvbnMsIERmcEFkIH0gZnJvbSAnLi90eXBlcyc7XG5cbkBJbmplY3RhYmxlKHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxufSlcbmV4cG9ydCBjbGFzcyBEZnBTZXJ2aWNlIHtcbiAgcHJpdmF0ZSAkc2luZ2xlUmVxdWVzdCA9IG5ldyBTdWJqZWN0PFJlcXVlc3Q+KCk7XG4gIHByaXZhdGUgJGV2ZW50cyA9IG5ldyBTdWJqZWN0PEV2ZW50PigpO1xuICBnZXQgZXZlbnRzKCk6IE9ic2VydmFibGU8RXZlbnQ+IHtcbiAgICByZXR1cm4gdGhpcy4kZXZlbnRzLmFzT2JzZXJ2YWJsZSgpO1xuICB9XG5cbiAgYmVmb3JlRGlzcGxheT86IChzbG90czogQXJyYXk8Z29vZ2xldGFnLlNsb3Q+KSA9PiB2b2lkO1xuICBkaXNhYmxlUmVmcmVzaFNsb3RzID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgQEluamVjdChQTEFURk9STV9JRCkgcHJpdmF0ZSBwbGF0Zm9ybUlkOiBvYmplY3QsXG4gICAgQEluamVjdChET0NVTUVOVCkgcHJpdmF0ZSBkb2N1bWVudDogRG9jdW1lbnQsXG4gICAgQEluamVjdChHUFRfTE9BREVSKSBwcml2YXRlIGdwdExvYWRlcjogT2JzZXJ2YWJsZTxHUFRfU09VUkNFPixcbiAgKSB7XG4gICAgaWYgKGlzUGxhdGZvcm1Ccm93c2VyKHRoaXMucGxhdGZvcm1JZCkpIHtcbiAgICAgIHRoaXMuaW5pdCgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaW5pdCgpOiB2b2lkIHtcbiAgICAvLyBHUFRcbiAgICB0aGlzLmdwdExvYWRlci5zdWJzY3JpYmUoKGdwdFNvdXJjZSkgPT4ge1xuICAgICAgdGhpcy5hcHBlbmRTY3JpcHQoeyBhc3luYzogdHJ1ZSwgc3JjOiBncHRTb3VyY2UgfSk7XG4gICAgfSk7XG4gICAgLy8gU2luZ2xlIFJlcXVlc3QgUXVldWVcbiAgICB0aGlzLiRzaW5nbGVSZXF1ZXN0XG4gICAgICAucGlwZShcbiAgICAgICAgYnVmZmVyKFxuICAgICAgICAgIHRoaXMuJHNpbmdsZVJlcXVlc3QucGlwZShzd2l0Y2hNYXAoKCkgPT4gdGltZXIoREVMQVlfVElNRSAqIDIpKSksXG4gICAgICAgICksXG4gICAgICApXG4gICAgICAuc3Vic2NyaWJlKChhY3RzKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmJlZm9yZURpc3BsYXkgJiYgdHlwZW9mIHRoaXMuYmVmb3JlRGlzcGxheSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIHRoaXMuYmVmb3JlRGlzcGxheShhY3RzLm1hcChhY3QgPT4gYWN0LnNsb3QpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlZnJlc2hTbG90czogZ29vZ2xldGFnLlNsb3RbXSA9IFtdO1xuICAgICAgICBhY3RzLmZvckVhY2goKGFjdCkgPT4ge1xuICAgICAgICAgIGlmIChhY3QgaW5zdGFuY2VvZiBEaXNwbGF5U2xvdCkge1xuICAgICAgICAgICAgZ29vZ2xldGFnLmRpc3BsYXkoYWN0LnNsb3QpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBhY3QgaW5zdGFuY2VvZiBSZWZyZXNoU2xvdCB8fFxuICAgICAgICAgICAgZ29vZ2xldGFnLnB1YmFkcygpLmlzSW5pdGlhbExvYWREaXNhYmxlZCgpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICByZWZyZXNoU2xvdHMucHVzaChhY3Quc2xvdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHJlZnJlc2hTbG90cy5sZW5ndGggPiAwICYmICF0aGlzLmRpc2FibGVSZWZyZXNoU2xvdHMpIHtcbiAgICAgICAgICBnb29nbGV0YWcucHViYWRzKCkucmVmcmVzaChyZWZyZXNoU2xvdHMpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAvLyBFdmVudCBMaXN0ZW5lcnNcbiAgICBnb29nbGV0YWcuY21kLnB1c2goKCkgPT4ge1xuICAgICAgRVZFTlRfVFlQRVMuZm9yRWFjaCgodHlwZSkgPT5cbiAgICAgICAgZ29vZ2xldGFnLnB1YmFkcygpLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgdGhpcy4kZXZlbnRzLm5leHQoZXZlbnRGYWN0b3J5KHR5cGUsIGV2ZW50KSk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIGRlZmluZShhZDogRGZwQWQsIGRlZmluZWRTbG90PzogZ29vZ2xldGFnLlNsb3QpOiBnb29nbGV0YWcuU2xvdCB7XG4gICAgY29uc3QgaWQgPSBhZC5pZCB8fCAnJztcblxuICAgIGxldCBzbG90OiBnb29nbGV0YWcuU2xvdDtcbiAgICBpZiAoZGVmaW5lZFNsb3QpIHtcbiAgICAgIHNsb3QgPSBkZWZpbmVkU2xvdDtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZXhpc3RzID0gdGhpcy5nZXRTbG90KGlkKTtcbiAgICAgIGlmIChleGlzdHMpIHtcbiAgICAgICAgdGhpcy5kZXN0cm95KGV4aXN0cyk7XG4gICAgICB9XG4gICAgICBpZiAoYWQuc2l6ZSkge1xuICAgICAgICBzbG90ID0gZ29vZ2xldGFnLmRlZmluZVNsb3QoYWQudW5pdFBhdGgsIGFkLnNpemUsIGlkKSBhcyBnb29nbGV0YWcuU2xvdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNsb3QgPSBnb29nbGV0YWcuZGVmaW5lT3V0T2ZQYWdlU2xvdChhZC51bml0UGF0aCwgaWQpIGFzIGdvb2dsZXRhZy5TbG90O1xuICAgICAgfVxuICAgIH1cblxuICAgIHNsb3RcbiAgICAgIC5jbGVhckNhdGVnb3J5RXhjbHVzaW9ucygpXG4gICAgICAuY2xlYXJUYXJnZXRpbmcoKVxuICAgICAgLmRlZmluZVNpemVNYXBwaW5nKGFkLnNpemVNYXBwaW5nIHx8IFtdKVxuICAgICAgLnVwZGF0ZVRhcmdldGluZ0Zyb21NYXAoYWQudGFyZ2V0aW5nIHx8IHt9KVxuICAgICAgLnNldENsaWNrVXJsKGFkLmNsaWNrVXJsIHx8ICcnKVxuICAgICAgLnNldEZvcmNlU2FmZUZyYW1lKGFkLmZvcmNlU2FmZUZyYW1lIHx8IGZhbHNlKVxuICAgICAgLnNldFNhZmVGcmFtZUNvbmZpZyhhZC5zYWZlRnJhbWVDb25maWcgfHwge30pO1xuXG4gICAgaWYgKGFkLmNhdGVnb3J5RXhjbHVzaW9uIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIGFkLmNhdGVnb3J5RXhjbHVzaW9uLmZvckVhY2goKGNhdCkgPT4gc2xvdC5zZXRDYXRlZ29yeUV4Y2x1c2lvbihjYXQpKTtcbiAgICB9IGVsc2UgaWYgKCdzdHJpbmcnID09PSB0eXBlb2YgYWQuY2F0ZWdvcnlFeGNsdXNpb24pIHtcbiAgICAgIHNsb3Quc2V0Q2F0ZWdvcnlFeGNsdXNpb24oYWQuY2F0ZWdvcnlFeGNsdXNpb24pO1xuICAgIH1cblxuICAgIGlmIChhZC5jb2xsYXBzZUVtcHR5RGl2IGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIHNsb3Quc2V0Q29sbGFwc2VFbXB0eURpdihhZC5jb2xsYXBzZUVtcHR5RGl2WzBdLCBhZC5jb2xsYXBzZUVtcHR5RGl2WzFdKTtcbiAgICB9IGVsc2UgaWYgKCdib29sZWFuJyA9PT0gdHlwZW9mIGFkLmNvbGxhcHNlRW1wdHlEaXYpIHtcbiAgICAgIHNsb3Quc2V0Q29sbGFwc2VFbXB0eURpdihhZC5jb2xsYXBzZUVtcHR5RGl2KTtcbiAgICB9XG5cbiAgICBjb25zdCBhdHRyaWJ1dGVzID0gYWQuYWRzZW5zZSB8fCB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGVOYW1lID0ga2V5IGFzIGdvb2dsZXRhZy5hZHNlbnNlLkF0dHJpYnV0ZU5hbWU7XG4gICAgICBzbG90LnNldChhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdID8/ICcnKTtcbiAgICB9XG5cbiAgICBzbG90LmFkZFNlcnZpY2UoZ29vZ2xldGFnLnB1YmFkcygpKTtcbiAgICBnb29nbGV0YWcuZW5hYmxlU2VydmljZXMoKTtcblxuICAgIHJldHVybiBzbG90O1xuICB9XG5cbiAgZGlzcGxheShzbG90OiBnb29nbGV0YWcuU2xvdCk6IHZvaWQge1xuICAgIHRoaXMuJHNpbmdsZVJlcXVlc3QubmV4dChuZXcgRGlzcGxheVNsb3Qoc2xvdCkpO1xuICB9XG5cbiAgcmVmcmVzaChzbG90OiBnb29nbGV0YWcuU2xvdCk6IHZvaWQge1xuICAgIHRoaXMuJHNpbmdsZVJlcXVlc3QubmV4dChuZXcgUmVmcmVzaFNsb3Qoc2xvdCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc3BsYXlzIGEgcmV3YXJkZWQgYWQuIFRoaXMgbWV0aG9kIHNob3VsZCBub3QgYmUgY2FsbGVkIHVudGlsIHRoZSB1c2VyIGhhcyBjb25zZW50ZWQgdG8gdmlldyB0aGUgYWQuXG4gICAqL1xuICByZXdhcmRlZChhZDogRGZwQWQpIHtcbiAgICBjb25zdCByZXdhcmRlZCA9IGdvb2dsZXRhZy5kZWZpbmVPdXRPZlBhZ2VTbG90KFxuICAgICAgYWQudW5pdFBhdGgsXG4gICAgICBnb29nbGV0YWcuZW51bXMuT3V0T2ZQYWdlRm9ybWF0LlJFV0FSREVELFxuICAgICk7XG4gICAgaWYgKHJld2FyZGVkID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gRU1QVFk7XG4gICAgfVxuICAgIGdvb2dsZXRhZy5kaXNwbGF5KHRoaXMuZGVmaW5lKGFkLCByZXdhcmRlZCkpO1xuICAgIHJldHVybiB0aGlzLmV2ZW50cy5waXBlKFxuICAgICAgZmlsdGVyKChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQuc2xvdCA9PT0gcmV3YXJkZWQpIHtcbiAgICAgICAgICBpZiAoZXZlbnQgaW5zdGFuY2VvZiBSZXdhcmRlZFNsb3RSZWFkeUV2ZW50KSB7XG4gICAgICAgICAgICBldmVudC5tYWtlUmV3YXJkZWRWaXNpYmxlKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAoZXZlbnQgaW5zdGFuY2VvZiBTbG90UmVuZGVyRW5kZWRFdmVudCAmJiBldmVudC5pc0VtcHR5KSB8fFxuICAgICAgICAgICAgZXZlbnQgaW5zdGFuY2VvZiBSZXdhcmRlZFNsb3RHcmFudGVkRXZlbnQgfHxcbiAgICAgICAgICAgIGV2ZW50IGluc3RhbmNlb2YgUmV3YXJkZWRTbG90Q2xvc2VkRXZlbnRcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0pLFxuICAgICAgdGFrZTxcbiAgICAgICAgfCBTbG90UmVuZGVyRW5kZWRFdmVudFxuICAgICAgICB8IFJld2FyZGVkU2xvdEdyYW50ZWRFdmVudFxuICAgICAgICB8IFJld2FyZGVkU2xvdENsb3NlZEV2ZW50XG4gICAgICA+KDEpLFxuICAgICk7XG4gIH1cblxuICBkZXN0cm95KHNsb3Q6IGdvb2dsZXRhZy5TbG90KTogdm9pZCB7XG4gICAgZ29vZ2xldGFnLmRlc3Ryb3lTbG90cyhbc2xvdF0pO1xuICB9XG5cbiAgZ2V0U2xvdChlbGVtZW50SWQ6IHN0cmluZyk6IGdvb2dsZXRhZy5TbG90IHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy5nZXRTbG90cygpLmZpbmQoXG4gICAgICAoc2xvdCkgPT4gZWxlbWVudElkID09PSBzbG90LmdldFNsb3RFbGVtZW50SWQoKSxcbiAgICApO1xuICB9XG5cbiAgZ2V0U2xvdHMoZWxlbWVudElkcz86IHN0cmluZ1tdKTogZ29vZ2xldGFnLlNsb3RbXSB7XG4gICAgY29uc3Qgc2xvdHM6IGdvb2dsZXRhZy5TbG90W10gPSBnb29nbGV0YWcucHViYWRzKCkuZ2V0U2xvdHMoKTtcbiAgICByZXR1cm4gc2xvdHMuZmlsdGVyKFxuICAgICAgKHNsb3QpID0+XG4gICAgICAgICFlbGVtZW50SWRzIHx8IGVsZW1lbnRJZHMuaW5kZXhPZihzbG90LmdldFNsb3RFbGVtZW50SWQoKSkgIT09IC0xLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogVXNlIGdvb2dsZXRhZy5jbWQucHVzaCgpIHRvIGV4ZWN1dGUgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgKiBAcGFyYW0gY2FsbGJhY2tcbiAgICovXG4gIGNtZChjYWxsYmFjazogKCkgPT4gdm9pZCk6IGJvb2xlYW4ge1xuICAgIGlmIChpc1BsYXRmb3JtQnJvd3Nlcih0aGlzLnBsYXRmb3JtSWQpKSB7XG4gICAgICBnb29nbGV0YWcuY21kLnB1c2goY2FsbGJhY2spO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGFwcGVuZFNjcmlwdChcbiAgICBvcHRpb25zOiBTY3JpcHRPcHRpb25zLFxuICAgIHBhcmVudE5vZGU/OiBFbGVtZW50LFxuICApOiBIVE1MU2NyaXB0RWxlbWVudCB7XG4gICAgcGFyZW50Tm9kZSA9IHBhcmVudE5vZGUgfHwgdGhpcy5kb2N1bWVudC5oZWFkO1xuICAgIGNvbnN0IG9sZFNjcmlwdCA9IG9wdGlvbnMuaWRcbiAgICAgID8gcGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yKCcjJyArIG9wdGlvbnMuaWQpXG4gICAgICA6IG51bGw7XG4gICAgY29uc3Qgc2NyaXB0ID0gdGhpcy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICBPYmplY3QuYXNzaWduKHNjcmlwdCwgb3B0aW9ucywgeyB0eXBlOiAndGV4dC9qYXZhc2NyaXB0JyB9KTtcbiAgICBpZiAob2xkU2NyaXB0KSB7XG4gICAgICBwYXJlbnROb2RlLnJlcGxhY2VDaGlsZChzY3JpcHQsIG9sZFNjcmlwdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYXBwZW5kVGV4dCgnXFxuJywgcGFyZW50Tm9kZSk7XG4gICAgICBwYXJlbnROb2RlLmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgICB0aGlzLmFwcGVuZFRleHQoJ1xcbicsIHBhcmVudE5vZGUpO1xuICAgIH1cbiAgICByZXR1cm4gc2NyaXB0O1xuICB9XG5cbiAgYXBwZW5kVGV4dChkYXRhOiBzdHJpbmcsIHBhcmVudE5vZGU/OiBFbGVtZW50KTogVGV4dCB7XG4gICAgcGFyZW50Tm9kZSA9IHBhcmVudE5vZGUgfHwgdGhpcy5kb2N1bWVudC5oZWFkO1xuICAgIGNvbnN0IHRleHQgPSB0aGlzLmRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpO1xuICAgIHBhcmVudE5vZGUuYXBwZW5kQ2hpbGQodGV4dCk7XG4gICAgcmV0dXJuIHRleHQ7XG4gIH1cbn1cbiJdfQ==