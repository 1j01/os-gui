# <img alt="os-gui.js" src="images/os-gui-logo.svg" height="200">

A library for imitating operating system graphical user interfaces on the web

Specifically, Windows 98 — for now at least; it could be expanded in the future.

This library powers [98.js.org](https://98.js.org), a web-based version of Windows 98, including Paint, Notepad, Sound Recorder, and more.
See the [demos](https://1j01.github.io/os-gui/demo/) for more information.


## Features

- Menu bars, with support for checkbox items, disabled states, and submenus

- App windows which you can drag around, maximize, minimize, close, and resize

- Dialog and tool window variants

- Flying titlebar animation that guides your eyes, for maximize/minimize/restore

- Focus containment: if you Tab or Shift+Tab within a window, it wraps around to the first/last control.

- Button styles, including lightweight buttons, disabled buttons, and default action buttons

- Scrollbar styles, webkit-specific (in the future there could be a custom scrollbar based on a nonintrusive scrollbar library, or styles *supporting* a library, where you're expected to use the library directly)
  - Procedurally rendered arrows, allowing for different scrollbar sizes
  - Inversion effect when clicking on scrollbar track

- Themeable with Windows `.theme` & `.themepack` files **at runtime**!

## Demo

See [a demo online here](https://1j01.github.io/os-gui/demo/)

### See also

- [98.js](https://github.com/1j01/98), my web desktop
- [padraigfl/packard-belle](https://github.com/padraigfl/packard-belle/)
- [arturbien/React95](https://github.com/arturbien/React95)
- [React95/React95](https://github.com/React95/React95)


## Requirements

This library currently requires [jQuery](https://jquery.com/) for the windowing implementation.
Menu bars do **not** require jQuery.

(Eventually I want to have no dependencies. So far I've removed jQuery from the menu code...)


## Setup

The library is not yet provided as a bundle (single file).

You can either 1. download the repository as a ZIP file, 2. clone the repository, or 3. install the library as an [npm package](https://www.npmjs.com/package/os-gui).

You have to include scripts for the components you want to use (`MenuBar.js` or `$Window.js`),
along with stylesheets for layout, a theme, and a color scheme.

Make sure to use the compiled CSS files, not the source files.
<!-- If you're not installing with `npm`, you'll have to build the library yourself. See [Development](#development) below. -->

In `<head>`:
```html
<link href="os-gui/layout.css" rel="stylesheet" type="text/css">
<link href="os-gui/windows-98.css" rel="stylesheet" type="text/css">
<link href="os-gui/windows-default.css" rel="stylesheet" type="text/css">
```

In `<head>` or `<body>`:
```html
<script src="os-gui/MenuBar.js"></script>

<script src="lib/jquery.js"></script> <!-- required by $Window.js -->
<script src="os-gui/$Window.js"></script>
```


## API

**Note**: The API will likely change a lot, but I maintain a [Changelog](CHANGELOG.md).

### Panel & Inset Styles

- `.inset-deep` creates a 2px inset border
- `.outset-deep` creates a 2px inset border (like a button or window or menu popup)
- `.inset-shallow` creates a 1px inset border
- `.outset-shallow` creates a 1px outset border

### Button styles

Button styles are applied to `button` elements globally.
(And if you ever want to reset it, note that you have to get rid of the pseudo element `::after` as well. @TODO: scope CSS)

#### Toggle Buttons
To make a toggle button, add the `.toggle` class to the button.
Make it show as pressed with the `.selected` class. (@TODO: rename this `.pressed`)

You should use the styles together with semantic `aria-pressed`, `aria-haspopup`, and/or `aria-expanded` attributes as appropriate.

#### Default Buttons
You can show button is the default action by adding `.default` to the button.
Note that in Windows 98, this style moves from button to button depending on the focus.
A rule of thumb is that it should be on the button that will trigger with Enter. 

#### Lightweight Buttons
You can make a lightweight button by adding `.lightweight` to the button.
Lightweight buttons are subtle and have no border until hover.

#### Disabled Buttons
You can disable a button by adding the standard `disabled` attribute to the button.

### Scrollbar styles

Scrollbar styles are applied globally, but they have a `-webkit-` prefix, so they'll only work in "webkit-based" browsers, generally, like Chrome, Safari, and Opera.

(Can be overridden with `::-webkit-scrollbar` and related selectors (but not easily reset to the browser default, unless `-webkit-appearance: scrollbar` works... @TODO: scope CSS)

### Selection styles

Selection styles are applied globally.

(Can be overridden with `::selection` (but not easily reset to the browser default... unless with `unset`? @TODO: scope CSS)

### `MenuBar(menus)`

Creates a menu bar component.

`menus` should be an object holding arrays of [menu item specifications](#menu-item-specification), keyed by menu button name.

Returns an object with property `element`, which you should then append to the DOM where you want it.

See examples in the [demo code](./demo/demo.js).

#### Event: `info`

Can be used to implement a status bar.
A description is provided as `event.detail.description` when rolling over menu items that specify a `description`. For example:

```js
menubar.element.addEventListener("info", (event)=> {
	statusBar.textContent = event.detail?.description || "";
});
```

#### Event: `default-info`

Signals that a status bar should be reset to blank or a default message.

```js
menubar.element.addEventListener("default-info", (event)=> {
	statusBar.textContent = "";

	// or:
	statusBar.textContent = "For Help, click Help Topics on the Help Menu.";
	// like in MS Paint (and JS Paint)

	// or:
	statusBar.textContent = "For Help, press F1.";
	// like WordPad

	// or perhaps even:
	statusBar.innerHTML = "For Help, <a href='docs'>click here</a>";
	// Note that a link is not a common pattern, and it could only work for the default text;
	// for menu item descriptions the message in the status bar is transient, so
	// you wouldn't be able to reach it to click on it.
});
```

### Menu item specification

Menu item specifications are either `MENU_DIVIDER` - a constant indicating a horizontal rule, or an object with the following properties:

* `item`: a label for the item
* `shortcut` (optional): a keyboard shortcut for the item, like "Ctrl+A"; this is not functionally implemented, you'll need to listen for the shortcut yourself!
* `action` (optional): a function to execute when the item is clicked (can only specify either `action` or `checkbox`)
* `checkbox` (optional): an object specifying that this item should behave as a checkbox.
Property `check` of this object should be a function that *checks* if the checkbox should be checked or not and returns `true` for checked and `false` for unchecked. What a cutesy name.
Property `toggle` should be a function that toggles the state of the option, however you're storing it; called when clicked.
* `enabled` (optional): can be `false` to unconditionally disable the item, or a function that determines whether the item should be enabled, returning `true` to enable the item, `false` to disable.
* `submenu` (optional): an array of menu item specifications to create a submenu
* `description`: for implementing a status bar; an [`info` event](#event-info) is emitted when rolling over the item with this description

### Menu hotkeys

Menus can be navigated using the first letter of the menu item, or if you place `&` in front of a letter in the menu item, it will be used as the hotkey.

For menu button hotkeys, you need to press Alt, and within menu popups you must press the key directly. Alt will close the menus.

If there are multiple menu items with the same hotkey, it will cycle between them without activating them.
You should try to make the hotkeys unique, including between hotkeys and first letters of menu items without defined hotkeys.
(This behavior is observed in Windows 98's Explorer's Favorites menu, where you can make bookmarks that match other accelerators or menu items.)

### `$Window(options)`

Creates a window component that can be dragged around and such, brought to the front when clicked\*

`options.title`: Shortcut to set the window title initially.

`options.icon`: Sets the icon of the window, assuming a global `TITLEBAR_ICON_SIZE` (which should generally be 16) and a global `$Icon` function which takes an icon identifier and size and returns an `img` (or other image-like element). I know this API sucks, I'm going to change it, don't worry. See [Specifying Icons](#specifying-icons) for more details.

`options.toolWindow`: If `true`, the window will be a tool window, which means it will not have a minimize or maximize button, and it will be shown as always focused by default. It will also have a smaller close button in the default styles.

`options.parentWindow`: If specified, the window will be a child of this window. For tool windows, the focus state will be shared with the parent window.

`options.maximizeButton`: If set to `false`, the window will not have a maximize button. You cannot enable this if `toolWindow` is `true`.

`options.minimizeButton`: If set to `false`, the window will not have a minimize button. You cannot enable this if `toolWindow` is `true`.

`options.closeButton`: If set to `false`, the window will not have a close button.

`options.resizable`: If set to `true`, the window can be resized by the edges and corners.

`options.outerWidth`: Specifies the initial width of the window, including borders.

`options.outerHeight`: Specifies the initial height of the window, including title bar, menu bar, and borders.

`options.innerWidth`: Specifies the initial width of the window contents, excluding borders.

`options.innerHeight`: Specifies the initial height of the window contents, excluding title bar, menu bar, and borders

`options.minOuterWidth`: The minimum outer width of the window (when resizing), in pixels.

`options.minOuterHeight`: The minimum outer height of the window (when resizing), in pixels.

`options.minInnerWidth`: The minimum width of the window contents (when resizing), in pixels.

`options.minInnerHeight`: The minimum height of the window contents (when resizing), in pixels.

`options.constrainRect(rect, x_axis, y_axis)`: A function that can be used to constrain the window to a particular rectangle. Takes and returns a rectangle object with `x`, `y`, `width`, and `height` properties. `x_axis` and `y_axis` define what is being dragged `-1` for left and top, `1` for right and bottom, and `0` for middle. Note that the window will always be constrained to not move past the minimum width and height.

\*Iframes require special handling. There's an `$IframeWindow` helper in [98](https://github.com/1j01/98), but a better approach would use composition rather than inheritance.
(You could want multiple iframes in a window, or just an iframe with other content around it, maybe an iframe that sometimes exists or not!)

Returns a jQuery object with additional methods and properties:

#### `title(text)`

Sets the title, or if `text` isn't passed, returns the current title of the window.

#### `close()`

Closes the window.

#### `focus()`

Tries to focus something within the window, in this order of priority:
- The last focused control within the window
- A control with `class="default"`
- If it's a tool window, the parent window
- and otherwise the window itself (specifically `$window.$content`)

#### `blur()`

Removes focus from the window. If focus is outside the window, it is left unchanged.

#### `center()`

Centers the window in the page.
You should call this after the contents of the window is fully rendered, or you've set a fixed size for the window.

If you have images in the window, wait for them to load before showing and centering the window, or define a fixed size for the images.

#### `applyBounds()`

Fits the window within the page if it's partially offscreen.
(Doesn't resize the window if it's too large; it'll go off the right and bottom of the screen.)

#### `bringTitleBarInBounds()`

Repositions the window so that the title bar is within the bounds of the page, so it can be dragged.

#### `bringToFront()`

Brings the window to the front by setting its `z-index` to larger than any `z-index` yet used by the windowing system.

#### `setDimensions({ innerWidth, innerHeight, outerWidth, outerHeight })`

Sets the size of the window. Pass `{ innerWidth, innerHeight }` to specify the size in terms of the window content, or `{ outerWidth, outerHeight }` to specify the size including the window frame.

*(This may be expanded in the future to allow setting the position as well...)*

#### `$Button(text, action)`

Creates a button in the window's content area.
It automatically closes the window when clicked. There's no (good) way to prevent this, as it's intended only for dialogs.

If you need any other behavior, just create a `<button>` and add it to the window's content area.

Returns a jQuery object.
#### `$content`

*jQuery object.*  
Where you can append contents to the window.

#### `$titlebar`

*jQuery object.*  
The titlebar of the window, including the title, window buttons, and possibly an icon.

#### `$title`

*jQuery object.*  
The title portion of the titlebar.

#### `$x`

*jQuery object.*  
The close button.

#### Event: `closed`

Whether the window has been closed.

#### Event: `close`

Can be used to prevent closing a window, with `event.preventDefault()`.
Since there could be multiple listeners, and another listener could prevent closing, if you want to detect when the window is actually closed, use the `closed` event.

#### Event: `closed`

This event is emitted when the window is closed. It cannot be prevented.

#### Event: `window-drag-start`

Can be used to prevent dragging a window, with `event.preventDefault()`.

### Specifying Icons

⚠️ Bad API! Pointlessly indirect! ⚠️

```js
// var DESKTOP_ICON_SIZE = 32;
// var TASKBAR_ICON_SIZE = 16;
var TITLEBAR_ICON_SIZE = 16; // required global (if using options.icon)

function getIconPath(name, size){
	return "/images/icons/" + name + "-" + size + "x" + size + ".png";
}

function $Icon(name, size){ // required global (if using options.icon)
	var $img = $("<img class='icon'/>");
	$img.attr({
		draggable: false,
		src: getIconPath(name, size),
		width: size,
		height: size,
	});
	return $img;
}

$window = new $Window({
	icon: "my-icon",
});
// this will load /images/icons/my-icon-16x16.png
```

## License

Licensed under the [MIT License](https://opensource.org/licenses/MIT), see [LICENSE](LICENSE) for details.

## Development

Install [Node.js](https://nodejs.org/) if you don't already have it.

Clone the repository, then in the project directory run `npm i` to install the dependencies.
Also run `npm i` when pulling in changes from the repository, in case there are changes to the dependencies.

Run `npm start` to open a development server. It will open a demo page in your default browser. Changes to the library will be automatically recompiled, and the page will automatically reload.

It's a good idea to close the server when updating or installing dependencies; otherwise you may run into EPERM issues.

The styles are written with [PostCSS](https://postcss.org/), for mixins and other transforms.  
Recommended: install a PostCSS language plugin for your editor, like [PostCSS Language Support](https://marketplace.visualstudio.com/items?itemName=csstools.postcss) for VS Code.

Currently there's some CSS that has to manually be regenerated in-browser and copied into theme-specific CSS files.  
In the future this could be done with a custom PostCSS syntax parser for .theme/.themepack files, and maybe SVG instead of any raster graphics to avoid needing `node-canvas` (native dependencies are a pain). Or maybe UPNG.js and plain pixel manipulation.
