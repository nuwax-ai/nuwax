/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ let $992ceef00adc57c6$var$cachedRTLResult = null;
function $992ceef00adc57c6$export$faf7630257ad4304(recalculate = false) {
    if ($992ceef00adc57c6$var$cachedRTLResult === null || recalculate) {
        const outerDiv = document.createElement('div');
        const outerStyle = outerDiv.style;
        outerStyle.width = '50px';
        outerStyle.height = '50px';
        outerStyle.overflow = 'scroll';
        outerStyle.direction = 'rtl';
        const innerDiv = document.createElement('div');
        const innerStyle = innerDiv.style;
        innerStyle.width = '100px';
        innerStyle.height = '100px';
        outerDiv.appendChild(innerDiv);
        document.body.appendChild(outerDiv);
        if (outerDiv.scrollLeft > 0) $992ceef00adc57c6$var$cachedRTLResult = 'positive-descending';
        else {
            outerDiv.scrollLeft = 1;
            if (outerDiv.scrollLeft === 0) $992ceef00adc57c6$var$cachedRTLResult = 'negative';
            else $992ceef00adc57c6$var$cachedRTLResult = 'positive-ascending';
        }
        document.body.removeChild(outerDiv);
        return $992ceef00adc57c6$var$cachedRTLResult;
    }
    return $992ceef00adc57c6$var$cachedRTLResult;
}
function $992ceef00adc57c6$export$1389d168952b34b5(node, direction) {
    let { scrollLeft: scrollLeft } = node;
    // scrollLeft in rtl locales differs across browsers, so normalize.
    // See comment by getRTLOffsetType below for details.
    if (direction === 'rtl') {
        let { scrollWidth: scrollWidth, clientWidth: clientWidth } = node;
        switch($992ceef00adc57c6$export$faf7630257ad4304()){
            case 'negative':
                scrollLeft = -scrollLeft;
                break;
            case 'positive-descending':
                scrollLeft = scrollWidth - clientWidth - scrollLeft;
                break;
        }
    }
    return scrollLeft;
}
function $992ceef00adc57c6$export$ed5fd5ffe5ab0ac(node, direction, scrollLeft) {
    if (direction === 'rtl') switch($992ceef00adc57c6$export$faf7630257ad4304()){
        case 'negative':
            scrollLeft = -scrollLeft;
            break;
        case 'positive-ascending':
            break;
        default:
            {
                const { clientWidth: clientWidth, scrollWidth: scrollWidth } = node;
                scrollLeft = scrollWidth - clientWidth - scrollLeft;
                break;
            }
    }
    node.scrollLeft = scrollLeft;
}


export {$992ceef00adc57c6$export$faf7630257ad4304 as getRTLOffsetType, $992ceef00adc57c6$export$1389d168952b34b5 as getScrollLeft, $992ceef00adc57c6$export$ed5fd5ffe5ab0ac as setScrollLeft};
//# sourceMappingURL=utils.js.map
