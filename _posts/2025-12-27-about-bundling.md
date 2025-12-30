---
title: '번들링 톺아보기 (feat. Webpack)'
description: >-
   바닐라 자바스크립트로 SPA 를 만들어보며, 번들링에 대해 배운점을 정리해봅니다.
author: Lois
date: 2025-12-27
categories: [JavaScript]
tags: [JavaScript]
pin: false
---

> 여러 문서를 읽으며, 번들러 학습 내용을 정리한 내용입니다. 원문은 아래 링크를 참고해주세요.
>
> - [Toss - Bundling Fundamentals](https://frontend-fundamentals.com/bundling/get-started.html)
> - [면접관께서 가로되, 번들러가 무엇이냐 물으니](https://sungpaks.github.io/what-and-why-and-how-bundler/#%EB%B2%88%EB%93%A4%EB%9F%AC%EB%A5%BC-%EC%95%84%EC%A7%81%EB%8F%84-%EC%8D%A8%EC%95%BC-%ED%95%98%EB%8A%94-%EC%9D%B4%EC%9C%A0)
> - [Naver D2 - RequireJS AMD의 이해와 개발](https://d2.naver.com/helloworld/591319)
{: .prompt-info }


### Q1. 모듈 시스템이 나오기 전에는 어떻게 개발한거지?
바닐라 HTML/CSS/JS 를 실행해보면 하나의 html 파일 내부에 `<script>`로 임포트한 js 파일을 네트워크 요청하는 것을 볼 수 있다. 이는 파일 수가 커질수록 파일 수만큼의 요청을 보내게 된다. 바닐라 프로젝트를 실행했을때 문제점은 다음과 같다.
- 네트워크 요청은 script 파일 수만큼 보내ㄹ게된다.
- 의존성 문제가 있어서, 임포트 순서를 지켜야 한다.
- 전역 스코프를 공유하고 있어, 변수 네이밍에 유의해야 한다.

프로젝트의 규모가 커질 수록 유지보수 문제가 발생하며, 모듈화를 통해 각 파일의 독립을 보장하면서도 모듈을 그룹화할 수 있는 니즈가 발생하게 되었다.

### Q2. 모듈 시스템의 등장
1) AMD: define 으로 의존성 모듈 관계를 정의한다. -> 직관적이지 않은 문법

2) CJS: reuqire 방식의 의존성 모듈 가져오기, module.exports 객체로 모듈 api 를 정의 -> AMD보다 직관적이지만, 비동기로 가져오는 것이 불가능하여 동기적으로 로딩이 발생한다.

3) ESM: export/import, 트리세이킹 지원, async 비동기 임포트 지원

### Q3. 모던 브라우저에서 번들링이 필요한 이유
> 요즘 브라우저는 import와 export 같은 문법(ESM)을 지원해서 번들링 없이 모듈을 직접 쓸 수도 있어요.
>
> 출처: https://frontend-fundamentals.com/bundling/webpack-tutorial/module-system.html

이 문장은 즉슨, ESM 을 지원하는 코드는 브라우저가 있는 그대로 이해하고 실행할 수 있다는 것이다.

```js
// main.js
import { hello } from './module.js';
hello();
```
즉, 위와 같이 import 를 만나면 해당 파일을 별도의 HTTP 요청을 통해 가져올 수 있다.

ESM 이 등장하기 전까지는 CJS 를 Node.js 진영에서 사용하고 있었기 때문에 브라우저에서 CJS 를 적용해주려면 별도의 작업이 필요헀다. 이때 사용하는 것이 웹팩과 같은 번들러다.
즉, CJS 환경에서 분리된 모듈을 분석하여 의존성 그래프를 생성하고 독립된 스코프를 생성하여 하나의 js 파일로 합치는 번들링 과정을 거치게 된다.

