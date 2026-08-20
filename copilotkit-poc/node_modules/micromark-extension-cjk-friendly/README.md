# micromark-extension-cjk-friendly

[![Version](https://img.shields.io/npm/v/micromark-extension-cjk-friendly)](https://npmjs.com/package/micromark-extension-cjk-friendly) ![Node Current](https://img.shields.io/node/v/micromark-extension-cjk-friendly) [![NPM Downloads](https://img.shields.io/npm/dm/micromark-extension-cjk-friendly)](https://npmjs.com/package/micromark-extension-cjk-friendly) [![NPM Last Update](https://img.shields.io/npm/last-update/micromark-extension-cjk-friendly)](https://npmjs.com/package/micromark-extension-cjk-friendly) [![Socket Badge](https://badge.socket.dev/npm/package/micromark-extension-cjk-friendly)](https://socket.dev/npm/package/micromark-extension-cjk-friendly) [![Snyk Advisor Package Health Badge](https://snyk.io/advisor/npm-package/micromark-extension-cjk-friendly/badge.svg)](https://snyk.io/advisor/npm-package/micromark-extension-cjk-friendly)

A [micromark](https://github.com/micromark/micromark) extension to make Markdown emphasis (`**`) in CommonMark compatible with Chinese, Japanese, and Korean (CJK).

<span lang="ja">CommonMarkの強調記号(`**`)を日本語・中国語・韓国語にきちんと対応させるための[micromark](https://github.com/micromark/micromark)拡張</span>

<span lang="zh-Hans-CN">一个 [micromark](https://github.com/micromark/micromark) 扩展，用于使 CommonMark 的强调标记(`**`)能够正确支持中文、日语和韩语文本。</span>

<span lang="ko">CommonMark의 강조 표시(`**`) 를 한국어, 중국어, 일본어와 호환되도록 만드는 [micromark](https://github.com/micromark/micromark) 확장</span>

> [!NOTE]
> This package does not support the strikethrough syntax (`~~`) in GFM (GitHub Flavored Markdown). If you want to support it, please use [`micromark-extension-cjk-friendly-gfm-strikethrough`](https://npmjs.com/package/micromark-extension-cjk-friendly-gfm-strikethrough) along with this package.
>
> <span lang="ja">本パッケージはGitHub Flavored Markdown（GFM）の取り消し線（`~~`）に対応しません。対応させたい場合は、[`micromark-extension-cjk-friendly-gfm-strikethrough`](https://npmjs.com/package/micromark-extension-cjk-friendly-gfm-strikethrough)を併用してください。</span>
>
> <span lang="zh-Hans-CN">本包不支持 GitHub Flavored Markdown（GFM）的删除线（`~~`）。如果需要支持，请同时使用 [`micromark-extension-cjk-friendly-gfm-strikethrough`](https://npmjs.com/package/micromark-extension-cjk-friendly-gfm-strikethrough)。</span>
>
> <span lang="ko">이 패키지는 GitHub Flavored Markdown(GFM)의 취소선(`~~`)을 지원하지 않습니다. 지원하고 싶은 경우에는 [`micromark-extension-cjk-friendly-gfm-strikethrough`](https://npmjs.com/package/micromark-extension-cjk-friendly-gfm-strikethrough)를 함께 사용해 주세요.</span>

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

## Demo / <span lang="ja">デモ</span> / <span lang="zh-Hans-CN">演示</span> / <span lang="ko">데모</span>

https://tats-u.github.io/markdown-cjk-friendly

## When should I use this? / <span lang="ja">このパッケージを使うべき場合</span> / <span lang="zh-Hans-CN">何时使用此包</span> / <span lang="ko">이 패키지를 사용하는 시저</span>

If you are an engineer who must handle Chinese, Japanese, and Korean content that cannot be fully supervised, it is strongly recommended to use this package (adopt this specification instead of plain CommonMark or GFM). "Cannot be fully supervised" refers to situations such as:

1. When you need to display user-generated or AI-generated content as-is
2. When many translators do not understand this CommonMark behavior, and you cannot provide real-time rendering previews similar to production, and `<strong>` tags are not allowed
    - When using translation services like Crowdin or Transifex
    - When the person responsible for translation quality is not an engineer or does not understand this CommonMark behavior

Additionally, if you are creating Markdown-related software or services primarily targeting Chinese, Japanese, or Korean users (or all of them), it is strongly recommended to use this package (adopt this specification).

<span lang="ja">もしエンジニアであるあなたが全てに監修を入れられない日本語・中国語・韓国語のコンテンツを扱わなければならない場合、このパッケージを使う（素のCommonMarkやGFMではなく、この仕様を採用する）ことを強く推奨します。「全てに監修を入れられない」というのは、例えば次のようなものを指します。</span>

1. <span lang="ja">ユーザまたはAIが作成したコンテンツをそのまま表示する必要がある場合</span>
2. <span lang="ja">翻訳者に、このCommonMarkの仕様を理解していない人も多く、なおかつリアルタイムで本番同様の描画プレビューを提供できず、`<strong>`タグを許可していない場合</span>
    - <span lang="ja">翻訳にCrowdin・Transifexなどの翻訳サービスを使っている場合</span>
    - <span lang="ja">翻訳の品質に責任を負っている人が非エンジニアである、またはComonMarkのこの挙動を理解していない場合</span>

<span lang="ja">また、あなたが主に日本人・中国人・韓国人のいずれかまたは全てを対象としたMarkdown関連のソフトウェアやサービスを作成する場合も、このパッケージを使う（この仕様を採用する）ことを強く推奨します。</span>

<span lang="zh-Hans-CN">如果作为工程师的您必须处理无法全面监督的中文、日文和韩文内容，强烈建议使用这个包装（采用此规范，而不是普通的CommonMark或GFM）。"无法全面监督"指的是以下情况：</span>

1. <span lang="zh-Hans-CN">当需要按原样显示用户生成或AI生成的内容时</span>
2. <span lang="zh-Hans-CN">当许多翻译人员不理解这个CommonMark行为，而且无法提供类似生产环境的实时渲染预览，并且不允许使用`<strong>`标签时</span>
    - <span lang="zh-Hans-CN">当使用Crowdin或Transifex等翻译服务时</span>
    - <span lang="zh-Hans-CN">当负责翻译质量的人不是工程师或不理解这个CommonMark行为时</span>

<span lang="zh-Hans-CN">此外，如果您正在创建主要面向中国人、日本人或韩国人（或全部）的Markdown相关软件或服务，也强烈建议采用此规范。</span>

<span lang="ko">엔지니어로서 완전히 감독할 수 없는 일본어, 중국어, 한국어 콘텐츠를 다뤄야 하는 경우, 이 패키지를 사용하세요 (일반 CommonMark나 GFM 대신 이 사양을 채택할 것을 강력히 권장합니다). "완전히 감독할 수 없는"이란 다음과 같은 상황을 의미합니다:</span>

1. <span lang="ko">사용자 또는 AI가 생성한 콘텐츠를 그대로 표시해야 하는 경우</span>
2. <span lang="ko">많은 번역자가 이 CommonMark 동작을 이해하지 못하고, 실시간으로 실제 환경과 유사한 렌더링 미리보기를 제공할 수 없으며, `<strong>` 태그가 허용되지 않는 경우</span>
    - <span lang="ko">Crowdin이나 Transifex 같은 번역 서비스를 사용하는 경우</span>
    - <span lang="ko">번역 품질에 책임을 지는 사람이 엔지니어가 아니거나 이 CommonMark 동작을 이해하지 못하는 경우</span>

<span lang="ko">또한, 주로 일본어, 중국어, 한국어 사용자(또는 모두)를 대상으로 하는 Markdown 관련 소프트웨어나 서비스를 만들고 있다면, 이 패키지를 사용하세요 (이 사양을 채택할 것을 강력히 권장합니다).</span>

## Runtime Requirements / <span lang="ja">実行環境の要件</span> / <span lang="zh-Hans-CN">运行环境要求</span> / <span lang="ko">업데이트 전략</span>

This package is ESM-only. It requires Node.js 16 or later.

<span lang="ja">本パッケージはESM専用です。Node.js 16以上が必要です。</span>

<span lang="zh-Hans-CN">此包仅支持ESM。需要Node.js 16或更高版本。</span>

<span lang="ko">이 패키지는 ESM만 사용을 위한 패키지입니다. Node.js 16或更高版本가 필요입니다.</span>

## Installation / <span lang="ja">インストール</span> / <span lang="zh-Hans-CN">安装</span> / <span lang="ko">설치</span>

Install `micromark-extension-cjk-friendly` via [npm](https://www.npmjs.com/):

<span lang="ja">`micromark-extension-cjk-friendly`を[npm](https://www.npmjs.com/)でインストールしてください。</span>

<span lang="zh-Hans-CN">通过 [npm](https://www.npmjs.com/) 安装 `micromark-extension-cjk-friendly`。</span>

<span lang="ko">`micromark-extension-cjk-friendly`를 [npm](https://www.npmjs.com/)으로 설치하세요.</span>

```bash
npm install micromark-extension-cjk-friendly
```

If you use another package manager, please replace `npm install` with the command of the package manager you use (e.g. `pnpm add` or `yarn add`).

<span lang="ja">npm以外のパッケージマネージャを使う場合は、`npm install`を当該パッケージマネージャのコマンド（例：`pnpm add`・`yarn add`）に置き換えてください。</span>

<span lang="zh-Hans-CN">如果使用其他包管理器，请将 `npm install` 替换为当时包管理器的命令（例如：`pnpm add`、`yarn add`）。</span>

<span lang="ko">다른 패키지 매니저를 사용하는 경우 `npm install`을 해당 패키지 매니저의 명령어(예: `pnpm add`, `yarn add`)로 바꾸어 주세요.</span>

## Usage / <span lang="ja">使い方</span> / <span lang="zh-Hans-CN">用法</span> / <span lang="ko">사용법</span>

Import `micromark` and `micromark-extension-cjk-friendly`, and use the extension as follows:

<span lang="ja">`micromark`と`micromark-extension-cjk-friendly`をインポートし、次のように拡張を使用してください。</span>

<span lang="zh-Hans-CN">通过 `micromark` 和 `micromark-extension-cjk-friendly` 导入，然后使用扩展如下：</span>

<span lang="ko">`micromark`와 `micromark-extension-cjk-friendly`를 임포트하고 다음과 같이 확장을 사용하세요.</span>

```js
import { micromark } from "micromark";
import { gfm, gfmHtml } from "micromark-extension-gfm";
import { cjkFriendlyExtension } from "micromark-extension-cjk-friendly";

// e.g. combine with GFM extension
const htmlString = micromark(
  markdownString,
  {
    extensions: [gfm(), cjkFriendlyExtension()], // in no particular order
    htmlExtensions: [gfmHtml()],
  }
)
```

## Compatibility with the other languages / <span lang="ja">他言語との互換性</span> / <span lang="zh-Hans-CN">与其他语言的兼容性</span> / <span lang="ko">다른 언어와의 호환성</span>

This modification of the specification does not affect the other languages than Chinese, Japanese, and Korean. Even if your application or document has translations or content in other languages, it will not be affected, so please feel free to use this packages. I assure that even with this package (amendment suggestion), micromark still outputs the same HTML for all CommonMark test cases as of 0.31.2.

<span lang="ja">この仕様変更提案は、日本語・中国語・韓国語以外の言語には影響しません。アプリケーションやドキュメントに他言語の翻訳やコンテンツが含まれていても影響はありませんので、安心して本パッケージをご利用ください。</span>

<span lang="zh-Hans-CN">除中文、日文和韩文外，建议的规范变更不会影响其他语言。请放心使用此软件包，因为如果您的应用程序或文档包含其他语言的翻译或内容，也不会受到影响。我保证，即使使用此软件包（修正建议），micromark 仍然会为 0.31.2 版本的所有 CommonMark 测试用例输出相同的 HTML。</span>

<span lang="ko">이번 사양 변경 제안은 한국어, 중국어, 일본어 이외의 언어에는 영향을 미치지 않습니다. 애플리케이션이나 문서에 다른 언어의 번역이나 콘텐츠가 포함되어 있어도 영향을 받지 않으므로 안심하고 본 패키지를 사용하시기 바랍니다. 본 패키지(수정안)를 사용해도 0.31.2 시점의 모든 CommonMark 테스트케이스에서 micromark가 동일한 HTML을 출력하는 것을 보장합니다.</span>

## Specification / <span lang="ja">規格書</span> / <span lang="zh-Hans-CN">规范</span> / <span lang="ko">규정서</span>

https://github.com/tats-u/markdown-cjk-friendly/blob/main/specification.md (English)

## Related packages / <span lang="ja">関連パッケージ</span> / <span lang="zh-Hans-CN">相关包</span> / <span lang="ko">관련 패키지</span>

- [remark-cjk-friendly](https://npmjs.com/package/remark-cjk-friendly) [![Version](https://img.shields.io/npm/v/remark-cjk-friendly)](https://npmjs.com/package/remark-cjk-friendly) ![Node Current](https://img.shields.io/node/v/remark-cjk-friendly) [![NPM Downloads](https://img.shields.io/npm/dm/remark-cjk-friendly)](https://npmjs.com/package/remark-cjk-friendly) [![NPM Last Update](https://img.shields.io/npm/last-update/remark-cjk-friendly)](https://npmjs.com/package/remark-cjk-friendly) [![Socket Badge](https://badge.socket.dev/npm/package/remark-cjk-friendly)](https://socket.dev/npm/package/remark-cjk-friendly) [![Snyk Advisor Package Health Badge](https://snyk.io/advisor/npm-package/remark-cjk-friendly/badge.svg)](https://snyk.io/advisor/npm-package/remark-cjk-friendly)
- [markdown-it-cjk-friendly](https://npmjs.com/package/markdown-it-cjk-friendly) [![Version](https://img.shields.io/npm/v/markdown-it-cjk-friendly)](https://npmjs.com/package/markdown-it-cjk-friendly) ![Node Current](https://img.shields.io/node/v/markdown-it-cjk-friendly) [![NPM Downloads](https://img.shields.io/npm/dm/markdown-it-cjk-friendly)](https://npmjs.com/package/markdown-it-cjk-friendly) [![NPM Last Update](https://img.shields.io/npm/last-update/markdown-it-cjk-friendly)](https://npmjs.com/package/markdown-it-cjk-friendly) [![Socket Badge](https://badge.socket.dev/npm/package/markdown-it-cjk-friendly)](https://socket.dev/npm/package/markdown-it-cjk-friendly) [![Snyk Advisor Package Health Badge](https://snyk.io/advisor/npm-package/markdown-it-cjk-friendly/badge.svg)](https://snyk.io/advisor/npm-package/markdown-it-cjk-friendly)
- [micromark-extension-cjk-friendly-util](https://npmjs.com/package/micromark-extension-cjk-friendly-util) [![Version](https://img.shields.io/npm/v/micromark-extension-cjk-friendly-util)](https://npmjs.com/package/micromark-extension-cjk-friendly-util) ![Node Current](https://img.shields.io/node/v/micromark-extension-cjk-friendly-util) [![NPM Downloads](https://img.shields.io/npm/dm/micromark-extension-cjk-friendly-util)](https://npmjs.com/package/micromark-extension-cjk-friendly-util) [![NPM Last Update](https://img.shields.io/npm/last-update/micromark-extension-cjk-friendly-util)](https://npmjs.com/package/micromark-extension-cjk-friendly-util) [![Socket Badge](https://badge.socket.dev/npm/package/micromark-extension-cjk-friendly-util)](https://socket.dev/npm/package/micromark-extension-cjk-friendly-util) [![Snyk Advisor Package Health Badge](https://snyk.io/advisor/npm-package/micromark-extension-cjk-friendly-util/badge.svg)](https://snyk.io/advisor/npm-package/micromark-extension-cjk-friendly-util)
- [micromark-extension-cjk-friendly-gfm-strikethrough](https://npmjs.com/package/micromark-extension-cjk-friendly-gfm-strikethrough) [![Version](https://img.shields.io/npm/v/micromark-extension-cjk-friendly-gfm-strikethrough)](https://npmjs.com/package/micromark-extension-cjk-friendly-gfm-strikethrough) ![Node Current](https://img.shields.io/node/v/micromark-extension-cjk-friendly-gfm-strikethrough) [![NPM Downloads](https://img.shields.io/npm/dm/micromark-extension-cjk-friendly-gfm-strikethrough)](https://npmjs.com/package/micromark-extension-cjk-friendly-gfm-strikethrough) [![NPM Last Update](https://img.shields.io/npm/last-update/micromark-extension-cjk-friendly-gfm-strikethrough)](https://npmjs.com/package/micromark-extension-cjk-friendly-gfm-strikethrough) [![Socket Badge](https://badge.socket.dev/npm/package/micromark-extension-cjk-friendly-gfm-strikethrough)](https://socket.dev/npm/package/micromark-extension-cjk-friendly-gfm-strikethrough) [![Snyk Advisor Package Health Badge](https://snyk.io/advisor/npm-package/micromark-extension-cjk-friendly-gfm-strikethrough/badge.svg)](https://snyk.io/advisor/npm-package/micromark-extension-cjk-friendly-gfm-strikethrough)

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
