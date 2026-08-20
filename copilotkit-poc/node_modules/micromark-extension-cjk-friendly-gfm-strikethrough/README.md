# micromark-extension-cjk-friendly-gfm-strikethrough

[![Version](https://img.shields.io/npm/v/micromark-extension-cjk-friendly-gfm-strikethrough)](https://npmjs.com/package/micromark-extension-cjk-friendly-gfm-strikethrough) ![Node Current](https://img.shields.io/node/v/micromark-extension-cjk-friendly-gfm-strikethrough) [![NPM Downloads](https://img.shields.io/npm/dm/micromark-extension-cjk-friendly-gfm-strikethrough)](https://npmjs.com/package/micromark-extension-cjk-friendly-gfm-strikethrough) [![NPM Last Update](https://img.shields.io/npm/last-update/micromark-extension-cjk-friendly-gfm-strikethrough)](https://npmjs.com/package/micromark-extension-cjk-friendly-gfm-strikethrough) [![Socket Badge](https://badge.socket.dev/npm/package/micromark-extension-cjk-friendly-gfm-strikethrough)](https://socket.dev/npm/package/micromark-extension-cjk-friendly-gfm-strikethrough) [![Snyk Advisor Package Health Badge](https://snyk.io/advisor/npm-package/micromark-extension-cjk-friendly-gfm-strikethrough/badge.svg)](https://snyk.io/advisor/npm-package/micromark-extension-cjk-friendly-gfm-strikethrough)

A [micromark](https://github.com/micromark/micromark) extension to make GitHub Flavored Markdown (GFM) strikethrough (`~~`) compatible with Chinese, Japanese, and Korean (CJK).

<span lang="ja">GitHub Flavored Markdown（GFM）の取り消し線記号（`~~`）を日本語・中国語・韓国語にきちんと対応させるための[micromark](https://github.com/micromark/micromark)拡張</span>

<span lang="zh-Hans-CN">一个 [micromark](https://github.com/micromark/micromark) 扩展，用于使 GitHub Flavored Markdown（GFM）的删除线标记（`~~`）能够正确支持中文、日语和韩语文本。</span>

<span lang="ko">GitHub Flavored Markdown(GFM)의 취소선 기호(`~~`)를 한국어, 중국어, 일본어와 호환되도록 만드는 [micromark](https://github.com/micromark/micromark) 확장</span>

## Problem / <span lang="ja">問題</span> / <span lang="zh-Hans-CN">问题</span> / <span lang="ko">문제점</span>

CommonMark has a problem that the following emphasis marks `**` are not recognized as emphasis marks in Japanese, Chinese, and Korean.

<span lang="ja">CommonMarkには、日本語・中国語・韓国語内の次のような強調記号(`**`)が強調記号として認識されない問題があります。</span>

<span lang="zh-Hans-CN">CommonMark存在以下问题：在中文、日语和韩语文本中，强调标记`**`不会被识别为强调标记。</span>

<span lang="ko">CommonMark는 일본어와 중국어에서 다음과 같은 강조 표시 `**`가 강조 표시로 인식되지 않는 문제가 있습니다.</span>

```md
**このアスタリスクは強調記号として認識されず、そのまま表示されます。**この文のせいで。

**该星号不会被识别，而是直接显示。**这是因为它没有被识别为强调符号。

**이 별표는 강조 표시로 인식되지 않고 그대로 표시됩니다(이 괄호 때문에)**이 문장 때문에.
```

This problem occurs because the character just inside the `**` is a (Japanese or Chinese) punctuation mark (。) or parenthesis and the character just outside is not a space or punctuation mark.

<span lang="ja">これが起こった原因は、終了側の`**`のすぐ内側が約物（。やカッコ）、かつ外側が約物や空白以外の文字であるためです。</span>

<span lang="zh-Hans-CN">这个问题是因为在`**`的结束部分，内侧字符是标点符号（。）或括号，而外侧字符不是空格或标点符号。</span>

<span lang="ko">이 문제는 `**` 바로 안쪽의 문자가 (일본어나 중국어) 문장 부호(。) 또는 괄호이고 바깥쪽 문자가 공백이나 문장 부호가 아니기 때문에 발생합니다.</span>

Of course, not only the end side but also the start side has the same issue.

<span lang="ja">もちろん終了側だけでなく、開始側も同様の問題が存在します。</span>

<span lang="zh-Hans-CN">当然，不仅是结束侧，开始侧也存在同样的问题。</span>

<span lang="ko">물론 끝나는 부분뿐만 아니라 시작하는 부분에서도 동일한 문제가 있습니다.</span>

CommonMark issue: https://github.com/commonmark/commonmark-spec/issues/650

This behavior is also applied to the strikethrough (`~~`) in GFM.

<span lang="ja">この挙動は、GFMの取り消し線（`~~`）にも該当します。</span>

<span lang="zh-Hans-CN">这个行为也适用于 GFM 的删除线（`~~`）。</span>

<span lang="ko">이 동작은 GFM의 취소선(`~~`)에도 해당됩니다.</span>

## Runtime Requirements / <span lang="ja">実行環境の要件</span> / <span lang="zh-Hans-CN">运行环境要求</span> / <span lang="ko">업데이트 전략</span>

This package is ESM-only. It requires Node.js 16 or later.

<span lang="ja">本パッケージはESM専用です。Node.js 16以上が必要です。</span>

<span lang="zh-Hans-CN">此包仅支持ESM。需要Node.js 16或更高版本。</span>

<span lang="ko">이 패키지는 ESM만 사용을 위한 패키지입니다. Node.js 16或更高版本가 필요입니다.</span>

## Installation / <span lang="ja">インストール</span> / <span lang="zh-Hans-CN">安装</span> / <span lang="ko">설치</span>

Install `micromark-extension-cjk-friendly-gfm-strikethrough` via [npm](https://www.npmjs.com/):

<span lang="ja">`micromark-extension-cjk-friendly-gfm-strikethrough`を[npm](https://www.npmjs.com/)でインストールしてください。</span>

<span lang="zh-Hans-CN">通过 [npm](https://www.npmjs.com/) 安装 `micromark-extension-cjk-friendly-gfm-strikethrough`。</span>

<span lang="ko">`micromark-extension-cjk-friendly-gfm-strikethrough`를 [npm](https://www.npmjs.com/)으로 설치하세요.</span>

```bash
npm install micromark-extension-cjk-friendly-gfm-strikethrough
```

If you use another package manager, please replace `npm install` with the command of the package manager you use (e.g. `pnpm add` or `yarn add`).

<span lang="ja">npm以外のパッケージマネージャを使う場合は、`npm install`を当該パッケージマネージャのコマンド（例：`pnpm add`・`yarn add`）に置き換えてください。</span>

<span lang="zh-Hans-CN">如果使用其他包管理器，请将 `npm install` 替换为当时包管理器的命令（例如：`pnpm add`、`yarn add`）。</span>

<span lang="ko">다른 패키지 매니저를 사용하는 경우 `npm install`을 해당 패키지 매니저의 명령어(예: `pnpm add`, `yarn add`)로 바꾸어 주세요.</span>

## Usage / <span lang="ja">使い方</span> / <span lang="zh-Hans-CN">用法</span> / <span lang="ko">사용법</span>

Import `micromark` and `micromark-extension-cjk-friendly-strikethrough`, and use the extension as follows:

<span lang="ja">`micromark`と`micromark-extension-cjk-friendly-strikethrough`をインポートし、次のように拡張を使用してください。</span>

<span lang="zh-Hans-CN">通过 `micromark` 和 `micromark-extension-cjk-friendly-strikethrough` 导入，然后使用扩展如下：</span>

<span lang="ko">`micromark`와 `micromark-extension-cjk-friendly-strikethrough`를 임포트하고 다음과 같이 확장을 사용하세요.</span>

```js
import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";
import { cjkFriendlyExtension } from "micromark-extension-cjk-friendly";
import { gfmStrikethroughCjkFriendly } from "micromark-extension-cjk-friendly-gfm-strikethrough";

// e.g. combine with GFM extension
const htmlString = micromark(
  markdownString,
  {
    // gfmStrikethroughCjkFriendly() must be after gfm()
    extensions: [gfm(), cjkFriendlyExtension(), gfmStrikethroughCjkFriendly()],
    htmlExtensions: [gfmHtml()],
  }
)
```

> [!IMPORTANT]
> `gfmStrikethroughCjkFriendly()` must be after `gfm()`, or `gfmStrikethroughCjkFriendly()` will not work.
>
> <span lang="ja">`gfmStrikethroughCjkFriendly()`は`gfm()`の後に入れてください。そうしないと`gfmStrikethroughCjkFriendly()`は機能しません。</span>
>
> <span lang="zh-Hans-CN">`gfmStrikethroughCjkFriendly()` 必须在 `gfm()` 后面，否则 `gfmStrikethroughCjkFriendly()` 将不起作用。</span>
>
> <span lang="ko">`gfmStrikethroughCjkFriendly()`는 `gfm()` 후에 입력하면서 작동합니다. 이는 `gfmStrikethroughCjkFriendly()`는 작동하지 않습니다.</span>

## Specification / <span lang="ja">規格書</span> / <span lang="zh-Hans-CN">规范</span> / <span lang="ko">규정서</span>

The condition for `~~` to be recognized as a strikeout is the same as the condition for `**` to be recognized as emphasis in the following CommonMark specification amendment suggestion:

https://github.com/tats-u/markdown-cjk-friendly/blob/main/specification.md (English)

## Related packages / <span lang="ja">関連パッケージ</span> / <span lang="zh-Hans-CN">相关包</span> / <span lang="ko">관련 패키지</span>

- [micromark-extension-cjk-friendly](https://npmjs.com/package/micromark-extension-cjk-friendly) [![Version](https://img.shields.io/npm/v/micromark-extension-cjk-friendly)](https://npmjs.com/package/micromark-extension-cjk-friendly) ![Node Current](https://img.shields.io/node/v/micromark-extension-cjk-friendly) [![NPM Downloads](https://img.shields.io/npm/dm/micromark-extension-cjk-friendly)](https://npmjs.com/package/micromark-extension-cjk-friendly) [![NPM Last Update](https://img.shields.io/npm/last-update/micromark-extension-cjk-friendly)](https://npmjs.com/package/micromark-extension-cjk-friendly) [![Socket Badge](https://badge.socket.dev/npm/package/micromark-extension-cjk-friendly)](https://socket.dev/npm/package/micromark-extension-cjk-friendly) [![Snyk Advisor Package Health Badge](https://snyk.io/advisor/npm-package/micromark-extension-cjk-friendly/badge.svg)](https://snyk.io/advisor/npm-package/micromark-extension-cjk-friendly)
- [micromark-extension-cjk-friendly-util](https://npmjs.com/package/micromark-extension-cjk-friendly-util) [![Version](https://img.shields.io/npm/v/micromark-extension-cjk-friendly-util)](https://npmjs.com/package/micromark-extension-cjk-friendly-util) ![Node Current](https://img.shields.io/node/v/micromark-extension-cjk-friendly-util) [![NPM Downloads](https://img.shields.io/npm/dm/micromark-extension-cjk-friendly-util)](https://npmjs.com/package/micromark-extension-cjk-friendly-util) [![NPM Last Update](https://img.shields.io/npm/last-update/micromark-extension-cjk-friendly-util)](https://npmjs.com/package/micromark-extension-cjk-friendly-util) [![Socket Badge](https://badge.socket.dev/npm/package/micromark-extension-cjk-friendly-util)](https://socket.dev/npm/package/micromark-extension-cjk-friendly-util) [![Snyk Advisor Package Health Badge](https://snyk.io/advisor/npm-package/micromark-extension-cjk-friendly-util/badge.svg)](https://snyk.io/advisor/npm-package/micromark-extension-cjk-friendly-util)
- [remark-cjk-friendly](https://npmjs.com/package/remark-cjk-friendly) [![Version](https://img.shields.io/npm/v/remark-cjk-friendly)](https://npmjs.com/package/remark-cjk-friendly) ![Node Current](https://img.shields.io/node/v/remark-cjk-friendly) [![NPM Downloads](https://img.shields.io/npm/dm/remark-cjk-friendly)](https://npmjs.com/package/remark-cjk-friendly) [![NPM Last Update](https://img.shields.io/npm/last-update/remark-cjk-friendly)](https://npmjs.com/package/remark-cjk-friendly) [![Socket Badge](https://badge.socket.dev/npm/package/remark-cjk-friendly)](https://socket.dev/npm/package/remark-cjk-friendly) [![Snyk Advisor Package Health Badge](https://snyk.io/advisor/npm-package/remark-cjk-friendly/badge.svg)](https://snyk.io/advisor/npm-package/remark-cjk-friendly)
  - [remark-cjk-friendly-gfm-strikethrough](https://npmjs.com/package/remark-cjk-friendly-gfm-strikethrough) [![Version](https://img.shields.io/npm/v/remark-cjk-friendly-gfm-strikethrough)](https://npmjs.com/package/remark-cjk-friendly-gfm-strikethrough) ![Node Current](https://img.shields.io/node/v/remark-cjk-friendly-gfm-strikethrough) [![NPM Downloads](https://img.shields.io/npm/dm/remark-cjk-friendly-gfm-strikethrough)](https://npmjs.com/package/remark-cjk-friendly-gfm-strikethrough) [![NPM Last Update](https://img.shields.io/npm/last-update/remark-cjk-friendly-gfm-strikethrough)](https://npmjs.com/package/remark-cjk-friendly-gfm-strikethrough) [![Socket Badge](https://badge.socket.dev/npm/package/remark-cjk-friendly-gfm-strikethrough)](https://socket.dev/npm/package/remark-cjk-friendly-gfm-strikethrough) [![Snyk Advisor Package Health Badge](https://snyk.io/advisor/npm-package/remark-cjk-friendly-gfm-strikethrough/badge.svg)](https://snyk.io/advisor/npm-package/remark-cjk-friendly-gfm-strikethrough)
- [markdown-it-cjk-friendly](https://npmjs.com/package/markdown-it-cjk-friendly) [![Version](https://img.shields.io/npm/v/markdown-it-cjk-friendly)](https://npmjs.com/package/markdown-it-cjk-friendly) ![Node Current](https://img.shields.io/node/v/markdown-it-cjk-friendly) [![NPM Downloads](https://img.shields.io/npm/dm/markdown-it-cjk-friendly)](https://npmjs.com/package/markdown-it-cjk-friendly) [![NPM Last Update](https://img.shields.io/npm/last-update/markdown-it-cjk-friendly)](https://npmjs.com/package/markdown-it-cjk-friendly) [![Socket Badge](https://badge.socket.dev/npm/package/markdown-it-cjk-friendly)](https://socket.dev/npm/package/markdown-it-cjk-friendly) [![Snyk Advisor Package Health Badge](https://snyk.io/advisor/npm-package/markdown-it-cjk-friendly/badge.svg)](https://snyk.io/advisor/npm-package/markdown-it-cjk-friendly)

## Contributing / <span lang="ja">貢献</span> / <span lang="zh-Hans-CN">贡献</span> / <span lang="ko">기여</span>

### Setup

Install the dependencies:

```bash
pnpm install
```

### Get Started

Build the library:

```bash
pnpm build
```

Build the library in watch mode:

```bash
pnpm dev
```