ESM 은 별도의 번들링 과정은 필요없지만, 아직까지 대형 프로젝트에서는 Vite 와 같은 번들러 도구를 사용하고 있다. 그 이유가 뭘까? [Vite 공식 문서](https://ko.vite.dev/guide/why)에서는 다음과 같이 설명하고 있다.

- 번들 되지 않은 ESM을 가져오는 것은 중첩된 import로 인한 추가 네트워크 통신으로 인해 여전히 비효율적이다.
- 프로덕션 환경에서 최적의 로딩 성능을 얻으려면 트리 셰이킹, 지연 로딩 및 청크 파일 분할을 이용하는 것이 좋다.

그 외에도 개발 환경에서 HMR 을 지원하여 전체 페이지 리로딩없이도 변경된 소스코드를 바로 반영할 수 있도록 하며, Sourcemap을 지원하여 더 나은 디버깅 경험을 보장한다.


#### TL;DR
번들러가 여전히 필요한 이유를 정리하면 다음과 같다. 
- 모듈을 나눴으면 브라우저 환경에서 사용할 수 있도록 다시 묶는 과정이 필요하다.
  - 100번의 요청을 하나로 그룹화해서 1번만 요청하면 된다.
- 대부분의 브라우저에서 ESM 을 지원하기에 번들링이 꼭 필요한 것은 아니지만, CJS 환경은 별도의 번들링이 필요했다. 구형 브라우저 호환성을 위해서는 여전히 번들링이 필요하다.
- TSX 를 JSX 로 변환하거나, ES6+ 문법이 ES5에서도 호환하게 하는 작업은 정확히 번들러와는 다른 Transpile 범주에 속하긴 하지만, 대부분 함께 사용이 된다. (바벨 + 웹팩의 조합)
- 사용하지 않는 공백을 제거하는 minification 작업과 사용하지 않는 코드를 제거하는 tree-shaking 최적화를 진행할 수 있다.
- Sourcemap 의 생성으로 디버깅 경험을 보장한다.
- HMR(Hot Module Replacement) 을 지원하면서 개발 환경에서 페이지 리로딩 없이 코드 변경사항을 반영할 수 있다.


### Q4. tsconfig 'moduleResolution' 옵션에 대해
moduleResolution은 컴파일러가 각 import가 어떤 모듈을 가리키는지 해석하는 과정을 명시한다.
런타임 모듈 해석은 Node.js나 번들러(Webpack, Vite 등)가 담당할 수 있다. 

- 'node16' or 'nodenext': Node.js v12 이상의 환경, ESM 과 CJS 를 둘다 지원한다.
- "node(node10)": Node.js 버전 v10 하위 버전일 경우 적용, CJS 를 필수적으로 사용한다.
- "bundler": package.json 의 imports/exports 를 지원한다. node resolution 과는 다르게, import 구문 내부의 파일 확장자를 요구하진 않는다. 즉, 번들러 설정값에 따라 진행한다.


### Q5. 번들러가 어떻게 코드의 변경점을 찾을까?
개발 서버의 동작 방식은 코드를 처리하는 방식에 따라 두 가지로 나뉜다. 자세한 내용은 [토스 번들러 문서](https://frontend-fundamentals.com/bundling/deep-dive/dev/dev-server.html) 를 참고한다.

1) 번들링 기반 개발 서버 (ex: Webpack, Rollup)
- 서버 실행 시 프로젝트의 의존성을 분석하여 하나의 번들로 묶는다.
- 프로젝트 규모가 커질수록 분석해야 할 파일과 의존성이 많아져서 최초 실행 시간이 길어질 수 있다.
- 하지만 구동 후에는 HMR 을 통해 변경된 모듈만 빠르게 반영한다.

2) ESM 기반 개발 서버 (ex: Vite)
- 모듈을 사전에 번들링하지 않고, 브라우저가 필요한 모듈만 실시간으로 요청한다.
- 서버 실행 시 전체 프로젝트를 번들링할 필요가 없어서 빠르게 실행할 수 있다.

