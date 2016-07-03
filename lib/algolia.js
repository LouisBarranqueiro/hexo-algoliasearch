/* eslint block-scoped-var: 0 */
/**
 * Index posts on Algolia
 * @param {Object} args
 * @param {Function} callback
 * @returns {void}
 */
function algolia(args, callback) {
  var _ = require('lodash');
  var algoliasearch = require('algoliasearch');
  var async = require('async');
  var hexoUtil = require('hexo-util');
  var hexo = this;
  var algoliaConfig = hexo.config.algolia;
  var log = hexo.log;
  var posts = [];
  
  /**
   * Collect data of a post
   * @param {Object} post A post of Hexo
   * @returns {Object} post A post of Hexo
   */
  function getPost(post) {
    var key = null;
    var tags = [];
    var categories = [];
    
    // index only published posts
    if (post.published) {
      var object = _.pick(post, algoliaConfig.fields);
      
      // define objectID for Algolia
      object.objectID = post._id;
      
      // remove all html tags in post content
      if (algoliaConfig.fields.indexOf('content') >= 0) {
        object.content = hexoUtil.stripHTML(post.content);
      }
      
      // remove all html tags in post excerpt
      if (algoliaConfig.fields.indexOf('excerpt') >= 0) {
        object.excerpt = hexoUtil.stripHTML(post.excerpt);
      }
      
      // extract tags
      if (algoliaConfig.fields.indexOf('tags') >= 0) {
        for (key in post.tags.data) {
          if (post.tags.data.hasOwnProperty(key)) {
            if (post.tags.data[key].hasOwnProperty('name')) {
              tags.push(post.tags.data[key].name);
            }
          }
        }
        object.tags = tags;
      }
      
      // extract categories
      if (algoliaConfig.fields.indexOf('categories') >= 0) {
        for (key in post.categories.data) {
          if (post.categories.data.hasOwnProperty(key)) {
            if (post.categories.data[key].hasOwnProperty('name')) {
              categories.push(post.categories.data[key].name);
            }
          }
        }
        object.categories = categories;
      }
      
      posts.push(object);
    }
    return post;
  }
  
  /**
   * Index posts
   * @param {String} index An index name
   * @param {Array} posts A list of posts
   * @returns {void}
   */
  function indexPosts(index, posts) {
    // split our results into chunks of 5,000 objects,
    // to get a good indexing/insert performance
    var chunkedPosts = _.chunk(posts, algoliaConfig.chunkSize || 5000);
    
    log.info('Indexing posts on Algolia...');
    async.each(chunkedPosts, index.saveObjects.bind(index), function(err) {
      if (err) {
        log.info('Error has occurred during indexing posts : ' + err);
        throw err;
      }
      log.info('Indexation done');
    });
  }

  // register filter to collect data of each posts
  hexo.extend.filter.register('after_post_render', getPost);

  // start process with a generate call
  log.info('Collecting posts...');
  hexo.call('generate', function(err) {
    if (err) {
      log.info('Error has occurred during collecting posts : ' + err);
      return callback(err);
    }

    log.info('Posts collected');
    // init index
    var client = algoliasearch(algoliaConfig.appId, algoliaConfig.adminApiKey);
    var index = client.initIndex(algoliaConfig.indexName);

    // clear index
    if (args && !args.n) {
      log.info('Clearing index on Algolia...');
      index.clearIndex(function(err) {
        if (err) {
          log.info('Error has occurred during clearing index : ' + err);
          return err;
        }
        log.info('Index cleared');
        indexPosts(index, posts);
      });
    }
    else {
      indexPosts(index, posts);
    }
  });
}

module.exports = algolia;
