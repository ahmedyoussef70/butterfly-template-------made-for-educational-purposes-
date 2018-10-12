function TAG_MODE(tag) {
  return document.createElement(tag)
}
function TEXT_MODE(text) {
  return document.createTextNode(text)
}
function ATTRS_MODE(node, attrs) {
  for (lhs in attrs) node.setAttribute(lhs, attrs[lhs])
}
function CHILDREN_MODE() {}

class Lexer {
  lex(text) {
    this.text = text
    this.index = 0
    this.currentLineNumber = 1
    this.tokens = []
    this.relationsMap = []
    this.parsingMode = null
    this.contextMode = null
    this.tagR1 = /[a-zA-Z]/
    this.tagR2 = /-|\d/
    this.whiteSpaceR = /\s/
    this.escapeChars = { b: '\b', f: '\f', n: '\n', r: '\r', t: '\t', v: '\v', "'": "'", '"': '"' }
    while (this.index < this.text.length) {
      let ch = text[this.index]
      if (this.tagR1.test(ch)) {
        this.parsingMode = TAG_MODE
        this.tokens.push(this.readTag())
      } else if (this.whiteSpaceR.test(ch)) {
        if (ch === '\n') this.currentLineNumber += 1
        this.index += 1
      } else if (ch === '[') {
        if (this.tokens.length) {
          this.relationsMap.push(this.tokens[this.tokens.length - 1])
          this.contextMode = CHILDREN_MODE
          this.index += 1
        } else {
          this.vizError(this.index, this.index + 1)
          throw new Error(
            `Can not declare children without a parent: line ${this.currentLineNumber}, index ${this.index}, char ${
              this.text[this.index]
            }`
          )
        }
      } else if (ch === ']') {
        this.relationsMap.pop()
        this.contextMode = this.relationsMap.length ? CHILDREN_MODE : null
        this.index += 1
      } else if (ch === "'" || ch === '"') {
        this.parsingMode = TEXT_MODE
        this.tokens.push(this.readText(ch))
      } else if (ch === '(') {
        if (this.tokens.length) {
          this.parsingMode = ATTRS_MODE
          this.tokens[this.tokens.length - 1].attrs = this.readAttrs()
        } else {
          this.vizError(this.index, this.index + 1)
          throw new Error(
            `Can not attach attrs on null: line ${this.currentLineNumber}, index ${this.index}, char ${
              this.text[this.index]
            }`
          )
        }
      } else if (ch === ',') {
        this.index += 1
      } else {
        this.vizError(this.index, this.index + 1)
        throw new Error(
          `Unknown char: line ${this.currentLineNumber}, index ${this.index}, char ${this.text[this.index]}`
        )
      }
    }
    return this.tokens
  }
  readTag() {
    let tag = ''
    let index = this.index
    tag += this.text[this.index]
    this.index += 1
    while (this.parsingMode === TAG_MODE) {
      let ch = this.text[this.index]
      if (ch != null && (this.tagR1.test(ch) || this.tagR2.test(ch))) {
        tag += ch
        this.index += 1
      } else {
        let token = this.makeToken(tag, index)
        tag = index = null
        return token
      }
    }
  }
  readText(q) {
    let text = ''
    let quote = q
    let index = this.index + 1
    let shouldEscape = false
    this.index += 1
    while (this.parsingMode === TEXT_MODE) {
      let ch = this.text[this.index]
      if (ch != null) {
        if (shouldEscape) {
          text += this.escapeChars[this.text[this.index]] || ch
          this.index += 1
          shouldEscape = false
        } else if (ch === '\\') {
          shouldEscape = true
          this.index += 1
        } else if (ch === quote) {
          let token = this.makeToken(text, index)
          text = index = null
          this.index += 1
          return token
        } else {
          if (ch === '\n') this.currentLineNumber += 1
          text += ch
          this.index += 1
        }
      } else {
        this.vizError(index, this.index - 1)
        throw new Error(
          `Missing quote: line ${this.currentLineNumber}, index ${this.index}, text ${this.text.slice(
            index,
            this.index - 1
          )}`
        )
      }
    }
  }
  readAttrs() {
    let attrs = {}
    let LHS = ''
    let RHS = ''
    let expectingLHS = true
    let expectingRHS = false
    let expectingComma = false
    let index = this.index + 1
    this.index += 1
    while (this.parsingMode === ATTRS_MODE) {
      let ch = this.text[this.index]
      if (ch != null) {
        if (this.whiteSpaceR.test(ch)) {
          if (LHS) expectingComma = true
          if (ch === '\n') this.currentLineNumber += 1
          this.index += 1
        } else if (ch === ',' || ch === ')') {
          if (LHS) {
            attrs[LHS] = RHS
          }
          LHS = RHS = ''
          expectingRHS = false
          expectingLHS = true
          expectingComma = false
          this.index += 1
          if (ch === ')') {
            let token = this.makeToken(attrs, index)
            this.parsingMode = LHS = RHS = attrs = null
            return token
          }
        } else if (expectingLHS) {
          if (this.tagR1.test(ch) || (LHS.length && this.tagR2.test(ch))) {
            if (expectingComma) {
              this.vizError(index, this.index)
              throw new Error(
                `Missing a comma: ${
                  this.componentName ? 'Component -> ' + this.componentName + ',' : ''
                } text -> ${this.text.slice(index, this.index)}`
              )
            }
            LHS += ch
            this.index += 1
          } else if (ch === '=') {
            expectingRHS = true
            expectingLHS = false
            expectingComma = false
            this.index += 1
          } else {
            this.vizError(this.index, this.index + 1)
            throw new Error(
              `Attr keys must not have quotes or invalid chars: line -> ${this.currentLineNumber}, index -> ${
                this.index
              }, char -> ${this.text[this.index]}`
            )
          }
        } else if (expectingRHS) {
          if (ch === "'" || ch === '"') {
            this.parsingMode = TEXT_MODE
            let token = this.readText(ch)
            RHS = token.rawValue
            expectingRHS = false
            expectingLHS = false
            expectingComma = true
            this.parsingMode = ATTRS_MODE
          } else {
            this.vizError(this.index, this.index + 1)
            throw new Error(
              `Attr values must have quotes: line -> ${this.currentLineNumber}, index -> ${this.index}, char -> ${
                this.text[this.index]
              }`
            )
          }
        } else if (expectingComma) {
          this.vizError(index, this.index)
          throw new Error(
            `Missing a comma: ${
              this.componentName ? 'Component -> ' + this.componentName + ',' : ''
            } text -> ${this.text.slice(index, this.index)}`
          )
        }
      } else {
        this.vizError(index, this.index)
        throw new Error(
          `Missing a closing parenthesis: ${
            this.componentName ? 'Component ' + this.componentName + ',' : ''
          } text ${this.text.slice(index, this.index)}`
        )
      }
    }
  }
  makeToken(rawValue, startIndex) {
    let token = {
      parsingMode: this.parsingMode,
      contextMode: this.contextMode,
      rawValue,
      startIndex,
      endIndex: this.index - 1,
      lineNumber: this.currentLineNumber,
      parentToken: this.contextMode === CHILDREN_MODE ? this.relationsMap[this.relationsMap.length - 1] : null,
      attrs: null
    }
    this.parsingMode = null
    return token
  }
  vizError(start, end) {
    let body
    if (typeof document === 'object' && (body = document.querySelector('body'))) {
      let error = `<pre>${this.text.slice(0, start)}<b style="color:orangered">${this.text.slice(start, end)}</b></pre>`
      body.innerHTML = error
    }
  }
}

