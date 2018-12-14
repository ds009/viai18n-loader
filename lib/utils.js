const esprima = require('esprima')
const htmlparser = require('htmlparser2') // high performance according to https://github.com/fb55/htmlparser2
const md5 = require('blueimp-md5')
const fs = require('fs')

function getFileName(resourcePath) {
  const paths = resourcePath.split('/')
  const file = paths[paths.length - 1]
  return file.slice(0, file.lastIndexOf('.'))
}

function removeQuotes(text) {
  return text.match(/^(\s*)['"](.*)['"](\s*)$/)[2]
}

function generateScriptReplacers(script, matchRegString, separator) {
  const tokens = esprima.tokenize(script)
  const replacers = []
  tokens.filter(node => (node.type === 'Template' || node.type === 'String')).forEach(node => {
    // match result !== target text
    const matched = node.value.match(new RegExp(matchRegString))
    if (matched) {
      if (node.type === 'String') {
        // node.value has already quotes here
        const origin = trimText(separator ? matched[1] : removeQuotes(node.value))
        const hash = getTextKey(origin)
        const newText = 'this.$t["' + hash + '"]'
        replacers.push({oldText: node.value, newText, origin, hash})
      } else {
        // Template
        if (separator) {
          const groups = node.value.match(new RegExp(matchRegString, 'g'))
          groups.forEach(t => {
            const origin = trimText(t.match(new RegExp(matchRegString))[1])
            const hash = getTextKey(origin)
            const newText = '${this.$t["' + hash + '"]}'
            replacers.push({oldText: t, newText, origin, hash})
          })
        } else {
          const groups = node.value.match(/^([`}])([\s\S]*)((\${)|`)/)
          if (groups && groups.length > 3) {
            const origin = trimText(groups[2])
            const hash = getTextKey(origin)
            const newText = groups[1] + '${this.$t["' + hash + '"]}' + groups[3]
            replacers.push({oldText: node.value, newText, origin, hash})

          } else {
            console.error('Error when retrieving text from script template: ' + node.value)
            throw new Error('Syntax incompatible')
          }
        }
      }
    }
  })
  return replacers
}

function generateTemplateReplacers(template, matchRegString, separator) {
  let replacers = []
  const parser = new htmlparser.Parser({
    onattribute(name, text) {
      replacers = replacers.concat(parseExpressionInTemplate(text, matchRegString, separator,name))
    },
    ontext(text) {
      replacers = replacers.concat(parseExpressionInTemplate(text, matchRegString, separator,null))
    }
  })
  parser.write(template)
  parser.end()

  return replacers
}

function parseExpressionInTemplate(text, matchRegString, separator, attributeName) {
  const replacers = []
  const matched = text.match(new RegExp(matchRegString))
  if (matched) {
    const matchExp = text.match(/^(\S*)\s*({{)([\s\S]*)(}})\s*(\S*)$/)
    if (matchExp) {
      if ((matchExp[1] && matchExp[1].length) || (matchExp[5] && matchExp[5].length)) {
        throw new Error(`
            The Viai18n-loader does not support the combination of text and vue expression in template:
            Error text *** ${text} ***
            You can change text combination '<p>extra text {{expression}}</p>' to '<p>{{"extra text" + expression}}</p>'
            `)
      } else {
        // tokenize text in {{}} expression
        const tokens = esprima.tokenize(matchExp[3])
        tokens.filter(node => node.type === 'String').forEach(t => {
          const matchStr = t.value.match(new RegExp(matchRegString))
          if (matchStr) {
            const origin = trimText(separator ? matchStr[1] : removeQuotes(t.value))
            const hash = getTextKey(origin)
            const newText = '$t["' + hash + '"]'
            replacers.push({oldText: t.value, newText, origin, hash})
          }
        })
      }
    } else {
      const origin = trimText(separator ? matched[1] : text)
      const hash = getTextKey(origin)
      if(attributeName){
        const oldTextReg = name + '\\s*=\\s*(\'|\")' + value + '(\'|\")'
        const newText = nameAsVariable(name) + '=\'$t["' + hash + '"]\''
        replacers.push({oldText: new RegExp(oldTextReg), newText, origin, hash})
      }else{
        const oldTextReg = '>\s*' + text + '\s*<'
        const newText = '>{{$t["' + hash + '"]}}<'
        replacers.push({oldText: new RegExp(oldTextReg), newText, origin, hash})

      }
    }
  }
  return replacers
}

function nameAsVariable(name){
  return name.indexOf(':')===0?name:(':'+name)
}
function trimText(text) {
  return text.trim().replace(/(^\s+)|(^\s+)/g, ' ')
}

function getTextKey(text) { // 8 chars text with 4 chars hash should be enough
  let textKey = text.replace(/[\s\r\n]/g, '').slice(0, 8)

  //  八个首字符+hash
  return text.length > 8 ? `${textKey}_${md5(text).slice(0, 4)}` : textKey
}

function writeJsonToFile(data, filePath, cacheTime = 2000) {
  try {
    const file = fs.readFileSync(filePath)
    const oldData = JSON.parse(file)
    const newData = Object.assign({}, data)
    // assign old data, only two levels
    Object.keys(oldData).forEach(lang => {
      if (!newData[lang]) {
        newData[lang] = oldData[lang]
      } else {
        Object.assign(newData[lang], oldData[lang])
      }
    })
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 4), {flag: 'w'})
  } catch (e) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), {flag: 'wx'})
  }
}

function importMessages(filename) {
  return `import messages from "./${filename}.messages.json";`
}

function insert$t(filename, defaultLang, source) {
  // messages put in computed so that languages shown can be switched without refresh the page
  const messageProp = `
    $t(){
      return messages[this.$lang]||messages["${defaultLang}"]||{}
    },
  `
  const simpleExport = 'export default { computed:{' + messageProp + '} }'
  // the original default may have different forms, we proxy it here by adding computed message property
  const modifiedExport = `
    if ($defaultObject.computed){
      Object.assign($defaultObject.computed,{${messageProp}})
    }else{
      $defaultObject.computed = {${messageProp}}
    }
    export default $defaultObject
  `
  const importString = importMessages(filename)
  const script = matchScript(source)
  if (script) {
    const defaultObject = matchDefaultObject(script[2]) // script body
    if (defaultObject) {
      return source.replace(defaultObject[0], importString + 'const $defaultObject = ' + defaultObject[2] + '\n' + modifiedExport)
    } else {
      return source.replace(script[0], script[0] + importString + simpleExport) // script[0] === script[1]+script[2]
    }
  } else {
    return source + '<script>' + importString + simpleExport + '</script>'
  }
}

function matchTemplate(source) {
  const matched = source.match(/<template>([\s\S]*)<\/template>/)
  return matched
}

function matchDefaultObject(source) {
  const matched = source.match(/(export\s+default\s+)([\s\S]+)/)
  return matched
}

function matchScript(source) {
  const matched = source.match(/(<script[^>]*>)([\s\S]*)<\/script>/)
  return matched
}

function removeComments(source) {
  let sourceWithoutComment = source.replace(/<!--.*?-->/igm, '')
  // remove comments in template, esprima.tokenize will ignore comments in js
  return sourceWithoutComment
}

module.exports = {
  getFileName,
  generateScriptReplacers,
  generateTemplateReplacers,
  writeJsonToFile,
  importMessages,
  insert$t,
  matchTemplate,
  matchScript,
  removeComments,
}
