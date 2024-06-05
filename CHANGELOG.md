# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

The API is unstable, and [Semantic Versioning](https://semver.org/spec/v2.0.0.html) does not yet apply.

## [Unreleased]
<details>
	<summary>
		Changes in master that are not yet released.
		Click to see more.
	</summary>

### Fixed

- Fixed positioning of windows when minimized without a taskbar.

</details>

## [0.7.2] - 2024-05-29

### Fixed

- Marked `options.element` and `options` as optional in `applyCSSProperties` type declarations.
- Added missing `force` parameter to `$Window`'s `close` method in type declarations and documentation.
- Changed `getIconAtSize` return type to `Node | null` (from `HTMLElement`) in type declarations, and mentioned that it can return `null` in the documentation.
- (Also changed type of `private $icon` to `JQuery<Node>`)
- (Added `dock` method requirement to deprecated `$component` option of `$Window` constructor, in type declarations.)
- (Removed weird `$G.off("scroll", onscroll);` for non-existent `onscroll` in `$Window.js`. This didn't cause an error, since `onscroll` is a global event, but it shouldn't have been there.)

## [0.7.1] - 2024-05-24

### Fixed

- Fixed an assertion error that was thrown when navigating menus with the keyboard, due to an overly broad condition. (I asserted that the type was HTMLElement, but needed to assert that it was *either null or* an HTMLElement. The assertion was just for type narrowing.)

## [0.7.0] - 2024-05-23

### Deprecated

- [Deprecate `item` in favor of `label` for menu item labels](https://github.com/1j01/os-gui/commit/c14be98e1f1f4211a8a8bb47470796750184e740)
  - This is just a clearer name for the property.
- [Deprecate `shortcut` in favor of `shortcutLabel` and `ariaKeyShortcuts`](https://github.com/1j01/os-gui/commit/92541cb3d22c0f5de2fbd11c02fe21713a033203)
  - `aria-keyshortcuts` needs "Control" spelled out, and for macOS "Meta" for the command key, unlike the traditional visual representations. Hence the separation of concerns.


### Added
- `AccessKeys` API for parsing and rendering labels with access keys (syntax: `&` defines the following character as the access key, `&&` inserts one literal ampersand)
  - `AccessKeys.escape(label)` escapes ampersands by doubling them
  - `AccessKeys.unescape(label)` unescapes ampersands by removing one of each pair
  - `AccessKeys.has(label)` returns whether the label has an access key
  - `AccessKeys.get(label)` returns the access key character, or `null` if there isn't one
  - `AccessKeys.remove(label)` returns plain text without access key indicator, like `AccessKeys.toText()` but with a special case to remove parentheticals such as " (&N)" rather than just the ampersand
  - `AccessKeys.toText(label)` returns plain text without access key syntax
  - `AccessKeys.toHTML(label)` returns HTML with `<span class="menu-hotkey">` around the access key (uses `AccessKeys.toFragment` for security)
  - `AccessKeys.toFragment(label)` returns a `DocumentFragment` with `<span class="menu-hotkey">` wrapping the access key character
  - private `AccessKeys.indexOf(label)` (don't use this)
  - (In the future, the CSS class "menu-hotkey" may be renamed to "access-key", perhaps with a prefix.)
- Radio menu item support
  - In menu item lists, you can create radio groups by including an object with `radioItems`, `getValue`, `setValue`, and optionally `ariaLabel` properties.
    - `radioItems` is an array of menu item specifications, which can also include `value` for the option value.
  - (Commits: [1](https://github.com/1j01/os-gui/commit/b9595e1b58f1fe2897bc5a4cf68e8f30a3d94cdf), [2](https://github.com/1j01/os-gui/commit/3e8eaa9e5c1e51107f57e665273e74e088c3dca2), [3](https://github.com/1j01/os-gui/commit/81694e13d37dd4026b78edf3b8f5fb6a65515c05), [4](https://github.com/1j01/os-gui/commit/08cd001bcde6c0ede84a2a1bba5801c7b853916f))
- TypeScript types for the whole library
  - Type declarations are included as part of the `os-gui` package, in [`os-gui.d.ts`](os-gui.d.ts)
  - You may need to reference the declarations file explicitly in your `tsconfig.json`'s `include` or `files` array, or use a `/// <reference path="node_modules/os-gui/os-gui.d.ts" />` directive. I'm not sure how exactly this is supposed to work.
- `$Window` methods:
  - experimental `onFocus`, `onBlur`, and `onClosed` API for events (looking to remove dependency on jQuery)
  - private `addChildWindow($window)` (don't use this)
  - private `unminimize()` (don't use this)
- `$Window` properties:
  - `closed`: Whether the window has been closed.
  - `icons`: The icons of the window at different sizes, as set by `options.icons` or `setIcons()`.
  - `$minimize`: the minimize button
  - `$maximize`: the maximize button
  - private `$title_area` (don't use this)
  - private `$icon` (don't use this)
- `$Window` property `element` (already mentioned but now has a section like other properties)
- Menu item specification properties:
  - `shortcutLabel` for defining the label of the shortcut key combination separately from the `ariaKeyShortcuts` property; this replaces the old `shortcut` property
  - `ariaKeyShortcuts` for defining the access key combination for the menu item. Must follow [aria-keyshortcuts](https://www.w3.org/TR/wai-aria-1.1/#aria-keyshortcuts) syntax.
  - `label` for defining the label of the menu item; this replaces the old `item` property
  - `value` (only for radio items) for defining a radio option value
- Docs for positioning windows

### Changed
- [Handle synthetic events, including when pointerId is not given](https://github.com/1j01/os-gui/commit/70000c0ccfb674003784c258be68c575dea7e8d6)
  - This is for jspaint, which triggers pointerup when pressing both mouse buttons to cancel a drawing gesture, and on blur.
- [Make menu bars wrap to multiple rows when needed](https://github.com/1j01/os-gui/commit/43268608093dd47b2b91581e865ebd6431ce0e91)
- [Close menus if focus leaves menu popups and menu bar](https://github.com/1j01/os-gui/commit/14c099567bc3ec91fcaf8f1257dc9c6ae127e80f)
  - If you click on the empty space on the menu bar, it should close menus, not just unhighlight.
  - This also seems to fix the case where a window is closed while menus are open (you can test this with the Trigger Station in test.html)
- [Improve menu bar code and some behavior](https://github.com/1j01/os-gui/commit/8afb7111f2170fcd23095e9f77808ccfc0f0b362)
  - Prevent some unnecessary DOM updates with highlighting and opening/closing.
  - Check for specific menu bar instance when testing focus
  - Make menu bar only ever close its own menu popups
  - Reduce redundancy in menu closing code
  - Fix cycling behavior with Up key: pressing up in a menu opened by clicking (such that the first item isn't automatically highlighted) now goes to the bottom item, instead of the top item (or the second-to-bottom item if you had hovered a menu item within and then moved the mouse out). It still focuses the top item if you open the menu via up/down arrow as this matches the Windows 98 behavior for using the keyboard.
  - This commit might actually break closing menu popups in the case that the menu bar is removed from the DOM, because it relies on sending events...
    - (I'm not sure if I followed up on this.)
- [Use event.key instead of event.keyCode](https://github.com/1j01/os-gui/commit/8d34ddebc2d087dccd3b49f79e1c0fa261c7b9fc)
- [Prevent entering disabled submenus [with the keyboard?]](https://github.com/1j01/os-gui/commit/c423ae66943f852f71b0b4caac35e5e30b3c483c)
- [Don't dispatch update events when hovering menu items](https://github.com/1j01/os-gui/commit/36a13fdb67b4774aeb032c8602f8deaed7ba33b3)
  - This only affects the Schrödinger's Checkbox as far as I know, and arguably makes it more thematic, since it only changes when "observing" it.
  - (Should it be called Schrödinger's Tick, btw? haha, gross.)
- [Make menu popups inherit the theme from the menu bar](https://github.com/1j01/os-gui/commit/56024aa8180d71641903a921251ecaaeca35ef6a)
- [Patch drag handling for Eye Gaze Mode in JS Paint](https://github.com/1j01/os-gui/commit/cf5143ded2a41640d5df7182f4e9fcbbafc9ec6f)
- [Fix menu button border offset on press, and oscillating menu opening when hovering between two menu buttons](https://github.com/1j01/os-gui/commit/fe4070424b8df15935435a5ac281a26ae655720a)
  - ([Next two commits added explanation and simplified slightly](https://github.com/1j01/os-gui/compare/fe4070424b8df15935435a5ac281a26ae655720a..8be71e281db04322b4e2b572392fb5d3846f705b))
- [Fix: keep menu button highlighted if clicked to close](https://github.com/1j01/os-gui/commit/7216e2c9784a8e88a00b3d84edc9d3b4457ab392)
- [Highlight/open menus when moving mouse at all while over menu button](https://github.com/1j01/os-gui/commit/78c1216463da1061eeea816287a5ffe79b041f97)
- [Fix: don't trigger menu items if holding Ctrl](https://github.com/1j01/os-gui/commit/8a4b596c58cf57c7fbca567437ab4c1013054014)
  - For example, in Paint, with the Help menu open, Ctrl+A shouldn't open About Paint, it should Select All, using the app-global keyboard shortcut.
- SVG icons for checkbox/radio/submenu icons are now defined in CSS using `mask-image`
  - Should fix scaling in JS Paint's Eye Gaze Mode
  - (Commits: [1](https://github.com/1j01/os-gui/commit/b174a4ef9cc391b5cd6a5f661995f597995e2b1e), [2](https://github.com/1j01/os-gui/commit/22d82e00545fa6e575a06303020740c649687018))
- [Fix subpixel issues with menu button borders, and margin-bottom (and greatly simplify, by adding a wrapper span)](https://github.com/1j01/os-gui/commit/750f08c69f3f16a78efb7fe852a2ef015306e5f7)
- [Refocus last focused control outside menus on close to support copy/paste](https://github.com/1j01/os-gui/commit/cac0db341eb834e6042fedec814bbe6e3f4882d4)
  - This generalizes refocusing the last focused control within the window to also work for controls outside the window, I think?
- [Fix setting window title to empty string](https://github.com/1j01/os-gui/commit/596488acea8d5234f7c11f4914dd1c1d15592b16)
  - Previously, it returned the current window title instead of clearing it, due to incorrect handling of falsy values when differentiating between getter/setter method signatures.
- `MenuBar` menu item property `description` is now optional.

### Fixed

see Changed


## [0.6.0] - 2021-11-01

### Deprecated
- `$window.task` way of interfacing with a taskbar. Use `$window.setMinimizeTarget(taskbarButtonElement)` instead, and events `icon-change` and `title-change` to update the button.

### Added
- `MenuBar` method `closeMenus()` to close any open menus.
- `MenuBar` method `setKeyboardScope(...elements)` to control hotkey handling
- `$Window` method `setMenuBar(menuBar)` to set the menu bar, and set up the keyboard scope.
- `$Window` method `setMinimizeTarget(taskbarButtonElement)` to set the element representing the window when minimized, which will be used when animating.
- `$Window` property `element` to get the DOM element.
- `element.$window` to get the `$Window` instance from the DOM element.
- `$Window` events `icon-change` and `title-change`
- Top level menus support access keys without holding Alt, if the menu bar is focused. (You can not yet tap Alt to focus the menu bar, so you're probably still going to need to hold Alt in practice for now.)
- `makeBlackToInsetFilter()` in `parse-theme.js` to initialize an SVG filter for disabled button icons

### Changed
- If you close a menu by clicking the menu button, the containing window will now be re-focused.
- Menus no longer close when encountering a synthetic `blur` event, to facilitate a hack in [Pinball](https://98.js.org), where a `blur` is triggered to trick the game into pausing.
- Windows that are not `resizable` can no longer be maximized. The maximize button will be grayed out.

### Fixed
- Fixed error when pressing arbitrary (unhandled) keys with menu bar focused
- Menus now ignore Alt+(hotkey) if the event is already handled. (For instance, on the demo page there's a menu bar without a window which has global hotkeys, as well as menu bars with identical hotkeys in windows. Hotkeys will now affect the appropriate menu bar depending on whether a window is focused.)
- Window titlebar buttons now use `ButtonText` theme color instead of always black.

## [0.5.0] - 2021-10-29

### Deprecated
- `$Window`'s terrible `options.icon` API. Use the new, versatile `options.icons` instead. No more ugly globals you have to define! Example: `new $Window({icons: {16: 'app-16x16.png', any: 'app-icon.svg'}})`
- `setIconByID()`, use `setIcons(icons)` instead (with same format as `options.icons`)
- `getIconName()`, use `$window.icons` instead perhaps, or avoid it entirely

### Changed
- `applyCSSProperties` now takes an options object instead of an element as the second argument. Use `options.element` to specify the root element. Default is `document.documentElement` (i.e. `<html>`, `:root`).
- `applyCSSProperties` now accepts a `CSSStyleDeclaration` interchangeably with a plain object of CSS properties, same as `renderThemeGraphics` does. I don't know if this is *useful*, but it's good to be consistent, and this doesn't cost much.
- Page scrolling is prevented when the window is re-focused. (Browsers by default scroll controls into view, and re-focusing the window focuses the last focused control.)
- `touch-action: none` is now applied to the menu bar, so the page doesn't scroll if you're trying to access the menus.
- Menus now close on pointer down, not pointer up, for menu buttons.
- When windows are minimized without a taskbar, the minimize button now shows a restore icon.
- Taskbar height calculation now includes padding/border (of `.taskbar` element)
- When a menu item is clicked and the menu closes, the containing window is re-focused.

### Fixed
- `$Window`'s `closed` event wasn't fired because the element was removed from the DOM.
- A non-`toolWindow` window with `parentWindow` defined now shows as focused.
- `aria-owns` attribute now correctly uses element IDs (not stringified elements like `[object HTMLDivElement]`)
- Super minor: if a menu bar is contained in a selection, it will no longer show access key underlines as white. This bothered me. What can I say, I'm a compulsive [highlighter](https://xkcd.com/1271/).
- Handle older jQuery for `pointerId` (`(e.pointerId ?? e.originalEvent.pointerId)`); affects the cursor during window resizing (which uses `setPointerCapture` to keep a consistent cursor).
- Fix restore from minimize (to taskbar) going to top left corner of screen (if the window had previously been dragged). (This does not apply to taskbarless minimization, which seems to be fine.)
- Word wrap is now prevented in flying titlebar text.
- Menu bar behavior with touch (menus not opening, dialogs blurring after opening via menu, etc.)
- Prevented showing multiple menu buttons as hovered (e.g. if you press Esc and left/right and then hover a different item with the mouse)
- Prevented focus ring showing on menu items when clicking and then using the keyboard, or when using touch. (Menu item highlight effect is separate from focus ring.)
- Prevented resizing window while minimized to bottom of screen (in the case that there's no taskbar).
- Prevented titlebar from shrinking and disappearing (especially when minimized without taskbar), for some window layouts.
- Fixed animation of window restoring if window was minimized without taskbar and then dragged.
- Fixed titlebar button active state not working in Chrome 95.
- Don't show padding around window when window is maximized.

### Added
- Windows are now shown as focused when focus is within an iframe, even for nested iframes! Unfortunately this can't work for cross-origin iframes in all cases.
  (For [98.js.org](https://98.js.org) this was a regression in v0.4.0 due to focus handling changes, but now it's handled in the library)
- Focus can now be restored to the last focused control within (same-origin) iframes, even nested iframes! (when refocusing windows, e.g. clicking on the titlebar)
- `options.iframes.ignoreCrossOrigin` to silence warnings about cross-origin iframes (which can't be seamlessly integrated).
- `applyCSSProperties` now supports `options.recurseIntoIframes` (defaults to `false`).
- `$Window` methods `maximize()`, `minimize()`, and `restore()`
- `$Window` option `icons` which can specify icons of different sizes. Pass an object with keys that are sizes in pixels (or "any"), and values that are the URL of an image, or an object with `srcset` if you want support different pixel densities, or a DOM node if you want full control (e.g. to use an `<svg>` or a font icon or an emoji text node).
- `$Window` method `setTitlebarIconSize` to set the icon size, picking the nearest size from `icons`.
- `$Window` method `getTitlebarIconSize` to get the current icon size.
- `$Window` method `getIconAtSize` to pick an icon for the given size, for use in a taskbar. Returns an element or `null`.
- `$Window` now exposes `icons` property based on the `options.icons` option.
- `.pressing` class to show buttons as pressed (when triggering via the keyboard for example).

## [0.4.1] - 2021-10-20

### Fixed
- Ability to use `MenuBar` without `$Window.js` (`TypeError: Assignment to constant variable.`)
- Handle `document.body` not existing if you create a `MenuBar` before `DOMContentLoaded`
- Compatibility with older jQuery
- Removed some redundant event listeners
- More elements are considered tabbable (`object`, `embed`, `video`, `audio`, `iframe`, `[contenteditable]`)
- Greatly improved performance while hovering menu items! Focus is now only set on the menu popup, not the menu item.
- Menu item height no longer changes based on checkbox state

### Changed
- Menu items that have a submenu open are now highlighted unless another item is hovered at that level.
- If you hover to open a submenu, and then press right (in LTR layout, or left in RTL),
  it will no longer go to the next top level menu. The submenu is already focused, so you can use up/down to navigate it.
- SVG is now used for checkbox menu items, instead of text.
- SVG for submenu arrow is now more accurate to Windows 98.
- Menu item and divider height is now accurate to Windows 98.

### Added
- Menu bars are now screen-reader-friendly!
- `info` events (for status bar updates) are now sent when using the arrow keys to navigate.
- If a submenu is empty, it is shown with "(Empty)", grayed out.

</details>

## [0.4.0] - 2021-10-15

### Removed
- `minWidth` option; use `minOuterWidth` instead.
- `minHeight` option; use `minOuterHeight` instead.
- global `window.focusedWindow` (not part of API)

### Deprecated
- `$MenuBar.js`; use `MenuBar.js` instead. jQuery is no longer used by the menu bar module.
- `$MenuBar(menus)`; use `new MenuBar(menus).element` instead.
- The extra parameter to menu bar's `info` event; use `event.detail?.description` instead.

### Changed
- `parseThemeFileString` can now return `undefined` if the theme file is not valid.
- HTML `dir` attribute / CSS `direction` property is now respected at the level of the window/menu bar, rather than just the document body, so you can have individual windows with different directions.
- Menu bar's buttons and top level menus are no longer contained in a `<div class="menu-container">` element. Top level menus are now children of `<body>`, as submenus already were.
- Clicking on window will now focus not just the last focused element, but if there wasn't one, it will focus a control with `class="default"`, and if that doesn't exist, the first control, and if there's no controls, the window itself (specifically `$window.$content`) or a tool window's parent window.
- `$window.focus()` now actually focuses something, rather than just bringing the window to the top and making it appear active. It will focus the last focused control within the window, or else a control with `class="default"`, or else, if it's a tool window, the parent window, and otherwise the window itself (specifically `$window.$content`).
- `$window.blur()` now removes focus from any focused control within the window. If focus is outside the window, it's not changed.
- Windows can now be positioned freely when the `<body>` element is smaller than the viewport. The boundary is considered to be the maximum of the document's scrollable area and the viewport.
- Window focus is now based around DOM focus. Focusing a control within the window will automatically focus the window. Special logic for preventing blur for taskbars is removed. To prevent blur you must now listen for `mousedown` or `pointerdown` on your element and call `event.preventDefault()`, the standard way to prevent blur.
- Tool windows that have no parent window are now shown as focused as long as the browser window is focused. This is useful for web applications where the browser window takes the place of the parent application window.

### Added
- Window method `setDimensions({ innerWidth, innerHeight, outerWidth, outerHeight })` to set the size of the window.
- Window options `innerWidth`, `innerHeight`, `outerWidth`, `outerHeight` to set the initial size of the window.
- Window options `minInnerWidth`, `minInnerHeight`, `minOuterWidth`, `minOuterHeight` to set the minimum size of the window.
- Windows can now be minimized without a taskbar.
- Menu bar's `info` event now works with submenus as well. (Previously items that contain submenus were assumed to not have descriptions, simply because Paint's one submenu does not a have a description. But for instance Explorer has descriptions for all of its menus (except Favorites, which is a bit special, what with drag and drop and context menus and all.))
- Greatly improved menu navigation:
  - Menus can now be opened with Enter and exited with Escape.
  - Menus can now be navigated with access keys, and the first letters of items without access keys defined.
  - Pressing Escape an extra time will unfocus the menu bar, focusing the last focused control within the window.
  - Submenus can now be navigated with the arrow keys.
  - Submenus stay open more easily. It's a little buggy still, but they're not constantly trying to close themselves on you.
  - Menus wrap around when navigating up and down or left and right.
  - The default action of scrolling the page with arrow keys is now prevented when menus are focused.

### Fixed
- Improved accuracy of the titlebar styles, especially for tool windows.
- Fixed active state of the titlebar buttons in Firefox.
- Disabled buttons no longer show active state if you try to click on them.
- In demo: When loading a theme file, do not apply any styles if it is not a valid theme file.
- For right-to-left languages, submenus are now opened with the left arrow key, matching the arrow direction shown, and menus are navigated with left/right arrow keys spatially (before it was swapped because the order of elements was reversed but the key bindings were not).
- Titlebar gradient is flipped for RTL languages.
- Submenus have correct RTL layout. (Top level menus were previously descendants of the window (so I didn't notice the problem), but now all menus are children of the document body, and `dir` attribute is propagated from the menu bar element's `direction` CSS property to the floating menus.)
- Focused disabled menu items are distinguished from enabled menu items.

## [0.3.0] - 2021-09-04

### Added
- Added window options `toolWindow`, `parentWindow`, `maximizeButton`, `minimizeButton`, `closeButton`, `resizable`, `minWidth`, `minHeight`, and `constrainRect(rect, x_axis, y_axis)`.
- Added window method `bringTitleBarInBounds()`.
- Added window event `closed`, which should be used instead of `close` for detecting when the window is closed. Use `close` only for preventing the window from closing.
- Added window event `window-drag-start`.
- Focus wrapping now works with Shift+Tab in addition to Tab, and handles more types of focusable elements.
- Focus is now restored to the last focused element within the window when the window is focused again.
- Focus is now given to the next-topmost window when the window is closed.

### Changed
- Loosened constraints on windows when releasing a drag. You can now drag a window out of the screen, except the titlebar is kept in bounds. (This still doesn't match the behavior of Windows, but in Windows you can recover a window from offscreen with Alt+Space or the taskbar context menu.)
- Increased thickness of the window frame to match the look of Windows 98.
- Window overflow is now hidden by default, with `contain: layout paint;` on `.window-content` in the layout CSS.
- Window content now flexes to fill the window, with `flex: 1;` in the layout CSS. The `$content` element still uses the default box model (i.e. `display: block`), but is stretched within its parent which uses `display: flex;`.

### Fixed
- Use standard `touch-action` CSS property instead of obsolete PEP polyfill's attribute. The PEP library was never included or documented as a dependency.
- Keyboard shortcuts using the meta key are no longer swallowed by the window.
- Allow setting title to empty string. Not very useful.

## [0.2.2] - 2020-04-30

### Added
- Added a [Blue color scheme](https://www.deviantart.com/tpenguinltg/art/Blue-525167751) for use in JS Paint for the Winter theme.

### Changed
- The menu bar is now a fixed height, which should help with automated visual regression testing in JS Paint.

### Fixed
- Submenu popups are now offset correctly on scrollable pages (such as the demo)
- Windows are now clamped to the bounds of a scrollable page instead of an area the size of the view at the top of the page
- Windows are now centered correctly in view when the page is scrolled
- Windows are now dragged correctly while scrolling the page

## [0.2.1]

### Removed
- Unwanted globals `$G` and `E` are no longer exported

### Changed
- Windows are bounded to the screen at the end of a drag operation. This doesn't match behavior of windows in Windows 98, but in lieu of OS features for getting windows back on screen like <kbd>Alt+Space</kbd>, I think this makes sense for now.

### Fixed
- Dragging over iframes is fixed
- Some layout-important CSS is moved to `layout.css`
- Some titlebar-related styles are scoped in to `.os-window *` to fix conflicts in jspaint, where I'm trying to use a separate window class temporarily for tool windows.
- Colors:
  - Menu bar dividers now correctly use the theme colors
  - Disabled buttons now correctly use the theme colors
  - Disabled menu items now correctly use the theme colors except that sometimes it should just show GrayText and not a 3D effect
  - Menu bar button text uses the correct colors now

## [0.2.0] - 2020-03-12
### Added
- Rewrote using PostCSS
- Everything is now **themeable**, by dragging and dropping `.theme` and `.themepack` files
- Maximize and Minimize, with flying titlebar effect
- Default buttons
- Toggle buttons

### Changed
- Button borders are now based on SVG `border-image`, instead of using pseudo elements, `border` and `box-shadow`.
  - Metrics for buttons are changed, they're simpler now, because it's not extending visibly outside the border-box.
  - (`::after` is now free to use for other things, altho `::before` is still used for showing focus.)
- Window component is now an app window instead of a tool window, to aid reintegration with 98.js.org; jspaint will come later.
- Window component is styled with `.os-window` now, altho it includes both classes `os-window` and `window`.

[Unreleased]: https://github.com/1j01/os-gui/compare/v0.7.2...HEAD
[0.7.2]: https://github.com/1j01/os-gui/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/1j01/os-gui/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/1j01/os-gui/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/1j01/os-gui/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/1j01/os-gui/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/1j01/os-gui/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/1j01/os-gui/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/1j01/os-gui/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/1j01/os-gui/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/1j01/os-gui/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/1j01/os-gui/releases/tag/v0.2.0
