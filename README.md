# os-gui.js

A library for imitating operating system graphical user interfaces on the web

Specifically, Windows 98 - for now at least; it could be expanded in the future

<!-- Check out 98 and jspaint (and sound-recorder and notepad and minesweeper) and maybe mos and maybe pbp2d... -->

**Important**: This project is pre-alpha and not really "quality" yet.


## Features

- Menu bars, with support for checkbox items, disabled states, and at least partial support for submenus

- Windows which you can drag around and maximize

- Flying titlebar animation that guides your eyes

- Button styles, including lightweight buttons and disabled buttons

- Scrollbar styles, webkit-specific (in the future there could be a custom scrollbar based on a nonintrusive scrollbar library, or styles *supporting* a library, where you're expected to use the library directly)
  - Procedurally rendered arrows, allowing for different scrollbar sizes
  - Inversion effect when clicking on scrollbar track

- Themeable with Windows `.theme` & `.themepack` files at runtime

## Demo

See [a demo online here](https://1j01.github.io/os-gui/demo/)

### See also

- [98.js](https://github.com/1j01/98), my web desktop
- [padraigfl/packard-belle](https://github.com/padraigfl/packard-belle/)
- [arturbien/React95](https://github.com/arturbien/React95)
- [React95/React95](https://github.com/React95/React95)


## Requirements

This library currently requires [jQuery](https://jquery.com/), or, almost certainly it would work with [zepto.js](http://zeptojs.com/) as well.


## Setup

The library is not yet provided as a bundle or package.

You have to include `$MenuBar.js` or `$Window.js` specifically, as required,
along with stylesheets for layout and a theme and a color scheme.

You can download the repo contents as a ZIP file in the "Clone or download" dropdown on GitHub.

You need to follow the development instructions, and use the *compiled CSS files*, not the source.

In `<head>`:
```html
<link href="os-gui/layout.css" rel="stylesheet" type="text/css">
<link href="os-gui/windows-98.css" rel="stylesheet" type="text/css">
<link href="os-gui/windows-default.css" rel="stylesheet" type="text/css">
```

In `<head>` or `<body>`:
```html
<script src="lib/jquery.js"></script>
<script src="os-gui/$MenuBar.js"></script>
<script src="os-gui/$Window.js"></script>
```


## API

The API is not versioned using semver yet, but it should be once a version 1.0 is released.

### Panel & Inset Styles

- `.inset-deep` creates a 2px inset border
- `.outset-deep` creates a 2px inset border (like a button or window or menu popup)
- `.inset-shallow` creates a 1px inset border
- `.outset-shallow` creates a 1px outset border

### Button styles

Button styles are applied to `button` elements globally.
And to reset it, you have to get rid of the pseudo element `::after` as well.

You can have the depressed (held down) style stay using `.selected`

### Scrollbar styles

Scrollbar styles are applied globally, but they have a `-webkit-` prefix, so they'll only work in "webkit-based" browsers, generally, like Chrome, Safari, and Opera.

Can be overridden with `::-webkit-scrollbar` and related selectors (but not easily reset to the browser default, unless `-webkit-appearance: scrollbar` works)

### Selection styles

Selection styles are applied globally.

Can be overridden with `::selection` (but not easily reset to the browser default... unless with `unset` - but that's not very clean; there should be a better way to scope where the selection styles apply, like maybe a `.os-gui` class)

### `$MenuBar(menus)`

Creates a menu bar component.

`menus` should be an object holding arrays of [menu item specifications](#menu-item-specification), keyed by menu button name.

Returns a jQuery object, which you should then append to the DOM where you want it.

#### Event: `info`

Can be used to implement a status bar.
A description is provided when rolling over menu items that specify a `description`, via an extra parameter to the event handler. For example:

```js
$menubar.on("info", (event, description)=> {
	$status.text(description);
});
```

#### Event: `default-info`

Should be used to reset a status bar, if present, to blank or a default message.

```js
$menubar.on("default-info", ()=> {
	$status.text("");
	// or
	$status.text("For Help, click Help Topics on the Help Menu.");
	// like in MS Paint (and JS Paint)
	// or perhaps even
	$status.html("For Help, <a href='docs'>click here</a>");
	// Note that a link could only work for the default text;
	// for menu item descriptions the message in the status bar is transient;
	// you wouldn't be able to reach it while its shown to click on it.
});
```

### Menu item specification

Menu item specifications are either `MENU_DIVIDER` - a constant indicating a horizontal rule, or an object with the following properties:

* `item`: a label for the item
* `shortcut` (optional): a keyboard shortcut for the item, like "Ctrl+A"; this is not functionally implemented, you'll need to listen for the shortcut yourself!
* `action` (optional): a function to execute when the item is clicked (can only specify either `action` or `checkbox)
* `checkbox` (optional): an object specifying that this item should behave as a checkbox.
Property `check` of this object should be a function that *checks* if the checkbox should be checked or not and returns `true` for checked and `false` for unchecked. What a cutesy name; it should be changed; `isChecked` would be better.
Property `toggle` should be a function that toggles the state of the option, however you're storing it; called when clicked.
* `enabled` (optional): can be `false` to unconditionally disable the item, or a function that determines whether the item should be enabled, returning `true` for enabled, `false` for disabled.
* `submenu` (optional): an array of menu item specifications to create a submenu
* `description`: for implementing a status bar; an event is emitted, called `info`, when rolling over the item with this description, provided as a jQuery "extra parameter"

### Menu hotkeys

In menu and menu item names, you can place `&` before letters to indicate menu-level-scoped hotkeys (which should be unique to that level of the menu, i.e. the menubar or the contents of a particular submenu).

But these are **not functionally implemented!**

### `$Window(options)`

Creates a window component that can be dragged around and such, brought to the front when clicked\*

`options.title`: Shortcut to set the window title initially.

`options.icon`: Sets the icon of the window, assuming a global `TITLEBAR_ICON_SIZE` (which should generally be 16) and a global `$Icon` function which takes an icon identifier and size and returns an `img` (or other image-like element).

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
```

\*Iframes require special handling. There's an `$IframeWindow` helper in [98](https://github.com/1j01/98), but a better approach would use composition rather than inheritance.
(You could want multiple iframes in a window, or just an iframe with other content around it, maybe an iframe that sometimes exists or not!)

Returns a jQuery object with additional methods and properties:

#### `title(text)`

Sets the title, or if `text` isn't passed, returns the current title of the window.

#### `close()`

Closes the window.

#### `center()`

Centers the window in the page.
You should call this after creating the contents of the window, and either rendering all of it, or determining its size.

#### `applyBounds()`

Fits the window within the page if it's partially offscreen.
(Doesn't resize the window if it's too large; it'll go off the right and bottom of the screen.)

#### `bringToFront()`

Brings the window to the front by setting its `z-index` to larger than any `z-index` yet used by the windowing system.

#### `$Button(text, action)`

Creates a button in the window's content area.

#### `$content`

Where you can append contents to the window.

#### `$titlebar`

The titlebar of the window, including the title, window buttons, and possibly an icon.

#### `$title`

The title portion of the titlebar.

#### `$x`

The close button.

#### `closed`

Whether the window has been closed.

#### Event: `close`

Can be used to prevent closing a window (with `event.preventDefault()`), or just to know when it closed.


## License

Licensed under the [MIT License](https://opensource.org/licenses/MIT), see [LICENSE](LICENSE) for details.

## Development

Install [Node.js](https://nodejs.org/) if you don't already have it.

Initially and when pulling changes from git, run `npm i` to install dependencies.

Run `npm run live-server` to open a development server.

In a separate terminal, run `npm run watch` to watch source files and recompile on changes.

Close the server & watch script when updating dependencies or installing new ones (or you'll run into EPERM issues).

The styles are written with PostCSS, for mixins and other transforms.  
Recommended: install a PostCSS language plugin for your editor, like [PostCSS Language Support](https://marketplace.visualstudio.com/items?itemName=csstools.postcss) for VS Code.

Currently there's some CSS that has to manually be regenerated in-browser and copied into theme-specific CSS files.  
In the future this could be done with a custom PostCSS syntax parser for .theme/.themepack files, and maybe SVG instead of any raster graphics to avoid needing `node-canvas` (native dependencies are a pain).  
