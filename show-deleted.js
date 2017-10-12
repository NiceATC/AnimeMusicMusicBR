

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } };

define('extplug/show-deleted/main',['require','exports','module','extplug/Plugin','plug/views/rooms/chat/ChatView','plug/views/rooms/popout/PopoutChatView','plug/core/Events','meld'],function (require, exports, module) {

  var Plugin = require('extplug/Plugin');
  var ChatView = require('plug/views/rooms/chat/ChatView');
  var PopoutChatView = require('plug/views/rooms/popout/PopoutChatView');
  var Events = require('plug/core/Events');

  var _require = require('meld');

  var around = _require.around;

  var ShowDeleted = Plugin.extend({
    name: 'Show Deleted Messages v2',
    description: 'Keeps showing deleted chat messages.',

    enable: function enable() {
      var _this = this;

      this._super();

      // default deleted message styles. can be changed in room styles
      // by room hosts.
      this.Style({
        '.cm.extplug-deleted': {
          opacity: '0.5'
        }
      });

      var advice = function advice(joinpoint) {
        var _joinpoint$args = _slicedToArray(joinpoint.args, 1);

        var cid = _joinpoint$args[0];

        // if the last received message is being deleted, make sure new
        // messages don't collapse into its <div>
        if (this.lastText && this.lastText.hasClass('cid-' + cid)) {
          this.lastID = this.lastType = this.lastText = this.lastTime = null;
        }

        const message = this.$(`.cid-${cid}`).closest('.cm')
      if (!message.hasClass('extplug-deleted')) {
        message.addClass('extplug-deleted')
        const timestamp = message.find('.timestamp')
        timestamp.prepend('[Deleted] ')

        // Add a tooltip showing the user who deleted the message.
        const moderator = lastDeleteEvent && API.getUser(lastDeleteEvent.mi)
        if (moderator) {
          timestamp.attr({
            'data-tooltip-dir': 'left',
            'data-tooltip': `Deleted by ${moderator.username}`
          })
        }
      }

      lastDeleteEvent = null
    }

    this.listenTo(Events, 'socket:chatDelete', (del) => {
      lastDeleteEvent = del
    })

      this.replaceEvents(function () {
        _this.mainAdvice = around(ChatView.prototype, 'onDelete', advice);
        _this.popAdvice = around(PopoutChatView.prototype, 'onDelete', advice);
      });
    },

    disable: function disable() {
      var _this2 = this;

      this.replaceEvents(function () {
        _this2.mainAdvice.remove();
        _this2.popAdvice.remove();
      });
      this._super();
    },

    // safely replace the onDelete method, keeping the event handler around
    replaceEvents: function replaceEvents(cb) {
      var chatView = this.ext.appView.room.chat;
      if (chatView) Events.off('chat:delete', chatView.onDelete);
      cb();
      if (chatView) Events.on('chat:delete', chatView.onDelete, chatView);
    }

  });

  module.exports = ShowDeleted;
});
