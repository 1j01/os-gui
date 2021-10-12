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

### Removed
- `minWidth` option; use `minOuterWidth` instead.
- `minHeight` option; use `minOuterHeight` instead.

### Deprecated
- `$MenuBar(menus)`; use `new MenuBar(menus).element` instead. (jQuery is being phased out.)

### Changed
- `parseThemeFileString` can now return `undefined` if the theme file is not valid.
- HTML `dir` attribute / CSS `direction` property is now respected at the level of the window/menu bar, rather than just the document body, so you can have individual windows with different directions.

### Added
- Window method `setDimensions({ innerWidth, innerHeight, outerWidth, outerHeight })` to set the size of the window.
- Window options `innerWidth`, `innerHeight`, `outerWidth`, `outerHeight` to set the initial size of the window.
- Window options `minInnerWidth`, `minInnerHeight`, `minOuterWidth`, `minOuterHeight` to set the minimum size of the window.

### Fixed
- Improved accuracy of the titlebar styles, especially for tool windows.
- Fixed active state of the titlebar buttons in Firefox.
- Disabled buttons no longer show active state if you try to click on them.
- In demo: When loading a theme file, do not apply any styles if it is not a valid theme file.
- For right-to-left languages, submenus are now opened with the left arrow key, matching the arrow direction shown, and menus are navigated with left/right arrow keys spacially (before it was swapped because the order of elements was reversed but the key bindings were not).
- Titlebar gradient is flipped for RTL languages.

</details>

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

[Unreleased]: https://github.com/1j01/os-gui/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/1j01/os-gui/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/1j01/os-gui/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/1j01/os-gui/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/1j01/os-gui/releases/tag/v0.2.0