### Q6. HMR 의 동작 원리
#### 출처
- [Toss HMR](https://frontend-fundamentals.com/bundling/deep-dive/dev/hmr.html)
- [webpack-dev-server와 HMR](https://yoiyoy.gitbooks.io/dev/content/hot-module-replacement.html)

#### 과정
**Step1: 파일 변경을 감지하고 번들링**

웹팩에서 HMR 이 활성화되면 웹팩의 watch 기능이 변경된 파일을 감지하고, 감지된 파일은 다시 컴파일되어
메모리상에 저장된 번들로 생성된다. 그 다음 파일의 정보를 **웹소켓으로 브라우저에 전달**된다.

**Step2: 브라우저에서 변경된 모듈 요청**

브라우저는 웹소켓으로 받은 정보를 바탕으로 변경된 모듈을 서버에 요청하고 런타임에 모듈을 교체한다.

**Step3: 런타임에 변경된 내용을 반영**

모듈이 교체되었지만 교체된 내용을 화면에 다시 그리는 작업도 필요하다. 런타임에 동작을 구현하기 위해서는 **HRM API**를 사용한다. 

- HMR API 이벤트 전파 과정

특정 모듈이 업데이트되면 해당 모듈에서 이벤트가 버블링으로 전파된다. 전파 과정에서 accept 메소드의 핸들러를 통해 렌더링 이벤트를 다시 호출해서 렌더링을 처리한다. 만약 이벤트를 받는 accept 핸들러가 없다면 브라우저가 새로고침된다.

![hot-module-replacement](https://frontend-fundamentals.com/bundling/images/hmr-2.png)


### Q7. 소스맵이 필요한 이유
#### 출처
- [소스 맵을 사용하여 프로덕션에서 압축된 TypeScript 탐색하기](https://leapcell.io/blog/ko/ssos-map-eul-sayonghayeo-peurodeoksyeon-eseo-apsugdoen-typescript-tamnagsahagi)
- [Webpack 공식문서](https://webpack.js.org/configuration/devtool/)

소스맵이 없으면 브라우저는 bundle.js 의 코드만 확인이 가능하기 떄문에, 원본 코드의 어느 부분에서 문제가 발생했는지 파악이 어려워진다. (minify + uglify + 최적화)

웹팩에서는 소스맵을 어떤 식으로 읽어오는지에 대해 `devtool` 을 설정할 수 있고 여러 옵션이 존재한다. default 값은 development 모드에서 `eval` 이다. `production` 에서는 `false` 로 설정되어 기본적으로 생성하지 않는다.


1) `false`

만약 false 처리가 된다면 소스맵 자체가 생성되지 않는다.

2) `eval`
- 각 모듈을 eval() 및 `//# sourceURL`로 실행
- 빌드 속도는 빠름
- 원본 코드 대신 트랜스파일된 코드에 매핑되어 줄번호가 올바르게 표시되지 않음
- 소스맵 파일이 존재하지 않음

![sourcemap-eval](/assets/img/articles/2025-12-27-about-bundling/sourcemap-eval.png)

3) `eval-source-map`
- 각 모듈을 eval()으로 실행되고 소스맵을 eval()에 DataUrl로 추가
- 초기 빌드가 느리지만, 리빌드를 빠르게 제공하고 실제 파일을 생성
- **줄 번호는 원본 코드에 매핑**되므로 올바르게 매핑됨
- 최고 품질의 개발용 소스맵을 생성

![eval-source-map](/assets/img/articles/2025-12-27-about-bundling/eval-source-map.png)

4) `eval-cheap-source-map`
- eval-source-map과 유사하며 각 모듈을 eval()으로 실행
- **열 매핑이 없고 줄 번호만 매핑하므로 비용이 "저렴"**
- 로더의 소스맵을 무시하고 eval devtool과 비슷하게 트랜스파일 된 코드만 표시함. 따라서, **원본 코드의 줄 번호와 매핑되지 않음**

5) `eval-cheap-module-source-map`
- eval-cheap-source-map과 유사하지만, 이 경우 더 나은 결과를 위해 로더의 소스맵을 사용함. 따라서 **원본 코드의 줄 번호와 매핑됨**

프로덕션의 경우 `source-map`, `nosources-source-map` 또는 `hidden-source-map`과 같은 옵션을 일반적으로 사용한다.

6) `source-map`: 별도의 .map 파일을 생성한다. 하지만, 배포시 .map 파일을 함께 업로드하지 않도록 주의해야 한다.

7) `nosources-source-map`: sourcesContent 필드 없이 소스 맵을 생성. 즉, 스택 추적 및 줄 번호는 볼 수 있지만 원본 소스 코드 내용은 수동으로 업로드하지 않는 한 **디버거에 표시되지 않는다.**

8) `hidden-source-map`: 소스 맵을 생성하지만 번들링된 출력에 `//# sourceMappingURL=` 주석을 추가하지 않는다. 추후 센트리와 같은 로깅 툴을 사용할 경우, SentryWebPackPugin 을 연동하고 `filesToDeleteAfterUpload` 옵션을 통해 prod 환경에서 소스코드 노출 없이 로깅이 가능하다.
