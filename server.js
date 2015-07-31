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

var parsePosts = function(body){
  var $ = cheerio.load(body);
  var posts = [];
  //test
  //console.log($('#pagelet_timeline_main_column').html());


  //not functional
  $('.userContentWrapper').each(function(i, element) {
    var text = $(this).children().attr('data-hover');
    posts.push({
      text: text
    });
  });
  return posts;
};


var getPosts = function(res, id) {
  phantom.create(function(ph){
    ph.createPage(function (page){
      page.open('http://facebook.com/'+id, function(status, body){
        // 5 second wait time just in case
        setTimeout(function(){
          // returns success
          console.log('opened facebook?', status);
          // returns undefined
          console.log(page.content);
          body = page.content;
          var posts = parsePosts(body);
            res.send({
            id: id,
            posts: posts
          });
        }, 5000);
        ph.exit();
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
  var posts = [];

  if (!id) {
    sendError(res, 'Please send a valid id');
  } else {
    posts = getPosts(res, id);
  }

});
var port = process.env.PORT || 3200;
app.listen(port);
