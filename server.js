var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var phantom = require('phantom');

var sendError = function(res, errorMessage) {
  res.send({
    'type': 'error',
    'message': errorMessage
  });
};

var parsePosts = function(data){
  var $ = cheerio.load(data);
  var posts = [];

  $('.userContentWrapper').each(function(i, element) {

    var time = $('[data-utime]', this).data('utime');

    var text = $('.userContent', this).text() ||
      $('.text_exposed_root', this).text().replace(' See More', '') ||
      $('h5', this).text().split(' shared ')[1];

    var url = $('[data-utime]', this).parent().attr('href');

    posts.push({
      time: time,
      text: text,
      url: 'https://facebook.com' + url
    });
  });
  return posts;
};


var getPosts = function(res, id) {
  phantom.create(function(ph){
    ph.createPage(function (page){
      var url = 'http://facebook.com/' + id;
      console.log('Getting the html for ' + url);

      page.open(url, function(status) {
        console.log('status', status);

        if (status !== 'success') {
          ph.exit();
          return;
        }

        page.evaluate(function () {
          return document && document.body && document.body.innerHTML;
        }, function (body) {
          if (!body) {
            res.send({
              'id': id
            });
          }
          else {
            var $ = cheerio.load(body, {
              xmlMode: true
            });


            // Facebook hides this content in a comment, let's parse it out
            var contents = $('code').contents();
            var data = '';

            for (var i = 0; i < contents.length; i++) {
              if (contents[i].data.indexOf('userContentWrapper') !== -1) {
                data = contents[i].data;
                break;
              }
            }

            var posts = parsePosts(data);

            res.send({
              'id': id,
              posts: posts
            });
          }

          ph.exit();
        });
      });
    });
  });
};

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  //Question - intercept OPTIONS method - How would the OPTION method ever be called?
  //Wouldn't it always be a GET?
  if ('OPTIONS' == req.method) {
    res.send(200);
  }
  else {
    next();
  }
};

app.use(allowCrossDomain);
//Possibly use app.all(...) here, then we wouldn't need to intercept OPTIONS?
app.get('/:id?', function(req, res){
  var id = req.params.id;

  if (!id) {
    sendError(res, 'Please send a valid id');
  } else {
    getPosts(res, id);
  }

});
var port = process.env.PORT || 3200;
app.listen(port);
