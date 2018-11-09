const esprima = require('esprima')
const htmlparser = require('htmlparser2') // high performance according to https://github.com/fb55/htmlparser2
const md5 = require('blueimp-md5')
const fs = require('fs')

function getFileName(resourcePath) {
  const paths = resourcePath.split('/')
  const file = paths[paths.length - 1]
  return file.slice(0, file.lastIndexOf('.'))
}

function generateScriptReplacers(script, matchRegString, separator) {
  const tokens = esprima.tokenize(script)
  const replacers = []
  const texts = {}
  tokens.filter(node => (node.type === 'Template' || node.type === 'String')).forEach(node => {
    // match result !== target text
    const matched = node.value.match(new RegExp(matchRegString))
    if (matched) {
      if (node.type === 'String') {
        // node.value has already quotes here
        const origin = trimText(matched[separator ? 1 : 0])
        const hash = getTextKey(origin)
        const newText = 'this.$t["' + hash + '"]'
        if (!texts[newText]) {
          replacers.push({oldText: node.value, newText, origin, hash})
          texts[newText] = true
        }
      } else {
        // Template
        if (separator) {
          const groups = node.value.match(new RegExp(matchRegString, 'g'))
          groups.forEach(t => {
            const origin = trimText(t.match(new RegExp(matchRegString))[1])
            const hash = getTextKey(origin)
            const newText = '${this.$t["' + hash + '"]}'
            if (!texts[newText]) {
              replacers.push({oldText: t, newText, origin, hash})
              texts[newText] = true
            }
          })
        } else {
          const groups = node.value.match(/^([`}])([\s\S]*)((\${)|`)/)
          if (groups && groups.length > 3) {
            const origin = trimText(groups[2])
            const hash = getTextKey(origin)
            const newText = groups[1] + '${this.$t["' + hash + '"]}' + groups[3]
            if (!texts[newText]) {
              replacers.push({oldText: node.value, newText, origin, hash})
              texts[newText] = true
            }
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
  const replacers = []
  const texts = {}
  const parser = new htmlparser.Parser({
    onattribute(name, value) {
      const matched = value.match(new RegExp(matchRegString))
      if (matched) {
        if (name.indexOf(':') >= 0) {
          console.error('Error with chinese in variable attribute: ' + name + ' ' + value)
          throw new Error('Syntax incompatible')
        }
        const reg = name + '\\s*=\\s*(\'|\")' + value + '(\'|\")'
        const origin = trimText(separator ? matched[1] : value)
        const hash = getTextKey(origin)
        const newText = ':' + name + '=\'$t["' + hash + '"]\''
        if (!texts[newText]) {
          replacers.push({oldText: new RegExp(reg), newText, origin, hash})
          texts[newText] = true
        }
      }
    },
    ontext(text) {
      const matched = text.match(new RegExp(matchRegString))
      if (matched) {
        const origin = trimText(separator ? matched[1] : text)
        const hash = getTextKey(origin)
        const newText = '>{{$t["' + hash + '"]}}<'
        const oldTextReg = '>\s*' + text + '\s*<'
        if (!texts[newText]) {
          replacers.push({oldText: new RegExp(oldTextReg), newText, origin, hash})
          texts[newText] = true
        }
      }
    }
  })
  parser.write(template)
  parser.end()

  return replacers
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
    if (Date.now() - oldData.lastUpdateTime < cacheTime) {
      return
    }
    const newData = Object.assign({}, data)
    // assign old data, only two levels
    Object.keys(oldData).forEach(lang => {
      if (!newData[lang]) {
        newData[lang] = oldData[lang]
      } else {
        Object.assign(newData[lang], oldData[lang])
      }
    })
    Object.assign(newData, {lastUpdateTime: Date.now()})
    console.log('writeFile : ' + filePath)
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 4), {flag: 'w'})
  } catch (e) {
    console.log('create and write')
    Object.assign(data, {lastUpdateTime: Date.now()})
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), {flag: 'wx'})
  }
}

function importMessages(filename) {
  return `import messages from "./${filename}.messages.json";`
}

function $t(defaultLang) {
  // $t here is an object not a function
  return `
    $t(){
      return messages[this.$lang]||messages["${defaultLang}"]||{}
    },
  `
}

function matchTemplate(source) {
  const matched = source.match(/<template>([\s\S]*)<\/template>/)
  return matched ? matched[0] : null
}

function matchScript(source) {
  const matched = source.match(/<script[^>]*>([\s\S]*)<\/script>/)
  return matched ? matched[1] : null
}

function removeComments(source) {
  let sourceWithoutComment = source.replace(/((^|[^"':])\/\/.*)|(\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\/)/gm, '') // remove comments in JS, be careful of links
  sourceWithoutComment = sourceWithoutComment.replace(/<!--.*?-->/igm, '') // remove comments in JS
  return sourceWithoutComment
}

module.exports = {
  getFileName,
  generateScriptReplacers,
  generateTemplateReplacers,
  getTextKey,
  writeJsonToFile,
  importMessages,
  $t,
  matchTemplate,
  matchScript,
  removeComments,
}
