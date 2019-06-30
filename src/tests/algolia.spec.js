import algoliaCommand, {
  clearAlgoliaIndex,
  getBasicFields,
  getFieldsWithFilters,
  indexPostsOnAlgolia,
  preparePosts,
  splitIntoChunks
} from '../algolia'
import Hexo from 'hexo'
import algoliasearch, {mocks as algoliasearchMocks} from 'algoliasearch'

jest.mock('algoliasearch', () => {
  const algoliaIndex = {
    clearIndex: jest.fn((callback) => callback()),
    saveObjects: jest.fn((posts, callback) => callback())
  }
  const algoliaClient = {
    initIndex: jest.fn(() => algoliaIndex)
  }
  return {
    __esModule: true, // this property makes it work,
    default: jest.fn(() => algoliaClient),
    mocks: {
      algoliaClient,
      algoliaIndex
    }
  }
})

const TEST_BLOG_PATH = process.cwd() + '/test_blog'

describe('algolia', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getBasicFields()', () => {
    it('should return basic fields', () => {
      expect(getBasicFields(['content', 'title'])).toEqual(['content', 'title'])
      expect(getBasicFields(['content:strip:truncate,0,500', 'title', 'excerpt'])).toEqual(['title', 'excerpt'])
    })
  })

  describe('getFieldsWithFilters()', () => {
    it('should return field with filters', () => {
      expect(getFieldsWithFilters(['content', 'title'])).toEqual([])
      expect(getFieldsWithFilters(['content:strip:truncate,0,500', 'tags', 'title:strip', 'excerpt']))
        .toEqual(['content:strip:truncate,0,500', 'title:strip'])
    })
  })

  describe('splitIntoChunck()', () => {
    expect(splitIntoChunks([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  describe('preparePosts()', () => {
    const createPost = (id) => {
      return {
        _id: id,
        content: '<span>the content of the <strong>post</strong></span>',
        tags: {data: [{name: 'tag-1'}, {name: 'tag-2'}, {name: 'tag-3'}]},
        categories: {data: [{name: 'category-1'}, {name: 'category-2'}, {name: 'category-3'}]},
        title: 'the title of the post'
      }
    }

    it('should return a list of posts with only their title', () => {
      const posts = [createPost(1), createPost(2), createPost(3)]
      const preparedPosts = preparePosts(posts, ['title', 'content'], [])
      expect(preparedPosts).toMatchSnapshot()
    })

    it('should return a list of posts with the specified fields with filters', function() {
      const posts = [createPost(1), createPost(2), createPost(3)]
      const fieldWithFilters = ['content:strip:truncate,0,5', 'title:truncate,5,10']
      const preparedPosts = preparePosts(posts, ['title'], fieldWithFilters)
      expect(preparedPosts).toMatchSnapshot()
    })

    it('should return a list of posts with the specified fields with filters', function() {
      const posts = [createPost(1), createPost(2), createPost(3)]
      const fields = ['title', 'tags', 'categories']
      const fieldWithFilters = ['content:strip:truncate,0,5', 'title:truncate,5,10']
      const preparedPosts = preparePosts(posts, fields, fieldWithFilters)
      expect(preparedPosts).toMatchSnapshot()
    })

    it('should return a list of posts with the specified fields wand warn about unknown field', function() {
      global.hexo = {log: {warn: jest.fn()}}
      const posts = [createPost(1)]
      const fields = ['unknownField', 'title']
      const preparedPosts = preparePosts(posts, fields, fields)
      expect(preparedPosts).toMatchSnapshot()
      expect(hexo.log.warn).toHaveBeenCalledWith(`"${posts[0].title}" post has no "unknownField" field.`)
    })

    it('should return a list of posts with the specified fields with filters', function() {
      const posts = [createPost(1), createPost(2), createPost(3)]
      const fields = ['title', 'tags', 'categories']
      const fieldWithFilters = ['content:strip:truncate,0,5', 'title:truncate,5,10']
      const preparedPosts = preparePosts(posts, fields, fieldWithFilters)
      expect(preparedPosts).toMatchSnapshot()
    })
  })

  describe('clearAlgoliaIndex()', () => {
    it('should clear the index on Algolia', () => {
      const algoliaIndex = {clearIndex: jest.fn((callback) => callback())}
      clearAlgoliaIndex(algoliaIndex)
      expect(algoliaIndex.clearIndex).toHaveBeenCalledTimes(1)
    })

    it('should throw error because clearing the index failed', () => {
      const errorToThrow = Error('cannot clear index')
      const algoliaIndex = {clearIndex: jest.fn((callback) => callback(errorToThrow))}
      clearAlgoliaIndex(algoliaIndex)
        .catch((error) => {
          expect(error).toEqual(errorToThrow)
        })
      expect(algoliaIndex.clearIndex).toHaveBeenCalledTimes(1)
    })
  })

  describe('indexPostsOnAlgolia()', () => {
    it('should index posts on Algolia', async() => {
      const posts = [{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}]
      const chunkSize = 2
      const algoliaIndex = {
        saveObjects: jest.fn((posts, callback) => callback())
      }
      await indexPostsOnAlgolia(algoliaIndex, posts, chunkSize)

      const saveObjectsCalls = algoliaIndex.saveObjects.mock.calls
      expect(algoliaIndex.saveObjects).toHaveBeenCalledTimes(3)
      expect(saveObjectsCalls[0][0]).toEqual([{id: 1}, {id: 2}])
      expect(saveObjectsCalls[1][0]).toEqual([{id: 3}, {id: 4}])
      expect(saveObjectsCalls[2][0]).toEqual([{id: 5}])
    })

    it('should throw error because the indexation failed', async() => {
      const posts = [{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}]
      const chunkSize = 2
      const errorToThrow = Error('Cannot index objects')
      const algoliaIndex = {
        saveObjects: jest.fn((posts, callback) => callback(errorToThrow))
      }
      indexPostsOnAlgolia(algoliaIndex, posts, chunkSize)
        .catch((error) => {
          expect(error).toEqual(error)
        })

      const saveObjectsCalls = algoliaIndex.saveObjects.mock.calls
      expect(algoliaIndex.saveObjects).toHaveBeenCalledTimes(3)
      expect(saveObjectsCalls[0][0]).toEqual([{id: 1}, {id: 2}])
      expect(saveObjectsCalls[1][0]).toEqual([{id: 3}, {id: 4}])
      expect(saveObjectsCalls[2][0]).toEqual([{id: 5}])
    })
  })

  describe('algoliaCommand()', () => {
    it('should clear index and index posts on Algolia (environment variables)', async() => {
      process.env.ALGOLIA_APP_ID = 'env-algolia-app-id'
      process.env.ALGOLIA_ADMIN_API_KEY = 'env-algolia-admin-app-id'
      process.env.ALGOLIA_INDEX_NAME = 'env-algolia-index-name'
      const algoliaClient = algoliasearchMocks.algoliaClient
      const algoliaIndex = algoliasearchMocks.algoliaIndex
      const hexo = new Hexo(TEST_BLOG_PATH)

      await hexo.init()
      await algoliaCommand(hexo, {}, () => {})

      const indexedPosts = algoliaIndex.saveObjects.mock.calls[0][0]
      // freeze ID of posts because we later use snapshots and these IDs change
      indexedPosts[0].objectID = 1

      expect(algoliasearch).toHaveBeenCalledWith(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_API_KEY)
      expect(algoliaClient.initIndex).toHaveBeenCalledWith(process.env.ALGOLIA_INDEX_NAME)
      expect(algoliaIndex.clearIndex).toHaveBeenCalledTimes(1)
      expect(algoliaIndex.saveObjects).toHaveBeenCalledTimes(1)
      expect(indexedPosts).toMatchSnapshot()

      delete process.env.ALGOLIA_APP_ID
      delete process.env.ALGOLIA_ADMIN_API_KEY
      delete process.env.ALGOLIA_INDEX_NAME
    })

    it('should clear index and index posts on Algolia (Hexo config)', async() => {
      const algoliaClient = algoliasearchMocks.algoliaClient
      const algoliaIndex = algoliasearchMocks.algoliaIndex
      const hexo = new Hexo(TEST_BLOG_PATH)

      await hexo.init()
      await algoliaCommand(hexo, {}, () => {})

      const algoliaConfig = hexo.config.algolia
      const indexedPosts = algoliaIndex.saveObjects.mock.calls[0][0]
      // freeze ID of posts because we later use snapshots and these IDs change
      indexedPosts[0].objectID = 1

      expect(algoliasearch).toHaveBeenCalledWith(algoliaConfig.appId, algoliaConfig.adminApiKey)
      expect(algoliaClient.initIndex).toHaveBeenCalledWith(algoliaConfig.indexName)
      expect(algoliaIndex.clearIndex).toHaveBeenCalledTimes(1)
      expect(algoliaIndex.saveObjects).toHaveBeenCalledTimes(1)
      expect(indexedPosts).toMatchSnapshot()
    })

    it('should not clear index and index posts on Algolia', async() => {
      const algoliaClient = algoliasearchMocks.algoliaClient
      const algoliaIndex = algoliasearchMocks.algoliaIndex
      const hexo = new Hexo(TEST_BLOG_PATH)
      const options = {n: true} // means: do not clear index

      await hexo.init()
      await algoliaCommand(hexo, options, () => {})

      const algoliaConfig = hexo.config.algolia
      const indexedPosts = algoliaIndex.saveObjects.mock.calls[0][0]
      // freeze ID of posts because we later use snapshots and these IDs change
      indexedPosts[0].objectID = 1

      expect(algoliasearch).toHaveBeenCalledWith(algoliaConfig.appId, algoliaConfig.adminApiKey)
      expect(algoliaClient.initIndex).toHaveBeenCalledWith(algoliaConfig.indexName)
      expect(algoliaIndex.clearIndex).not.toHaveBeenCalled()
      expect(algoliaIndex.saveObjects).toHaveBeenCalledTimes(1)
      expect(indexedPosts).toMatchSnapshot()
    })

    it('should exit and log error if the Algolia index cannot be cleared', async() => {
      const algoliaClient = algoliasearchMocks.algoliaClient
      const algoliaIndex = algoliasearchMocks.algoliaIndex
      const callbackCommand = jest.fn()
      const error = Error('Mocked error')
      const hexo = new Hexo(TEST_BLOG_PATH)
      const prevClearIndexMock = algoliaIndex.clearIndex
      algoliaIndex.clearIndex = jest.fn(() => {
        throw error
      })

      await hexo.init()
      await algoliaCommand(hexo, {}, callbackCommand)

      const algoliaConfig = hexo.config.algolia
      expect(algoliasearch).toHaveBeenCalledWith(algoliaConfig.appId, algoliaConfig.adminApiKey)
      expect(algoliaClient.initIndex).toHaveBeenCalledWith(algoliaConfig.indexName)
      expect(algoliaIndex.clearIndex).toHaveBeenCalledTimes(1)
      expect(algoliaIndex.saveObjects).not.toHaveBeenCalled()
      expect(callbackCommand).toHaveBeenCalledWith(error)

      algoliaIndex.clearIndex = prevClearIndexMock
    })

    it('should exit and log error if the posts cannot be indexed', async() => {
      const algoliaClient = algoliasearchMocks.algoliaClient
      const algoliaIndex = algoliasearchMocks.algoliaIndex
      const callbackCommand = jest.fn()
      const error = Error('Mocked error')
      const hexo = new Hexo(TEST_BLOG_PATH)
      const prevSaveObjectsMock = algoliaIndex.saveObjects
      algoliaIndex.saveObjects = jest.fn(() => {
        throw error
      })

      await hexo.init()
      await algoliaCommand(hexo, {}, callbackCommand)

      const algoliaConfig = hexo.config.algolia
      expect(algoliasearch).toHaveBeenCalledWith(algoliaConfig.appId, algoliaConfig.adminApiKey)
      expect(algoliaClient.initIndex).toHaveBeenCalledWith(algoliaConfig.indexName)
      expect(algoliaIndex.clearIndex).toHaveBeenCalledTimes(1)
      expect(algoliaIndex.saveObjects).toHaveBeenCalledTimes(1)
      expect(callbackCommand).toHaveBeenCalledWith(error)

      algoliaIndex.saveObjects = prevSaveObjectsMock
    })

    it('should exit because there is no posts to index', async() => {
      const callbackCommand = jest.fn()
      const hexo = new Hexo(TEST_BLOG_PATH)
      await hexo.init()
      // mock the call to generate the blog so there is no post generated
      hexo.call = () => {}
      await algoliaCommand(hexo, {}, callbackCommand)

      expect(algoliasearch).not.toHaveBeenCalled()
      expect(callbackCommand).toHaveBeenCalledWith()
    })
  })
})
