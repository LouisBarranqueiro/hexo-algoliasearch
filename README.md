# hexo-algoliasearch
[![travis build status](https://img.shields.io/travis/LouisBarranqueiro/hexo-algoliasearch/master.svg?style=flat-square)](https://travis-ci.com/LouisBarranqueiro/hexo-algoliasearch)
[![coveralls status](https://img.shields.io/coveralls/LouisBarranqueiro/hexo-algoliasearch.svg?style=flat-square)](https://coveralls.io/github/LouisBarranqueiro/hexo-algoliasearch)
[![gitter chat](https://img.shields.io/gitter/room/LouisBarranqueiro/hexo-algoliasearch.svg?style=flat-square)](https://gitter.im/LouisBarranqueiro/hexo-algoliasearch)

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
    - content:strip:truncate,0,500
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
| fields         | List   |         | The list of the field names to index. Separate field name and filters with `:`. Read [Filters](#filters) for more information |

#### Filters

Filters give you the ability to process value of fields before indexation.
Filters are separated each others by colons (`:`) and may have optional arguments separated by commas (`,`).
Multiple filters can be chained. The output of one filter is applied to the next.

##### List of filters:


| Filter     | Signature                              | Syntax           | Description |
| ---------- | -------------------------------------- | ---------------- | ----------- |
| strip      | `strip()`                              | `strip`          | Strip HTML. It can be useful for excerpt and content value to not index HTML tags and attributes. |
| truncate   | `truncate(start: number, end: number)` | `truncate,0,300` | Truncate string from `start` index to `end` index. Algolia has some limitations about record size so it might be useful to cut post contents. |


##### Example

``` yml
  fields:
    - content:strip:truncate,0,200
```

It will strip HTML from `content` value then truncate the result starting from index `0` to index `200` before indexation.
This property will be added to algolia records as `contentStripTruncate`

## Usage

```
hexo algolia
```

#### Options

| Options        | Description |
| -------------- | ----------- |
| -n, --no-clear | Does not clear the existing index |

# Licence

hexo-algoliasearch is under [MIT](https://github.com/LouisBarranqueiro/hexo-algoliasearch/blob/master/LICENSE)
