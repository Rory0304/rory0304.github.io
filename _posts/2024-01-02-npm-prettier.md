---
title: 'Prettier Config 패키지 제작으로 개발 생산성 높이기 (feat. CJS와 ESM)'
description: >-
  프로젝트를 생성할 때마다 매번 설정해주어야 하는 Prettier 파일을 패키지로 제작해보기
author: Lois
date: 2024-01-02
categories: [Open Source]
tags: [Open Source, NPM]
pin: true
---

## Intro,

프로젝트를 생성할 때마다 매번 설정해주어야 하는 Prettier 파일을 아예 패키지로 배포해서, 한 번의 라이브러리 설치로 다양한 환경에서 작업이 가능하도록 개발 생산성을 개선해보려 합니다.

[Configuration File · Prettier](https://prettier.io/docs/en/configuration.html#sharing-configurations)

*작업 후에는 아래처럼 코드 한 줄만으로 여러 프로젝트에서 동일한 프리티어를 설정할 수 있습니다.

```jsx
module.exports = require('@rorysa/prettier-config');
```

*이번 포스팅에서는 Prettier 패키지를 만들기 위한 설정 방법을 다룰 것이기 때문에, npm 패키지를 실제로 “배포”하는 방법에 대해서는 다루지 않습니다.

---

## 📑 사전 지식

우선 Prettier 파일을 생성하기에 앞서, 번들링을 위해 필요한 사전 지식을 잠깐 정리해보려 합니다.

### 1) 모듈 환경
초기 JS 는 모듈별로 코드를 가져오거나 내보내는 방법이 없었기 때문에 하나의 JS 파일에 전체 기능을 담아야 했습니다. 당연히 성능 문제가 발생하였고 이를 해결하기 위해 나온 방식이 CJS, ESM 입니다.

#### CJS (CommonJS)
Node.js에서 가장 일반적으로 사용되는 모듈 시스템으로, `require()` 가져올 수 있으며, `module.exports` 객체를 통해 모듈을 내보낼 수 있습니다.
CJS 의 모듈로더는 동기적으로 작동하는 특징이 있습니다.

#### ESM (MJS)
최신 JavaScript 버전에서 지원되는 모듈 시스템으로, `import` 문으로 가져올 수 있으며, `export` 문을 사용하여 모듈을 내보낼 수 있습니다.
Top-level Await을 지원하기 때문에 비동기적으로 동작하며, 이 차이점 때문에 ESM 에서 CJS 를 import 할 수는 있지만, CJS 에서 ESM 을 require 할 수는 없습니다.

### 2) 왜 CJS와 ESM 모듈 시스템을 지원해야 할까? 
프론트엔드 어플리케이션은 브라우저 상에서 동작하는 경우가 대부분이기 때문에 ESM 형태로 개발해도 문제가 없으나, 자바스크립트 라이브러리를 개발하는 경우는 다르게 생각해야 합니다.
예를 들어, 어떤 기능을 서버 사이드 렌더링에서 사용하는 경우는 Node.js 의 CJS 를 지원하는 것이 중요할 것입니다. 또한, 트리세이킹으로 번들 사이즈를 줄여서 브라우저의 퍼포먼스를 향상시키는 것이 중요하다면 트리세이킹이 쉽게 가능한 ESM 을 지원하는 것이 좋을 것입니다. Node.js 12부터는 ESM 모듈이 추가되었기 때문에 해당 환경에서 구동되는 경우 CJS 와 ESM 을 둘다 지원하는 것이 효율적일 것입니다.

### 3) CJS 와 ESM 을 해석하는 과정
우리가 어떤 라이브러리를 만들게 되면 개발자는 import/export 구문 혹은 require/module.export 구문에 따라 ESM 혹은 CJS 방식을 선택할 수 있습니다. 
그리고 그에 따른 빌드 결과물은 package.js 의 export field에 따라 CJS/ESM 방식으로 선택하여 내보낼 수 있습니다.

```js
// CJS
// ./dist/index.cjs를 불러온다.
const pkg = require("xxx");

// ESM
// ./esm/index.mjs를 불러온다.
import pkg from "xxx";
```

```json
// package.json
{
  "name": "xxx",
  "exports": {
    ".": {
      "require": "./dist/index.cjs",
      "import": "./esm/index.mjs"
    }
  }
}
```
위와 같이 빌드의 결과물을 작성해주기 위해서는 구동하는 환경에 대한 고려가 필수적입니다. 예를 들어, Node.js 에서 라이브러리를 구동한다고 가정해봅니다.

- 만약 Node.js v11 이하의 버전인 경우, 오직 CJS 로 작성된 모듈만 지원합니다. 따라서 ESM 패키지를 import/export 구문을 사용하게 된다면 오류가 발생합니다.
- Node.js v12 이상의 버전이라면, CJS/ESM 을 모두 지원하기 때문에 파일 확장자와 package.json 의 type 필드를 확인하여 모듈 형식을 결정하게 됩니다.
  - .mjs및 .cjs 파일은 항상 각각 ES 모듈과 CJS 모듈로 해석됩니다.
  - package type 값이 "module" 인 필드가 있으면 => 모든 js 파일은 ES 모듈로 해석됩니다.
  - type 필드에 아무 값도 없거나 module 이 아닌 다른 값인 경우 => 모든 .js 또는 .ts 파일은 CJS 형태로 인식됩니다.

만약 CJS/ESM 을 지원하는 환경에서 위 규칙을 따르지 않고, ESM 과 CJS 환경에서 동일한 .js 파일을 실행하게 될 경우 오류가 발생하게 됩니다.
예를 들어, 아래와 같이 CJS 패키지를 정의했다고 생각해봅니다.

```json
// package.json
{
  "name": "xxx",
  "type": "commonjs",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./esm/index.js"
    }
  }
}
```
CJS 패키지를 import/export 구문을 통해 실행하려 하면 오류가 발생합니다. 일단 import 문을 사용한 경우 `./esm/index.js` 가 ESM 이지만
가장 가까운 package type 이 `commonjs` 이기 떄문에 CJS 모듈 로더가 사용이 되기 떄문입니다. 따라서 CJS 환경에서는 import 구문을 사용할 수 없다는 오류가 발생합니다.

모던 브라우저에서 라이브러리를 실행하는 경우를 생각해봅니다. 모던 브라우저는 CJS 를 지원하지 않습니다. 따라서 번들러를 통해 구동 가능한 ESM 으로 번들링하는 과정이 필요합니다. 

예를 들어, 타입스크립트 기반의 React 컴포넌트 라이브러리를 만들었다고 가정해봅니다. 브라우저는 `.tsx` 확장자를 가진 파일을 바로 실행할 수 없기 떄문에 먼저 타입스크립트를 자바스크립트로 `트랜스파일` 하는 과정이 필요합니다. 대표적인 트랜스파일러인 babel 을 이용하면, ES6+ 구문들이나 jsx/tsx 코드를 구형 브라우저에서도 실행이 가능한 자바스크립트로 변환하게 됩니다. 

그리고 변환된 자바스크립트는 모던 브라우저에서 실행이 가능하도록 `번들링` 하는 과정을 거치게 됩니다. webpack, rollup, vite 등의 번들러를 활용하여 ESM/CJS 를 지원할 수 있도록 빌드 결과물을 설정할 수 있습니다. 대부분의 번들러는 트랜스파일 설정과 함께 사용할 수 있습니다. 에를 들어, Rollup 은 babel 과 함께 적용하여 다음과 같이 설정을 합니다.

```js
import babel from '@rollup/plugin-babel'

export default {
  input: 'src/index.ts',
  output: [
    {
      // CommonJS 출력을 위한 설정
      file: 'dist/index.cjs.js',
      format: 'cjs',
    },
    {
      // ES Module 출력을 위한 설정
      file: 'dist/index.esm.js',
      format: 'esm',
    },
  ],
  plugins: [
    // 
    babel({
      // {...}
      babelHelpers: 'bundled',
    }),
  ],
}
```

물론 외부 번들링+트랜스파일러를 사용하지 않고도, tsc 를 이용하여 tsx -> js(ES6/ES5) 변환은 가능합니다. 하지만 바벨처럼 [polyfill](https://stackoverflow.com/questions/41173215/does-typescript-transpilation-handle-transpiling-es6-to-es5) 을 따로 지원하진 않습니다.

만약 tsc 를 이용하여 tsx 를 번들링하려면, 따로 tsconfig 옵션 설정이 필요합니다. 또한, 타입스크립트 프로젝트에서도 모듈을 임포트할 수 있어야 하기 떄문에 js 파일과 함께 타입을 명시한 `d.ts` 의 변환 과정도 필요합니다. 이때는 CJS TypeScript( .cts )와 ESM TypeScript( .mts )로 Type Definition 을 구분해주어야 합니다.

---

## 💄 Prettier 설정하기
이제 TypeScript 로 정의된 prettier 설정(index.ts)을 CJS 와 ESM 환경에서 구동이 가능하도록 패키지화하여 배포를 해보려 합니다.

보통 prettier config 의 경우 .json 파일로 진행이 되기 때문에 따로 CJS/ESM 의 변환 과정 없이 바로 패키지화 하는 경우들이 많았습니다. (물론 json도 충분하긴 합니다)

하지만 저만 사용하는 패키지라도, 미래의(?) 동료 개발자를 생각하며 내부 개발툴 패키지를 만들어보고 싶었습니다. 그밖에 아래와 같은 이유로 ts 로 제작하기로 했습니다.

- json 파일 형식의 경우 따로 prettier의 설정값의 타입을 미리 알 수 없는 단점이 있고, 커스터마이징이 불가한 이슈가 있습니다. 이 부분은 차차 언급해보겠습니다.
- prettier 에 추가할 외부 모듈들을 import 방식으로 가져오고 싶었습니다.
- 사용자가 `.prettierrc.cjs`, `prettier.config.mjs` 로 설정할지 모르는 일이기 때문에 최대한 범용성을 생각하며 패키지로 만들어보고 싶었습니다.

### 1) tsconfig 설정하기
먼저 [공식 문서](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html) 에 따르면, TypeScript 는 프로젝트의 특성에 따라 설정을 달리합니다. 라이브러리 개발의 경우는 모든 환경을 테스트하기 어렵기 때문에, **가장 엄격하고 보편적인 설정(strictest possible settings)**을 사용해야 합니다. 

- 추천 예시
```json
{
    "compilerOptions": {
      "module": "node18",
      "target": "es2020",
      "strict": true,
      "verbatimModuleSyntax": true,
      "declaration": true,
      "sourceMap": true,
      "declarationMap": true,
      "rootDir": "src",
      "outDir": "dist"
    }
}
```
- `module: "node18"` Node.js 모듈 시스템과 호환되는 ESM 및 CJS 모두를 지원하며, 보통 번들러에서도 문제없이 작동합니다.
- `target: "es2020"` 프로젝트가 지원하는 환경 중 가장 낮은(target) 레벨을 지정합니다.


### 2) Prettier 설치/설정
우선 Prettier를 설치합니다. 더불어 TypeScript 의 경우 Prettier 옵션의 타입이 명시되어야 하기 때문에 `@types/prettier` 도 설치합니다. (JS 는 설치하지 않아도 되지만, 옵션에 대한 힌트를 주석으로 받을 수 있기 때문에 설치를 권장합니다.)

```
yarn add prettier
yarn add --dev @types/prettier
```

프리티어 설정을 담을 .ts (혹은 .js) 파일을 생성하고, [Docs](https://prettier.io/docs/en/options) 를 참고하여 필요한 옵션을 작성해줍니다.

```tsx
import type { Options as PrettierOptions } from "prettier";

interface Options extends PrettierOptions {}

const options: Options = {
  // ref: https://prettier.io/docs/en/options.html#print-width
  // Specify the line length that the printer will wrap on.
  printWidth: 80,

  // ref: https://prettier.io/docs/en/options.html#tab-width
  // Specify the number of spaces per indentation-level.
  tabWidth: 2,

  // ref: https://prettier.io/docs/en/options.html#tab-width
  // Include parentheses around a sole arrow function parameter.
  // "avoid" - Omit parens when possible. Example: x => x
  arrowParens: "avoid",

  // ref: https://prettier.io/docs/en/options.html#semicolons
  // Print semicolons at the ends of statements.
  semi: true,

  // ref: https://prettier.io/docs/en/options.html#quotes
  // Use single quotes instead of double quotes.
  singleQuote: true,

  // ref: https://prettier.io/docs/en/options.html#bracket-line
  // Put the > of a multi-line HTML (HTML, JSX, Vue, Angular) element at the end of the last line instead of being alone on the next line (does not apply to self closing elements).
  bracketSameLine: false,

  // ref: https://prettier.io/docs/en/options.html#bracket-spacing
  // Print spaces between brackets in object literals.
  bracketSpacing: true,

  // ref: https://prettier.io/docs/en/options.html#trailing-commas
  // Print trailing commas wherever possible in multi-line comma-separated syntactic structures.
  trailingComma: "es5",
};

export default options;
```

### 3) Import 순서 정렬하기

프리티어 플러그인 중 하나인 [trivago/prettier-plugin-sort-imports](https://github.com/trivago/prettier-plugin-sort-imports) 을 설치하면, 파일 import 순서도 자동으로 정렬할 수 있습니다.

```tsx
// Input
import React, {
    FC,
    useEffect,
    useRef,
    ChangeEvent,
    KeyboardEvent,
} from 'react';
import { logger } from '@core/logger';
import { reduce, debounce } from 'lodash';
import { Message } from '../Message';
import { createServer } from '@server/node';
import { Alert } from '@ui/Alert';
import { repeat, filter, add } from '../utils';
import { initializeApp } from '@core/app';
import { Popup } from '@ui/Popup';
import { createConnection } from '@server/database';

// ================================================

// Output: prettier-plugin-sort-imports 적용시
import { debounce, reduce } from 'lodash';
import React, {
    ChangeEvent,
    FC,
    KeyboardEvent,
    useEffect,
    useRef,
} from 'react';

import { createConnection } from '@server/database';
import { createServer } from '@server/node';

import { initializeApp } from '@core/app';
import { logger } from '@core/logger';

import { Alert } from '@ui/Alert';
import { Popup } from '@ui/Popup';

import { Message } from '../Message';
import { add, filter, repeat } from '../utils';
```

마찬가지로 `yarn add @trivago/prettier-plugin-sort-imports` 으로 플러그인 설치를 진행하고, 앞서 만들었던 Config 파일에 타입과 옵션을 추가해줍니다.
여기서 주의할 점은 prettier의 버전인데, 3.xx 버전의 경우 마이그레이션을 추가적으로 작업해주어야 합니다.

> Note: If you are migrating from v2.x.x to v3.x.x, [Please Read Migration Guidelines](https://github.com/trivago/prettier-plugin-sort-imports/blob/main/docs/MIGRATION.md)
> 

- **importOrder**

```tsx
[
    "^react(.*)", // react 로 시작하는 라이브러리(react, react-native 등)는 1번째 순서로 배치한다.
    "<THIRD_PARTY_MODULES>", // 외부 라이브러리를 2번째 순서로 배치한다.
    "^app/(.*)$", // app 으로 시작하는 경로는 3번째 순서로 배치한다. ex: app/components/…
    "^pages/(.*)$",
    "^apis/(.*)$",
    "^hooks/(.*)$",
    "^utils/(.*)$",
    "^components/(.*)$",
    "^styles/(.*)$",
    "^types/(.*)$",
    "^[./]",
  ]
```

- regex 를 이용하여 파일의 정렬 순서를 차례로 지정해줍니다.이때 import하는 경로를 기준으로 작성합니다. `<THIRD_PARTY_MODULES>` 는 외부 라이브러리의 순서인데 `@trivago/prettier-plugin-sort-imports` 는 기본적으로 외부 라이브러리를 상단에 올리는 것을 default 로 설정해주고 있습니다. 만약 외부 라이브러리를 상단에 올리는 것을 원하지 않는다면 `<THIRD_PARTY_MODULES>`를 원하는 순서에 명시해주어야 합니다.

- **importOrderSeparation**: 정렬 시, 임포트 해온 그룹들 사이에 공백을 추가한다. 
- **importOrderSortSpecifiers**: 정렬 시, 설정한 범주 내에서 정렬을 할지 설정한다.

```tsx
// false 일 때
import aaa from '@utils/test1';
import ccc from '@common/test1';
import bbb from '@utils/test1';
import ddd from '@styles/test1';

// ----------------------------------

// true 일 때
import aaa from '@utils/test1';
import bbb from '@common/test1';
import ccc from '@utils/test1';
import ddd from '@styles/test1';
```

참고로 ts 파일에서 `@trivago/prettier-plugin-sort-imports` 를 사용할 때, 아래와 같은 오류가 발생한다면 모듈을 읽어오는 방식에서 문제가 있는 것입니다.

```tsx
Cannot find module '@trivago/prettier-plugin-sort-imports'. 
Did you mean to set the 'moduleResolution' option to 'nodenext', or to add aliases to the 'paths' option?
```

`moduleResolution` 은 소스코드 내부에 import 되어 있는 모듈의 해석 방식을 설정할 수 있는 방식입니다. 만약 module 이 `commonjs`, `node16`, `nodenext` 이외의 설정값으로 되어 있다면 기본적으로 `classic` 방식을 따르게 됩니다. 

앞서 저는 `target` 을 `es2020` 으로 설정을 하였고, `module` 은 지정하지 않았기 때문에 자동으로 `target`의 값을 따르게 됩니다. 이 경우 `moduleResolution` 은 `classic` 으로 설정이 됩니다. 안타깝게도 `classic` 방식은 타입스크립트에서 가장 오래된 모듈을 읽어오는 방식입니다. 프로젝트가 다른 AMD 모듈이나 RequireJS 를 사용하지 않는다면 해당 방식을 따르지 않는 것이 좋습니다. 

잠시 [공식 문서](https://www.typescriptlang.org/docs/handbook/modules/theory.html#module-resolution) 의 내용을 가져와 `moduleResolution`을 설정해야 하는 이유에 대해 알아보겠습니다.

#### Module resolution is host-defined
ECMAScript 표준은 import/export 를 어떻게 파싱하고 해석할지만 정의하고, 실제 모듈을 어떻게 찾을지는 런타임 환경(호스트)에 달려있습니다.
예를 들어, 극단적으로 이모지를 특정 파일 경로로 매핑하는 "표준 준수 ESM"이 어디에 존재한다고 생각을 해봅니다.

```ts
import monkey from "🐒"; // Looks for './eats/bananas.js'
import cow from "🐄"; // Looks for './eats/grass.js'  
import lion from "🦁"; // Looks for './eats/you.js'
```

위 예시에서는 타입스크립트가 "🐒" 가 './eats/bananas.js' 를 의미한다는 것을 사전에 모르면 타입 체크를 할 수 없습니다.

왜냐하면 타입스크립트는 import 구문을 자체적으로 수정하지 않으며, 모듈의 경로는 코드가 실행되는 런타임 환경에 따라 해석이 되기 때문입니다. `module`이 런타임에 기대하는 모듈의 환경을 정의한다면, `moduleResolution` 은 import 된 모듈의 해석 방법을 정의(일종의 알고리즘)한다고 생각하면 됩니다.

> Just as module informs the compiler about the host’s expected module format, moduleResolution, along with a few customization options, specify > the algorithm the host uses to resolve module specifiers to files 

다시 Prettier 설정으로 돌아가 봅시다. 앞서 저는 target을 es2020 로 설정했지만, module resolution 을 설정해주지 않았기 때문에 module 속성 또한 es2020으로, moduleResolution은 module 값에 따라 `classic` 으로 설정이 되었습니다. `trivago`를 임포트한 모듈을 해석할 수 있으려면 `classic`이 아니라, `nodenext` 방식으로 설정해주면 됩니다. 또한, `module`의 설정값도 `nodenext` 로 변경해줍니다.

### 4) 기타 정보: Editor Config + Prettier
[EditorConfig](https://editorconfig.org/) 는 각자 다른 에디터나 IDE 를 사용해도 동일한 코딩 스타일을 유지할 수 있도록 해주는 라이브러리입니다.
프로젝트의 root 에 .editorconfig 를 생성하여 설정이 가능한데, Prettier 와 함께 사용할 경우 이 설정들을 프리티어 고유의 Config 로 변환해줄 수 있습니다.

> If `options.editorconfig` is `true` and an [`.editorconfig` file](https://editorconfig.org/) is in your project, Prettier will parse it and convert its properties to the corresponding Prettier configuration. This configuration will be overridden by `.prettierrc`, etc.
> 

만약 아래와 같이 editorconfig 파일이 설정이 되었다면,

```
// .editorconfig
[*]
charset = utf-8
insert_final_newline = true
end_of_line = lf
indent_style = space
indent_size = 2
max_line_length = 80
```

Prettier 에서 일부 설정을 고유의 config 로 변환합니다. 예를 들어, end_of_line / indent_style / indent_size / max_line_length 가 해당됩니다.

```
# Stop the editor from looking for .editorconfig files in the parent directories
# root = true

[*]
# Non-configurable Prettier behaviors 
charset = utf-8
insert_final_newline = true
# Caveat: Prettier won’t trim trailing whitespace inside template strings, but your editor might.
# trim_trailing_whitespace = true

# Configurable Prettier behaviors
# (change these if your Prettier config differs)
end_of_line = lf
indent_style = space
indent_size = 2
max_line_length = 80
```

---

## 📦 패키지 배포하기
### 1) package.json 기본 설정 
[TS 파일의 패키지 배포](https://www.typescriptlang.org/ko/docs/handbook/declaration-files/publishing.html) 는 npm publish 명령어를 통해 자동으로 빌드를 하고 배포를 진행하게 됩니다. 

`npm init -y` 명령을 이용하면 패키지 설정을 위한 package.json 파일이 생성되는데, 저는 프리티어 파일을 만들 것이기 때문에 name 필드에 `"name": "@username/prettier-config"` 식으로 패키지 명을 작성해주었습니다. 만약 npm public 으로 배포할 예정이라면 `publishConfig: { "access": "public" }` 옵션을 추가해줍니다.

```
{
  "name": "@rorysa/prettier-config", // 패키지 명
  
  "version": "1.0.0", // 패키지 버전 
  
  "description": "Shareable prettier config for rory projects", // 패키지 설명

  "license": "ISC", // 패키지 라이센스
	
  "devDependencies": {
    "@types/prettier": "^2.7.2",
    "typescript": "<4.4.0"
  },
	
  "dependencies": {
    "@trivago/prettier-plugin-sort-imports": "^4.3.0",
    "prettier": "^3.1.1"
  }
  
  "publishConfig": {
    "access": "public" // 공개 설정
  }
}
```

### 2) tsconfig.json 설정
TypeScript 가 어떤 스펙으로 컴파일할 것인지 명시하는 파일인 `tsconfig.json`를 작성해줍니다. 설정값에 대해서는 주석을 참고합니다.

```json
{
  "compilerOptions": {
    "moduleResolution": "Node",
    "strict": true,
    "typeRoots": ["node_modules/@types"],
    "declaration": true,
    "outDir": "dist"
  },
  "files": ["./index.ts"],
  "include": ["./index.ts"]
}
```

- **files**: 원하는 파일만 **타입스크립트 처리**하도록 만들 수 있다.
- **include**: 정규식 형태로 원하는 **파일 목록을 지정**할 수 있다.
- **compilerOptions:** 선택한 파일들을 어떤 방식으로 처리할지 정의한다.
    - `target`: 타입스크립트가 최종적으로 컴파일하는 결과물의 **문법 형태**를 지정한다. 만약 ES5 를 선택했다면, ES6부터 지원하는 화살표 함수는 모두 function 문법으로 변환된다.
    - `lib`: 현재 프로젝트에서 사용할 수 있는 특정 기능에 대한 문법을 추가한다. 설정한 `target` 에 따라서 `lib`가 달라진다. 만약 프로젝트가 DOM 관련 API 를 호출한다면 타입스크립트는 기본적으로 DOM API 를 문법에 추가하지 않기 때문에 lib 에 DOM 추가 설정을 해주어야 한다.
    - `typeRoots`: TypeScript 가 정의되어 있는 Type 의 공간으로, 기본이 `node_modules/@types` 이다.
    - `module`: 컴파일 결과물이 사용하게 될 **module 방식**으로, `‘node’, ‘commonjs’, ‘amd’, ‘system’, ‘es2015’, ‘es2020’, ‘ESNext’`가 존재한다.
    - `moduleResolution`: 모듈(import/export) 경로를 해석하는 방식을 결정합니다. 
    - `strict`: true 로 지정하면 타입스크립트의 Type 검사 옵션 중 `strict*`와 관련된 모든 것을 `true` 로 만들게 된다.
    - `outDir`: `files`와 `include`를 통해서 선택된 파일들의 결과문이 저장되는 디렉터리를 `outDir`을 통해서 지정할 수 있다.
    - `declaration` : `true`로 설정하게 되면 해당 `.ts` 파일의 `.d.ts` 파일이 생성된다.

앞서 CJS/ESM 해석 방법에 대한 내용을 보았듯이, TS는 JS 로 변환하는 컴파일 과정을 거쳐서 메인 `.js`와 그에 대한 선언 파일인 `d.ts`를 package.json에 명시해주어야 합니다.
빌드 시에는 dist 경로의 js 파일이 사용이 될 것이기 때문에 package.json의 main 과 files 에

- 어떤 파일이 메인 스레드인지 (main)
- 패키지 배포할 때는 어떤 파일만 포함할 것인지(files)를 명시해줍니다.

```
{
  "main": "./dist/index.js", // dist/index.js 가 메인 스레드임
	
  "files": ["dist/**/*"], // dist 경로의 파일만 사용
	
  "exports": {
    ".": {
      "types": "./dist/index.d.ts", //타입 경로를 사용할 경우
      "default": "./dist/index.js" //default export 경로 명시
    }
  },
}
```

실제로 배포를 해서 prettier 를 적용하고 싶은 프로젝트에 install 을 해보면 다음과 같은 오류를 만날 수 있습니다.

- `SyntaxError: Cannot use import statement outside a module`
    - 원인: CJS 환경에서 ESM 모듈을 가져오려함
    - 방법: ESM 환경으로 바꾸거나 (package type “module”) 모듈에서 CJS 도 지원한다.

저는 앞선 설정에서 ESM 모듈만을 정의했기 때문에, CJS 환경에서 그대로 사용하려하니 문제가 발생하게 됩니다. 즉, ts 를 js 로 컴파일 후 해당 모듈을 ESM이나 CJS 환경에서 자유롭게 사용이 가능해야합니다.


### 3) CJS 와 ESM 지원하기
이제 모듈 환경에 대한 문제를 해결하기 위해 `package exports` 필드를 이용하여 cjs 용 esm 용을 분리해봅니다. 저는 아래의 참고자료를 확인했습니다.

📑 참고 자료
- [https://github.com/snowcrystals/prettier-config](https://github.com/snowcrystals/prettier-config)
    - cjs 와 esm 를 동시에 지원하는 prettier config 오픈소스로, `tsup` 라이브러리로 포맷(cjs, esm)을 지정하는 방식을 적용한 것을 확인할 수 있습니다.
- [라이브러리 번들링 개선 과정: 커맨드 한 줄로 번들링 끝내기](https://blog.hoseung.me/2023-07-22-improve-library-bundling)
    - @rollup/plugin-commonjs 를 적용과 `tsup` 을 이용하면 CJS, ESM 으로 간편하게 컴파일 할 수 있음을 확인할 수 있습니다.

[tsup](https://github.com/egoist/tsup) 은 간단한 설정으로 ESM, CJS 등 여러 모듈 형식으로 타입스크립트를 빌드할 수 있습니다.
먼저 devDependency 로 설치후, script 를 추가하거나 더 많은 설정이 필요한 경우 `tsup.config.ts` 파일을 만들어서 구성하면 됩니다.

**1️⃣ script 를 이용하는 방법**

- `"build": "tsup src/index.ts --format cjs,esm --dts --minify",`
    - `--dts` : emitDeclarationOnly
    - `--minify`: minify the output, resulting into lower bundle sizes

**2️⃣ tsup.config.ts 파일을 생성하기**

```ts
import { defineConfig } from "tsup";
export default defineConfig([
  // ESM 빌드
  {
    entry: ["./index.ts"],
    format: ["esm"],
    outDir: "esm",
    dts: true,
    clean: true,
    minify: true,
    skipNodeModulesBundle: true,
    treeshake: true,
    tsconfig: "tsconfig.json",
  },
  // CJS 빌드
  {
    entry: ["./index.ts"],
    format: ["cjs"],
    outDir: "dist",
    outExtension: () => ({ js: ".cjs" }),
    dts: true,
    clean: true,
    minify: true,
    skipNodeModulesBundle: true,
    treeshake: true,
    tsconfig: "tsconfig.json",
  },
]);
```

package.json 에도 생성된 cjs, esm 의 경로를 정의해줍니다.

```json
{
    "type": "module",
    "main": "./esm/index.js",
    "types": "./esm/index.d.ts",
    "files": [
      "dist/**/*",
      "esm/**/*"
    ],
    "exports": {
      ".": {
        "require": {
          "types": "./dist/index.d.cts",
          "default": "./dist/index.cjs"
        },
        "import": {
          "types": "./esm/index.d.ts",
          "default": "./esm/index.js"
        }
      }
    }
}
```

**3️⃣ 결과**

![npm-prettier](/assets/img/articles/2024-01-02-npm-prettier/npm-prettier.png)

index.cjs 는 CJS 가, index.js 는 ESM 이 적용된 결과입니다. 실제로 반환된 코드를 확인해보면 index.cjs 는 `module.exports` 를, index.js 는 `export { r as default };` 로 프리티어 설정을 문법에 맞게 export 해주고 있음을 확인할 수 있습니다.

---

## 🔎 패키지 사용 방법

이제 배포한 패키지를 프로젝트에 적용해봅니다.

### 1) Sharing a Prettier Configuration

생성된 프리티어 패키지를 적용하는 방법은 간단합니다. 루트 경로에 .prettierrc.js 파일을 만들어서 모듈 환경에 맞춰서 패키지를 불러주면 됩니다.

```jsx
module.exports = require('@company/prettier-config');
import companyPrettierConfig from "@company/prettier-config";
```

또는 package.json 의 prettier key 를 이용해서 패키지를 명시하는 방법도 있습니다.

```json
{
  "name": "my-cool-library",
  "version": "9000.0.1",
  "prettier": "@company/prettier-config"
}
```

.prettierrc.json 을 사용하는 예제도 있긴 하지만, 이 방법의 경우 overwrite 가 불가능합니다. 만약 추가적인 룰을 명시해주고 싶다면 .prettierrc.js 를 사용하는 것이 좋습니다.

```json
"@company/prettier-config"
```

> Note: This method does not offer a way to extend the configuration to overwrite some properties from the shared configuration. If you need to do that, import the file in a .prettierrc.js file and export the modifications, e.g:
> 
> 
> ```js
> import companyPrettierConfig from "@company/prettier-config";
> 
> export default {
>   ...companyPrettierConfig,
>   semi: false,
> };
> ```
> 

### 2) 모든 파일에 Prettier 적용해주기

프리티어 파일을 레파지토리 내 전체 파일에 적용해주려면, 아래의 스크립트를 실행하면 됩니다.

```jsx
"pretty": "prettier --write \"./**/*.{js,jsx,mjs,cjs,ts,tsx,json}\""
```

---

## 🧪 패키지를 로컬에서 테스트하기

이제 만든 Prettier 파일을 npm publish 했다면, 해당 패키지를 설치했을 때 프로젝트에 잘 적용되는지 확인해봅니다.
앗, prettier 설정이 잘못된 부분이 보여서 패키지를 고쳐서 npm publish 를 하고 재설치를 진행해서 또다시 테스트를 진행해주었습니다.
그런데..이걸 코드 수정을 할 때마다 계속 반복해야 하는 걸까요? 🤯

패키지를 테스트함에 있어서 매번 `npm publish - install` 하는 과정은 너무 번거롭고 비효율적입니다. 이때 `yalc` 를 사용하여 해결할 수 있습니다.

yalc 는 로컬 환경에서 패키지 테스트를 도와주는 라이브러리로, 매번 패키지를 Publish 하는 과정이나 어려운 `yarn link` 명령어를 대신하여 편하게 사용할 수 있습니다.

### 1) yarn link 를 사용하여 패키지 테스트를 하는 방법
yalc 를 사용함에 앞서, yarn link 명령어를 사용하는 방법도 잠깐 알아보겠습니다.

yarn link 는 개발 환경에서 패키지 폴더에서 대한 **심볼릭 링크(Symbolic link)**를 생성하는 원리를 적용합니다. 우리가 만든 프리티어 패키지와 프로젝트 내부의 `node_modules/<package>` 가 심볼릭 링크로 연결되기 때문에, 프리티어 패키지를 수정할 때마다 배포를 하지 않아도 로컬 환경에서 테스트가 가능합니다.

yarn link 를 사용하는 방법은 간단합니다. `yarn link` 로 테스트가 필요한 패키지의 심볼릭 링크를 생성하고 → `yarn link <package>` 로 심볼릭 링크를 원하는 프로젝트에 연결해주면 됩니다. 하지만, 이런 [yarn link 방식은 단점이 존재합니다.](https://medium.com/zigbang/yalc-npm-%ED%8C%A8%ED%82%A4%EC%A7%80%EB%A5%BC-%ED%85%8C%EC%8A%A4%ED%8A%B8%ED%95%98%EB%8A%94-%EB%8D%94-%EB%82%98%EC%9D%80-%EB%B0%A9%EB%B2%95-26eebae3f355) 대표적으로 테스트하려는 패키지의 특정 라이브러리 버전이 사용하려는 프로젝트의 동일 라이브러리의 버전과 다른 경우 예상하지 못한 오류가 발생할 수 있는데, 이를 해결하기 위해 의존성을 강제로 하나의 경로를 바라보도록 하는 방법을 적용해줄 수 있으나 추가적인 작업을 거쳐야 합니다.

*심볼릭 링크: 리눅스에서 다른 파일이나 폴더를 가리키는 파일을 뜻한다. 심볼릭 링크를 생성한다는 것은 바로가기 파일을 만든다고 생각하면 된다.

### 2) yalc 를 사용하여 패키지를 테스트하는 방법
위에서 설명한 yarn link 의 단점을 보완하면서도 간편하게 사용할 수 있는 방법이 [yalc](https://github.com/wclr/yalc) 입니다.

- yalc publish 로 패키지를 로컬에 배포하면, yalc 는 패키지의 파일들을 특별한 전역 저장소(예: `~/.yalc`)에 위치하게 됩니다.
- 패키지를 사용할 프로젝트에 `yalc add my-package`를 실행하면 현재 폴더의 `.yalc`로 패키지 내용을 가져와 `file:`종속성을 `package.json` 파일에 주입(수정)합니다.
- 또는 `yalc link my-package`를 사용하여 패키지 내용에 대한 심볼릭 링크를 `node_modules`에 생성하고 `package.json`을 수정하지 않도록 할 수도 있습니다. 
이는 `npm/yarn link`가 하는 것과 달리 작동하며, Pnmp/Yarn/Npm 워크스페이스와 함께 사용할 수 있습니다.
- `yalc`는 프로젝트에 특별한 `yalc.lock` 파일을 생성하는데, (이는 `yarn.lock` 및 `package-lock.json`과 유사함). 이 파일은 `yalc` 루틴을 수행하는 동안 일관성을 보장하는 데 사용됩니다.
- `yalc`는 `yarn` 또는 `npm` 패키지 관리자를 사용하는 프로젝트와 함께 사용할 수 있습니다.

Readme 설명을 참고하여, Prettier 패키지를 로컬 환경에서 테스트해봅니다.

```
[1] package 내부의 version 을 변경한다. 

[2] yarn build 로 패키지를 빌드한다. 

[3] 수정된 패키지를 yalc publish로 yalc에 퍼블리싱한다. 그럼 다음과 같은 로그가 찍힌다. → @comapny/my-package@1.3.2 published in store.

[4] yalc add (또는 link) 로 테스트할 패키지를 심볼릭 링크로 연결한다. 

[5] 이후 수정 사항이 생기면 패키지에서 yarn build → yalc publish 후, 프로젝트에서 yalc update 로 수정 사항을 반영한다.

[6] 테스트 완료했다면 yalc remove my-package 혹은 yalc remove —all 로 의존성을 삭제한다.
```

- Tip: Prettier는 yalc 로 연결할 경우 자동으로 반영되지 않기 때문에, vsc 의 Reload Window 를 실행해주어야 합니다.
- TroubleShooting: 만약 Prettier v.2 를 사용한다면 ESM 을 지원하지 않아 vscode 확장 앱 오류가 발생합니다. [이슈 참고](https://github.com/prettier/prettier/pull/13130)

---

## ✨ 최종 결과

### 깃허브
[https://github.com/Rory0304/rory-prettier-config](https://github.com/Rory0304/rory-prettier-config)

### 설치/사용 방법
```
yarn add --dev @rorysa/prettier-config
```

```
//.prettierrc.js
// CJS
module.exports = require('@rorysa/prettier-config');

// ESM
import config from '@rorysa/prettier-config';
export default config
```

---

## 참고자료

- [https://velog.io/@himprover/prettier로-뒤죽박죽-import-정리하기](https://velog.io/@himprover/prettier%EB%A1%9C-%EB%92%A4%EC%A3%BD%EB%B0%95%EC%A3%BD-import-%EC%A0%95%EB%A6%AC%ED%95%98%EA%B8%B0)
- [https://medium.com/zigbang/yalc-npm-패키지를-테스트하는-더-나은-방법-26eebae3f355](https://medium.com/zigbang/yalc-npm-%ED%8C%A8%ED%82%A4%EC%A7%80%EB%A5%BC-%ED%85%8C%EC%8A%A4%ED%8A%B8%ED%95%98%EB%8A%94-%EB%8D%94-%EB%82%98%EC%9D%80-%EB%B0%A9%EB%B2%95-26eebae3f355)
- [https://velog.io/@sisofiy626/dependencies의-종류와-차이점-dev-peer](https://velog.io/@sisofiy626/dependencies%EC%9D%98-%EC%A2%85%EB%A5%98%EC%99%80-%EC%B0%A8%EC%9D%B4%EC%A0%90-dev-peer)
- [https://blog.ull.im/engineering/2018/12/23/how-to-create-and-publish-npm-module-in-typescript.html](https://blog.ull.im/engineering/2018/12/23/how-to-create-and-publish-npm-module-in-typescript.html)
- [https://junghyeonsu.com/posts/deploy-simple-util-npm-library/#타입스크립트-설정](https://junghyeonsu.com/posts/deploy-simple-util-npm-library/#%ED%83%80%EC%9E%85%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8-%EC%84%A4%EC%A0%95)
- [https://tech.kakao.com/2023/10/19/commonjs-esm-migration/](https://tech.kakao.com/2023/10/19/commonjs-esm-migration/)
- [토스의 CJS / ESM 관련 포스팅 참고](https://toss.tech/article/commonjs-esm-exports-field)
