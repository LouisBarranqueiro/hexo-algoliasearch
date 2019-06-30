import _ from 'lodash'
import hexoUtil from 'hexo-util'

import algoliasearch from 'algoliasearch'

const FILTER_FUNCTIONS = {
  strip: hexoUtil.stripHTML,
  truncate: function(post, start, end) {
    return post.substr(start, end)
  }
}

/**
 * Split an `Array` into chunk
 *
 * @param {Array} array - The `Array` to split
 * @param {Number} chunkSize - The size of the chunks
 * @returns {Array}
 */
export const splitIntoChunks = (array, chunkSize) => {
  const newArrays = array.slice(0)
  const chunks = []
  while (newArrays.length) {
    chunks.push(newArrays.splice(0, chunkSize))
  }
  return chunks
}

/**
 * Pick speficied fields of posts
 *
 * @param {Object} posts - The posts to prepare
 * @param {Array} fields - The fields of the posts to select
 * @param {Array} fieldsWithFilters - The fields of the posts to select
 * @returns {Object} posts - The posts ready to be indexed
 */
export const preparePosts = (posts, fields, fieldsWithFilters) => {
  const tagsAndCategoriesFields = ['tags', 'categories'].filter((field) => fields.includes(field))

  return posts.map((initialPost) => {
    const postToIndex = _.pick(initialPost, fields)
    // define a unique ID to identfy this post on Algolia
    postToIndex.objectID = initialPost._id

    // extract tags and categories
    tagsAndCategoriesFields.forEach((field) => {
      postToIndex[field] = []
      initialPost[field].data.forEach(function(fieldElement) {
        postToIndex[field].push(fieldElement.name)
      })
    })

    // execute filters of fields
    fieldsWithFilters.forEach((field) => {
      const indexedFieldName = []
      const fieldFilters = field.split(':')
      const fieldName = fieldFilters.shift()

      if (!initialPost.hasOwnProperty(fieldName)) { // eslint-disable-line
        hexo.log.warn(`"${initialPost.title}" post has no "${fieldName}" field.`)
        return
      }

      let fieldValue = initialPost[fieldName]

      fieldFilters.forEach(function(filter) {
        const filterArgs = filter.split(',')
        const filterName = filterArgs.shift()

        indexedFieldName.push(_.upperFirst(filterName))
        filterArgs.unshift(fieldValue)
        // execute filter on field value
        fieldValue = FILTER_FUNCTIONS[filterName].apply(this, filterArgs)
      })

      // store filter result in post object
      postToIndex[fieldName + indexedFieldName.join('')] = fieldValue
    })

    return postToIndex
  })
}

/**
 * Index posts on Algolia
 *
 * @param {Object} algoliaIndex - An Algolia index
 * @param {Array} posts - A list of posts to index
 * @param {number} chunkSize - A list of posts to index
 * @returns {void}
 */
export const indexPostsOnAlgolia = (algoliaIndex, posts, chunkSize) => {
  // split our results into chunks of 5,000 objects,
  // to get a good indexing/insert performance
  const chunkedPosts = splitIntoChunks(posts, chunkSize)
  return Promise.all(chunkedPosts.map((posts) => {
    return new Promise((resolve, reject) => {
      algoliaIndex.saveObjects(posts, (error) => {
        if (error) {
          reject(error)
        }
        resolve()
      })
    })
  }))
}

/**
 * Clear an Algolia index
 *
 * @param {Object} algoliaIndex - The algolia index to clear
 * @returns {Promise}
 */
export const clearAlgoliaIndex = (algoliaIndex) => {
  return new Promise((resolve, reject) => {
    algoliaIndex.clearIndex((error) => {
      if (error) {
        reject(error)
      }
      resolve()
    })
  })
}

/**
 * Get fields without filters
 *
 * @param {Array} fields - A list of fields. E.g: content, excerpt, categories, etc...
 * @returns {Array} - A list of fields without any filters
 */
export const getBasicFields = fields => fields.filter((field) => !/:/.test(field))

/**
 * Get fields with filters
 *
 * @param {Array} fields - A list of fields. E.g: content, excerpt, categories, etc...
 * @returns {Array} - A list of fields with filters
 */
export const getFieldsWithFilters = fields => fields.filter((field) => /:/.test(field))

const algoliaCommand = async(hexo, args, callback) => {
  const algoliaConfig = hexo.config.algolia
  const fields = getBasicFields(algoliaConfig.fields)
  const fieldsWithFilters = getFieldsWithFilters(algoliaConfig.fields)
  const algoliaAppId = process.env.ALGOLIA_APP_ID || algoliaConfig.appId
  const algoliaAdminApiKey = process.env.ALGOLIA_ADMIN_API_KEY || algoliaConfig.adminApiKey
  const algoliaIndexName = process.env.ALGOLIA_INDEX_NAME || algoliaConfig.indexName
  const algoliaChunkSize = algoliaConfig.chunkSize

  await hexo.call('generate')
  await hexo.database.load()

  let posts = hexo.database.model('Post').find({published: true}).toArray()

  if (!posts.length) {
    hexo.log.info('There is no post to index.')
    return callback()
  }
  posts = preparePosts(posts, fields, fieldsWithFilters)

  const algoliaClient = algoliasearch(algoliaAppId, algoliaAdminApiKey)
  const algoliaIndex = algoliaClient.initIndex(algoliaIndexName)

  if (args && !args.n) {
    hexo.log.info('Clearing index on Algolia...')
    try {
      await clearAlgoliaIndex(algoliaIndex)
    }
    catch (error) {
      hexo.log.info(`Error has occurred during clearing index : ${error}`)
      return callback(error)
    }
    hexo.log.info('Index cleared.')
  }

  hexo.log.info('Indexing posts on Algolia...')
  try {
    await indexPostsOnAlgolia(algoliaIndex, posts, algoliaChunkSize)
  }
  catch (error) {
    hexo.log.info(`Error has occurred during indexing posts : ${error}`)
    return callback(error)
  }
  hexo.log.info(`${posts.length} posts indexed.`)
}

export default algoliaCommand
