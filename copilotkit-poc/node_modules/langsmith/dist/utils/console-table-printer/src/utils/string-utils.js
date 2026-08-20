import { findWidthInConsole } from './console-utils.js';
// ("How are you?",10) => ["How are ", "you?"]
export const splitTextIntoTextsOfMinLen = (inpStr, width, charLength) => {
    const ret = [];
    const lines = inpStr.split(/[\n\r]/);
    lines.forEach((line) => {
        const spaceSeparatedStrings = line.split(' ');
        let now = [];
        let cnt = 0;
        spaceSeparatedStrings.forEach((strWithoutSpace) => {
            const consoleWidth = findWidthInConsole(strWithoutSpace, charLength);
            if (cnt + consoleWidth <= width) {
                cnt += consoleWidth + 1; // 1 for the space
                now.push(strWithoutSpace);
            }
            else {
                if (now.length > 0)
                    ret.push(now.join(' '));
                now = [strWithoutSpace];
                cnt = consoleWidth + 1;
            }
        });
        ret.push(now.join(' '));
    });
    return ret;
};
// ("How are you?",center, 20) => "    How are you?    "
// ("How are you?",right, 20)  => "        How are you?"
// ("How are you?",center, 4)  => "How\nare\nyou?"
export const textWithPadding = (text, alignment, columnLen, charLength) => {
    const curTextSize = findWidthInConsole(text, charLength);
    // alignments for center padding case
    const leftPadding = Math.floor((columnLen - curTextSize) / 2);
    const rightPadding = columnLen - leftPadding - curTextSize;
    // handle edge cases where the text size is larger than the column length
    if (columnLen < curTextSize) {
        const splittedLines = splitTextIntoTextsOfMinLen(text, columnLen);
        if (splittedLines.length === 1) {
            return text;
        }
        return splittedLines
            .map((singleLine) => textWithPadding(singleLine, alignment, columnLen, charLength))
            .join('\n');
    }
    // console.log(text, columnLen, curTextSize);
    switch (alignment) {
        case 'left':
            return text.concat(' '.repeat(columnLen - curTextSize));
        case 'center':
            return ' '
                .repeat(leftPadding)
                .concat(text)
                .concat(' '.repeat(rightPadding));
        case 'right':
        default:
            return ' '.repeat(columnLen - curTextSize).concat(text);
    }
};
// ("How are you?",10) => ["How are ", "you?"]
export const biggestWordInSentence = (inpStr, charLength) => inpStr
    .split(' ')
    .reduce((a, b) => Math.max(a, findWidthInConsole(b, charLength)), 0);
