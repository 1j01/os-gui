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

### Deprecated
- $Window's terrible `options.icon` API; use the new, versatile `options.icons` instead. No more ugly globals you have to define!

### Changed
- `applyCSSProperties` now takes an options object instead of an element as the second argument. Use `options.element` to specify the root element. Default is `document.documentElement` (i.e. `<html>`, `:root`).
- `applyCSSProperties` now accepts a `CSSStyleDeclaration` interchangeably with a plain object of CSS properties, same as `renderThemeGraphics` does. I don't know if this is *useful*, but it's good to be consistent, and this doesn't cost much.

### Fixed
- `$Window`'s `closed` event wasn't fired because the element was removed from the DOM.
- `aria-owns` attribute now correctly uses element IDs (not stringified elements like `[object HTMLDivElement]`)
- Super minor: if a menu bar is contained in a selection, it will no longer show access key underlines as white. This bothered me. What can I say, I'm a compulsive [highlighter](https://xkcd.com/1271/).
- Handle older jQuery for `pointerId` (`(e.pointerId ?? e.originalEvent.pointerId)`); affects the cursor during window resizing (which uses `setPointerCapture` to keep a consistent cursor).

### Added
- Windows are now shown as focused when focus is within an iframe, even for nested iframes! Unfortunately this can't work for cross-origin iframes in all cases.
  (For [98.js.org](https://98.js.org) this was a regression in v0.4.0 due to focus handling changes, but now it's handled in the library)
- Focus can now be restored to the last focused control within (same-origin) iframes, even nested iframes! (when refocusing windows, e.g. clicking on the titlebar)
- `options.iframes.ignoreCrossOrigin` to silence warnings about cross-origin iframes (which can't be seamlessly integrated).
- `applyCSSProperties` now supports `options.recurseIntoIframes` (defaults to `false`).
- `$Window` option `icons` which can specify icons of different sizes. Pass an object with keys that are sizes in pixels (or "any"), and values that are the URL of an image, or an object with `srcset` if you want support different pixel densities, or a DOM node if you want full control (e.g. to use an `<svg>` or a font icon or an emoji text node).
- `$Window` method `setIconSize` to set the icon size, picking the nearest size from `icons`.

</details>

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
  - Menus can now be navigated with accelerators, and the first letters of items without accelerators defined.
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

[Unreleased]: https://github.com/1j01/os-gui/compare/v0.4.1...HEAD
[0.4.1]: https://github.com/1j01/os-gui/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/1j01/os-gui/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/1j01/os-gui/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/1j01/os-gui/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/1j01/os-gui/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/1j01/os-gui/releases/tag/v0.2.0
