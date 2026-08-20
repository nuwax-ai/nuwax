// src/ext/attention.ts
import { ok as assert } from "devlop";
import {
  classifyCharacter,
  classifyPrecedingCharacter,
  isCjk,
  isCjkOrIvs,
  isCodeHighSurrogate,
  isCodeLowSurrogate,
  isNonCjkPunctuation,
  isSpaceOrPunctuation,
  isUnicodeWhitespace,
  TwoPreviousCode,
  tryGetGenuineNextCode,
  tryGetGenuinePreviousCode
} from "micromark-extension-cjk-friendly-util";
import { push, splice } from "micromark-util-chunked";
import { resolveAll } from "micromark-util-resolve-all";
import { codes, types } from "micromark-util-symbol";
var attention = {
  name: "attention",
  resolveAll: resolveAllAttention,
  tokenize: tokenizeAttention
};
function resolveAllAttention(events, context) {
  let index = -1;
  let open;
  let group;
  let text;
  let openingSequence;
  let closingSequence;
  let use;
  let nextEvents;
  let offset;
  while (++index < events.length) {
    if (events[index][0] === "enter" && events[index][1].type === "attentionSequence" && events[index][1]._close) {
      open = index;
      while (open--) {
        if (events[open][0] === "exit" && events[open][1].type === "attentionSequence" && events[open][1]._open && // If the markers are the same:
        context.sliceSerialize(events[open][1]).charCodeAt(0) === context.sliceSerialize(events[index][1]).charCodeAt(0)) {
          if ((events[open][1]._close || events[index][1]._open) && (events[index][1].end.offset - events[index][1].start.offset) % 3 && !((events[open][1].end.offset - events[open][1].start.offset + events[index][1].end.offset - events[index][1].start.offset) % 3)) {
            continue;
          }
          use = events[open][1].end.offset - events[open][1].start.offset > 1 && events[index][1].end.offset - events[index][1].start.offset > 1 ? 2 : 1;
          const start = { ...events[open][1].end };
          const end = { ...events[index][1].start };
          movePoint(start, -use);
          movePoint(end, use);
          openingSequence = {
            type: use > 1 ? types.strongSequence : types.emphasisSequence,
            start,
            end: { ...events[open][1].end }
          };
          closingSequence = {
            type: use > 1 ? types.strongSequence : types.emphasisSequence,
            start: { ...events[index][1].start },
            end
          };
          text = {
            type: use > 1 ? types.strongText : types.emphasisText,
            start: { ...events[open][1].end },
            end: { ...events[index][1].start }
          };
          group = {
            type: use > 1 ? types.strong : types.emphasis,
            start: { ...openingSequence.start },
            end: { ...closingSequence.end }
          };
          events[open][1].end = { ...openingSequence.start };
          events[index][1].start = { ...closingSequence.end };
          nextEvents = [];
          if (events[open][1].end.offset - events[open][1].start.offset) {
            nextEvents = push(nextEvents, [
              ["enter", events[open][1], context],
              ["exit", events[open][1], context]
            ]);
          }
          nextEvents = push(nextEvents, [
            ["enter", group, context],
            ["enter", openingSequence, context],
            ["exit", openingSequence, context],
            ["enter", text, context]
          ]);
          assert(
            context.parser.constructs.insideSpan.null,
            "expected `insideSpan` to be populated"
          );
          nextEvents = push(
            nextEvents,
            resolveAll(
              context.parser.constructs.insideSpan.null,
              events.slice(open + 1, index),
              context
            )
          );
          nextEvents = push(nextEvents, [
            ["exit", text, context],
            ["enter", closingSequence, context],
            ["exit", closingSequence, context],
            ["exit", group, context]
          ]);
          if (events[index][1].end.offset - events[index][1].start.offset) {
            offset = 2;
            nextEvents = push(nextEvents, [
              ["enter", events[index][1], context],
              ["exit", events[index][1], context]
            ]);
          } else {
            offset = 0;
          }
          splice(events, open - 1, index - open + 3, nextEvents);
          index = open + nextEvents.length - offset - 2;
          break;
        }
      }
    }
  }
  index = -1;
  while (++index < events.length) {
    if (events[index][1].type === "attentionSequence") {
      events[index][1].type = "data";
    }
  }
  return events;
}
function tokenizeAttention(effects, ok) {
  const attentionMarkers = this.parser.constructs.attentionMarkers.null;
  const { now, sliceSerialize, previous: tentativePrevious } = this;
  const previous = isCodeLowSurrogate(tentativePrevious) ? (
    // second (lower) surrogate likely to be preceded by first (higher) surrogate
    tryGetGenuinePreviousCode(tentativePrevious, now(), sliceSerialize)
  ) : tentativePrevious;
  const before = classifyCharacter(previous);
  const twoPrevious = new TwoPreviousCode(previous, now(), sliceSerialize);
  const beforePrimary = classifyPrecedingCharacter(
    before,
    twoPrevious.value.bind(twoPrevious),
    previous
  );
  let marker;
  return start;
  function start(code) {
    assert(
      code === codes.asterisk || code === codes.underscore,
      "expected asterisk or underscore"
    );
    marker = code;
    effects.enter("attentionSequence");
    return inside(code);
  }
  function inside(code) {
    if (code === marker) {
      effects.consume(code);
      return inside;
    }
    const token = effects.exit("attentionSequence");
    const next = isCodeHighSurrogate(code) ? tryGetGenuineNextCode(code, now(), sliceSerialize) : code;
    const after = classifyCharacter(next);
    assert(attentionMarkers, "expected `attentionMarkers` to be populated");
    const beforeNonCjkPunctuation = isNonCjkPunctuation(beforePrimary);
    const beforeSpaceOrNonCjkPunctuation = beforeNonCjkPunctuation || isUnicodeWhitespace(beforePrimary);
    const afterNonCjkPunctuation = isNonCjkPunctuation(after);
    const afterSpaceOrNonCjkPunctuation = afterNonCjkPunctuation || isUnicodeWhitespace(after);
    const beforeCjkOrIvs = isCjkOrIvs(beforePrimary);
    const open = !afterSpaceOrNonCjkPunctuation || afterNonCjkPunctuation && (beforeSpaceOrNonCjkPunctuation || beforeCjkOrIvs) || attentionMarkers.includes(code);
    const close = !beforeSpaceOrNonCjkPunctuation || beforeNonCjkPunctuation && (afterSpaceOrNonCjkPunctuation || isCjk(after)) || attentionMarkers.includes(previous);
    token._open = Boolean(
      marker === codes.asterisk ? open : open && (isSpaceOrPunctuation(beforePrimary) || !close)
    );
    token._close = Boolean(
      marker === codes.asterisk ? close : close && (isSpaceOrPunctuation(after) || !open)
    );
    return ok(code);
  }
}
function movePoint(point, offset) {
  point.column += offset;
  point.offset += offset;
  point._bufferIndex += offset;
}
export {
  attention
};
