const esprima = require('esprima')
const htmlparser = require('htmlparser2') // high performance according to https://github.com/fb55/htmlparser2
const md5 = require('blueimp-md5')
const fs = require('fs')
const deprecatedMark = '@DEPRECATED@'

function getFileName(resourcePath) {
  const paths = resourcePath.split('/')
  const file = paths[paths.length - 1]
  return file.slice(0, file.lastIndexOf('.'))
}

function removeQuotes(text) {
  return text.match(/^(\s*)['"](.*)['"](\s*)$/)[2]
}

function generateScriptReplacers(script, matchRegString, delimiter) {
  const tokens = esprima.tokenize(script)
  const replacers = []
  const targets = {}
  tokens.filter(node => (node.type === 'Template' || node.type === 'String')).forEach(node => {
    // match result !== target text
    const matched = node.value.match(new RegExp(matchRegString))
    if (matched) {
      if (node.type === 'String') {
        // node.value has already quotes here
        if (!targets[node.value]) {
          targets[node.value] = true
          const origin = trimText(delimiter ? matched[1] : removeQuotes(node.value))
          const hash = getTextKey(origin)
          const newText = 'this.$t("' + hash + '")'
          replacers.push({oldText: new RegExp(regSafeText(node.value), 'g'), newText, origin, hash, isScript:true})
        }
      } else {
        // Template
        if (delimiter) {
          const groups = node.value.match(new RegExp(matchRegString, 'g'))
          groups.forEach(t => {
            const origin = trimText(t.match(new RegExp(matchRegString))[1])
            const hash = getTextKey(origin)
            const newText = '${this.$t("' + hash + '")}'
            replacers.push({oldText: t, newText, origin, hash, isScript:true})
          })
        } else {
          const groups = node.value.match(/^([`}])([\s\S]*)((\${)|`)/)
          if (groups && groups.length > 3) {
            const origin = trimText(groups[2])
            const hash = getTextKey(origin)
            const newText = groups[1] + '${this.$t("' + hash + '")}' + groups[3]
            replacers.push({oldText: node.value, newText, origin, hash, isScript:true})

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

function generateTemplateReplacers(template, matchRegString, delimiter) {
  let replacers = []
  const parser = new htmlparser.Parser({
    onattribute(name, text) {
      const targetReg = new RegExp(matchRegString)
      const matched = text.match(targetReg)
      if (matched) {
        const tokenInExpression = text.split(/("[\s\S]*?")|('[\s\S]*?')/)
        if (tokenInExpression.length > 1) {
          let newText = ''
          tokenInExpression.forEach(token => {
            if (!token) {
              return
            }
            const matchToken = token.match(targetReg)
            if (matchToken) {
              const origin = trimText(delimiter ? matchToken[1] : removeQuotes(token))
              const hash = getTextKey(origin)
              newText += '$t("' + hash + '")'
              replacers.push({origin, hash})
            } else {
              newText += token
            }
          })
          replacers.push({oldText: text, newText})
        } else {
          const origin = trimText(delimiter ? matched[1] : text)
          const hash = getTextKey(origin)
          const oldTextReg = name + '\\s*=\\s*(\'|")' + regSafeText(text) + '(\'|")'
          const newText = nameAsVariable(name) + '=\'$t("' + hash + '")\''
          replacers.push({oldText: new RegExp(oldTextReg), newText, origin, hash})
        }
      }
    },
    ontext(text) {
      replacers = replacers.concat(parseExpressionInTemplate(text, matchRegString, delimiter))
    }
  },{lowerCaseAttributeNames:false})
  parser.write(template)
  parser.end()
  return replacers
}

function parseExpressionInTemplate(text, matchRegString, delimiter) {
  const replacers = []
  const targetReg = new RegExp(matchRegString)
  const matched = text.match(targetReg)
  if (matched) {
    const matchExp = text.match(/{{([\s\S]*)}}/)
    if (matchExp) {
      // split text by {{}} expression
      const tokens = text.split(/({{[\s\S]*?}})/)
      let newText = ''
      tokens.forEach(t => {
        if (!t) {
          return
        }
        const matchStr = t.match(targetReg)
        if (matchStr) {
          if (t[0] !== '{') {
            // simple text in template
            const origin = trimText(delimiter ? matchStr[1] : t) // the whole text but not only matched, because it may be a mix of different languages
            const hash = getTextKey(origin)
            newText += '{{$t("' + hash + '")}}'
            replacers.push({origin, hash})// replace entire text once
          } else {
            const tokenInExpression = t.split(/("[\s\S]*?")|('[\s\S]*?')/)
            tokenInExpression.forEach(token => {
              if (!token) {
                return
              }
              const matchToken = token.match(targetReg)
              if (matchToken) {
                const origin = trimText(delimiter ? matchToken[1] : removeQuotes(token))
                const hash = getTextKey(origin)
                newText += '$t("' + hash + '")'
                replacers.push({origin, hash})
              } else {
                newText += token
              }
            })
          }
        }
        else {
          newText += t
        }
      });
      replacers.push({oldText: text, newText})
    } else {
      const origin = trimText(delimiter ? matched[1] : text)
      const hash = getTextKey(origin)
      const oldTextReg = '>\\s*' + regSafeText(text) + '\\s*<'
      const newText = '>{{$t("' + hash + '")}}<'
      replacers.push({oldText: new RegExp(oldTextReg), newText, origin, hash})
    }
  }
  return replacers
}

function regSafeText(text) {
  return text.replace(/\*/g, '\\*').replace(/\./g, '\\.')
    .replace(/\+/g, '\\+').replace(/\^/g, '\\^')
    .replace(/\[/g, '\\[').replace(/\]/g, '\\]')
    .replace(/\?/g, '\\?').replace(/\$/g, '\\$')
    .replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function nameAsVariable(name) {
  return name.indexOf(':') === 0 ? name : (':' + name)
}

function trimText(text) {
  return text.trim().replace(/(^\s+)|(^\s+)/g, ' ')
}

function getTextKey(text) { // 8 chars text with 4 chars hash should be enough
  let textKey = text.replace(/[\s\r\n]/g, '').slice(0, 8)

  //  八个首字符+hash
  return text.length > 8 ? `${textKey}_${md5(text).slice(0, 4)}` : textKey
}

function writeJsonToFile(data, filePath) {
  try {
    const file = fs.readFileSync(filePath)
    const oldData = JSON.parse(file)
    const newData = Object.assign({}, data)
    // assign old data, only two levels
    Object.keys(oldData).forEach(lang => {
      if (!newData[lang]) {
        newData[lang] = oldData[lang]
      } else {
        Object.keys(newData[lang]).forEach(k => {
          let dKey = k
          if (dKey.indexOf(deprecatedMark) >= 0) {
            dKey = dKey.replace(deprecatedMark, '')
          }
          if (oldData[lang][dKey] !== undefined) {
            newData[lang][k] = oldData[lang][dKey]
          }
        })
        Object.keys(oldData[lang]).forEach(k => {
          if (newData[lang][k] === undefined) {
            if (k.indexOf(deprecatedMark) < 0) {
              const dKey = k + deprecatedMark
              // mark an old item as deprecated
              newData[lang][dKey] = oldData[lang][k]
            } else {
              // a marked deprecated
              const dKey = k.replace(deprecatedMark, '')
              if (newData[lang][dKey] === undefined) {
                // not reused item, keep deprecated mark
                newData[lang][k] = oldData[lang][k]
              } else {
                // reused, ignore the old deprecated mark item
              }
            }
          }
        })
      }
    })
    fs.writeFileSync(filePath, JSON.stringify(sortObjectByKey(newData), null, 4), {flag: 'w'})
  } catch (e) {
    fs.writeFileSync(filePath, JSON.stringify(sortObjectByKey(data), null, 4), {flag: 'wx'})
  }
}

function sortObjectByKey(unordered) {
  const ordered = {};
  Object.keys(unordered).sort().forEach(function (key) {
    if (typeof unordered[key] === 'string') {
      ordered[key] = unordered[key];
    } else {
      ordered[key] = sortObjectByKey(unordered[key]);
    }
  });
  return ordered
}

function importMessages(filename) {
  return `import messages from "./${filename}.messages.json";`
}

function insert$t(filename, defaultLang, source) {
  // messages put in computed so that languages shown can be switched without refresh the page
  const messageProp = `
    $t(key){
      if(!this.$lang && !messages["${defaultLang}"]) return key;
      const trans = messages[this.$lang]||messages["${defaultLang}"]||{};
      return trans[key];
    },
  `
  const simpleExport = 'export default { methods:{' + messageProp + '} }'
  // the original default may have different forms, we proxy it here by adding $t method
  const modifiedExport = `
    if ($defaultObject.methods){
      Object.assign($defaultObject.methods,{${messageProp}})
    }else{
      $defaultObject.methods = {${messageProp}}
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
  const matched = source.match(/([\s\S]*?<script[^>]*>)([\s\S]*)(<\/script>[\s\S]*)/)
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
  insert$t,
  matchTemplate,
  matchScript,
  removeComments,
}
