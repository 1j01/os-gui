# <a href="https://os-gui.js.org"><img alt="os-gui.js" src="images/os-gui-logo.svg" height="200"></a>

A library for imitating operating system graphical user interfaces on the web

Specifically, Windows 98 — for now at least; it could be expanded in the future.

This library powers [98.js.org](https://98.js.org), a web-based version of Windows 98, including Paint, Notepad, Sound Recorder, and more.

See the [homepage](https://os-gui.js.org/) for more information.


## Features

- Menu bars, with support for checkbox and radio items, disabled states, submenus, keyboard shortcuts, and more

- App windows which you can drag around, maximize, minimize, close, and resize

- Dialog and tool window variants

- Flying titlebar animation that guides your eyes during maximize/minimize/restore

- Focus containment: if you Tab or Shift+Tab within a window, it wraps around to the first/last control.

- Button styles, including lightweight buttons, disabled buttons, and default action buttons

- Scrollbar styles, webkit-specific (in the future there could be a custom scrollbar based on a nonintrusive scrollbar library, or styles *supporting* a library, where you're expected to use the library directly)
  - Procedurally rendered arrows, allowing for different scrollbar sizes
  - Inversion effect when clicking on scrollbar track

- Themeable with Windows `.theme` & `.themepack` files **at runtime**!

## Demo

See [demos online here](https://os-gui.js.org)

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

The library is not (yet) provided as a single convenient file.

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

#### Disabled Button States
You can disable a button by adding the standard `disabled` attribute to the button.

#### Pressed Button States
You can show a button as being pressed by adding the `.pressing` class to the button.  
This is useful for buttons that are triggered by a keystroke.

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

#### `element`

The DOM element that represents the menu bar.

#### `closeMenus()`

Closes any menus that are open.

#### `setKeyboardScope(...eventTargets)`

Hotkeys like <kbd>Alt</kbd> will be handled at the level of the given element(s) or event target(s).

By default, the scope is `window` (global), for the case of a single-page application where the menu bar is at the top.
If you are putting the menu bar in a window, you should call this with the window's element:

```js
menu_bar.setKeyboardScope($window[0]);
```
or better yet,
```js
$window.setMenuBar(menu_bar);
```
which takes care of the keyboard scope for you, while attaching the menu bar to the window.

Note that some keyboard behavior is always handled if the menu bar has focus.

Note also for iframes, you may need to call this with `$window[0], iframe.contentWindow` currently, but this should be changed in the future (keyboard events should be proxied).

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

Menu item specifications are either `MENU_DIVIDER` (a constant indicating a horizontal rule), or a radio group specification, or an object with the following properties:

* `label`: a label for the item; ampersands define [access keys](#access-keys) (to use a literal ampersand, use `&&`)
* `shortcutLabel` (optional): a keyboard shortcut to show for the item, like "Ctrl+A" (Note: you need to listen for the shortcut yourself, unlike access keys)
* `ariaKeyShortcuts` (optional): [`aria-keyshortcuts`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-keyshortcuts) for the item, like "Control+A Meta+A", for screen readers. "Ctrl" is not valid (you must spell it out), and it's best to provide an alternative for macOS, usually with the equivalent Command key, using "Meta" (and `event.metaKey`).
* `action` (optional): a function to execute when the item is clicked (can only specify either `action` or `checkbox`)
* `checkbox` (optional): an object specifying that this item should behave as a checkbox.
	* Property `check` of this object should be a function that *checks* if the item should be checked or not, returning `true` for checked and `false` for unchecked. What a cutesy name.
	* Property `toggle` should be a function that toggles the state of the option, however you're storing it; called when clicked.
* `enabled` (optional): can be `false` to unconditionally disable the item, or a function that determines whether the item should be enabled, returning `true` to enable the item, `false` to disable.
* `submenu` (optional): an array of menu item specifications to create a submenu
* `description` (optional): for implementing a status bar; an [`info` event](#event-info) is emitted when rolling over the item with this description
* `value` (optional): for radio items, the value of the item; can be any type, but `===` is used to determine whether the item is checked.

A radio group specification is an object with the following properties:

* `radioItems`: an array of menu item specifications to create a radio button group. Unlike `submenu`, the items are included directly in this menu. It is recommended to separate the radio group from other menu items with a `MENU_DIVIDER`.
* `getValue`: a function that should return the value of the selected radio item.
* `setValue`: a function that should change the state to the given value, in an application-specific way.
* `ariaLabel` (optional): a string to use as the `aria-label` for the radio group (for screen reader accessibility)

### Access Keys

Menus can be navigated with contextual hotkeys known as **access keys**.

Place an ampersand before a letter in a menu button or menu item's label to make it an access key.
Microsoft has [documentation on access keys](https://docs.microsoft.com/windows/apps/design/input/access-keys),
including guidelines for choosing access keys.
Generally the first letter is a good choice.

If a menu item doesn't define an access key, the first letter of the label can be used to access it.

For menu buttons, you need to hold Alt when pressing the button's access key, but for menu items in menu popups you must press the key directly, as Alt will close the menus.

If there are multiple menu items with the same access key, it will cycle between them without activating them.
You should try to make the access keys unique, including between defined access keys and the first letters of menu items without defined access keys.
(This behavior is observed in Windows 98, in Explorer's Favorites menu, where you can make bookmarks with the first letter matching the access keys of other menu items.)

<!-- @TODO: this section is an awkward mix of explaining what access keys are, how they work, and how to implement them; should restructure -->

There is an `AccessKeys` object exported by `MenuBar.js`, with functions for dealing with access keys:

#### `AccessKeys.escape(label)`

Escapes ampersands in the given label, so that they are not interpreted as access keys.

This is useful for dynamic menus, like a history menu that uses page titles as labels. You don't want ampersands to be spuriously interpreted as access keys, or double ampersands to be interpreted as a single ampersand.

#### `AccessKeys.unescape(label)`

Un-escapes all double ampersands in the label.

For rendering, use [`toHTML`](#accesskeys-tohtml-label) or [`toFragment`](#accesskeys-tofragment-label) instead.

<!-- #### `AccessKeys.indexOf(label)`

Returns the index of the ampersand that defines an access key, or -1 if not present.

Internal use only. -->

#### `AccessKeys.has(label)`

Returns true if the label has an access key.

#### `AccessKeys.get(label)`

Returns the access key for the given label, or null if none.

`MenuBar` handles access keys automatically, but if you're including access keys for other UI elements, you need to handle them yourself, and you can use this rather than hard-coding the access key, so it doesn't need to be changed in two places.

#### `AccessKeys.remove(label)`

Removes the access key indicator (`&`) from the label, and un-escapes any double ampersands.
Also removes a parenthetical access key indicator, like " (&N)", as a special case.

#### `AccessKeys.toText(label)`

Removes the access key indicator (`&`) from the label, and un-escapes any double ampersands.
This is like [`toHTML`](#accesskeys-tohtml-label) but for plain text.

**Note**: while often access keys are part of a word, like "&New",
in translations they are often indicated separately, like "새로 만들기 (&N)",
since the access key stays the same, but the letter is no longer part of the word (or even the alphabet).
This function doesn't remove strings like " (&N)", it will remove only the "&" and leave "새로 만들기 (N)".
If you want that behavior, use `AccessKeys.remove(label)`.

#### `AccessKeys.toHTML(label)`

Returns HTML (with proper escaping) with the access key as a `<span class='menu-hotkey'>` element.

**Security note**: It is safe to use the result of this function in HTML element content, as it escapes the label. It is not safe to use in an attribute value, but this is not the intended usage.

**Layout note**: you may want to surround the result with `<span style="white-space: pre">` to prevent whitespace from collapsing if the access key is next to a space.

#### `AccessKeys.toFragment(label)`

Returns a [`DocumentFragment`](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment) with the access key as a `<span class='menu-hotkey'>` element.

**Layout note**: you may want to surround the result with `<span style="white-space: pre">` to prevent whitespace from collapsing if the access key is next to a space.


### `$Window(options)`

Creates a window component that can be dragged around and such, brought to the front when clicked, and closed.
Different types of windows can be created with different options.
Note that focus wraps within a window's content.

Returns a jQuery object with additional methods and properties (see below, after options).

The DOM node can be accessed with `$window.element`, and the `$Window` object can be accessed from the DOM node with with `element.$window`.

<table><tr><td>

`options.title`: Sets the initial window caption.

`options.icons`: Specifies the icon of the window at different sizes. Pass an object with keys that are sizes in pixels (or "any"), and values that are the URL of an image, or an object with `srcset` if you want support different pixel densities, or a DOM node if you want full control (e.g. to use an `<svg>` or a font icon or an emoji).

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

`options.iframes`: Contains options for controlling iframe integration.
By default OS-GUI will try to enhance iframes with logic to:
- [x] Show the window as focused when the iframe has focus (this even works for nested iframes!)
- [x] Restore focus to controls in the iframe when refocusing the window (e.g. clicking the titlebar) (this even works for nested iframes!)
- [ ] Propagate theme to iframes (i.e. when you drag a Windows `.theme` file, apply it to iframes too)
	- [x] Theme is propagated to iframes when using `applyCSSProperties(cssProperties, {element, recurseIntoIframes: true})`
	- [ ] @TODO: apply theme for new iframes, not just existing ones (needs a place to store the current theme, or a way to listen for changes to CSS properties in the DOM so it can dynamically inherit them across the frame boundary, supporting stylesheets as well as inline styles)
- [ ] @TODO: proxy mouse and keyboard events to and from the iframe, to allow for:
	- [ ] Outer window to capture and prevent keyboard events
		- Handle menu Alt+(access key) hotkeys when focus is in the iframe
		- An obvious use case is a browser app that loads arbitrary interactive content, but reserves some keyboard shortcuts for its own use. That said, if you're implementing a browser inside a browser, you can't reserve any of the keyboard shortcuts that the real browser reserves! (Maybe an electron version of 98.js.org would be able to though.)
	- [ ] Iframe to handle shortcuts when menus are focused
	- [ ] Fixing issues where dragging inside the iframe (without needing pointer capture):
		- [ ] Let the iframe to handle mouseup/pointerup events outside itself, so it knows when to end dragging.
		- [ ] Let the iframe to handle mousemove/pointermove events outside itself, so it works when dragging outside the iframe (it's ugly if it stops at the border).
		- [ ] At the start of a drag when the iframe was not previously focused, the gesture should be uninterrupted. (Does this need event proxying? Or just less nosy focus-handling (don't call focus() where not needed)? I think it currently focuses each parent browsing context before restoring focus inside the iframe, and it should really just figure out if it can focus an inner control, and IF NOT focus an outer one. And it shouldn't `focus()` what's already focused.)
		- [ ] When dragging over elements outside the iframe, such as an overlapped window (even with an iframe inside it), the interacted iframe should be able to handle the drag. (It just needs a `.pointer-is-down iframe { pointer-events: none; }` and an override on the interacted iframe. I've done it in 98.js.org, easy. In addition to mousemove/pointermove proxying.)

`options.iframes.ignoreCrossOrigin`: Set to true to silence cross-origin warnings for iframes within the window. Focus integration can't fully work with cross-origin iframes. There will be cases where the window is not shown as focused when clicking into the iframe, and focus can't be restored to controls within the iframe.

</td></tr></table>

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

#### `minimize()`

Minimizes the window. If `$window.task.$task` is defined it will use that as a target for minimizing, otherwise the window will minimize to the bottom of the screen.

Current behavior is that it *toggles* minimization. This may change in the future.

#### `maximize()`

Maximizes the window. While maximized, the window will use `position: fixed`, so it will not scroll with the page.

Current behavior is that it *toggles* maximization. This may change in the future. Also, if minimized, it will restore instead of maximizing. Basically, it does what the maximize button does, rather than simply what the method name suggests.

#### `unminimize()`

PRIVATE: don't use this. Use `restore()` instead.

Restores the window from minimized state.

#### `restore()`

Restores the window from minimized or maximized state. If the window is not minimized or maximized, this method does nothing.

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

#### `setIcons(icons)`

Changes the icon(s) of the window. `icons` is in the same format as `options.icons`.

#### `setTitlebarIconSize(size)`

Sets the size of the window's title bar icon, picking the closest size that's available.

#### `getTitlebarIconSize()`

Returns the size of the window's title bar icon.

#### `getIconAtSize(size)`

Picks the closest icon size that's available, and returns a unique DOM node (i.e. cloned).

This can be used for representing the window in the taskbar.

#### `setMenuBar(menuBar)`

Appends the menu bar to the window, and sets the keyboard scope for the menu bar's hotkeys to the window.

Can be called with `null` to remove the menu bar.

#### `setMinimizeTarget(minimizeTargetElement)`

The minimize target (taskbar button) represents the window when minimized, and is used for animating minimize and restore.
If `minimizeTargetElement` is `null`, the window will minimize to the bottom of the screen (the default).

#### `$Button(text, action)`

Creates a button in the window's content area.
It automatically closes the window when clicked. There's no (good) way to prevent this, as it's intended only for dialogs.

If you need any other behavior, just create a `<button>` and add it to the window's content area.

Returns a jQuery object.

#### `addChildWindow($window)`

PRIVATE: don't use this.

Defines a window as a child. For tool windows, the focus state will be shared with the parent window.

This is used internally when you set `options.parentWindow` when creating a window.

#### `onFocus(listener)`

EXPERIMENTAL: This is a potential new API for events when dependency on jQuery is removed.Not available for all events. Inspired by Webamp's API which is probably inspired by React's API.

Calls the listener when the window is (visually?) focused.

#### `onBlur(listener)`

EXPERIMENTAL: potential new API for events

Calls the listener when the window (visually?) loses focus.

#### `onClosed(listener)`

EXPERIMENTAL: potential new API for events

Calls the listener when the window is closed (after the close event is emitted, and if it wasn't prevented).

#### `closed`

Whether the window has been closed.

#### `icons`

The icons of the window at different sizes, as set by `options.icons` or `setIcons()`.

#### `$content`

*jQuery object.*  
Where you can append contents to the window.

#### `$titlebar`

*jQuery object.*  
The titlebar of the window, including the title, window buttons, and possibly an icon.

#### `$title_area`

PRIVATE: Don't use this. Use `$title` or `$titlebar` instead, if possible.

*jQuery object.*  
Wrapper around the title.

#### `$title`

*jQuery object.*  
The title portion of the titlebar.

#### `$x`

*jQuery object.*  
The close button.

#### `$minimize`

*jQuery object.*  
The minimize button.

#### `$maximize`

*jQuery object.*  
The maximize button.

#### `$icon`

PRIVATE: Don't use this.

*jQuery object.*  
The titlebar icon.

#### `element`

The DOM element that represents the window.

#### Event: `closed`

Whether the window has been closed.

#### Event: `close`

Can be used to prevent closing a window, with `event.preventDefault()`.
Since there could be multiple listeners, and another listener could prevent closing, if you want to detect when the window is actually closed, use the `closed` event.

#### Event: `closed`

This event is emitted when the window is closed. It cannot be prevented.

#### Event: `window-drag-start`

Can be used to prevent dragging a window, with `event.preventDefault()`.

#### Event: `title-change`

Can be used to update a taskbar button's label.

#### Event: `icon-change`

Can be used to update a taskbar button's icon.
Use `$window.getIconAtSize(size)` to get an appropriate icon.

### Positioning Windows

Other than `center()`, there is no API specifically for positioning windows.

You can use `$window.css({ top: "500px", left: "500px" })` to set the position of the window. This is a [jQuery method](https://api.jquery.com/css/).

You can also set `position` to `fixed` or `absolute` to position the window relative to the viewport or the nearest positioned ancestor, respectively.

If you want to position a window relative to another window, you can use `$otherWindow.element.getBoundingClientRect()` to get the bounding rectangle of the other window, and then use that to position the window. This is a [built-in DOM API](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect). For example:
```js
const otherRect = $otherWindow.element.getBoundingClientRect();
$window.css({
	top: otherRect.top + "px",
	left: (otherRect.right + 10) + "px",
});
```

#### Notes:
- Stylesheets can't be used (without `!important`) to position the window, because the library uses inline styles to position the window, which take precedence.
- If either window has dynamic content, such as images, you should wait for the content to load before measuring and positioning windows. Alternatively, you can make the layout fixed, by specifying sizes for all images/similar, or a fixed size for the window.
- I may extend `setDimensions()` in the future to allow positioning the window in addition to sizing it, or add a `setPosition()` method.
- You can pass `options.constrainRect` to dynamically constrain the window position and size during dragging and resizing.


### Theming

`parse-theme.js` contains functions for parsing and applying themes.


#### `parseThemeFileString(themeString)`

Parses an INI file string into CSS properties.

Automatically renders dynamic theme graphics, and includes them in the CSS properties.

#### `applyCSSProperties(cssProperties, {element=document.documentElement, recurseIntoIframes=false})`

`cssProperties` is an object with CSS properties and values. It can also be a `CSSStyleDeclaration` object.

`element` is the element to apply the properties to.

If `recurseIntoIframes` is true, then the properties will be applied to all `<iframe>` elements within the element as well.
This only works with same-origin iframes.

#### `renderThemeGraphics(cssProperties)`

Can be used to update theme graphics (scrollbar icons, etc.) for a specific section of the page. Used by the demo to show variations.

Returns CSS properties representing the rendered theme graphics.

```js
element.style.setProperty('--scrollbar-size', '30px');
applyCSSProperties(renderThemeGraphics(getComputedStyle(element)), { element });
```

#### `makeThemeCSSFile(cssProperties)`

Exports a CSS file for a theme. Assumes that the theme graphics are already rendered.
Includes a "generated file" comment.

#### `makeBlackToInsetFilter()`

Initializes an SVG filter that can be used to make icons appear disabled.
It may not work with all icons, since it uses the black parts of the image to form a shape.

Usage from CSS:
```css
button:disabled .icon {
	filter: saturate(0%) opacity(50%); /* fallback until SVG filter is initialized */
	filter: url("#os-gui-black-to-inset-filter");
}
```

## License

Licensed under the [MIT License](https://opensource.org/licenses/MIT), see [LICENSE](LICENSE) for details.

## Development

Install [Node.js](https://nodejs.org/) if you don't already have it.

Clone the repository, then in the project directory run `npm i` to install the dependencies.
Also run `npm i` when pulling in changes from the repository, in case there are changes to the dependencies.

Run `npm start` to open a development server. It will open a demo page in your default browser. Changes to the library will be automatically recompiled, and the page will automatically reload.

Run `npm run lint` to run type checking and spell checking (and any other linting tasks).

It's a good idea to close the server when updating or installing dependencies; otherwise you may run into EPERM issues.

The styles are written with [PostCSS](https://postcss.org/), for mixins and other transforms.  
Recommended: install a PostCSS language plugin for your editor, like [PostCSS Language Support](https://marketplace.visualstudio.com/items?itemName=csstools.postcss) for VS Code.

Currently there's some CSS that has to manually be regenerated in-browser and copied into theme-specific CSS files.  
In the future this could be done with a custom PostCSS syntax parser for .theme/.themepack files, and maybe SVG instead of any raster graphics to avoid needing `node-canvas` (native dependencies are a pain). Or maybe UPNG.js and plain pixel manipulation.
