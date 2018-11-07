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
    return source
  }

  // ignore excluded files
  if (!this.resourcePath || (options.exclude && this.resourcePath.match(options.exclude))) return source
  const $langRegex = new RegExp(/\$lang\s?\(\s*\)/) // to match $lang property
  const matched$lang = source.match($langRegex)
  if (!matched$lang) {
    // no $lang property declared
    return source
  }
  const filename = utils.getFileName(this.resourcePath)
  let sourceWithoutComment = utils.removeComments(source)
  const filePath = this.resourcePath.match(/(.*)((\.vue$)|(\.js$))/)
  const originalScript = utils.matchScript(sourceWithoutComment)
  const originalTemplate = utils.matchTemplate(sourceWithoutComment)
  let matchRegString = options.regString
  if (options.separator) {
    matchRegString = options.separator + '(.+?)' + options.separator
  }
  // get replacers from script and template
  let replacers = []
  if (originalScript) {
    replacers = replacers.concat(utils.generateScriptReplacers(originalScript, matchRegString, options.separator))
  }
  if (originalTemplate) {
    replacers = replacers.concat(utils.generateTemplateReplacers(originalTemplate, matchRegString, options.separator))
  }
  // replace old texts by new texts using regex
  if (replacers.length) {
    if (options.updateMessagesFile) {
      // only write json file when updateMessagesFile === true
      const data = {}
      options.languages.forEach(lang => {
        data[lang.key] = {}
      })
      replacers.forEach(replacer => {
        // replace source
        sourceWithoutComment = sourceWithoutComment.replace(replacer.oldText, replacer.newText)
        // generate translations
        options.languages.forEach(lang => {
          data[lang.key][replacer.hash] = lang.translator(replacer.origin)
        })
      })
      // write file with cacheTime (to handle webpack rebuild bug)
      utils.writeJsonToFile(data, filePath[1] + '.messages.json', options.cacheTime || 2000)
    } else {
      replacers.forEach(replacer => {
        // replace source
        sourceWithoutComment = sourceWithoutComment.replace(replacer.oldText, replacer.newText)
      })
    }
    // add import *.messages.json and $t function
    const importMessages = utils.importMessages(filename)
    // import messages
    const scriptTag = sourceWithoutComment.match(/(<script[^>]*>)/)[1]
    sourceWithoutComment = sourceWithoutComment.replace(/(<script[^>]*>)/, scriptTag + importMessages)
    // insert $t beside $lang
    sourceWithoutComment = sourceWithoutComment.replace($langRegex, utils.$t(options.languages[0].key) + matched$lang[0])
  }
  return sourceWithoutComment
}
