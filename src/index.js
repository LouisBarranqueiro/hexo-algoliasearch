import algolia from './algolia'

hexo.extend.console.register('algolia', 'Index your posts on Algolia', {
  options: [{
    name: '-n, --no-clear', desc: 'Does not clear the existing index'
  }]
}, algolia)
