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

### Added
- Added a [Blue color scheme](https://www.deviantart.com/tpenguinltg/art/Blue-525167751) for use in JS Paint for the Winter theme.

### Changed
- The menu bar is now a fixed height, which should help with automated visual regression testing in JS Paint.

### Fixed
- Submenu popups are now offset correctly on scrollable pages (such as the demo)

</details>

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
- Everything is now **themable**, by dragging and dropping `.theme` and `.themepack` files
- Maximize and Minimize, with flying titlebar effect
- Default buttons
- Toggle buttons

### Changed
- Button borders are now based on SVG `border-image`, instead of using pseudo elements, `border` and `box-shadow`.
  - Metrics for buttons are changed, they're simpler now, because it's not extending visibly outside the border-box.
  - (`::after` is now free to use for other things, altho `::before` is still used for showing focus.)
- Window component is now an app window instead of a tool window, to aid reintegration with 98.js.org; jspaint will come later.
- Window component is styled with `.os-window` now, altho it includes both classes `os-window` and `window`.

[Unreleased]: https://github.com/1j01/os-gui/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/1j01/os-gui/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/1j01/os-gui/releases/tag/v0.2.0
