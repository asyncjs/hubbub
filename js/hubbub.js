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
        gistLife     = 3600000,
        markdownLife = 21600000;

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
      var url;
      if (useFixtures) {
        url = 'fixtures/' + gistId + '.json';
      } else {
        url = apiRoot + 'gists/' + gistId + '/comments';
      }
      ajax({
        url:url,
        dataType: 'json'
      }, function (comments) {
        cache.setGist(gistId, comments);
        callback(el, comments);
      }, function (err) {
        el.innerHTML = el.innerHTML + "<small>Error fetching Comments</small>";
      });
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
    var str;

    if (diff < 3600) {
      str = Math.round(diff / 60) + ' minutes ago'
    } else if (diff < 86400) {
      var hours = Math.round(diff / 3600);
      str = hours === 1 ? 'an hour ago' : hours + ' hours ago'
    } else {
      var days = Math.round(diff / 86400);
      str = days === 1 ? 'yesterday' : days + ' days ago'
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
      body.innerHTML = '<p>' + comment.body + '</p>';
      parseMarkdown(comment, function (text) {
        body.innerHTML = text;
      });
    }
    return body;
  }

  function parseMarkdown (comment, success) {
    var opts = {};
    if (useFixtures) {
      opts.url = 'fixtures/' + comment.id + '.html';
    } else {
      opts.url = apiRoot + 'markdown';
      opts.reqDataType = 'json';
      opts.type = 'POST';
      opts.data = { text: comment.body };
    }
    ajax(opts, function (markdown) {
      cache.setMarkdown(comment.id, markdown);
      success(markdown);
    }, function (err) {
      // do nothing
    });
  }

  function ajax (options, success, error) {
    var req = new XMLHttpRequest();
    options.type = options.type || 'GET';
    req.addEventListener('readystatechange', function (res) {
      if (req.readyState === 4 && req.status === 200) {
        var data;
        if (options.dataType === 'json') {
          data = JSON.parse(res.target.responseText);
        } else {
          data = res.target.responseText;
        }
        success(data, res);
      } else if (req.readyState === 4) {
        error(res);
      }
    });
    req.open(options.type, options.url, true);
    if (options.reqDataType === 'json') {
      req.setRequestHeader('Content-type', 'application/json');
      req.send(JSON.stringify(options.data));
    } else {
      req.send(options.data);
    }
  }
  hubbub.ajax = ajax;

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
