# tw-animate-css

[![npm version](https://img.shields.io/npm/v/tw-animate-css?color=red&logo=npm)](https://www.npmjs.com/package/tw-animate-css)
[![npm downloads](https://img.shields.io/npm/dt/tw-animate-css?color=red&logo=npm)](https://www.npmjs.com/package/tw-animate-css)
[![MIT license](https://img.shields.io/github/license/Wombosvideo/tw-animate-css)]()
[![GitHub stars](https://img.shields.io/github/stars/Wombosvideo/tw-animate-css?color=blue)](https://github.com/Wombosvideo/tw-animate-css)

A collection of Tailwind CSS v4.0 utilities for creating beautiful animations. Includes ready-to-use animations `accordion-down`, `accordion-up` and `caret-blink`, as well as a set of utilities for creating your own animations.

---

This package is a replacement for [`tailwindcss-animate`][Original_Plugin_GitHub]. It embraces the new [CSS-first architecture][TailwindCSS_Custom_Utilities], providing a pure CSS solution for adding animation capabilities to your Tailwind CSS project without relying on the legacy JavaScript plugin system or having to define all keywords from scratch.

> [!WARNING]
> The upcoming release v2.0.0 will include breaking changes. A migration script and a guide will be provided to help you transition smoothly.

## Table of Contents

- [Getting Started](#getting-started)
  - [NPM](#npm)
  - [Manual Download](#manual-download)
- [Usage](#usage)
  - [Enter/Exit Animations](#enterexit-animations)
    - [Base Classes](#base-classes)
    - [Parameter Classes](#parameter-classes)
    - [Transform Classes](#transform-classes)
  - [Ready-to-Use Animations](#ready-to-use-animations)
- [Examples](#examples)
- [Notes on Compatibility](#notes-on-compatibility)

## Getting Started

### NPM

1. Install the package with `npm`:

   ```sh
   npm install -D tw-animate-css
   ```

2. Add the following line to your `app.css` or `globals.css` file:

   ```css
   @import "tw-animate-css";
   ```

3. Start using the animations!

   ```html
   <!-- Add an animated fade and zoom entrance -->
   <div class="animate-in fade-in zoom-in">...</div>

   <!-- Add an animated slide to top-left exit -->
   <div class="animate-out slide-out-to-top slide-out-to-left">...</div>

   <!-- Control animation duration -->
   <div class="... duration-300">...</div>

   <!-- Control animation delay -->
   <div class="... delay-150">...</div>

   <!-- And so much more! -->
   ```

> ℹ️ **NOTE**  
> The above guide works for esbuild, Vite and probably other bundlers too. If you are using a different bundler, the syntax may differ. [Let me know][Create_Issue] how it works and I'll update the documentation.

### Manual Download

1. Download the [`tw-animate.css`][CSS_File]
   file from GitHub and place it next to your `app.css` or `globals.css` file.
2. Add the following line to your `app.css` or `globals.css` file:

   ```css
   @import "./tw-animate.css";
   ```

3. Start using the animations!

   ```html
   <!-- Add an animated fade and zoom entrance -->
   <div class="animate-in fade-in zoom-in">...</div>

   <!-- Add an animated slide to top-left exit -->
   <div class="animate-out slide-out-to-top slide-out-to-left">...</div>

   <!-- Control animation duration -->
   <div class="... duration-300">...</div>

   <!-- Control animation delay -->
   <div class="... delay-150">...</div>

   <!-- And so much more! -->
   ```

## Usage

### Enter/Exit Animations

To keep the README concise, I'll define a few variables:

- `<io>`: Specify the type of animation. This can be `in` for enter or `out` for exit animations.
- `<dir>`: Specify the direction of the slide. This can be `in-from-top`, `in-from-bottom`, `in-from-left`, `in-from-right`, `in-from-start`, `in-from-end`, `out-to-top`, `out-to-bottom`, `out-to-left`, `out-to-right`, `out-to-start`, or `out-to-end`.
- `*`: Specify a value to apply. See list of possible values.

#### Base Classes

| Class                     | Description                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [`animate-<io>`][Docs_IO] | Base class for enter/exit animations. This needs to be applied in order for enter/exit animations to work. |

#### Parameter Classes

To customize the animation parameters, use the following classes:

| Class                             | Description                                                                                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`duration-*`][Docs_Duration]     | Sets [`animation-duration`][MDN_Duration]. Uses `--tw-duration`, see [Tailwind CSS docs][TailwindCSS_Duration]. Defaults to `duration-150`.              |
| [`ease-*`][Docs_Ease]             | Sets [`animation-timing-function`][MDN_Ease]. Uses `--tw-ease`, see [Tailwind CSS docs][TailwindCSS_Easing]. Defaults to `ease-[ease]`.                  |
| [`delay-*`][Docs_Delay]           | Sets [`animation-delay`][MDN_Delay]. Possible values: Any `<number>`, `initial`, or any other `[<value>]`.                                               |
| [`repeat-*`][Docs_Repeat]         | Sets [`animation-iteration-count`][MDN_Repeat]. Possible values: Any `<number>`, `infinite`, `initial` or any other `[<value>]`.                         |
| [`direction-*`][Docs_Direction]   | Sets [`animation-direction`][MDN_Direction]. Possible values: `normal`, `reverse`, `alternate`, `alternate-reverse`, `initial` or any other `[<value>]`. |
| [`fill-mode-*`][Docs_Fill_Mode]   | Sets [`animation-fill-mode`][MDN_Fill_Mode]. Possible values: `none`, `forwards`, `backwards`, `both`, `initial` or any other `[<value>]`.               |
| [`running`][Docs_Running]         | Sets [`animation-play-state`][MDN_Play_State] to `running`.                                                                                              |
| [`paused`][Docs_Paused]           | Sets [`animation-play-state`][MDN_Play_State] to `paused`.                                                                                               |
| [`play-state-*`][Docs_Play_State] | Sets [`animation-play-state`][MDN_Play_State]. Possible values: `initial` or any other `[<value>]`.                                                      |

#### Transform Classes

| Class                         | Description                                                                                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`blur-in-*`][Docs_Blur]      | Applies a blur effect on the element when it enters. Possible values: `blur-in`, `blur-in-<number>`, `blur-in-(<custom-property>)`, or `blur-in-[<value>]`.    |
| [`blur-out-*`][Docs_Blur]     | Applies a blur effect on the element when it exits. Possible values: `blur-out`, `blur-out-<number>`, `blur-out-(<custom-property>)`, or `blur-out-[<value>]`. |
| [`fade-<io>`][Docs_Fade]      | Fades the element in from or out to `opacity: 0`.                                                                                                              |
| [`fade-<io>-*`][Docs_Fade]    | Fades the element in from or out to the specified value. Possible values: Any `<number>` (percentage) or any other `[<value>]`.                                |
| [`zoom-<io>`][Docs_Zoom]      | Zooms the element in from or out to `scale3D(0,0,0)`.                                                                                                          |
| [`zoom-<io>-*`][Docs_Zoom]    | Zooms the element in from or out to the specified value. Possible values: Any `<number>` (percentage) or any other `[<value>]`.                                |
| [`spin-<io>`][Docs_Spin]      | Spins the element in from or out to `rotate(30deg)`.                                                                                                           |
| [`spin-<io>-*`][Docs_Spin]    | Spins the element in from or out to the specified value. Possible values: Any `<number>` (degrees) or any other `[<value>]`.                                   |
| [`slide-<dir>`][Docs_Slide]   | Slides the element in from or out to the specified direction (`100%`).                                                                                         |
| [`slide-<dir>-*`][Docs_Slide] | Slides the element in from or out to the specified value. Possible values: Any `<number>` (percentage) or any other `[<value>]`.                               |

### Ready-to-Use Animations

| Class                                  | Description                                                                                                                                                                                              |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`accordion-down`][Docs_Accordion]     | Accordion down animation. Requires `--radix-accordion-content-height` or one of the [other accordion content height variables][Docs_Accordion_Content_Height] to be set to the content's height.         |
| [`accordion-up`][Docs_Accordion]       | Accordion up animation. Requires `--radix-accordion-content-height` or one of the [other accordion content height variables][Docs_Accordion_Content_Height] to be set to the content's height.           |
| [`collapsible-down`][Docs_Collapsible] | Collapsible down animation. Requires `--radix-collapsible-content-height` or one of the [other collapsible content height variables][Docs_Collapsible_Content_Height] to be set to the content's height. |
| [`collapsible-up`][Docs_Collapsible]   | Collapsible up animation. Requires `--radix-collapsible-content-height` or one of the [other collapsible content height variables][Docs_Collapsible_Content_Height] to be set to the content's height.   |
| [`caret-blink`][Docs_Caret]            | Blinking animation for caret/cursor.                                                                                                                                                                     |

By the way, if you don't use some of the above animations, they will not be included in the final CSS file. This is because Tailwind CSS kind of does tree-shaking for you. So, if you don't use `accordion-down`, it won't be included in the final CSS file.

## Examples

**Basic usage:**

```html
<div class="animate-in fade-in slide-in-from-top-8 duration-500">
  Fade in from 0% opacity,<br />
  slide from top by 8 spacing units (2rem),<br />
  with a 500ms duration.
</div>
```

**Advanced usage:**

```html
<div
  class="data-[state=show]:animate-in data-[state=hide]:animate-out fade-in slide-in-from-top-8 fade-out slide-out-to-top-8 duration-500"
  data-state="show"
>
  <p>
    If the element has the <code>data-state="show"</code> attribute,<br />
    fade in from 0% opacity,<br />
    slide from top by 8 spacing units (2rem),<br />
    with a 500ms duration.
  </p>
  <p>
    If the element has the <code>data-state="hide"</code> attribute,<br />
    fade out to 0% opacity,<br />
    slide to top by 8 spacing units (2rem),<br />
    with a 500ms duration.
  </p>
</div>
```

## Notes on Compatibility

> ℹ️ **NOTE**  
> I use only a small portion of the original plugin, so it might not be a 100% compatible drop-in replacement. If you notice any inconsistencies, feel free to contribute to this repository by opening a pull-request.

<!-- Links -->

[Original_Plugin_GitHub]: https://github.com/jamiebuilds/tailwindcss-animate
[Original_Plugin_Docs]: https://github.com/jamiebuilds/tailwindcss-animate/blob/main/README.md
[TailwindCSS_Custom_Utilities]: https://tailwindcss.com/docs/adding-custom-styles#adding-custom-utilities
[TailwindCSS_Duration]: https://tailwindcss.com/docs/transition-duration
[TailwindCSS_Easing]: https://tailwindcss.com/docs/transition-timing-function
[TailwindCSS_Delay]: https://tailwindcss.com/docs/transition-delay
[Docs_IO]: ./docs/animations/in-out.md
[Docs_Duration]: ./docs/parameters/animation-duration.md
[Docs_Ease]: ./docs/parameters/animation-timing-function.md
[Docs_Delay]: ./docs/parameters/animation-delay.md
[Docs_Repeat]: ./docs/parameters/animation-iteration-count.md
[Docs_Direction]: ./docs/parameters/animation-direction.md
[Docs_Fill_Mode]: ./docs/parameters/animation-fill-mode.md
[Docs_Running]: ./docs/parameters/animation-play-state.md#running
[Docs_Paused]: ./docs/parameters/animation-play-state.md#paused
[Docs_Play_State]: ./docs/parameters/animation-play-state.md#play-state-
[Docs_Blur]: ./docs/transforms/blur.md
[Docs_Fade]: ./docs/transforms/opacity.md
[Docs_Zoom]: ./docs/transforms/scale.md
[Docs_Spin]: ./docs/transforms/rotate.md
[Docs_Slide]: ./docs/transforms/translate.md
[Docs_Accordion]: ./docs/animations/accordion.md
[Docs_Accordion_Content_Height]: ./docs/animations/accordion.md#setting-content-height
[Docs_Collapsible]: ./docs/animations/collapsible.md
[Docs_Collapsible_Content_Height]: ./docs/animations/collapsible.md#setting-content-height
[Docs_Caret]: ./docs/animations/caret-blink.md
[MDN_Duration]: https://developer.mozilla.org/en-US/docs/Web/CSS/animation-duration
[MDN_Ease]: https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timing-function
[MDN_Delay]: https://developer.mozilla.org/en-US/docs/Web/CSS/animation-delay
[MDN_Repeat]: https://developer.mozilla.org/en-US/docs/Web/CSS/animation-iteration-count
[MDN_Direction]: https://developer.mozilla.org/en-US/docs/Web/CSS/animation-direction
[MDN_Fill_Mode]: https://developer.mozilla.org/en-US/docs/Web/CSS/animation-fill-mode
[MDN_Play_State]: https://developer.mozilla.org/en-US/docs/Web/CSS/animation-play-state
[Create_Issue]: https://github.com/Wombosvideo/tw-animate-css/issues/new
[CSS_File]: https://raw.githubusercontent.com/Wombosvideo/tw-animate-css/refs/heads/main/src/tw-animate.css
