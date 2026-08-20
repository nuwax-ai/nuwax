// src/strikethrough.ts
import { ok as assert } from "devlop";
import {
  classifyCharacter,
  classifyPrecedingCharacter,
  isCjk,
  isCodeHighSurrogate,
  isCodeLowSurrogate,
  isIvs,
  isNonCjkPunctuation,
  isUnicodeWhitespace,
  TwoPreviousCode,
  tryGetGenuineNextCode,
  tryGetGenuinePreviousCode
} from "micromark-extension-cjk-friendly-util";
import { splice } from "micromark-util-chunked";
import { resolveAll } from "micromark-util-resolve-all";
import { codes, constants, types } from "micromark-util-symbol";
function gfmStrikethroughCjkFriendly(options) {
  const options_ = options || {};
  let single = options_.singleTilde;
  const tokenizer = {
    name: "strikethrough",
    tokenize: tokenizeStrikethrough,
    resolveAll: resolveAllStrikethrough
  };
  if (single === null || single === void 0) {
    single = true;
  }
  return {
    text: { [codes.tilde]: tokenizer },
    insideSpan: { null: [tokenizer] },
    attentionMarkers: { null: [codes.tilde] }
  };
  function resolveAllStrikethrough(events, context) {
    let index = -1;
    while (++index < events.length) {
      if (events[index][0] === "enter" && events[index][1].type === "strikethroughSequenceTemporary" && events[index][1]._close) {
        let open = index;
        while (open--) {
          if (events[open][0] === "exit" && events[open][1].type === "strikethroughSequenceTemporary" && events[open][1]._open && // If the sizes are the same:
          events[index][1].end.offset - events[index][1].start.offset === events[open][1].end.offset - events[open][1].start.offset) {
            events[index][1].type = "strikethroughSequence";
            events[open][1].type = "strikethroughSequence";
            const strikethrough = {
              type: "strikethrough",
              start: Object.assign({}, events[open][1].start),
              end: Object.assign({}, events[index][1].end)
            };
            const text = {
              type: "strikethroughText",
              start: Object.assign({}, events[open][1].end),
              end: Object.assign({}, events[index][1].start)
            };
            const nextEvents = [
              ["enter", strikethrough, context],
              ["enter", events[open][1], context],
              ["exit", events[open][1], context],
              ["enter", text, context]
            ];
            const insideSpan = context.parser.constructs.insideSpan.null;
            if (insideSpan) {
              splice(
                nextEvents,
                nextEvents.length,
                0,
                resolveAll(insideSpan, events.slice(open + 1, index), context)
              );
            }
            splice(nextEvents, nextEvents.length, 0, [
              ["exit", text, context],
              ["enter", events[index][1], context],
              ["exit", events[index][1], context],
              ["exit", strikethrough, context]
            ]);
            splice(events, open - 1, index - open + 3, nextEvents);
            index = open + nextEvents.length - 2;
            break;
          }
        }
      }
    }
    index = -1;
    while (++index < events.length) {
      if (events[index][1].type === "strikethroughSequenceTemporary") {
        events[index][1].type = types.data;
      }
    }
    return events;
  }
  function tokenizeStrikethrough(effects, ok, nok) {
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
    const events = this.events;
    let size = 0;
    return start;
    function start(code) {
      assert(code === codes.tilde, "expected `~`");
      if (previous === codes.tilde && events[events.length - 1][1].type !== types.characterEscape) {
        return nok(code);
      }
      effects.enter("strikethroughSequenceTemporary");
      return more(code);
    }
    function more(code) {
      const before2 = classifyCharacter(previous);
      if (code === codes.tilde) {
        if (size > 1) return nok(code);
        effects.consume(code);
        size++;
        return more;
      }
      if (size < 2 && !single) return nok(code);
      const token = effects.exit("strikethroughSequenceTemporary");
      const next = isCodeHighSurrogate(code) ? tryGetGenuineNextCode(code, now(), sliceSerialize) : code;
      const after = classifyCharacter(next);
      const beforeNonCjkPunctuation = isNonCjkPunctuation(beforePrimary);
      const beforeSpaceOrNonCjkPunctuation = beforeNonCjkPunctuation || isUnicodeWhitespace(beforePrimary);
      const afterNonCjkPunctuation = isNonCjkPunctuation(after);
      const afterSpaceOrNonCjkPunctuation = afterNonCjkPunctuation || isUnicodeWhitespace(after);
      const beforeCjkOrIvs = isCjk(beforePrimary) || isIvs(before2);
      token._open = !afterSpaceOrNonCjkPunctuation || after === constants.attentionSideAfter && (beforeSpaceOrNonCjkPunctuation || beforeCjkOrIvs);
      token._close = !beforeSpaceOrNonCjkPunctuation || before2 === constants.attentionSideAfter && (afterSpaceOrNonCjkPunctuation || isCjk(after));
      return ok(code);
    }
  }
}
export {
  gfmStrikethroughCjkFriendly
};
