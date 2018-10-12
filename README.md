## butterfly-template

Is a clean, simple and powerful template language that uses javascript strings to build `DOM nodes or Virtual Nodes` (~5.8k minified).

## Get Started

CDN:

```javascript
<script src="https://cdn.jsdelivr.net/gh/ahmedyoussef70/butterfly-template@1.0.4/umd/index.min.js"></script>
<script>
  const { templateToDOM } = butterflyTemplate
</script>
```

Node:

```
npm i butterfly-template
```

```javascript
const { templateToDOM } = require('butterfly-template')
```

## Examples

#### 1 - How to make a simple element ?

```javascript
const div = `div`
butterflyTemplate.templateToDOM(div)
// outputed DOM: <div></div>
```

#### 2 - How to add attributes to an element ?

Attributes are added using parentheses and separated by comma.

```javascript
const div = `div (class = "x1", id = "x2")`
butterflyTemplate.templateToDOM(div)
// outputed DOM: <div class="x1" id="x2"></div>
```

#### 3 - How to add children to an element ?

Children are added using square brackets.

Commas are not required for separation and will be ignored.

But you have to know that there is two types of nodes you can build:

- element nodes: mentioned in example 1.
- text nodes: those are made using quotes.

```javascript
const div = `div (class = "x1", id = "x2") [
  h1 [ "Hello World" ] 
]`
butterflyTemplate.templateToDOM(div)
/* outputed DOM: 
  <div class="x1" id="x2">
    <h1>Hello World</h1>
  </div>
*/

const div = `div (class = "x1", id = "x2") [
  h1 [ "Hello World" ]
  h2 [ "Hey" ]
]`
butterflyTemplate.templateToDOM(div)
/* outputed DOM: 
  <div class="x1" id="x2">
    <h1>Hello World</h1>
    <h2>Hey</h2>
  </div>
*/
```

#### 4 - It's really just javascript strings

So, you can do interpolation and concatenation in a natural way.

```javascript
const h1 = x => `h1 [ "${x}" ]`
butterflyTemplate.templateToDOM(h1('Hello World'))
// outputed DOM: <h1>Hello World</h1>
```

You can also use the power of Arrays:

```javascript
const users = ['a', 'b', 'c']
const ul = ls => `ul [ ${ls} ]`
const li = x => `li [ "${x}" ]`

butterflyTemplate.templateToDOM(ul(users.map(li)))
/* outputed DOM: 
  <ul>
    <li>a</li>
    <li>b</li>
    <li>c</li>
  </ul>
*/
```

#### 5 - Partials are just functions

```javascript
const userProfile = (name, imageSrc) => `div [
  img (src = "${imageSrc}")
  h4 [ "${name}" ]
]`
butterflyTemplate.templateToDOM(userProfile('username', 'imagesrc'))
/* outputed DOM: 
  <div>
    <img src="imagesrc">
    <h4>username</h4>
  </div>
*/
```

## What about Error Handling ?

The Lexer will throw erros with helpful details about the problem. for example:

- Catching invalid tags/characters and pointing at the line number, index number, the character itself
  and injecting the html body with a simple visualization of the error highlighted in red.
  ![example of error handling](https://i.imgur.com/gAhtLO9.png)

## How to get Virtual nodes instead of DOM nodes ?

```javascript
const {Lexer, VNT} = butterflyTemplate
new VNT().build(new Lexer().lex('div [ h1 [ "hello" ] ]'))

outputs: /*
{
  rawValue: "div",
  attrs: null,
  children: [{…}],
  startIndex: 0,
  endIndex: 2,
  lineNumber: 1,
  parentToken: null,
  parsingMode: ƒ TAG_MODE(t)
}
*/
```

## How it works ?

butterfly-template has a built in Parser, that consists of:

- Lexer.
- AST-like builder (i named it VNT instead of AST because it's more like a virtual-nodes tree).
- Compiler for the ASTs/VNTs.

The VNT builder and the VNT compiler are separated methods under the VNT class.

The api exposes the Lexer class, the VNT class and a simple function called templateToDOM works as shown in the examples.
