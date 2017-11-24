# hexo-algoliasearch
[![npm version](https://img.shields.io/npm/v/hexo-algoliasearch.svg?style=flat-square)](https://www.npmjs.com/package/hexo-algoliasearch) [![npm dependencies](https://img.shields.io/david/LouisBarranqueiro/hexo-algoliasearch.svg?style=flat-square)](https://david-dm.org/LouisBarranqueiro/hexo-algoliasearch#info=dependencies&view=table) [![npm dev dependencies](https://img.shields.io/david/dev/LouisBarranqueiro/hexo-algoliasearch.svg?style=flat-square)](https://david-dm.org/LouisBarranqueiro/hexo-algoliasearch#info=devDependencies&view=table) [![npm download/month](https://img.shields.io/npm/dm/hexo-algoliasearch.svg?style=flat-square)](https://www.npmjs.com/package/hexo-algoliasearch) [![npm download total](https://img.shields.io/npm/dt/hexo-algoliasearch.svg?style=flat-square)](https://www.npmjs.com/package/hexo-algoliasearch) [![gitter chat](https://img.shields.io/gitter/room/LouisBarranqueiro/hexo-algoliasearch.svg?style=flat-square)](https://gitter.im/LouisBarranqueiro/hexo-algoliasearch)

A plugin to index posts of your Hexo blog on Algolia

## Installation

```
npm install hexo-algoliasearch --save
```

If Hexo detect automatically all plugins, that's all.  

If that is not the case, register the plugin in your `_config.yml` file :
```
plugins:
  - hexo-algoliasearch
```

## Configuration

You can configure this plugin in your `_config.yml` file :

``` yml
algolia:
  appId: "Z7A3XW4R2I"
  apiKey: "12db1ad54372045549ef465881c17e743"
  adminApiKey: "40321c7c207e7f73b63a19aa24c4761b"
  chunkSize: 5000
  indexName: "my-hexo-blog"
  fields:
    - excerpt
    - excerpt:strip
    - gallery
    - permalink
    - photos
    - slug
    - tags
    - title
```

| Key            | Type   | Default | Description |
| -------------- | ------ | ------- | ----------- |
| appId          | String |         | Your application ID. Optional, if the environment variable `ALGOLIA_APP_ID` is set|
| apiKey         | String |         | Your API key (read only). It is use to search in an index. Optional, if the environment variable `ALGOLIA_API_KEY` is set|
| adminApiKey    | String |         | Your adminAPI key. It is use to create, delete, update your indexes. Optional, if the environment variable `ALGOLIA_ADMIN_API_KEY` is set |
| chunkSize      | Number | 5000    | Records/posts are split in chunks to upload them. Algolia recommend to use `5000` for best performance. Be careful, if you are indexing post content, It can fail because of size limit. To overcome this, decrease size of chunks until it pass. |
| indexName      | String |         | The name of the index in which posts are stored. Optional, if the environment variable `ALGOLIA_INDEX_NAME` is set|
| fields         | List   |         | The list of the field names to index. Separate field name and action name with `:`. Read [Actions](#actions) for more information |

#### Actions

Actions give you the ability to process value of a fields before indexation.

##### List of actions :

- **strip** : strip HTML. It can be useful for excerpt and content value  

##### Example

- fields:
   excerpt:strip

It will add an `excerptStrip` property to the post object containing excerpt without HTML tags before indexation.

## Usage

```
hexo algolia
```

#### Options

| Options        | Description |
| -------------- | ----------- |
| -n, --no-clear | Does not clear the existing index |

# Licence

hexo-algoliasearch is under [GNU General Public License v3.0](https://github.com/LouisBarranqueiro/hexo-algoliasearch/blob/master/LICENSE)
