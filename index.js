//
// # Ampersand Modal
//
// A modal popup view for Ampersand.js
//
// The accessibility features of this modal is based on the following articles:
//
// * http://accessibility.oit.ncsu.edu/training/aria/modal-window/version-2/
// * http://www.nczonline.net/blog/2013/02/12/making-an-accessible-dialog-box/
//
/* jshint browser: true */
/* jshint node: true */
'use strict';

var AmpView = require('ampersand-view');

var view = [
  '<div role="dialog" aria-hidden="true" aria-describedby="amp-modal-descr" data-hook="overlay" class="modal-overlay">',
    '<div class="modal-body" tabindex="0" role="document">',
      '<button class="close" data-hook="close">',
        '<span aria-hidden="true">&times;</span>',
        '<span class="screenreader" data-hook="close-text"></span>',
      '</button>',
      '<h1 data-hook="title"></h1>',
      '<p id="amp-modal-descr" data-hook="description"></p>',
      '<div data-hook="content"></div>',
    '</div>',
  '</div>'
].join('\n');

module.exports = AmpView.extend({
  // Customization options.
  props: {
    title: 'string',
    description: 'string',
    closeText: ['string', false, 'Close'],
    contentView: 'view'
  },

  // Bind our properties to the element.
  bindings: {
    title: '[data-hook="title"]',
    description: '[data-hook="description"]',
    closeText: '[data-hook="close-text"]',
    contentView: {
      type: function (el, val, previousVal) {
        if (previousVal) { previousVal.remove(); }
        this.registerSubview(val);
        var content = this.queryByHook('content');
        if (!val.el) {
          val.render();
        }
        content.appendChild(val.el);
      },
      hook: 'content',
    },
  },

  // Declare `view` a custom data type.
  dataTypes: {
    view: {
      set: function setViewType(nv) {
        var f = 'function';
        // Consider it a view if it follows the view conventions of Ampersand.
        if (typeof nv.render === f && typeof nv.remove === f && nv.el) {
          return {
            val: nv,
            type: 'view',
          };
        }
        else {
          return {
            val: nv,
            type: typeof nv,
          };
        }
      },

      compare: function compareViewType(a, b) {
        return a === b;
      },
    },
  },

  // Return our template
  template: view,

  // Render the modal
  render: function renderModal() {
    this.renderWithTemplate();
  },

  // More "temporary" properties separted to the session compartment.
  session: {
    lastFocus: 'element',
    hiddenElements: 'array',
    containerOverflow: 'string',
    containerHeight: 'string',
  },

  // Hook up DOM events
  events: {
    'click [data-hook="overlay"]': 'cancel',
    'click [data-hook="close"]': 'cancel',
    'focus': 'trapFocus',
    'keydown': 'escape',
  },

  initialize: function () {
    // Need to listen to entire doc, not just in modal.
    document.addEventListener('keydown', this.escape.bind(this));
  },

  //
  // ## Open
  //
  // Opens the modal.
  //
  // When opening the modal all the modal overlay's siblings will be "turned
  // off" by setting `aria-hidden` to `true`. This is reverted once the modal
  // is closed. We will also remember the last focused element before opening
  // the modal. So that we can restore focus when closing it.
  //
  // * **container**, selector or element to show modal in.
  // * **animate**, an optional function. The function will recieve the view
  // as it's only argument. It's then up to the function to animate the view.
  // * **context**, the context to execute the `animate` function in.
  //
  openIn: function openModal(container, animate, context) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }

    // Grab current focus and store away
    this.lastFocus = document.activeElement;

    // Set aria-hidden on siblings
    var hidden = [];
    var childNodes = container.children;
    for (var i = 0, len = childNodes.length; i < len; i++) {
      var node = childNodes[i];
      var current = node.getAttribute('aria-hidden');
      if (current !== 'false') {
        node.setAttribute('aria-hidden', 'true');
        hidden.push(node);
      }
    }
    this.hiddenElements = hidden;

    // Set overflow: hidden on parent to prevent scrolling
    this.containerOverflow = container.style.overflow;
    this.containerHeight = container.style.height;
    container.style.overflow = 'hidden';
    container.style.height = '100%';

    // Append ourselves to container
    if (!this.rendered) {
      this.render();
    }
    this.el.style.display = 'none';
    container.appendChild(this.el);

    if (typeof animate === 'function') {
      context = context || this.el;
      setTimeout(animate.bind(context, this.el), 0);
    }
    else {
      this.el.style.display = 'block';
    }
  },

  //
  // ## Close
  //
  // Closes the modal.
  //
  // Restores focus to the previously focused element and enables all siblings
  // again.
  //
  close: function closeModal(event) {
    var container = this.el.parentNode;
    // We can't close if we're not appended to a parent.
    if (!container) { return false; }

    this.restore();
    this.trigger('close');
    this.remove();
  },

  //
  // ## Cancel
  //
  // Dismisses the modal just like `close()` but signifies a canceled action.
  //
  cancel: function cancelModal(event) {
    var container = this.el.parentNode;
    // We can't close if we're not appended to a parent.
    if (!container) { return false; }

    // Don't close on clicks inside the modal.
    if (event) {
      var target = event.target;
      var closeBtn = this.queryByHook('close');
      var closeBtnClicked = closeBtn === target || closeBtn.contains(target);
      var overlay = this.queryByHook('overlay');
      var overlayClicked = target === overlay;
      var shouldClose = (closeBtnClicked || overlayClicked);
      if (!shouldClose) {
        return false;
      }
    }

    this.restore();
    this.trigger('cancel');
    this.remove();
  },

  //
  // ## Restore
  //
  // Restore document state when closing modal.
  //
  restore: function restoreState() {
    var container = this.el.parentNode;
    // Restore aria-hidden on previously hidden elements
    this.hiddenElements.forEach(function (node) {
      node.removeAttribute('aria-hidden');
    });
    this.hidden = [];

    // Restore container
    container.style.overflow = this.containerOverflow;
    container.style.height = this.containerHeight;

    // Restore focus
    if (this.lastFocus) {
      this.lastFocus.focus();
      this.lastFocus = null;
    }
  },

  //
  // ## Escape
  //
  // Handle escape key.
  //
  escape: function escape(event) {
    if (event.keyCode === 27) {
      event.preventDefault();
      this.cancel();
    }
  },

  //
  // ## Trap Focus
  //
  // Traps focus within the modal. For example when tabbing around and focus
  // gets outside the modal, the focus is brought back.
  //
  trapFocus: function trapFocus(event) {
    var focusInModal = this.el.contains(event.target);
    if (!focusInModal) {
      event.stopPropagation();
      var bd = this.query('.modal-body');
      bd.focus();
    }
  },
});
