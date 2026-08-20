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
 */ // eslint-disable-next-line @typescript-eslint/no-unused-vars
function $bf42fa5f8ac488ca$var$Cell(props) {
    return null;
}
$bf42fa5f8ac488ca$var$Cell.getCollectionNode = function* getCollectionNode(props) {
    let { children: children } = props;
    let textValue = props.textValue || (typeof children === 'string' ? children : '') || props['aria-label'] || '';
    yield {
        type: 'cell',
        props: props,
        rendered: children,
        textValue: textValue,
        'aria-label': props['aria-label'],
        hasChildNodes: false
    };
};
/**
 * A Cell represents the value of a single Column within a Table Row.
 */ // We don't want getCollectionNode to show up in the type definition
let $bf42fa5f8ac488ca$export$f6f0c3fe4ec306ea = $bf42fa5f8ac488ca$var$Cell;


export {$bf42fa5f8ac488ca$export$f6f0c3fe4ec306ea as Cell};
//# sourceMappingURL=Cell.mjs.map
