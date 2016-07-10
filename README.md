# hexo-algoliasearch

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
    - title
    - tags
    - slug
    - excerpt
    - excerpt:strip
    - photos
    - gallery
```

| Key            | Type   | Default | Description |
| -------------- | ------ | ------- | ----------- |
| appId          | String |         | Your application ID. |
| apiKey         | String |         | Your API key (read only). It is use to search in an index. |
| adminApiKey    | String |         | Your adminAPI key. It is use to create, delete, update your indexes |
| chunkSize      | Number | 5000    | Records/posts are split in chunks to upload them. Algolia recommend to use `5000` for best performance. Be careful, if you are indexing post content, It can fail because of size limit. To overcome this, decrease size of chunks until it pass. |
| indexName      | String |         | The name of the index in which posts are stored. |
| fields         | List   |         | The list of the field names to index. Separate field name and action name with `:`. Read [Actions](#actions) for more information |

#### Actions

Actions give you the ability to process value of a field before indexation. 

##### List of actions :
- **strip** : strip HTML. It can be useful for excerpt and content value  

##### Example

- fields:
   excerpt:strip

It will add an `excerptStrip` property to the post object containing excerpt without HTML tags.


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
