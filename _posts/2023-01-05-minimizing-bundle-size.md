---
title: '[Next.js] Next.js 와 Minimizing bundle size 방법 적용기'
description: >-
   Next.js 의 페이지 로딩 시간이 왜이리 느릴까
author: Lois
date: 2023-01-05
categories: [Next.js]
tags: [Next.js]
pin: false
---

## Intro,
회사에서 material-ui + Framer + Next.js 의 조합을 사용하고 있는데, 개발 환경에서 페이지 컴파일하는 시간이 너무 느려 초기 로딩이 오래 걸리는 문제가 있는 상황이었다. 이는 곧 프로덕션 빌드 환경에서 초기 페이지 로딩에 영향이 있을 것으로 예상했고, 무엇이 원인인지 파악하며 문제를 해결해보기 위해 과정을 기록해보았다. 

```
💥 compiled client and server successfully in 177.5s (2090 modules)
```

---

## 🧐 원인 파악

정확한 원인 분석을 위해 [netxjs bundle size analyzer](https://github.com/vercel/next.js/tree/canary/packages/next-bundle-analyzer) 를 사용했다. 페이지에 사용되는 번들 사이즈를 분석한 후 문제가 되는 모듈의 사이즈를 최소화하는 방식으로 접근해볼 수 있다. 

문서를 따라 해보면, 분석 결과로 `edge` / `client` / `nodejs` html 파일이 열리게 된다. `client.html`은 클라이언트 번들링 결과를, `node.html` 은 서버 사이드 렌더링 시 필요한 서버 번들링 정보를, edge.html 은 아마 edge time 의 번들 결과를 보여주는 것 같으나 공식 문서에서 설명된 바는 없다. 

참고로, `State Size`는 빌드된 그대로의 상태 / `Parsed` 는 tree shaking 을 마친 결과물 / `Gzipped` 는 서빙을 위해 압축된 사이즈로,  Parsed 가 줄어들면 Gzipped 도 비례하여 줄어든다. 따라서, Parsed 사이즈를 중점으로 보기로 했다. 

우선, 문제가 되는 번들인 MUI과 Framer를 확인해보자. 

- node.html (mui parsed size: 2.32MB)

![node](/assets/img/articles/2023-01-05-minimizing-bundle-size/node.png)

- client.html (framer motion parsed size: 92.59kb)

![client](/assets/img/articles/2023-01-05-minimizing-bundle-size/client.png)

예상대로, 서버 사이드와 클라이언트 사이드에서 각각 mui 와 animation framer 을 차지하는 비중이 높았다. 

---

## ✅ 용어 정리

여기서 잠깐, 모듈 / 번들 / 번들링 / 트리 세이킹 등 갑자기 사용되는 개념이 많아져서, 이들의 관계성에 대해 헷갈리는 상황에 봉착했다. 우선 용어 정리부터 하고 차근차근 진행해보자. 

- **모듈**: 코드의 재사용성을 위해 사용되는 독립적인 코드의 단위 (Function, Component 등)
- **모듈 시스템**: 구성한 모듈을 언제든지 불러오거나, 코드를 모듈로 만들어주는 방법
    - AMD, CommonJS, UMD, ESM 이 존재함.
    - 대표적으로 ESM 은 export-import 를 사용하여 파일에 접근할 수 있도록 한다. 의존성 그래프의 생성 과정이 이루어지는데, import 문에서 지정한 파일이 의존성 그래프에 입점되고 연결된 import 따라가며 의존성 그래프를 생성한다.
- **번들**: 프로그램이 커질 수록 세분화된 모듈들이 많아지기 떄문에, 각 변수들의 스코프 혹은 네트워크 비용에 대해 신경을 써야 하며, 이런 문제점을 보완하기 위해 **모듈화된 파일들을 다시 하나로 묶어주는 방식**을 사용하게 된다. 이때, 모듈화된 js 파일들을 하나로 합칠 때 ‘번들러’를 이용한다.
- **번들러**: 서로 연관이 있는 여러 모듈들을 하나의 번들 파일로 묶는다. 예를 들어, Webpack, Parcel, Rollup 등이 존재한다.
- **트리 세이킹:** 사용되지 않는 코드를 제거하기 위해 JS 컨텍스트에서 일반적으로 사용되는 용어이다.
    - **dev 빌드 환경에서는 모든 모듈을 가져오기 때문에 실질적으로 눈에 띄는 변화가 일어나진 않는다. 하지만, 프로덕션 빌드 환경에서는 명시적으로 가져오지 않는 es6 모듈에 대하여 제거하기 때문에 빌드 사이즈를 작게 만들 수 있다.** ([출처](https://yceffort.kr/2021/08/javascript-tree-shaking))
    - 예를 들어, 웹팩의 트리세이킹의 경우 번들 Minification 단계에서 실행되며, 이 단계는 프로덕션 모드에서만 동작을 한다. 따라서, 개발 모드에서는 트리세이킹 방식이 적용되지 않아 번들 사이즈의 차이를 볼 수 없다. [(출처)](https://stackoverflow.com/questions/56350947/what-is-different-between-webpack-production-and-development-regarding-tree-shak)
- **컴파일**: 사용자가 이해하는 언어의 코드를 받아서, 기계가 이해하는 버전 혹은 언어로 바꿔 결과를 반환하는 과정

---

## Mui와 Framer motion 번들 사이즈를 줄이는 방법

MUI 의 [Minimizing bundle size](https://mui.com/material-ui/guides/minimizing-bundle-size/) 문서를 확인해보자. 

> Development bundles can contain the full library which can lead to **slower startup times**. This is especially noticeable if you use named imports from `@mui/icons-material`, which can be up to six times slower than the default import.
> 

위에 언급된 것처럼, 개발용 번들은 전체 라이브러리를 포함하고 있기 때문에 초기 시작 시간을 느리게 만들 수 있다. 특히, named import 방식을 사용하면 default import 보다 6배는 느리다고 한다.

```tsx
// 🐌 Named
import { Delete } from '@mui/icons-material';

// 🚀 Default
import Delete from '@mui/icons-material/Delete';
```

따라서, 많이 임포트를 할 필요가 없다면 default import  방식이 권장되고, 만약 3rd level 까지 import 를 해온다면 번들 중복 문제가 발생할 수 있기 때문에 지양하는 것이 좋다고 한다. 

```tsx
// ✅ OK
import { Add as AddIcon } from '@mui/icons-material';
import { Tabs } from '@mui/material';
//                         ^^^^^^^^ 1st or top-level

// ✅ OK
import AddIcon from '@mui/icons-material/Add';
import Tabs from '@mui/material/Tabs';
//                              ^^^^ 2nd level

// ❌ NOT OK
import TabIndicator from '@mui/material/Tabs/TabIndicator';
//                                           ^^^^^^^^^^^^ 3rd level
```

3rd level import 를 하지 않도록 eslint 룰에 추가하여 자동으로 휴먼 에러를 방지할 수 있도록 정의해볼 수도 있다. 

```tsx
{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": ["@mui/*/*/*"]
      }
    ]
  }
}
```

문제는 임포트해오는 모듈 수가 많을 수록, default import 방식은 불필요한 코드 양이 많아지기 때문에 DX 관점에서 상당히 불편할 수 있다. 

이 경우 먼저 협의를 통해 하나의 컨벤션을 정하는 것이 좋다. 예를 들어, **“3개 이하의 모듈만을 임포트하는 경우, default import 를 사용하며 그 이상은 named import 를 사용함”** 과 같은 방식으로 말이다. 

그리고 임포트해야 할 모듈 수가 기준치보다 많아서 **named import 코드를 사용했을 경우, 실제 빌드 결과에서는 default import** **로 자동 변환** 할 수 있다면 더 좋을 것이다. mui 공식 문서에는 babel plugin 을 사용하여 default import 로 변환하는 방식을 소개해주고 있다. 

### 1. [babel plugin 살펴보기](https://github.com/avocadowastaken/babel-plugin-direct-import)

1) install
```
npm install --save-dev babel-plugin-direct-import
```

2) Result
- Input
```tsx
import { Button, colors, ThemeProvider } from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
```

- OutPut
```tsx
import Button from "@mui/material/Button/Button.js";
import * as colors from "@mui/material/colors/index.js";
import ThemeProvider from "@mui/system/esm/ThemeProvider/ThemeProvider.js";
import ChevronLeftIcon from "@mui/icons-material/esm/ChevronLeft.js";
import ChevronRightIcon from "@mui/icons-material/esm/ChevronRight.js";
```

babel plugin 을 설정해줌으로써, named import 방식으로 DX 효과를 가져오면서, 실제 빌드시에는 default import 로 변환되기 때문에 번들 최소화가 가능해진다.

> - **UX**: The Babel plugin enables top-level tree-shaking even if your bundler doesn't support it.
> - **DX**: The Babel plugin makes startup time in dev mode as fast as Option 1.
> - **DX**: This syntax reduces the duplication of code, requiring only a single import for multiple modules. Overall, the code is easier to read, and you are less likely to make a mistake when importing a new module.

### 2. Next.js
next.js 13버전에서는 bable plugin 을 따로 설정해줄 필요 없이, 아예 내장 configuration 으로 설정해줄 수 있다.

```tsx
// next.config.js
transpilePackages: ["@mui/material", "@mui/icons-material"],
modularizeImports: {
    "@mui/material/?(((\\w*)?/?)*)": {
      transform: "@mui/material/{{ matches.[1] }}/{{member}}",
    },
    "@mui/icons-material/?(((\\w*)?/?)*)": {
      transform: "@mui/icons-material/{{ matches.[1] }}/{{member}}",
    },
  },
```

- transpliePackages: node modules 종속성을 자동으로 transpile 하여 번들링함. next-transpile-modules의 패키지 빌트인 기능
- modularizeImports: SWC를 사용하는 경우, moduleizeImports 를 대신 사용하여 tree shaking 을 지원함

### 3. Framer
framer motion 도 번들 사이즈 문제를 해결하는 방법을 Docs 를 통해 설명해주고 있다. 

[Reduce bundle size | Framer for Developers](https://www.framer.com/motion/guide-reduce-bundle-size/)

웹팩이나 롤업으로 트리세이킹이 가능하고, 규모가 작은 hook 만을 사용한다면 번들 사이즈가 문제가 되진 않지만, core API 인 motion 컴포넌트를 사용하면 문제가 될 수 있다. `motion` 컴포넌트는 우선 선언형이면서 props 를 받는 API 이기 때문에 사이즈가 29kb 보다 작을수는 없다고 한다. 따라서, `m` 과 `LazyMotion` 컴포넌트를 대신 사용하면, 초기 렌더링을 4.6kb 이하로 줄일 수 있음을 참고하여, 적용하면 된다. lazy-loading 을 사용하고 있어서 사이트가 렌더링된 후까지 애니메이션과 인터렉션 로드를 연기할 수 있다.

---
## 적용 결과

위 문서를 참고하여 코드를 적용해봤을 때, parsed 사이즈로 아래와 같은 결과를 얻을 수 있었다. 

**node.js: (mui 2.32MB ⇒ 1.01MB, 1.31MB 감소)**

![MUI](/assets/img/articles/2023-01-05-minimizing-bundle-size/mui.png)

**client.html (framer motion parsed size: 92.59KB ⇒ 11.32KB, 81.27KB 감소)**

![framer](/assets/img/articles/2023-01-05-minimizing-bundle-size/framer.png)

빌드 타임의 번들 사이즈를 줄이는 것이기 때문에, 개발 환경에서 초기 로딩이 느려지는 것은 눈에 띄게 속도가 해결되진 않았다. 하지만, MUI 를 사용하는 default import 부분의 경우는 그래도 수치 상의 compile 시간은 줄어들었다.

---

## 🔭 How Next.js Works ? (Deep Dive)

우선 문제를 해결하는 것이 우선이기 때문에, 위와 같이 설정은 해주었으나..아직 궁금증이 완전히 해소되진 않았다. Next.js 는 개발단계와 배포단계에서 어떤 동작을 하고 있기에 이런 번들 크기의 차이를 보이는 것일까? 공식 문서에서는 Next.js 가 어떤 식으로 동작하는지 잘 소개해주고 있어서 한 번 쭉 정리를 해보며 해결해보려 한다. 문서 링크는 아래와 같다. 

- https://nextjs.org/learn-pages-router/foundations/how-nextjs-works/development-and-production

### **Development and Production Environments**

Next.js 에서는 개발 단계와 배포 단계에 적용하는 기능을 다르게 적용하고 있다. 예를 들어, **개발 단계에서는 개발자와 앱을 빌딩하는 경험을 최적화하는 것이 중요하기 때문에, DX 개선에 초점**을 맞춰서 기능을 제공한다. 예를 들면, 빌트인된 타입스크립트, ESLint 의 Integration, [Fast Refresh](https://nextjs.org/docs/architecture/fast-refresh) 같은 경우가 있다. 하지만, **배포 단계에서는 엔드 유저를 위한 최적화**를 진행한다. 예를 들면, 코드에 빠르게 접근 가능하면서 성능을 개선할 수 있도록 **코드** **transformation** 에 초점을 맞추고 있다. 이렇듯, 환경 별로 달성해야 하는 목표가 다르기 때문에, [개발 → 배포] 까지 과정으로 이어지면서 많은 작업이 필요하며 그 예시가 **Compiled**, **Bundled**, **Minified**, **Code Split** 이다. 

### What is Compiling?

개발자는 Typescript, JSX 같이 개발자 친화적인 언어로 코드를 작성한다. 개발자 친화적인 언어는 물론 효율적이고 직관적이지만, 기계인 브라우저가 이 코드를 이해하기 위해서는 ‘자바스크립트’로 ‘Compile’ 과정이 필요하다. 

![Compile](/assets/img/articles/2023-01-05-minimizing-bundle-size/compile.png)

**컴파일링을 한다는 것은 어떤 언어로된 코드를 받아서, 다른 버전 혹은 다른 언어로 된 결과를 반환하는 과정**이다. Next.js 에서 이런 컴파일 과정은 ‘개발 단계’ 에서 발생한다.

### What is Minifying?

개발자는 인간이 이해할 수 있는 언어로 코드를 작성하기 때문에, 이런 코드는 실제로 코드가 동작하는데 필요하진 않은 Extra 정보(코멘트, 공백, 줄바꿈 등) 가 포함될 수 있다. 

![Minifying](/assets/img/articles/2023-01-05-minimizing-bundle-size/minify.png)

**‘Minification’ 은 코드의 기능에 영향을 미치지 않는 이런 불필요한 정보를 없애는 과정이다.** 목표는 파일의 크기를 줄임으로 앱의 퍼포먼스를 높이는 것이고, Next.js 는 JS 와 CSS 파일들의 크기를 자동으로 최소화해준다. 

### What is Bundling?

개발자는 앱을 여러 ‘모듈’ 즉 ‘컴포넌트’, ‘함수’ 등으로 나눠서 작업한다. 이때 내부 모듈들을 ‘Exporting’ / ‘Importing’. 하게 되고 Third-party 패키지를 사용하거나, 경우에 따라서는 파일의 의존성이 복잡한 웹을 구성하게 될 수 있다. 

![Bundling](/assets/img/articles/2023-01-05-minimizing-bundle-size/bundle.png)

**‘Bundling’ 은 이러 웹의 의존성을 해결(Resolve)하고, 파일들을 합치거나(Merging / Packaging), 번들 사이즈를 최적화하게 된다.** 이때의 목표는 유저가 페이지를 방문할 때 사용되는 파일들의 요청 수를 줄이기 위함에 있다. 

### What is Code Splitting?

Next.js 에서 개발자는 여러 URL 로 접근할 수 있도록 여러 페이지들을 생성하게 되고, 이렇게 만들어진 Page 파일들은 곧 페이지의 **Entry Point** 가 된다. **Code-splitting 은 앱의 번들을 각각의 엔트리 포인트에서 사용되는 더 작은 Chunk 로 나누는 과정이다.** 이때의 목표는 페이지 실행 시, 요구되는 코드를 로딩하면서 앱의 초기 로딩 속도를 개선하기 위함에 있다. 

![Split](/assets/img/articles/2023-01-05-minimizing-bundle-size/split.png)

Next.js 에서는 빌드 단계에서 페이지 디렉토리 내 각각의 파일들은 자동으로 Code Split 하여, 자바스크립트 번들을 생성한다. 추가적으로 페이지 사이에 공유하고 있는 코드들 또한 다른 번들로 분리되어 페이지 Navigate 시 다시 다운로드하지 않도록 방지할 수 있으며, 페이지 초기 로드 이후에는 navigate 하려는 페이지 내부의 코드를 pre-loading 할 수 있다.

### Build Time and Runtime

빌드 타임은 **코드를 프로덕션으로 내보내기 위한 준비 과정**의 시간이다. 일단, 앱이 빌드되면 Next.js 는 production-optimized 된 파일들로 코드를 변환하고 서버에 배포하고 유저가 사용할 수 있는 Ready 상태로 만들어준다. 이 파일들은 아래를 포함한다. 

- Statically generated 된 페이지의 HTML 파일들
- 서버에서 페이지를 렌더링하기 위한 JS 파일들
- 클라이언트 단에서 동적 웹을 구성할 수 있는 JS 파일들
- CSS 파일들

런타임(혹은 request time) 은 **앱이 유저의 요청에 동작할 수 있는 상태**인 시간이며, 이는 앱이 Build 되고 Deploy 된 이후에 동작한다. 

---

## 참고 자료
- https://ko.javascript.info/modules-intro
- https://yceffort.kr/2021/08/javascript-tree-shaking
- https://mui.com/material-ui/guides/minimizing-bundle-size/#development-environment
- https://medium.com/@yashashr/next-js-optimization-for-better-performance-part-1-material-ui-mui-configs-plugins-6fdc48a4e984
- https://web.dev/i18n/ko/code-splitting-with-dynamic-imports-in-nextjs/
- https://ko.javascript.info/modules-intro
