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
  // use regString or delimiter to find targets
  let matchRegString = options.regString
  if (options.delimiter) {
    matchRegString = options.delimiter + '(.+?)' + options.delimiter
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
  const replaceParts={}
  const matchScript = utils.matchScript(sourceWithoutComment)
  if (matchScript && matchScript[2]) {
    replaceParts.parts=matchScript.slice(1) // will be used to replace and reform the source code
    replaceParts.scriptIndex= 1
    replaceParts.script = replaceParts.parts[1] // will be used to find target texts and generate replacers
    // which part contains template
    const matchStart = utils.matchTemplate(replaceParts.parts[0])
    const matchEnd = utils.matchTemplate(replaceParts.parts[2])
    if(matchStart){
      replaceParts.templateIndex=0
      replaceParts.template = matchStart[0]
    }
    if(matchEnd){
      replaceParts.templateIndex=2
      replaceParts.template = matchEnd[0]
    }
  }else{
    const matchTemplate = utils.matchTemplate(sourceWithoutComment)
    if(matchTemplate){
      replaceParts.parts=[sourceWithoutComment]
      replaceParts.templateIndex=0
      replaceParts.template =matchTemplate[0]
    }
  }

  // get replacers from script and template
  let replacers = []
  if (replaceParts.script) {// the second group is script body
    replacers = replacers.concat(utils.generateScriptReplacers(replaceParts.script, matchRegString, options.delimiter))
  }
  if (replaceParts.template) {
    replacers = replacers.concat(utils.generateTemplateReplacers(replaceParts.template, matchRegString, options.delimiter))
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
        // replace source
        if (replacer.oldText) {
          const replaceIndex = replacer.isScript?replaceParts.scriptIndex:replaceParts.templateIndex
          replaceParts.parts[replaceIndex]=replaceParts.parts[replaceIndex].replace(replacer.oldText, replacer.newText)
        }
        if (replacer.hash) {
          // generate translations
          options.languages.forEach(lang => {
            data[lang.key][replacer.hash] = lang.translator ? lang.translator(replacer.origin) : defaultTranslator(replacer.origin)
          })
        }
      })
      // write file with cacheTime (to handle webpack rebuild bug)
      utils.writeJsonToFile(data, filePath[1] + '.messages.json')
    } else {
      replacers.forEach(replacer => {
        // replace source
        if (replacer.oldText) {
          const replaceIndex = replacer.isScript?replaceParts.scriptIndex:replaceParts.templateIndex
          replaceParts.parts[replaceIndex]=replaceParts.parts[replaceIndex].replace(replacer.oldText, replacer.newText)
        }
      })
    }
    // import messages
    // and insert $t (use default language if any language isn't found)
    sourceWithoutComment = utils.insert$t(filename, options.languages[0].key, replaceParts.parts.join(''))
  }
  return sourceWithoutComment
}