class VNT {
  build(tokens = []) {
    this.tokens = tokens
    this.vnt = []
    this.tokensLength = this.tokens.length
    if (this.tokensLength > 0) {
      this.tokens.forEach(token => {
        if (token.parentToken) {
          let children = token.parentToken.children
          children ? children.push(token) : (token.parentToken.children = [token])
        } else {
          this.vnt.push(token)
        }
      })
      return this.vnt.length > 1 ? this.vnt : this.vnt[0]
    } else {
      throw new Error('VNT Error: not enough tokens')
    }
  }
  compile(vnt) {
    if (Object.prototype.toString.call(vnt) === '[object Object]') return this._compile(vnt)
    if (Object.prototype.toString.call(vnt) === '[object Array]') return vnt.map(vn => this._compile(vn))
  }
  _compile({ rawValue, attrs, children, parsingMode }) {
    var node = parsingMode(rawValue)
    attrs && ATTRS_MODE(node, attrs.rawValue)
    if (children)
      children.forEach(child => {
        node.append(this._compile(child))
      })
    return node
  }
}

module.exports = {
  Lexer,
  VNT,
  templateToDOM: (function _templateToDOM() {
    let lexer = new Lexer()
    let vnt = new VNT()
    return function __templateToDOM(template) {
      return vnt.compile(vnt.build(lexer.lex(template)))
    }
  })()
}
