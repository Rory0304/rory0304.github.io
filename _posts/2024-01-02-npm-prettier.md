---
title: 'Prettier Config 패키지 제작으로 개발 생산성 높이기 (feat. CJS와 ESM)'
description: >-
  프로젝트를 생성할 때마다 매번 설정해주어야 하는 Prettier 파일을 아예 Package 로 배포해서, 개발 생산성을 개선해보려 한다. 
author: Lois
date: 2024-01-02
categories: [Open Source]
tags: [Open Source, NPM]
pin: false
---

## Intro,

프로젝트를 생성할 때마다 매번 설정해주어야 하는 Prettier 파일을 아예 패키지로 배포해서, 한 번의 설치로 작업이 가능하도록 개발 생산성을 개선해보려 한다.

[Configuration File · Prettier](https://prettier.io/docs/en/configuration.html#sharing-configurations)

*작업 후에는 아래처럼 코드 한 줄만으로 프리티어 설정을 관리할 수 있게 된다.

```jsx
module.exports = require('@rorysa/prettier-config');
```

---

## 📑 Package 설정을 위한 사전 지식

우선 Prettier 파일을 생성하기에 앞서, 패키지를 만들기 위해 필요한 사전 지식을 잠깐 정리해보려 한다. 

### 1) Dependencies 의 종류

- `dependencies`
    - 어떤 옵션을 사용하지 않고 패키지 설치만 했을 경우 dependency 영역에 패키지가 기록된다.
    - **런타임 + 번들링 후에도 필요한 패키지인 경우 해당된다.**
    - 대표적으로 Lodash, React, ImmutableJS 등의 패키지들이 있다.
- `devDependencies`
    - 개발 과정, 테스트 과정에서만 사용되는 패키지
    - **번들링 이후에는 사용되지 않으며, 번들링 이전에만 사용되는 패키지인 경우 해당된다.**
    - 포맷팅(ESLint, Prettier), 번들러(Webpack, gulp, Parcel), 바벨과 플러그인, 테스트툴(Jest), 그 외에도 Storybook, Bootstrap, TS(JS로 변환된 코드가 제품에 사용되기 때문에) 등이 포함
- `peerDependencies`
    - 프로젝트를 패키지 형태로 배포할 때 주로 적용되는 방식으로, **하위 패키지에 대한 의존성이 높은 경우** 사용한다.
    - npm install 시 명시된 패키지의 의존성이 다르다면 오류가 발생하여 설치를 진행하지 않는다.
- 🤔 **패키지를 설치할 경우,** `(dev/peer)Dependencies` **의 내용도 같이 설치 되는가?**
    - [**How do you prevent install of "devDependencies" NPM modules for Node.js (package.json)?**](https://stackoverflow.com/questions/9268259/how-do-you-prevent-install-of-devdependencies-npm-modules-for-node-js-package)
    - npm v8 에서는 `—omit-dev flag`를 제공하기 때문에 regular dependencies 만 설치할 수 있도록 옵션을 제공한다.

### 2) 모듈 환경

- 초기 JS는 모듈별로 코드를 가져오거나, 내보내는 방법이 없어, 하나의 JS 파일에 모든 기능을 담아야 했다. 그에 따른 성능 문제를 해결하기위해 고안된 방식이 CJS, ESM 등이 있다.
- **CJS(CommonJS)**: Node.js에서 가장 일반적으로 사용되는 모듈 시스템으로, `require()` 가져올 수 있으며, `module.exports` 객체를 통해 모듈을 내보낼 수 있다.
    - package.json 의 `“type: commonjs”` 를 설정한다.
- **ESM(MJS)**: 최신 JavaScript 버전에서 지원되는 모듈 시스템으로, `import` 문으로 가져올 수 있으며, `export` 문을 사용하여 모듈을 내보낼 수 있다.
    - package.json 의 `“type”:”module”`을 설정한다.
    - ESM 에서 CJS 를 import 할 수는 있지만, CJS 에서 ESM 을 require 할 수는 없다.
- Node.js 12 부터 ESM 모듈 시스템이 추가되면서 기존의 CJS 와 2가지 모듈 시스템을 지원해야 하며, 이를 패키지에서는 package.json exports field 로 지원할 수 있다.
- 왜 2가지 모듈 시스템을 지원해야 하는가? ⇒ [토스의 CJS / ESM 관련 포스팅 참고](https://toss.tech/article/commonjs-esm-exports-field)

---

## 💄 Prettier 설정하기

우선 나는 Prettier 패키지도 만드는 김에 TS를 JS 로 변환하는 방식에 대한 공부도 하고 싶어서 TypeScript 로 작성했다. Prettier 패키지만 생성하고 싶은 경우 JS 로만 작성해도 무방하다.

### 1) Prettier 설치/설정

우선 Prettier를 설치한다. 더불어 TypeScript 의 경우 Prettier 옵션의 타입이 명시되어야 하기 때문에 `@types/prettier` 도 설치한다. (JS 는 설치하지 않아도 되지만, 옵션에 대한 힌트를 주석으로 받을 수 있기 때문에 설치를 권장한다.)

```jsx
yarn add prettier
yarn add --dev @types/prettier
```

프리티어 설정을 담을 .ts (혹은 .js) 파일을 생성하고, [Docs](https://prettier.io/docs/en/options) 를 참고하여 필요한 옵션을 작성해준다.

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

### 2) Import 순서 정렬하기

프리티어 플러그인 중 하나인 https://github.com/trivago/prettier-plugin-sort-imports 을 설치하면, 파일 import 순서도 자동으로 정렬할 수 있다.

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

마찬가지로 `yarn add @trivago/prettier-plugin-sort-imports` 으로 플러그인 설치를 진행하고, 앞서 만들었던 Config 파일에 타입과 옵션을 추가해준다. 여기서 주의할 점은 prettier의 버전인데, 3.xx 버전의 경우 마이그레이션을 추가적으로 작업해주어야 한다. 

> Note: If you are migrating from v2.x.x to v3.x.x, [Please Read Migration Guidelines](https://github.com/trivago/prettier-plugin-sort-imports/blob/main/docs/MIGRATION.md)
> 

1️⃣ **importOrder**

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

- regex 를 이용하여 파일의 정렬 순서를 차례로 지정한다. 이때 import하는 경로를 기준으로 작성한다. **`<**THIRD_PARTY_MODULES>` 는 외부 라이브러리의 순서인데 `@trivago/prettier-plugin-sort-imports` 는 기본적으로 외부 라이브러리를 상단에 올리는 것을 default 로 설정해주고 있다. 만약 외부 라이브러리를 상단에 올리는 것을 원하지 않는다면 **`<**THIRD_PARTY_MODULES>`를 원하는 순서에 명시해주어야 한다.

2️⃣ **importOrderSeparation**: 정렬 시, 임포트 해온 그룹들 사이에 공백을 추가한다. 

3️⃣ **importOrderSortSpecifiers**: 정렬 시, 설정한 범주 내에서 정렬을 할지 설정한다.

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

// 참고: https://velog.io/@himprover/prettier%EB%A1%9C-%EB%92%A4%EC%A3%BD%EB%B0%95%EC%A3%BD-import-%EC%A0%95%EB%A6%AC%ED%95%98%EA%B8%B0
```

참고로 ts 파일에서 `@trivago/prettier-plugin-sort-imports` 를 사용할 때, 아래와 같은 오류가 발생한다면 모듈을 읽어오는 방식에서 문제가 있는 것이다. 

```tsx
Cannot find module '@trivago/prettier-plugin-sort-imports'. 
Did you mean to set the 'moduleResolution' option to 'nodenext', or to add aliases to the 'paths' option?
```

해결 방법은 [이 블로그 글](https://velog.io/@jsi06138/TS-Cannot-find-module-%EC%98%A4%EB%A5%98-%ED%95%B4%EA%B2%B0%ED%95%98%EA%B8%B0)을 참고했다. `moduleResolution` 은 타입스크립트 모듈 해석 전략으로, 기본적으로 node.js 의 전략을 따른다. 만약 moduleResolution이 설정되지 않았다면 module 속성을 따르고, module 속성이 정해지지 않았다면 target 에 따라 정해진다. 

- module resolution: **node** => module: **commonjs** => target: **es3 or es5**
- module resolution: **classic** => module: **es6/2015** => target: **es6/es2015**

나의 경우 target을 es6 로 설정했고 module resolution 을 설정해주지 않았기 때문에 trivago 라이브러리의 선언 파일에 도달하지 못한 것이다. 따라서, moduleResolution 을 ‘node’ 로 바꿔주면 해결할 수 있다. 

→ 조금 더 해석을 해보자면, target 을 ES6 + moduleResolution 을 ‘node’ 로 설정했다면 TS 는 ES6 모듈을 생성(import 로 다른 모듈을 임포트해올 수 있음)할 수 있으며, TS 는 ‘Node’ 방식으로 모듈을 읽어오게 된다. 

### 3) 기타 정보: Editor Config + Prettier

[EditorConfig](https://editorconfig.org/) 는 각자 다른 에디터나 IDE 를 사용해도 동일한 코딩 스타일을 유지할 수 있도록 해주는 라이브러리이다. 프로젝트의 root 에 .editorconfig 를 생성하여 설정이 가능한데, Prettier 와 함께 사용할 경우 이 설정들을 프리티어 고유의 Config 로 변환해준다. 

> If `options.editorconfig` is `true` and an [`.editorconfig` file](https://editorconfig.org/) is in your project, Prettier will parse it and convert its properties to the corresponding Prettier configuration. This configuration will be overridden by `.prettierrc`, etc.
> 

만약 아래와 같이 editorconfig 파일이 설정이 되었다면,

```tsx
// .editorconfig
[*]
charset = utf-8
insert_final_newline = true
end_of_line = lf
indent_style = space
indent_size = 2
max_line_length = 80
```

Prettier 에서 일부 설정을 고유의 config 로 변환한다. 예를 들어, end_of_line / indent_style / indent_size / max_line_length 가 해당된다.

```tsx
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

TypeScript 는 정적 타입을 지원하는 프로그래밍 언어로, 타입 시스템을 가진 JS 의 상위 집합이다. 웹 브라우저나 Node.js 에서 동작하는 JS 는 동적 타입이기 때문에 TS 를 JS 로 변환하는 작업(컴파일)을 거치게 된다.

또한, 우리는 Prettier 설정을 TS 로 작성했고, 프로젝트에서 이 설정을 사용하려면 `.prettierrc(JSON)` , `.prettierrc.js` 파일에 맞게 바꿔주어야 한다. (그 외에도 프리티어를 설정하는 방법은 여러가지가 있고, 상황에 따라 맞는 방법을 택해서 적용한다. 각 방법에 대한 예시는 이 [링크](https://prettier.io/docs/en/configuration.html#basic-configuration)를 참고한다.) 

### 1) package.json 기본 설정

[TS 파일의 패키지 배포](https://www.typescriptlang.org/ko/docs/handbook/declaration-files/publishing.html) 시, npm publish 명령어를 통해 자동으로 빌드를 하고 배포를 진행하게 되는데, 이때 JS 로 변환하는 작업인 컴파일을 거치게 된다. 그 결과 파일인 메인 `.js` 파일을 가지고 있다면, 선언 파일을 `package.json`에도 표시해야 하며, 메인 파일의 type 선언 (d.ts) 도 types 프로퍼티에 명시해주어야 한다.

`npm init -y` 명령을 이용하면 패키지 설정을 위한 package.json 파일이 생성된다. 우리는 프리티어 파일을 만들 것이기 때문에 name 필드에 `"name": "@username/prettier-config"` 식으로 패키지 명을 작성한다. npm public 으로 배포할 예정이라면 `publishConfig: { "access": "public" }` 옵션을 추가해준다.

```tsx
{
  "name": "@rorysa/prettier-config", // 패키지 명
  "version": "1.0.0", // 패키지 버전 
  "description": "Shareable prettier config for rory projects", // 패키지 설명
  ....
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

TypeScript 가 어떤 스펙으로 컴파일할 것인지 명시하는 파일이 `tsconfig.json`인데, 나의 경우 컴파일하면 하면 js 로 변환하여 `dist` 경로에 저장할 수 있도록 설정해두었다. 그 외 설정에 대해서는 아래에 설명을 남겨두었다.

```tsx
// tsconfig.json
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
- **compilerOptions:** 선택한 파일들을 어떤 방식으로 처리할지 정의
    - `target`: 타입스크립트가 최종적으로 컴파일하는 결과물의 **문법 형태**를 지정한다. 만약 ES5 를 선택했다면, ES6부터 지원하는 화살표 함수는 모두 function 문법으로 변환된다.
    - `lib`: 현재 프로젝트에서 사용할 수 있는 특정 기능에 대한 문법을 추가한다. 설정한 `target` 에 따라서 `lib`가 달라진다. 만약 프로젝트가 DOM 관련 API 를 호출한다면 타입스크립트는 기본적으로 DOM API 를 문법에 추가하지 않기 때문에 lib 에 DOM 추가 설정을 해주어야 한다.
    - `typeRoots`: TypeScript 가 정의되어 있는 Type 의 공간으로, 기본이 `node_modules/@types` 이다.
    - `module`: 컴파일 결과물이 사용하게 될 **module 방식**으로, `‘node’, ‘commonjs’, ‘amd’, ‘system’, ‘es2015’, ‘es2020’, ‘ESNext’`가 존재한다.
    - `moduleResolution`: [앞선 설명](https://www.notion.so/Prettier-Config-feat-CJS-ESM-e95b4cc7181442be8417e117a3cc4f83?pvs=21)을 참고
    - `strict`: true 로 지정하면 타입스크립트의 Type 검사 옵션 중 `strict*`와 관련된 모든 것을 `true` 로 만들게 된다.
    - `outDir`: `files`와 `include`를 통해서 선택된 파일들의 결과문이 저장되는 디렉터리를 `outDir`을 통해서 지정할 수 있다.
    - `declaration` : `true`로 설정하게 되면 해당 `.ts` 파일의 `.d.ts` 파일이 생성된다.

빌드 시에는 dist 경로의 js 파일이 사용이 될 것이기 때문에 package.json의 main 과 files 에 어떤 파일이 메인 스레드인지 (main), 패키지 배포할 때는 어떤 파일만 포함할 것인지(files)를 명시한다.

```tsx
// package.json
{
	...
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

*이번 포스팅에서는 Prettier 패키지를 만들기 위한 설정 방법을 다룰 것이기 때문에, npm 패키지를 실제로 “배포”하는 방법에 대해서는 다루지 않을 것이다. 관련 정보는 [이 글](google.com)에서 너무 잘 정리되어 있기 때문에 참고하면 된다. 

실제로 배포를 해서 prettier 를 적용하고 싶은 프로젝트에 install 을 해보면 다음과 같은 오류를 만날 수 있다. 

- `SyntaxError: Unexpected token 'export’`
    - 원인: ESM 환경에서 ESM 모듈을 불러오는데 require 문을 사용함
    - 방법: import 문으로 모듈을 불러온다.
- `SyntaxError: Cannot use import statement outside a module`
    - 원인: CJS 환경에서 ESM 모듈을 import 하려 함
    - 방법: ESM 환경으로 바꾸거나 (package type “module”) 모듈에서 CJS 도 지원한다.
    - CJS 환경에서 ESM 모듈을 불러오려 할 때 파생되는 오류 : `require() of ES Module from .vscode/extensions/esbenp.prettier-vscode-10.1.0/node_modules/prettier/third-party.js not supported.`

모두 ESM 과 CJS 환경을 대응하지 못했기 때문에 생긴 문제이다. ts 를 js 로 바꿔서 사용하게 되면 해당 모듈을 ESM 환경에서도, CJS 환경에서도 이용할 수 있도록 지원해야 한다. 나는 패키지를 만들면서 ESM 모듈을 사용했기 때문에 이를 CJS 환경에서 불려오려하니 오류가 발생했다. 어떤 식으로 해결해주어야 할까?

### 3) CJS 와 ESM 지원하기

모듈 환경에 대한 문제를 해결하기 위해 `package exports` 필드를 이용하여 cjs 용 esm 용을 분리하는 방법을 리서치해봤다.

📑 참고 자료
- [https://github.com/snowcrystals/prettier-config](https://github.com/snowcrystals/prettier-config)
    - cjs 와 esm 를 동시에 지원하는 prettier config 오픈소스
    - `tsup` 라이브러리로 포맷(cjs, esm)을 지정하는 방식을 적용했다.
- [라이브러리 번들링 개선 과정: 커맨드 한 줄로 번들링 끝내기](https://blog.hoseung.me/2023-07-22-improve-library-bundling)
    - 이 글을 읽으면서 @rollup/plugin-commonjs 를 적용한 방식을 알아보았고, 타입스크립트 라이브러리 번들링을 목적으로 하는 `tsup` 을 이용하면 CJS, ESM 으로 간편하게 컴파일 할 수 있음을 확인했다.


이제 tsup 을 script에 적용해보자. [tsup](https://github.com/egoist/tsup) 을 devDependency 로 설치후, 아래의 script 를 추가하거나 더 많은 설정이 필요한 경우 `tsup.config.ts` 파일을 만들어서 구성하면 된다.

**1️⃣ script 를 이용하는 방법**

- `"build": "tsup src/index.ts --format cjs,esm --dts --minify",`
    - `--dts` : emitDeclarationOnly
    - `--minify`: minify the output, resulting into lower bundle sizes

**2️⃣ tsup.config.ts 파일을 생성하기**

```
import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["./index.ts"],
  format: ["cjs", "esm"],
  minify: true,
  skipNodeModulesBundle: true,
  sourcemap: true,
  tsconfig: "tsconfig.json",
  keepNames: true,
  treeshake: true,
  bundle: true,
  splitting: false,
});
```

**3️⃣ 결과**

![npm-prettier](/assets/img/articles/2024-01-02-npm-prettier/npm-prettier.png)

index.js 는 CJS 가, index.mjs 는 ESM 이 적용된 결과이다. 실제로 반환된 코드를 확인해보면 index.js 는 `module.exports` 를, index.mjs 는 `export { r as default };` 로 프리티어 설정을 문법에 맞게 export 해주고 있음을 확인할 수 있다. 

---

## 🔎 패키지 사용 방법

이제 배포한 패키지를 프로젝트에 적용해보자.

### 1) Sharing a Prettier Configuration

생성된 프리티어 패키지를 적용하는 방법은 간단하다. 루트 경로에 .prettierrc.js 파일을 만들어서 모듈 임포트 방식에 맞춰서 패키지를 불러주면 된다.

```jsx
module.exports = require('@company/prettier-config');
import companyPrettierConfig from "@company/prettier-config";
```

또는 package.json 의 prettier key 를 이용해서 패키지를 명시하는 방법도 있다.

```json
{
  "name": "my-cool-library",
  "version": "9000.0.1",
  "prettier": "@company/prettier-config"
}
```

.prettierrc.json 을 사용하는 예제도 있긴 한데, 이 방법의 경우 overwrite 가 불가능하다. 만약 추가적인 룰을 명시해주고 싶다면 .prettierrc.js 를 사용하는 것이 좋다. 

```json
"@company/prettier-config"
```

> Note: This method does not offer a way to extend the configuration to overwrite some properties from the shared configuration. If you need to do that, import the file in a .prettierrc.js file and export the modifications, e.g:
> 
> 
> ```json
> import companyPrettierConfig from "@company/prettier-config";
> 
> export default {
>   ...companyPrettierConfig,
>   semi: false,
> };
> ```
> 

### 2) 모든 파일에 Prettier 적용해주기

프리티어 파일을 레파지토리 내 전체 파일에 적용해주려면, 아래의 스크립트를 실행하면 된다.

```jsx
"pretty": "prettier --write \"./**/*.{js,jsx,mjs,cjs,ts,tsx,json}\""
```

---

## 🧪 패키지를 로컬에서 테스트하기

이제 만든 Prettier 파일을 npm publish 했다면, 해당 패키지를 설치했을 때 프로젝트에 잘 적용되는지 확인해보자. 앗, prettier 설정이 잘못된 부분이 보인다. 패키지를 고쳐서 npm publish 를 하고 재설치를 진행해서 또다시 테스트를 진행한다. 그런데..이걸 코드 수정을 할 때마다 계속 반복해야 하는 걸까? 🤯

패키지를 테스트함에 있어서 매번 npm publish - install 하는 과정은 너무 번거롭고 비효율적이다. 이때 `yalc` 를 사용하여 해결할 수 있다. yalc 는 로컬 환경에서 패키지 테스트를 도와주는 라이브러리로, 매번 패키지를 Publish 하는 과정이나 어려운 `yarn link` 명령어를 대신하여 편하게 사용할 수 있다. 

### 1) yarn link 를 사용하여 패키지 테스트를 하는 방법

yalc 를 사용함에 앞서, yarn link 명령어를 사용하는 방법도 잠깐 알아보자. yarn link 는 개발 환경에서 패키지 폴더에서 대한 **심볼릭 링크(Symbolic link)**를 생성하는 원리를 적용한다. 우리가 만든 프리티어 패키지와 프로젝트 내부의 `node_modules/<package>` 가 심볼릭 링크로 연결되기 때문에, 프리티어 패키지를 수정할 때마다 배포를 하지 않아도 로컬 환경에서 테스트가 가능하다.

yarn link 를 사용하는 방법은 간단하다. `yarn link` 로 테스트가 필요한 패키지의 심볼릭 링크를 생성하고 → `yarn link <package>` 로 심볼릭 링크를 원하는 프로젝트에 연결해주면 된다. 하지만, 이런 [yarn link 방식은 단점이 존재한다.](https://medium.com/zigbang/yalc-npm-%ED%8C%A8%ED%82%A4%EC%A7%80%EB%A5%BC-%ED%85%8C%EC%8A%A4%ED%8A%B8%ED%95%98%EB%8A%94-%EB%8D%94-%EB%82%98%EC%9D%80-%EB%B0%A9%EB%B2%95-26eebae3f355) 대표적으로 테스트하려는 패키지의 특정 라이브러리 버전이 사용하려는 프로젝트의 동일 라이브러리의 버전과 다른 경우 예상하지 못한 오류가 발생할 수 있는데, 이를 해결하기 위해 의존성을 강제로 하나의 경로를 바라보도록 하는 방법을 적용해줄 수 있으나 추가적인 작업을 거쳐야 한다. 

*심볼릭 링크: 리눅스에서 다른 파일이나 폴더를 가리키는 파일을 뜻한다. 심볼릭 링크를 생성한다는 것은 바로가기 파일을 만든다고 생각하면 된다.

### 2) yalc 를 사용하여 패키지를 테스트하는 방법

위에서 설명한 yarn link 의 단점을 보완하면서도 간편하게 사용할 수 있는 방법이 [yalc](https://github.com/wclr/yalc) 이다.

- yalc publish 로 패키지를 로컬에 배포하면, yalc 는 패키지의 파일들을 특별한 전역 저장소(예: `~/.yalc`)에 놓게 된다.
- 패키지를 사용할 프로젝트에 `yalc add my-package`를 실행하면 현재 폴더의 `.yalc`로 패키지 내용을 가져와 `file:`종속성을 `package.json` 파일에 주입(수정)한다.
- 또는 `yalc link my-package`를 사용하여 패키지 내용에 대한 심볼릭 링크를 `node_modules`에 생성하고 `package.json`을 수정하지 않도록 할 수도 있다. 이는 `npm/yarn link`가 하는 것과 달리 작동하며, Pnmp/Yarn/Npm 워크스페이스와 함께 사용할 수 있다.
- `yalc`는 프로젝트에 특별한 `yalc.lock` 파일을 생성하는데, (이는 `yarn.lock` 및 `package-lock.json`과 유사함). 이 파일은 `yalc` 루틴을 수행하는 동안 일관성을 보장하는 데 사용된다.
- `yalc`는 `yarn` 또는 `npm` 패키지 관리자를 사용하는 프로젝트와 함께 사용할 수 있다.

Readme 설명을 참고하여, Prettier 패키지를 로컬 환경에서 테스트해보자.

[1] package 내부의 version 을 변경한다. 

[2] yarn build 로 패키지를 빌드한다. 

[3] 수정된 패키지를 yalc publish로 yalc에 퍼블리싱한다. 그럼 다음과 같은 로그가 찍힌다. → @comapny/my-package@1.3.2 published in store.

[4] yalc add (또는 link) 로 테스트할 패키지를 심볼릭 링크로 연결한다. 

[5] 이후 수정 사항이 생기면 패키지에서 yarn build → yalc publish 후, 프로젝트에서 yalc update 로 수정 사항을 반영한다.

[6] 테스트 완료했다면 yalc remove my-package 혹은 yalc remove —all 로 의존성을 삭제한다.

*Tip: Prettier는 yalc 로 연결할 경우 자동으로 반영되지 않기 때문에, vsc 의 Reload Window 를 실행해주어야 한다.

*TroubleShooting: 만약 Prettier v.2 를 사용한다면 ESM 을 지원하지 않아 vscode 확장 앱 오류가 발생한다. 이 이슈를 참고한다.  https://github.com/prettier/prettier/pull/13130

---

## ✨ 최종 결과

### 깃허브

https://github.com/Rory0304/rory-prettier-config

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

완전 뿌듯…역시 포기하지 않으면 된다..처음 프리티어 패키지를 만들었을 때는 이정도의 딥다이브를 할 생각은 없었는데, 하다보니 오류를 만나고, 또 개선 사항이 생기고 하다보니까 공부해야 할 양이 많아졌다. 그래도 하나씩 원인-해결 방안을 찾다보니까 금방 익숙해졌고, 두려움은 점차 사라져갔다. 언젠간 배우겠지..하며 넘겼던 **tsconfig** 와 **Module**에 대한 공부를 할 수 있었던게 최대의 수확이었다. 😊  

---

## 참고자료

- [https://velog.io/@himprover/prettier로-뒤죽박죽-import-정리하기](https://velog.io/@himprover/prettier%EB%A1%9C-%EB%92%A4%EC%A3%BD%EB%B0%95%EC%A3%BD-import-%EC%A0%95%EB%A6%AC%ED%95%98%EA%B8%B0)
- [https://medium.com/zigbang/yalc-npm-패키지를-테스트하는-더-나은-방법-26eebae3f355](https://medium.com/zigbang/yalc-npm-%ED%8C%A8%ED%82%A4%EC%A7%80%EB%A5%BC-%ED%85%8C%EC%8A%A4%ED%8A%B8%ED%95%98%EB%8A%94-%EB%8D%94-%EB%82%98%EC%9D%80-%EB%B0%A9%EB%B2%95-26eebae3f355)
- [https://velog.io/@sisofiy626/dependencies의-종류와-차이점-dev-peer](https://velog.io/@sisofiy626/dependencies%EC%9D%98-%EC%A2%85%EB%A5%98%EC%99%80-%EC%B0%A8%EC%9D%B4%EC%A0%90-dev-peer)
- [https://blog.ull.im/engineering/2018/12/23/how-to-create-and-publish-npm-module-in-typescript.html](https://blog.ull.im/engineering/2018/12/23/how-to-create-and-publish-npm-module-in-typescript.html)
- [https://junghyeonsu.com/posts/deploy-simple-util-npm-library/#타입스크립트-설정](https://junghyeonsu.com/posts/deploy-simple-util-npm-library/#%ED%83%80%EC%9E%85%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8-%EC%84%A4%EC%A0%95)
- [https://tech.kakao.com/2023/10/19/commonjs-esm-migration/](https://tech.kakao.com/2023/10/19/commonjs-esm-migration/)
