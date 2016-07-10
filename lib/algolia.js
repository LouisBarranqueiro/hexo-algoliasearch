/* eslint block-scoped-var: 0 */

/**
 * Index posts on Algolia
 * @param {Object} args
 * @param {Function} callback
 * @returns {void}
 */
function algolia(args, callback) {
  var _ = require('lodash');
  var hexoUtil = require('hexo-util');
  var algoliasearch = require('algoliasearch');
  var async = require('async');
  var hexo = this;
  var algoliaConfig = hexo.config.algolia;
  var fields = getFields(algoliaConfig.fields);
  var customFields = getCustomFields(algoliaConfig.fields);
  var log = hexo.log;
  var posts = [];
  var actions = [];

  /**
   * Process data of a post
   * @param {Object} post A post of Hexo
   * @returns {Object} post A post of Hexo
   */
  function processPost(post) {
    var key = null;
    var tags = [];
    var categories = [];
    var object = {};
    // index only published posts
    object = _.pick(post, fields);

    // define objectID for Algolia
    object.objectID = post._id;

    // extract tags
    if (fields.indexOf('tags') >= 0) {
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
    if (fields.indexOf('categories') >= 0) {
      for (key in post.categories.data) {
        if (post.categories.data.hasOwnProperty(key)) {
          if (post.categories.data[key].hasOwnProperty('name')) {
            categories.push(post.categories.data[key].name);
          }
        }
      }
      object.categories = categories;
    }

    // handle custom fields
    for (key in customFields) {
      if (customFields.hasOwnProperty(key)) {
        var field = customFields[key].split(':');
        var fieldName = field[0];
        var actionName = field[1];
        var actionFn = actions[actionName];
        // execute action function on post field
        // and store result in post object
        object[fieldName + _.upperFirst(actionName)] = actionFn(post[fieldName]);
      }
    }
    return object;
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
      log.info('Indexation done. ' + posts.length + ' posts indexed.');
    });
  }

  // add actions
  actions.strip = hexoUtil.stripHTML;

  // register filter to collect data of each posts
  hexo.extend.filter.register('after_post_render', function(post) {
    if (post.published) {
      posts.push(processPost(post));
    }
    return post;
  });

  // start process with a generate call
  log.info('Collecting posts...');
  hexo.call('generate', function(err) {
    if (err) {
      log.info('Error has occurred during collecting posts : ' + err);
      return callback(err);
    }

    log.info(posts.length + ' posts collected');
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

/**
 * Get normal fields of a list of fields
 * @param {Array} fields A field name of a post
 * @returns {Array}
 */
function getFields(fields) {
  return fields.filter(function(field) {
    return !/:/.test(field);
  });
}

/**
 * Get fields name of a list of fields name that need a action on their value
 * @param {Array} fields A field name of a post
 * @returns {Array}
 */
function getCustomFields(fields) {
  return fields.filter(function(field) {
    return /:/.test(field);
  });
}

module.exports = algolia;
