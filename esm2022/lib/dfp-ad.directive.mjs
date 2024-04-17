/* eslint-disable @angular-eslint/no-conflicting-lifecycle */
import { Directive, EventEmitter, Inject, Input, Optional, Output, PLATFORM_ID, } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd } from '@angular/router';
import { Subject, timer } from 'rxjs';
import { filter, switchMap, takeUntil } from 'rxjs/operators';
import { DELAY_TIME } from './consts';
import { SlotRenderEndedEvent, SlotVisibilityChangedEvent } from './events';
import * as i0 from "@angular/core";
import * as i1 from "./dfp.service";
import * as i2 from "@angular/router";
export class DfpAdDirective {
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.2.2", ngImport: i0, type: DfpAdDirective, deps: [{ token: PLATFORM_ID }, { token: i0.ViewContainerRef }, { token: i1.DfpService }, { token: i2.Router, optional: true }, { token: i0.ElementRef, optional: true }, { token: i0.TemplateRef, optional: true }], target: i0.ɵɵFactoryTarget.Directive }); }
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
                }] }, { type: i0.ViewContainerRef }, { type: i1.DfpService }, { type: i2.Router, decorators: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGZwLWFkLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvZGZwLWFkLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSw2REFBNkQ7QUFDN0QsT0FBTyxFQUNMLFNBQVMsRUFHVCxZQUFZLEVBQ1osTUFBTSxFQUNOLEtBQUssRUFHTCxRQUFRLEVBQ1IsTUFBTSxFQUNOLFdBQVcsR0FJWixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUNwRCxPQUFPLEVBQUUsYUFBYSxFQUFVLE1BQU0saUJBQWlCLENBQUM7QUFFeEQsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDdEMsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFFOUQsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUd0QyxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsMEJBQTBCLEVBQUUsTUFBTSxVQUFVLENBQUM7Ozs7QUFNNUUsTUFBTSxPQUFPLGNBQWM7SUFTekIsSUFBYSxLQUFLLENBQUMsS0FBcUI7UUFDdEMsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7WUFDN0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7U0FDdkI7YUFBTTtZQUNMLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQzVCO0lBQ0gsQ0FBQztJQWtCRCxZQUN1QixVQUFrQixFQUMvQixhQUErQixFQUMvQixHQUFlLEVBQ0gsTUFBZSxFQUNmLFVBQW9DLEVBQ3BDLFdBQWtDO1FBSjlDLGtCQUFhLEdBQWIsYUFBYSxDQUFrQjtRQUMvQixRQUFHLEdBQUgsR0FBRyxDQUFZO1FBQ0gsV0FBTSxHQUFOLE1BQU0sQ0FBUztRQUNm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Q0FBQzs4R0FoS1UsY0FBYyxrQkFrQ2YsV0FBVztrR0FsQ1YsY0FBYzs7MkZBQWQsY0FBYztrQkFKMUIsU0FBUzttQkFBQztvQkFDVCxRQUFRLEVBQUUsU0FBUztvQkFDbkIsUUFBUSxFQUFFLE9BQU87aUJBQ2xCOzswQkFtQ0ksTUFBTTsyQkFBQyxXQUFXOzswQkFHbEIsUUFBUTs7MEJBQ1IsUUFBUTs7MEJBQ1IsUUFBUTs0Q0FqQ0QsV0FBVztzQkFBcEIsTUFBTTtnQkFDRyxpQkFBaUI7c0JBQTFCLE1BQU07Z0JBRU0sS0FBSztzQkFBakIsS0FBSztnQkFRWSxFQUFFO3NCQUFuQixLQUFLO3VCQUFDLFNBQVM7Z0JBQ0ksSUFBSTtzQkFBdkIsS0FBSzt1QkFBQyxXQUFXO2dCQUNTLFdBQVc7c0JBQXJDLEtBQUs7dUJBQUMsa0JBQWtCO2dCQUNRLGlCQUFpQjtzQkFBakQsS0FBSzt1QkFBQyx3QkFBd0I7Z0JBSVAsUUFBUTtzQkFBL0IsS0FBSzt1QkFBQyxlQUFlO2dCQUNVLGdCQUFnQjtzQkFBL0MsS0FBSzt1QkFBQyx1QkFBdUI7Z0JBR0EsY0FBYztzQkFBM0MsS0FBSzt1QkFBQyxxQkFBcUI7Z0JBQ0csZUFBZTtzQkFBN0MsS0FBSzt1QkFBQyxzQkFBc0I7Z0JBQ0osU0FBUztzQkFBakMsS0FBSzt1QkFBQyxnQkFBZ0I7Z0JBQ0EsT0FBTztzQkFBN0IsS0FBSzt1QkFBQyxjQUFjIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgQGFuZ3VsYXItZXNsaW50L25vLWNvbmZsaWN0aW5nLWxpZmVjeWNsZSAqL1xuaW1wb3J0IHtcbiAgRGlyZWN0aXZlLFxuICBEb0NoZWNrLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIEluamVjdCxcbiAgSW5wdXQsXG4gIE9uQ2hhbmdlcyxcbiAgT25EZXN0cm95LFxuICBPcHRpb25hbCxcbiAgT3V0cHV0LFxuICBQTEFURk9STV9JRCxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDb250YWluZXJSZWYsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgaXNQbGF0Zm9ybUJyb3dzZXIgfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuaW1wb3J0IHsgTmF2aWdhdGlvbkVuZCwgUm91dGVyIH0gZnJvbSAnQGFuZ3VsYXIvcm91dGVyJztcblxuaW1wb3J0IHsgU3ViamVjdCwgdGltZXIgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGZpbHRlciwgc3dpdGNoTWFwLCB0YWtlVW50aWwgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7IERFTEFZX1RJTUUgfSBmcm9tICcuL2NvbnN0cyc7XG5pbXBvcnQgeyBEZnBTZXJ2aWNlIH0gZnJvbSAnLi9kZnAuc2VydmljZSc7XG5pbXBvcnQgeyBEZnBBZCB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgU2xvdFJlbmRlckVuZGVkRXZlbnQsIFNsb3RWaXNpYmlsaXR5Q2hhbmdlZEV2ZW50IH0gZnJvbSAnLi9ldmVudHMnO1xuXG5ARGlyZWN0aXZlKHtcbiAgc2VsZWN0b3I6ICdbZGZwQWRdJyxcbiAgZXhwb3J0QXM6ICdkZnBBZCcsXG59KVxuZXhwb3J0IGNsYXNzIERmcEFkRGlyZWN0aXZlIGltcGxlbWVudHMgRG9DaGVjaywgT25DaGFuZ2VzLCBPbkRlc3Ryb3kge1xuICBwcml2YXRlICRkZXN0cm95ID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcbiAgcHJpdmF0ZSAkdXBkYXRlID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcbiAgcHJpdmF0ZSBlbGVtZW50PzogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgc2xvdD86IGdvb2dsZXRhZy5TbG90O1xuXG4gIEBPdXRwdXQoKSByZW5kZXJFbmRlZCA9IG5ldyBFdmVudEVtaXR0ZXI8U2xvdFJlbmRlckVuZGVkRXZlbnQ+KCk7XG4gIEBPdXRwdXQoKSB2aXNpYmlsaXR5Q2hhbmdlZCA9IG5ldyBFdmVudEVtaXR0ZXI8U2xvdFZpc2liaWxpdHlDaGFuZ2VkRXZlbnQ+KCk7XG5cbiAgQElucHV0KCkgc2V0IGRmcEFkKGRmcEFkOiBzdHJpbmcgfCBEZnBBZCkge1xuICAgIGlmICh0eXBlb2YgZGZwQWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aGlzLnVuaXRQYXRoID0gZGZwQWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgZGZwQWQpO1xuICAgIH1cbiAgfVxuICB1bml0UGF0aCE6IHN0cmluZztcbiAgQElucHV0KCdkZnBBZElkJykgaWQ/OiBzdHJpbmc7XG4gIEBJbnB1dCgnZGZwQWRTaXplJykgc2l6ZT86IGdvb2dsZXRhZy5HZW5lcmFsU2l6ZTtcbiAgQElucHV0KCdkZnBBZFNpemVNYXBwaW5nJykgc2l6ZU1hcHBpbmc/OiBnb29nbGV0YWcuU2l6ZU1hcHBpbmdBcnJheTtcbiAgQElucHV0KCdkZnBBZENhdGVnb3J5RXhjbHVzaW9uJykgY2F0ZWdvcnlFeGNsdXNpb24/OiBzdHJpbmcgfCBzdHJpbmdbXTtcbiAgLyoqXG4gICAqIFRoaXMgd29ya3Mgb25seSBmb3Igbm9uLVNSQSByZXF1ZXN0cy5cbiAgICovXG4gIEBJbnB1dCgnZGZwQWRDbGlja1VybCcpIGNsaWNrVXJsPzogc3RyaW5nO1xuICBASW5wdXQoJ2RmcEFkQ29sbGFwc2VFbXB0eURpdicpIGNvbGxhcHNlRW1wdHlEaXY/OlxuICAgIHwgYm9vbGVhblxuICAgIHwgW2Jvb2xlYW4sIGJvb2xlYW5dO1xuICBASW5wdXQoJ2RmcEFkRm9yY2VTYWZlRnJhbWUnKSBmb3JjZVNhZmVGcmFtZT86IGJvb2xlYW47XG4gIEBJbnB1dCgnZGZwQWRTYWZlRnJhbWVDb25maWcnKSBzYWZlRnJhbWVDb25maWc/OiBnb29nbGV0YWcuU2FmZUZyYW1lQ29uZmlnO1xuICBASW5wdXQoJ2RmcEFkVGFyZ2V0aW5nJykgdGFyZ2V0aW5nPzogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgc3RyaW5nW10+O1xuICBASW5wdXQoJ2RmcEFkQWRzZW5zZScpIGFkc2Vuc2U/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIEBJbmplY3QoUExBVEZPUk1fSUQpIHBsYXRmb3JtSWQ6IG9iamVjdCxcbiAgICBwcml2YXRlIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWYsXG4gICAgcHJpdmF0ZSBkZnA6IERmcFNlcnZpY2UsXG4gICAgQE9wdGlvbmFsKCkgcHJpdmF0ZSByb3V0ZXI/OiBSb3V0ZXIsXG4gICAgQE9wdGlvbmFsKCkgcHJpdmF0ZSBlbGVtZW50UmVmPzogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4sXG4gICAgQE9wdGlvbmFsKCkgcHJpdmF0ZSB0ZW1wbGF0ZVJlZj86IFRlbXBsYXRlUmVmPHVua25vd24+LFxuICApIHtcbiAgICBpZiAoaXNQbGF0Zm9ybUJyb3dzZXIocGxhdGZvcm1JZCkpIHtcbiAgICAgIHRoaXMuaW5pdCgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgaW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLiR1cGRhdGVcbiAgICAgIC5waXBlKFxuICAgICAgICBzd2l0Y2hNYXAoKCkgPT4gdGltZXIoREVMQVlfVElNRSkpLFxuICAgICAgICB0YWtlVW50aWwodGhpcy4kZGVzdHJveSksXG4gICAgICApXG4gICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy5kZnAuY21kKCgpID0+IHRoaXMuZGlzcGxheSgpKTtcbiAgICAgIH0pO1xuXG4gICAgdGhpcy5kZnAuZXZlbnRzXG4gICAgICAucGlwZShcbiAgICAgICAgZmlsdGVyKChldmVudCkgPT4gZXZlbnQuc2xvdCA9PT0gdGhpcy5zbG90KSxcbiAgICAgICAgdGFrZVVudGlsKHRoaXMuJGRlc3Ryb3kpLFxuICAgICAgKVxuICAgICAgLnN1YnNjcmliZSgoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50IGluc3RhbmNlb2YgU2xvdFJlbmRlckVuZGVkRXZlbnQpIHtcbiAgICAgICAgICB0aGlzLnJlbmRlckVuZGVkLmVtaXQoZXZlbnQpO1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50IGluc3RhbmNlb2YgU2xvdFZpc2liaWxpdHlDaGFuZ2VkRXZlbnQpIHtcbiAgICAgICAgICB0aGlzLnZpc2liaWxpdHlDaGFuZ2VkLmVtaXQoZXZlbnQpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIHRoaXMucm91dGVyICYmXG4gICAgICB0aGlzLnJvdXRlci5ldmVudHNcbiAgICAgICAgLnBpcGUoXG4gICAgICAgICAgZmlsdGVyKChldmVudCkgPT4gZXZlbnQgaW5zdGFuY2VvZiBOYXZpZ2F0aW9uRW5kKSxcbiAgICAgICAgICB0YWtlVW50aWwodGhpcy4kZGVzdHJveSksXG4gICAgICAgIClcbiAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgdGhpcy4kdXBkYXRlLm5leHQoKTtcbiAgICAgICAgfSk7XG4gIH1cblxuICBjcmVhdGUoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMudW5pdFBhdGgpIHtcbiAgICAgIGlmICghdGhpcy5lbGVtZW50KSB7XG4gICAgICAgIGlmICh0aGlzLnRlbXBsYXRlUmVmKSB7XG4gICAgICAgICAgY29uc3QgdmlldyA9IHRoaXMudmlld0NvbnRhaW5lci5jcmVhdGVFbWJlZGRlZFZpZXcodGhpcy50ZW1wbGF0ZVJlZik7XG4gICAgICAgICAgdGhpcy5lbGVtZW50ID0gdmlldy5yb290Tm9kZXNbMF07XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5lbGVtZW50UmVmKSB7XG4gICAgICAgICAgdGhpcy5lbGVtZW50ID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuJHVwZGF0ZS5uZXh0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICB9XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5lbGVtZW50IHx8IHRoaXMuZWxlbWVudC5pbm5lclRleHQubWF0Y2goL1xcUysvKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBwYXJlbnRFbGVtZW50ID0gdGhpcy5lbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgd2hpbGUgKHBhcmVudEVsZW1lbnQpIHtcbiAgICAgIGlmIChwYXJlbnRFbGVtZW50LmdldEF0dHJpYnV0ZSgnbmctdmVyc2lvbicpKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKFxuICAgICAgICBwYXJlbnRFbGVtZW50LnN0eWxlLnZpc2liaWxpdHkgPT09ICdoaWRkZW4nIHx8XG4gICAgICAgIHBhcmVudEVsZW1lbnQuc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcGFyZW50RWxlbWVudCA9IHBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zbG90ICYmIHRoaXMuaWQgPT09IHRoaXMuZWxlbWVudC5pZCkge1xuICAgICAgdGhpcy5kZnAuZGVmaW5lKHRoaXMsIHRoaXMuc2xvdCk7XG4gICAgICB0aGlzLmRmcC5yZWZyZXNoKHRoaXMuc2xvdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgY29uc3QgaWQgPSB0aGlzLmVsZW1lbnQuaWQgfHwgdGhpcy5pZDtcbiAgICAgIHRoaXMuc2xvdCA9IHRoaXMuZGZwLmRlZmluZShPYmplY3QuYXNzaWduKHt9LCB0aGlzLCB7IGlkOiBpZCB9KSk7XG4gICAgICB0aGlzLmVsZW1lbnQuaWQgPSBpZCB8fCB0aGlzLnNsb3QuZ2V0U2xvdEVsZW1lbnRJZCgpO1xuICAgICAgdGhpcy5pZCA9IHRoaXMuZWxlbWVudC5pZDtcbiAgICAgIHRoaXMuZGZwLmRpc3BsYXkodGhpcy5zbG90KTtcbiAgICB9XG4gIH1cblxuICBjbGVhcigpOiB2b2lkIHtcbiAgICB0aGlzLnZpZXdDb250YWluZXIuY2xlYXIoKTtcbiAgICB0aGlzLmVsZW1lbnQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5kZXN0cm95KCk7XG4gIH1cblxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNsb3QpIHtcbiAgICAgIHRoaXMuZGZwLmRlc3Ryb3kodGhpcy5zbG90KTtcbiAgICAgIHRoaXMuc2xvdCA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cblxuICBuZ0RvQ2hlY2soKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZWxlbWVudCAmJiB0aGlzLmVsZW1lbnQuaWQgJiYgdGhpcy5pZCAhPT0gdGhpcy5lbGVtZW50LmlkKSB7XG4gICAgICB0aGlzLmlkID0gdGhpcy5lbGVtZW50LmlkO1xuICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICB0aGlzLmNyZWF0ZSgpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBjb25zdCBjaGFuZ2UgPSBjaGFuZ2VzWydkZnBBZCddIHx8IGNoYW5nZXNbJ2lkJ10gfHwgY2hhbmdlc1snc2l6ZSddO1xuICAgIGlmIChjaGFuZ2UgJiYgIWNoYW5nZS5pc0ZpcnN0Q2hhbmdlKCkpIHtcbiAgICAgIHRoaXMuY2xlYXIoKTtcbiAgICB9XG4gICAgdGhpcy5jcmVhdGUoKTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuJGRlc3Ryb3kubmV4dCgpO1xuICAgIHRoaXMuY2xlYXIoKTtcbiAgfVxufVxuIl19