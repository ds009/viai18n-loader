const loaderUtils = require('loader-utils')
const utils = require('./utils')

module.exports = function (source, map) {
  // init options
  const urlQuery = this.resourceQuery
    ? loaderUtils.parseQuery(this.resourceQuery)
    : null
  const options = Object.assign({}, loaderUtils.getOptions(this), urlQuery)
  if (!options.languages || !options.languages.length) {
    // languages must be set
    throw new Error('no languages are given in config for viai18n-loader')
  }

  // ignore excluded files
  if (!this.resourcePath || (options.exclude && this.resourcePath.match(options.exclude))) return source
  // use regString or separator to find targets
  let matchRegString = options.regString
  if (options.separator) {
    matchRegString = options.separator + '(.+?)' + options.separator
  }
  if (!source.match(matchRegString)) {
    // nothing to translate
    return source;
  }
  const filename = utils.getFileName(this.resourcePath)
  // remove comments to avoid translating texts in comments
  let sourceWithoutComment = utils.removeComments(source)
  const filePath = this.resourcePath.match(/(.*)((\.vue$)|(\.js$))/)
  // find template and script part
  const originalScript = utils.matchScript(sourceWithoutComment)
  const originalTemplate = utils.matchTemplate(sourceWithoutComment)

  // get replacers from script and template
  let replacers = []
  if (originalScript && originalScript[2]) {// the second group is script body
    replacers = replacers.concat(utils.generateScriptReplacers(originalScript[2], matchRegString, options.separator))
  }
  if (originalTemplate) {
    replacers = replacers.concat(utils.generateTemplateReplacers(originalTemplate[0], matchRegString, options.separator))
  }
  // replace old texts by new texts using regex
  if (replacers.length) {
    if (options.updateMessagesFile) {
      // only write json file when updateMessagesFile === true
      const data = {};
      const keepOriginal = text => text
      const defaultTranslator = options.languages[0].translator || keepOriginal
      options.languages.forEach(lang => {
        data[lang.key] = {}
      })
      replacers.forEach(replacer => {
        console.log(replacer)
        // replace source
        if(replacer.oldText){
          sourceWithoutComment = sourceWithoutComment.replace(replacer.oldText, replacer.newText)
        }
        if(replacer.hash){
          // generate translations
          options.languages.forEach(lang => {
            data[lang.key][replacer.hash] = lang.translator ? lang.translator(replacer.origin) : defaultTranslator(replacer.origin)
          })
        }
      })
      // write file with cacheTime (to handle webpack rebuild bug)
      utils.writeJsonToFile(data, filePath[1] + '.messages.json', options.cacheTime || 2000)
    } else {
      replacers.forEach(replacer => {
        // replace source
        sourceWithoutComment = sourceWithoutComment.replace(replacer.oldText, replacer.newText)
      })
    }
    // import messages
    // and insert $t (use default language if any language isn't found)
    sourceWithoutComment = utils.insert$t(filename, options.languages[0].key, sourceWithoutComment)
  }
  console.log(sourceWithoutComment)
  return sourceWithoutComment
}
