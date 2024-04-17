import { InjectionToken } from '@angular/core';
export declare const DELAY_TIME = 50;
export declare enum GPT_SOURCE {
    STANDARD = "https://securepubads.g.doubleclick.net/tag/js/gpt.js",
    LIMITED_ADS = "https://pagead2.googlesyndication.com/tag/js/gpt.js"
}
export declare const GPT_LOADER: InjectionToken<import("rxjs").Observable<GPT_SOURCE>>;
