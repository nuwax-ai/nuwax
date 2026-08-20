import { Rect } from './Rect';
export declare class OverscanManager {
    private startTime;
    private velocity;
    private visibleRect;
    setVisibleRect(rect: Rect): void;
    getOverscannedRect(): Rect;
}
