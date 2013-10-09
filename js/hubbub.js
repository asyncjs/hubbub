var Hubbub = (function () {
  var cssClass    = '.hubbub',
      gistIdAttr  = 'data-gist-id',
      apiRoot     = 'https://api.github.com/',
      widgets     = document.querySelectorAll(cssClass),
      hubbub      = {},
      useFixtures = false;

  var cache = (function () {
    var gistKey      = 'hubbub-gist-',
        markdownKey  = 'hubbub-markdown-',
        gistLife     = 60000,
        markdownLife = 1800000;

    return {
      hasGist: function (id) {
        return localStorage.getItem(gistKey+id) !== null;
      },
      getGist: function (id) {
        var blob = JSON.parse(localStorage.getItem(gistKey+id));
        if (blob !== null) {
          if ((Date.now() - blob.createdAt) > gistLife) {
            localStorage.removeItem(gistKey+id);
          }
        }
        return blob.comments;
      },
      setGist: function (id, comments) {
        var blob = { comments: comments, createdAt: Date.now() };
        localStorage.setItem(gistKey+id, JSON.stringify(blob));
      },
      hasMarkdown: function (id) {
        return localStorage.getItem(markdownKey+id) !== null;
      },
      getMarkdown: function (id) {
        var blob = JSON.parse(localStorage.getItem(markdownKey+id));
        if (blob !== null) {
          if ((Date.now() - blob.createdAt) > markdownLife) {
            localStorage.removeItem(markdownKey+id);
          }
        }
        return blob.text;
      },
      setMarkdown: function (id, text) {
        var blob = { text: text, createdAt: Date.now() };
        localStorage.setItem(markdownKey+id, JSON.stringify(blob));
      },
    };
  })();

  // Initial setup
  [].forEach.call(widgets, function (el) {
    getComments(el, renderComments);
  });

  function getComments (el, callback) {
    var gistId = el.getAttribute(gistIdAttr);

    if (cache.hasGist(gistId)) {
      callback(el, cache.getGist(gistId));
    } else {
      var req = new XMLHttpRequest();
      req.onload = function (res) {
        var comments = JSON.parse(res.target.responseText);
        cache.setGist(gistId, comments);
        callback(el, comments);
      };
      var url;
      if (useFixtures) {
        url = 'fixtures/' + gistId + '.json';
      } else {
        url = apiRoot + 'gists/' + gistId + '/comments';
      }
      req.open('get', url, true);
      req.send();
    }
  }

  function renderComments (el, comments) {
    el.innerHTML = '<h3>Comments</h3>';
    comments.forEach(function (comment) {
      el.appendChild(renderComment(comment));
    });
  }

  function renderComment (comment) {
    var el = document.createElement('div');
    el.setAttribute('class', 'hubbub-container');
    el.appendChild(renderAvatar(comment.user));

    var content = document.createElement('div');
    content.setAttribute('class', 'hubbub-content');
    content.appendChild(renderHeader(comment));
    content.appendChild(renderCommentBody(comment));

    el.appendChild(content);
    return el;
  }

  function renderHeader (comment) {
    var header = document.createElement('div');
    header.setAttribute('class', 'hubbub-header');

    var un = document.createElement('a');
    un.setAttribute('class', 'hubbub-username');
    un.setAttribute('href', comment.user.html_url);
    un.textContent = comment.user.login;

    var pl = document.createElement('a');
    pl.setAttribute('class', 'hubbub-permalink');
    pl.setAttribute('href', comment.url);
    pl.textContent = 'commented';

    header.appendChild(un);
    header.appendChild(pl);
    header.appendChild(renderTimestamp(comment.created_at));
    return header;
  }

  function renderTimestamp (timestamp) {
    var diff = Date.now() - new Date(timestamp).getTime();
    var el = document.createElement('time');
    el.setAttribute('class', 'hubbub-timestamp');
    el.setAttribute('datetime', timestamp);
    el.setAttribute('title', timestamp);

    diff = Math.round(diff / 1000);

    if (diff < 3600) {
      str = Math.round(diff / 60) + ' minutes ago'
    } else if (diff < 86400) {
      str = Math.round(diff / 3600) + ' hours ago'
    } else {
      str = Math.round(diff / 86400) + ' days ago'
    }

    el.textContent = str;

    return el;
  }

  function renderCommentBody (comment) {
    var body = document.createElement('div');
    body.setAttribute('class', 'hubbub-comment-body');

    if (cache.hasMarkdown(comment.id)) {
      body.innerHTML = cache.getMarkdown(comment.id);
    } else {
      parseMarkdown(comment, function (text) {
        body.innerHTML = text;
      });
    }
    return body;
  }

  function parseMarkdown (comment, callback) {
    var req = new XMLHttpRequest();
    req.onload = function (res) {
      console.log(res.target.responseText);
      cache.setMarkdown(comment.id, res.target.responseText);
      callback(res.target.responseText);
    };
    var url;
    if (useFixtures) {
      url = 'fixtures/' + comment.id + '.html';
      req.open('get', url, true);
      req.send();
    } else {
      url = apiRoot + 'markdown/';
      req.setRequestHeader("Content-type", "application/json");
      req.open('post', url, true);
      req.send(JSON.stringify({
        text: comment.body
      }));
    }
  }

  function renderAvatar (user) {
    var img = document.createElement('img');
    img.setAttribute('class', 'hubbub-avatar');
    img.setAttribute('src', user.avatar_url);
    img.setAttribute('width', 48);
    img.setAttribute('height', 48);
    return img;
  }

  return hubbub;
})();
