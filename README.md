# ampersand-modal-view

A modal popup view for Ampersand.js.

## Install

`npm install ampersand-modal-view`

## Example

```javascript
var ModalView = require('ampersand-modal-view');
var MyCustomView = require('some-custom-view');

var modalContent = new MyCustomView(options);
var modal = new ModalView({
  title: 'Title of My Modal',
  description: 'a description, mostly for screenreaders',
  contentView: modalContent
});

modal.openIn('body');
```

## API Reference

### constructor/initialize `new AmpersandModalView([opts])`

Creates a new modal view.

#### opts

* `title`, the title of the modal. Set in a `h1`. Used as the aria label.
* `description`, sets a description for screenreaders. Used as the aria description
* `close`, allows you to change the screenreader label for the close button.
* `contentView`, any object following the Ampersand view conventions. The content
of the modal.

### open in `modalView.openIn(container)`

Opens the modal in `container`.

* `container`, a string selector or a DOM node to show the modal inside. Most
cases this will be `body`.

## Accessibility

This modal takes great care to be accessible for people using a screenreader.
The inspiration for the implementation comes from these two great articles.

* http://accessibility.oit.ncsu.edu/training/aria/modal-window/version-2/
* http://www.nczonline.net/blog/2013/02/12/making-an-accessible-dialog-box/

## License

MIT
