
#About
Util for parse RSS feed resources and normalize them to JSON object.

# Installation

Install via NPM

```js

npm install feed-to-json --save

```

# Example

```js

var Feed = require('feed-to-json');

Feed.load('https://news.google.com/news?pz=1&cf=all&output=rss', function(err, rss){
    console.log(rss);
});

```