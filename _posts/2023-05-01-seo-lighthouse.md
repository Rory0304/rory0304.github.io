---
title: 'LightHouse 점수 개선을 통한 페이지 고도화'
description: >-
  Performance / SEO / 접근성 및 유의 사항 정리
author: Lois
date: 2024-05-01
categories: [Web, SEO]
tags: [Web, SEO, LightHouse]
pin: false
---
## Lighthouse 지표 살펴보기
### Report Options
- 참고자료: https://github.com/GoogleChrome/lighthouse/blob/HEAD/docs/user-flows.md

**1) Mode**

- **Navigation**: 초기 페이지 로딩 시 성능 분석
    - 초기 페이지가 바로 로드되지 않을 경우에는 콘텐츠 분석이 어려움
    - 폼 제출이나 싱글 페이지 앱 내부 페이지 트랜지션에 관해서는 분석할 수 없음
- **TimeSpan**: 사용자가 정의한 시간 동안 발생한 성능 분석
    - Layout shift나 설정 시간 동안 JS 실행 시간이 오버되는 경우를 측정 가능
    - 전체 성능 지표를 제공하지 않음 (Accessibilty / SEO / PWA 측정은 제외됨)
- **SnapShot**: 특정 상태의 페이지 성능 분석
    - SPA 나 복잡한 폼 내부의 접근성 문제를 측정 가능
    - 인터랙션 내부의 메뉴나 UI 요소의 best-practice를 측정 가능
    - 전체 성능 지표를 제공하지 않음 (PWA 제외)
    - 현재 DOM 이외의 이슈 (네트워크 연결 문제, 메인 스레드 등)를 분석할 수 없음

**2) Categories**

- **Performance**: 웹 페이지 로딩 과정의 성능 문제 분석
- **Accessibility**: 사용자 접근성 문제 분석
- **Best Practice**: 보안 측면과 웹 개발의 최신 표준 분석
- **SEO**: 검색 엔진에서 얼마나 잘 크롤링 되는지 분석
- **PWA**: 서비스 워커와 오프라인 동작 등 PWA 와 관련된 문제 분석

### Performance 지표 개선 방안

#### [**1) FCP (First Contentful Paint)**](https://developer.chrome.com/docs/lighthouse/performance/speed-index?hl=ko)

브라우저가 첫 번째 DOM 콘텐츠를 렌더링하는데 걸리는 시간, 즉 사용자가 화면의 모든 것을 볼 수 있는 첫 번째 지점으로, 우수한 사용자 환경을 제공하려면 첫 콘텐츠 페인트가 **1.8초 이하**여야 한다. 

- **렌더링 차단 리소스 제거 - Eliminate render-blocking resources**
    - **렌더링 차단 스크립트 제거**
    첫 번째 페인트를 차단하는 모든 URL 중 중요한 리소스는 인라인 처리하고, 중요하지 않은 리소스는 지연시키며, 사용하지 않는 리소스는 삭제하여 URL 영향을 줄인다.
        - 중요 리소스를 식별하는 방법: Chrome DevTools 의 Souces 탭에서 맨 하단의 Coverage 선택 > 녹색 막대가 페이지의 핵심 기능에 중요한 코드이며, 빨간색 막대는 핵심 기능에 사용되지 않는 코드를 의미
        - 불필요한 URl <script> 에 async 혹은 defer 속성을 사용하여 blocking 을 제거한다.
    - **렌더링 차단 스타일 시트 제거**
        
        기본적으로 CSS는 렌더링 차단 리소스로 취급된다. 즉, CSSOM 이 생성되기 전까지는 브라우저가 이전에 처리된 콘텐츠를 렌더링하지 않는다. 따라서, CSS 는 최대한 간단하게 유지하고 가능한 빨리 제공하여 렌더링 차단을 해제해야 한다. [출처: [렌더링 차단 CSS](https://web.dev/articles/critical-rendering-path/render-blocking-css?hl=ko)]
        
        - 스타일을 미디어 쿼리 별로 정리된 여러 파일로 분할하여 렌더링 필요 상황을 명시한다. 미디어 쿼리를 사용하면 특정 사용 사례(예: 디스플레이 또는 인쇄)와 동적 조건(예: 화면 방향 변경, 이벤트 크기 조절 등) 를 설정할 수 있다.
        - `<link href=’other.css’ rel=’stylesheet’ media=’print’ />`
        
- **사용하지 않는 CSS 는 연기시킨다. - Remove unused CSS**
    - 중요하지 않은 스타일시트의 경우 preload 링크를 이용하여 비동기식으로 로드
    
- **과도한 DOM 크기 피하기 - Avoid an excessive Dom size**
    
    DOM 트리가 크면 첫 페이지 로드 시 보이지 않는 노드가 많이 포함되기 때문에 로드 시간이 느려져 사용자 데이터 비용이 증가한다. 또한, 사용자가 페이지와 상호작용 할 때 지속적으로 노드 위치와 스타일을 재계산해야 한다, 
    
    - 페이지에서 많은 요소를 렌더링하는 경우, react-window 라이브러리를 사용하여 생성된 DOM 노드 수를 최소화함
    - shouldComponentUpdate, PureComponent, React.memo 를 이용하여 불필요한 재렌더링을 최소화함
    - Effect 훅을 사용하여 런타임 성능 개선을 하는 경우, deps 를 명확히 명시함
    
- **주요 요청 미리 로드 - Preload key requests**
    
    프리 로드 속성을 지정하여, 중요 리소스는 미리 다운로드할 수 있도록 지시한다. 
    
    - `<link rel=’preload’ href=’ui.js’ as=’script’ />`

- **필수 원본에 사전 연결 - Preconnect to required origins**
    
    페이지에서 다른 출처에 연결 설정하려 할 때, 프로세스를 가능한 빨리 시작할 수 있도록 브라우저에 알릴 수 있도록 함
    
    - `<link rel=’preconnect’ />`
    - 포괄적인 기능인 `rel=’preload’`를 사용하는 것이 좋지만, 가져오는 데이터가 어디서 왔는지 알지만 무엇을 가져오는 알 수 없는 경우(ex: 스트리밍 데이터) 의 경우에는 preconnect 를 유지하는 것이 좋다.
- **웹 폰트가 로드되는 동안 텍스트가 계속 표시되도록 설정 - Ensure text remains visible during webfont load**
    
    일부 브라우저에서는 글꼴이 로드될 때까지 텍스트를 숨겨 보이지 않도록 하여 텍스트 플래시 (FOIT) 가 발생할 수 있음. 
    
    - 일시적으로 시스템 글꼴을 표시하여, 글꼴 로드되는 동안 텍스트가 표시되지 않도록 한다.
        - `@font-face` 스타일에 `font-display:swap` 을 표시하면 대부분의 최신 브라우저에서 FOIT 를 방지할 수 있다.
    - 웹 글꼴을 미리 로드한다.
        - `<link rel=’preload’ as=’font’ />`

#### [**2) Speed Index (SI)**](https://developer.chrome.com/docs/lighthouse/performance/speed-index?hl=ko)

웹 페이지 로드 중에 콘텐츠가 시각적으로 표시되는 시간

- **기본 스레드 작업 최소화 - Minimize main-thread work**
    페이지 로드하는 동안 CPU 시간이 소요된 위치를 분석하여 표시함    

    <img src="/assets/img/articles/2023-05-01-seo-lighthouse/speed-index.png" style="width: 250px" alt="speed-index">
    
    - Script Evaluation
        - [스크롤 핸들러 디바운스](https://web.dev/articles/debounce-your-input-handlers?hl=ko): `requestaAnimationFrame` 콜백으로 디바운스
    - Style & Layout
        - INP (다음 페인트에 대한 상호 작용) 은 사용자가 페이지와 상호작용한 시점부터 다음 프레임을 그려 시각적 UI 를 표시할 때까지의 시간이다. 여기서 중요한 요소는 **‘다음 프레임을 그리는데 걸리는 시간’** 으로, 스타일에 필요한 계산 비용을 줄여 총 렌더링 지연 시간을 줄일 수 있도록 설정한다.
        - 스타일 계산 비용 줄이기: 선택자의 복잡성과 지정 요소 수를 줄인다, BEM 을 이용하여 선택자 매칭 성능 이점을 획득한다.
        - 스타일 재계산 비용 측정 방법: DevTools → Performance → Recalculate Style
    - Script Parsing & Compliation
        - [코드 분할로 자바스크립트 페이로드 줄이기](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting?hl=ko) : webpack, Parcel, Rollup 같은 모듈 번들러를 이용하여 동적 가져오기 (지연 로딩) 를 이용하면 번들 분할이 가능하다.

#### [**3) LCP (Largest Contentful Paint)**](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint?hl=ko)

가장 큰 콘텐츠 요소 (이미지 or 텍스트) 가 렌더링 될 때까지 걸리는 시간이다. 

- 느린 서버 응답 시간 개선 - 서버의 응답 시간은 TTFB (Time to First Byte) 로 측정한다. 사용자와 가까운 CDN 을 이용하여 물리적인 네트 워크 요청 시간을 줄여볼 수 있다.
- `rel='preconnect'` 를 통해 서드 파티 자원의 연결을 일찍 받아올 수 있도록 설정한다. `preconnect` 를 지원하지 않는 브라우저에 대한 폴백으로 `dns-prefetch` 를 추가로 설정해볼 수 있다.
- 번들러를 사용하는 경우 CSS 최소화(공백 혹은 주석 제거 등) 를 위한 적절한 플러그인을 추가한다.
    - webpack의 경우: [optimize-css-assets-webpack-plugin](https://github.com/NMFR/optimize-css-assets-webpack-plugin)
    - Gulp의 경우: [gulp-clean-css](https://www.npmjs.com/package/gulp-clean-css)
    - Rollup의 경우: [rollup-plugin-css-porter](https://www.npmjs.com/package/rollup-plugin-css-porter)
- 이미지 최적화
    - [올바른 크기의 이미지 제공](https://web.dev/articles/serve-images-with-correct-dimensions?hl=ko)
        - 크기를 지정하여 레이아웃 변경을 방지 - img 태그에 width 와 height 설정 / `object-fit` 과 `aspect-ratio` 의 조합 사용
        - 절대 크기와 상대 크기가 모두 설정된 이미지의 경우 [`srcset`](https://developer.mozilla.org/docs/Web/HTML/Element/source#attr-srcset) 및 [`sizes`](https://developer.mozilla.org/docs/Web/HTML/Element/source#attr-sizes) 속성을 사용하여 다양한 이미지를 다양한 디스플레이 밀도 제공
    - [WebP 와 같은 새로운 포멧으로 이미지를 변환한다.](https://web.dev/articles/serve-images-webp?hl=ko)

#### [4) **FID (First Input Delay)**](https://web.dev/articles/fid?hl=ko)

사용자가 처음 페이지와 상호 작용한 시점 (링크 클릭, JS 기반 액션 등)부터 브라우저에서 상호작용에 대한 응답까지의 시간을 측정한 것, 좋은 FID 점수는 **최초 입력 지연이 100ms 이하**여야 한다. (*24년 3월 중 FID 가 INP (다음 페인트에 대한 상호작용) 으로 대체됨)

- **FID 지연이 발생하는 원인**
    - 기본적으로 대용량 JS 파일을 파싱하고 실행하는데 시간이 걸림에 따라 브라우저의 스레드에서 다른 작업을 수행할 수 없어 FID 지연이 발생한다.
    - FCP (First contentful Paint) 와 TTI (Time to Interact) 사이에 페이지 상호 작용을 시도할 시, FID 가 발생한다. 페이지가 일부 콘텐츠를 렌더링했지만 아직 안정적으로 상호작용할 수 없기 때문에 긴 입력 지연이 발생할 수 있다.
    - [참고 자료](https://web.dev/articles/fid?hl=ko)

- 사용하지 않는 자바스크립트 용량을 줄이는 방법
    - 번들을 여러 chunk 로 코드 분할
        - 기본적으로 React 같은 클라이언트 측 프레임워크는 지연 로드를 지원
        - webpack, rollup, parcel 등 모듈 번들러를 사용하여 동적 가져오기 지원
    - async 혹은 defer 를 이용하여 중요하지 않은 JS 코드를 연기
        - `<script defer src="…"></script>`

---

## A**ccessibility 점검하기**

### **1) Links do not have a discernible name, Buttons must have discernible text**

기본적으로 스크린 리더는 button과 a 태그 내의 inner text 를 인식할 수 있다. 하지만, 아이콘 svg 같이 버튼에 대한 설명이 포함되지 않을 경우 aria-label, aria-labelledby 를 사용하여 식별 가능한 텍스트를 덧붙여 설명해주어야 한다. 

ex) 

```tsx
//button
<button id="al" aria-label="Name"></button>

//link
<a href="taxhike.html" aria-label="Read more about Seminole tax hike">[Read more...]</a>
```

- 참고) https://dequeuniversity.com/rules/axe/4.7/button-name
- 참고) https://dequeuniversity.com/rules/axe/4.4/link-name

### **2) Accordion 접근성 개선하기**

주로 만들어 사용하는 아코디언 컴포넌트는 키보드 조작같은 스크린리더기 사용자를 위한 설정이 필요하다. w3에서 설명하는 [아코디언 접근성 문서](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/)를 확인해보자.

```xml
    <div id="accordionGroup" class="accordion"> 
      <h3>
        <button type="button"
                aria-expanded="true"
                class="accordion-trigger"
                aria-controls="sect1"
                id="accordion1id">
          <span class="accordion-title">
            Personal Information
            <span class="accordion-icon"></span>
          </span>
        </button>
      </h3>
      <div id="sect1"
           role="region"
           aria-labelledby="accordion1id"
           class="accordion-panel">
        <div>
          <fieldset>
            <p>
              <label for="cufc1">
                Name
                <span aria-hidden="true">
                  *
                </span>
                :
              </label>
              <input type="text"
                     value=""
                     name="Name"
                     id="cufc1"
                     class="required"
                     aria-required="true">
            </p>
            <p>
              <label for="cufc2">
                Email
                <span aria-hidden="true">
                  *
                </span>
                :
              </label>
              <input type="text"
                     value=""
                     name="Email"
                     id="cufc2"
                     aria-required="true">
            </p>
            <p>
              <label for="cufc3">
                Phone:
              </label>
              <input type="text"
                     value=""
                     name="Phone"
                     id="cufc3">
            </p>
            <p>
              <label for="cufc4">
                Extension:
              </label>
              <input type="text"
                     value=""
                     name="Ext"
                     id="cufc4">
            </p>
            <p>
              <label for="cufc5">
                Country:
              </label>
              <input type="text"
                     value=""
                     name="Country"
                     id="cufc5">
            </p>
            <p>
              <label for="cufc6">
                City/Province:
              </label>
              <input type="text"
                     value=""
                     name="City_Province"
                     id="cufc6">
            </p>
          </fieldset>
        </div>
      </div>
      <h3>
        <button type="button"
                aria-expanded="false"
                class="accordion-trigger"
                aria-controls="sect2"
                id="accordion2id">
          <span class="accordion-title">
            Billing Address
            <span class="accordion-icon"></span>
          </span>
        </button>
      </h3>
      <div id="sect2"
           role="region"
           aria-labelledby="accordion2id"
           class="accordion-panel"
           hidden="">
        <div>
          <fieldset>
            <p>
              <label for="b-add1">
                Address 1:
              </label>
              <input type="text"
                     name="b-add1"
                     id="b-add1">
            </p>
            <p>
              <label for="b-add2">
                Address 2:
              </label>
              <input type="text"
                     name="b-add2"
                     id="b-add2">
            </p>
            <p>
              <label for="b-city">
                City:
              </label>
              <input type="text"
                     name="b-city"
                     id="b-city">
            </p>
            <p>
              <label for="b-state">
                State:
              </label>
              <input type="text"
                     name="b-state"
                     id="b-state">
            </p>
            <p>
              <label for="b-zip">
                Zip Code:
              </label>
              <input type="text"
                     name="b-zip"
                     id="b-zip">
            </p>
          </fieldset>
        </div>
      </div>
      <h3>
        <button type="button"
                aria-expanded="false"
                class="accordion-trigger"
                aria-controls="sect3"
                id="accordion3id">
          <span class="accordion-title">
            Shipping Address
            <span class="accordion-icon"></span>
          </span>
        </button>
      </h3>
      <div id="sect3"
           role="region"
           aria-labelledby="accordion3id"
           class="accordion-panel"
           hidden="">
        <div>
          <fieldset>
            <p>
              <label for="m-add1">
                Address 1:
              </label>
              <input type="text"
                     name="m-add1"
                     id="m-add1">
            </p>
            <p>
              <label for="m-add2">
                Address 2:
              </label>
              <input type="text"
                     name="m-add2"
                     id="m-add2">
            </p>
            <p>
              <label for="m-city">
                City:
              </label>
              <input type="text"
                     name="m-city"
                     id="m-city">
            </p>
            <p>
              <label for="m-state">
                State:
              </label>
              <input type="text"
                     name="m-state"
                     id="m-state">
            </p>
            <p>
              <label for="m-zip">
                Zip Code:
              </label>
              <input type="text"
                     name="m-zip"
                     id="m-zip">
            </p>
          </fieldset>
        </div>
      </div>
    </div>
```

MUI 같은 스타일 라이브러리를 사용할 때에도 대부분 접근성 관련 설정이 빌트인되어있지 않기 때문에, 수동으로 신경을 써주어야 하는 부분이다. 

> For optimal accessibility we recommend setting `id` and `aria-controls` on the `AccordionSummary`. The `Accordion` will derive the necessary `aria-labelledby` and `id` for the content region of the accordion.
(출처: https://mui.com/material-ui/react-accordion/#accessibility)
> 

### 3**) flex 태그의 순서**

속성에  `row-reverse` 또는 `column-reverse` 값을 사용하면 실제 DOM 구조와 화면 표현에 차이가 생기게 된다. 시각적 순서가 UI 적으로 중요해도 스크린리더는 그 순서가 어떻게 되는지 알 수 없기 때문에 유의하여 사용해야 한다. 참고로 order 값으로 순서를 지정하는 방법 또한, DOM 순서와 화면 콘텐츠 순서가 서로 매칭되지 않는다.

### **4) Background and foreground colors do not have a sufficient contrast ratio**

시각 제한을 가진 사용자를 위해 웹 컨텐츠는 충분한 대비 비율을 가져야 한다. 배경 색상과 전경(텍스트 또는 다른 요소) 색 사이의 명도차이가 불분명하다면 Accessibility 경고문이 뜨게 된다. 물론 lighthouse 로 점검이 가능하지만, 선택자를 통한 크롬 익스텐션을 따로 설치하여 확인해보는 것을 추천한다. 

- kwcag a11y inspector : 선택자를 통한 너비, 폰트, 색상 검사
- OpenWAX : 웹 접근성 규칙 종합 검사
- WCAG Color contrast checker : 색상 대비 종합검사

텍스트 콘텐츠 명도 대비는 4.5:1 이상, 확대 가능한 브라우저에서는 최소 3:1이라면 준수하게 여겨진다. 

<img src="/assets/img/articles/2023-05-01-seo-lighthouse/color-seo.png" style="width: 250px" alt='color-seo'> 

---

## SEO

### **1) canonical tag의 설정**

캐노니컬 태그는 웹 사이트 내에 중복된 페이지 URL 이 존재할 경우, 어떤 페이지가 대표 페이지인지 알려주는 역할을 한다. 예를 들어, 사이트 내에 아래와 같은 경로가 있다면 크롤링 엔진은 모두 중복된 경로로 취급하여 잘못된 url 을 대표 페이지 경로로 인식할 수 있다. 

- https://www.example.com/articles
- https://www.example.com/articles?id=1
- https://www.example.com/articles?id=2

canonical 은 rel 옵션을 이용하여 아래와 같이 설정할 수 있다.

```rust
<link rel=”canonical” href=”https://example.com/articles”/>
```

만약, 글로벌 사이트를 만들었다면`rel="alternate"` 와 `hreflang` 속성을 이용하여 모든 언어 버전의 페이지 url 을 설정해준다.

```tsx

<link rel="alternate" hreflang="en" href="https://blog.com/en" />
```

- 매칭되는 언어가 없으면 `x-default` 를 추가한다.
- [langCode](https://developers.google.com/search/docs/specialty/international/localized-versions?hl=en#language-codes) 는 이 링크를 참고한다.

데스크탑 용인지 모바일 용인지도 media 속성을 이용하여 설정할 수 있다

```tsx
<link rel="alternate" href="https://blog.com/" media="only screen and (max-width: 640px" />
```

- 출처: https://armadillo-dev.github.io/dev-diary/seo/dev-diary-rel-canonical-and-alternate-seo/

### **2) Open Graph (OG)**

OG 태그는 웹페이지 url 공유시 보여주는 미리보기라 할 수 있다. 페이스북, 트위터, 네이버, 카카오톡 등 다양한 SNS 플랫폼에서 공유 시 아래와 같은 카드 형식으로 보여줄 수 있다. 

<img src="/assets/img/articles/2023-05-01-seo-lighthouse/og-tag.png" style="width: 250px" alt="og-tag"/>

보통 아래와 같은 `property=”og:title”` 로 표현이 되지만, 트위터의 경우에는 `name=’twitter:title'` 로 표현된다

```json
<meta property="og:url" content="www.youtube.com"> 
<meta property="og:title" content="Example">
<meta property="og:description" content="Example"> 
<meta property="og:type" content="website"> 
<meta property="og:image" content="../images/example.png"> 
<meta property="og:site_name" content="Example">
```

### **3) 구글의 구조화된 데이터 마크업**

각 페이지별로 적절하게 구조화된 마크업 데이터를 포함하면, 구글은 페이지에 대해 더 정확히 내용을 파악할 수 있다. 구조화된 마크업은 페이지의 속성에 따라 맞춰서 작성할 수 있으며, JSON-LD 형식을 취한다. 

- [Google 검색의 구조화된 데이터 마크업 소개](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=ko)

예를 들어, 회사를 소개하는 블로그 포스트의 경우 ‘article’ 마크업을 사용할 수 있다. 각 아티클 페이지 별로 ‘타이틀’, ‘게시 날짜’, ‘저자’ 등의 정보를 포함할 수 있다. 

```json
<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "Title of a News Article",
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
       ],
      "datePublished": "2015-02-05T08:00:00+08:00",
      "dateModified": "2015-02-05T09:20:00+08:00",
      "author": [{
          "@type": "Person",
          "name": "Jane Doe",
          "url": "https://example.com/profile/janedoe123"
        },{
          "@type": "Person",
          "name": "John Doe",
          "url": "https://example.com/profile/johndoe123"
      }]
    }
    </script>
```

‘자주 묻는 질문’ 페이지가 존재한다면, ‘F&Q’ 스키마를 사용하면 더 적절하게 페이지 내용을 표현할 수 있다. 

```json
<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [{
        "@type": "Question",
        "name": "What is the return policy?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "<p>Most unopened items in new condition and returned within <b>90 days</b> will receive a refund or exchange. Some items have a modified return policy noted on the receipt or packing slip. Items that are opened or damaged or do not have a receipt may be denied a refund or exchange. Items purchased online or in-store may be returned to any store.</p><p>Online purchases may be returned via a major parcel carrier. <a href=https://example.com/returns> Click here </a> to initiate a return.</p>"
        }
      }, {
        "@type": "Question",
        "name": "How long does it take to process a refund?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We will reimburse you for returned items in the same way you paid for them. For example, any amounts deducted from a gift card will be credited back to a gift card. For returns by mail, once we receive your return, we will process it within 4–5 business days. It may take up to 7 days after we process the return to reflect in your account, depending on your financial institution's processing time."
        }
      }, {
        "@type": "Question",
        "name": "What is the policy for late/non-delivery of items ordered online?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "<p>Our local teams work diligently to make sure that your order arrives on time, within our normaldelivery hours of 9AM to 8PM in the recipient's time zone. During  busy holiday periods like Christmas, Valentine's and Mother's Day, we may extend our delivery hours before 9AM and after 8PM to ensure that all gifts are delivered on time. If for any reason your gift does not arrive on time, our dedicated Customer Service agents will do everything they can to help successfully resolve your issue.</p><p><a href=https://example.com/orders/>Click here</a> to complete the form with your order-related question(s).</p>"
        }
      }, {
        "@type": "Question",
        "name": "When will my credit card be charged?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We'll attempt to securely charge your credit card at the point of purchase online. If there's a problem, you'll be notified on the spot and prompted to use another card. Once we receive verification of sufficient funds, your payment will be completed and transferred securely to us. Your account will be charged in 24 to 48 hours."
        }
      }, {
        "@type": "Question",
        "name": "Will I be charged sales tax for online orders?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text":"Local and State sales tax will be collected if your recipient's mailing address is in: <ul><li>Arizona</li><li>California</li><li>Colorado</li></ul>"}
        }]
    }
    </script>
```

구조화된 데이터가 잘 작동하는 지 여부는 [리치 검색 결과 테스터기](https://search.google.com/test/rich-results)를 통해 확인할 수 있다. 

![Google tool](/assets/img/articles/2023-05-01-seo-lighthouse/google-tool.png)

### 4**) robots.txt 과 sitemap**

robots.txt는 웹 크롤러의 접근을 제어하기 위한 규약이다. 특정 경로의 크롤링을 제어할 수 있고, 과부화 방지 및 개인 정보 노출을 원하지 않을 경우 사용할 수 있다. 보통 User-agent 와 Allow 를 통해 규약을 작성한다. 만약 `User-agent: *` 로 설정이 되었다면 이는 모든 문서에 대한 봇 접근을 허용하며, `Allow: /` 는 모든 문서에 대한 크롤링을 허가한다는 뜻이다. 특정 경로의 페이지는 허가하고 싶지 않다면 `Disallow: /foo/bar` 를 설정한다. 

```
User-agent: *
Allow: /
```

사이트맵 속성을 설정한다면, 웹 콘텐츠가 크롤링에 잘 발견될 수 있도록 할 수 있다. sitemap 은 XML 로 표현되고, 경우에 따라 sitemap 의 depth 가 추가될 수도 있다. Google Search Console 계정에서 사이트맵 색인 파리은 사이트 당 500개 까지 제출할 수 있고, 한 파일 당 50,000개의 사이트맵 제한이 있기 때문에 한 파일에 모든 정보를 담는 것은 적절하지 않기 때문이다. 따라, 파일로 잘게 쪼개어 sitemap 을 구성해주는 방법을 사용하기도 한다. (참고: [next-sitemap plugin](https://www.npmjs.com/package/next-sitemap))

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>http://www.example.com/sitemap1.xml</loc>
    <lastmod>2012-01-01T11:11:11+00:00</lastmod>
  </sitemap>
  <sitemap>
    <loc>http://www.example.com/sitemap2.xml</loc>
    <lastmod>2012-01-01T11:11:11+00:00</lastmod>
  </sitemap>
</sitemapindex>
```

Google에서 사이트맵 색인을 사용할 수 있도록 하려면 다음과 같은 필수 태그를 사용해야 한다.

출처) [사이트맵 색인 파일로 사이트맵 관리](https://developers.google.com/search/docs/crawling-indexing/sitemaps/large-sitemaps?hl=ko)

| 필수 태그 |  |
| --- | --- |
| `sitemapindex` | XML 트리의 상위 태그입니다. 여기에는 다른 모든 태그가 포함됩니다. |
| `sitemap` | 파일에 나열된 각 사이트맵의 상위 태그입니다. `sitemapindex` 태그의 첫 번째이자 유일한 직접 하위 태그입니다. |
| `loc` | 사이트맵의 위치(URL)입니다. `sitemap` 태그의 첫 번째이자 유일한 하위 요소입니다. 사이트맵 색인 파일에는 최대 50,000개의 `loc` 태그가 포함될 수 있습니다. |

또한 다음의 선택적 태그를 사용하면 Google에서 사이트맵 크롤링 일정을 예약하는 데 도움을 줄 수 있다. 

| 선택적 태그 |  |
| --- | --- |
| `lastmod` | 해당 사이트맵 파일이 수정된 시간을 식별합니다. `lastmod` 태그 값은 [W3C Datetime 형식](https://www.w3.org/TR/NOTE-datetime)이어야 합니다. |

---

## Video / Image

### **Video 사용시 유의할 점**

비디오 태그의 종류는 아래와 같다. 

- `autoPlay`  태그 내부에 autoplay 속성이 존재한다면 비디오가 자동재생 됨. ****autoplay를 비활성화 하려면 해당 속성을 완전히 제거해야 함
- `controls`  소리 조절(volume), 동영상 탐색(seek), 일시 정지(pause)/재시작(resume) 가능함
- `loop` 동영상 재생이 마치게 된 후, 자동으로 처음 프레임으로 돌아감
- `muted`기본값은 false이며, 비디오가 재생되면 오디오도 같이 재생됨. true로 설정 시, 오디오가 나오지 않음
- `post`  사용자가 동영상을 재생하기 전까지 출력되는 포스터 이미지로 이 속성이 명시되지 않으면, 첫 번째 프레임이 사용 가능하게 될때까지 아무것도 출력되지 않다가, 가능하게 되면 첫 번째 프레임을 포스터 프레임으로 출력됨
- `playsInline`  iOS safari에서 비디오가 재생될 때 전체 화면을 막는 속성

autoPlay 속성 사용하고 싶다면, muted 속성과 함께 사용해준다. muted 는 비디오가 자동으로 재생되지만 음소거로 될 수 있도록 설정한다. 대부분의 브라우저에서는 사용자 경험을 위해 자동 재생 비디오는 음소거를 지원한다. 

- android 의 경우 muted 속성을 추가해준다.
- 다만, iOS 의 경우 muted 와 playsinline 속성을 추가한다. 만약, 이 조건들을 만족함에도 재생이 안 된다면 track kind caption 을 제거했는지 확인한다.

주의할 점은 iOS 저전력 모드 일때는 autoplay, muted, playsinline 속성이 동작하지 않는다. 따라, 저전력 모드일 때를 대비한 영상 썸네일 poster 혹은 gif 이미지로 대체하여 보여주는 방법을 적용할 수 있도록 한다.

- [https://simplernerd.com/html-autoplay](https://simplernerd.com/html-autoplay/)

### **Image 사용시 유의할 점**

**1) Properly size images**

적절한 이미지 사이즈를 지정해주지 않을 경우, 로드 시간이 오래 걸려 퍼포먼스 이슈가 발생할 수 있기 때문에 이미지 최적화를 진행해주어야 한다. 이미지 용량이 현재 화면의 이미지 용량보다 과도하게 많으면 사이즈를 줄여서 이미지를 요청할 필요가 있다. 

![Google image size](/assets/img/articles/2023-05-01-seo-lighthouse/google-image-size.png)

만약, cdn 을 따로 사용한다면 해당 이미지에 맞춰 width/height 와 함께 이미지 요청을 한다.

**2) Serve images in next-gen formats**

> Image formats like WebP and AVIF often provide better compression than PNG or JPEG, which means faster downloads and less data consumtion.
> 

PNG 나 JPEG 같은 이미지 포멧보다는 WebP 혹은 AVIF 같은 형식을 취하는 것이 압축률이 더 좋고, 다운로드도 빨라진다고 한다. 하지만, 내 작업의 경우 모든 이미지 파일을 WebP 로 바꿀 수는 없기 때문에 중요한 배너 이미지의 경우 WebP 로 변환하는 작업을 거쳤다. CDN 을 지원하는 경우, format 변환하는 옵션이 존재하기 때문에 적용해봐도 좋을 것 같다

```tsx
https://images.ctfassets.net/{space_id}/{asset_id}/{unique_id}/{name}?fm={image_format}
```

**3) lottie vs gif**

애니메이션 이미지를 보여줄 경우 사용되는 파일 형식이다. 만약 gif 의 이미지 용량이 커서 퍼포먼스 문제가 생긴다면 lottie 로 바꿔보는 것도 한 가지 방법이다. lottie 는 애니메이션을 JSON 형식으로 표현하며 벡터 기반 그래픽을 사용하기 때문에 확대/축소해도 이미지 품질에 영향을 미치지 않는다. 경량화되어 있기 때문에 성능상 유리하다. 다만, lottie 를 지원하기 위해 `react-lottie`를 사용할 경우, 번들 사이즈가 커서 빌드 시점에 용량을 많이 차지 할 수 있다. 따라, `dynamic import`를 시도해보거나 더 가벼운 라이브러리인 `lottie-light-react` 를 사용하는 것이 좋다. 

---

## 참고 자료

- [https://velog.io/@shin6403/React-성능최적화-1편-Lighthouse](https://velog.io/@shin6403/React-%EC%84%B1%EB%8A%A5%EC%B5%9C%EC%A0%81%ED%99%94-1%ED%8E%B8-Lighthouse)
- [https://ui.toast.com/posts/ko_202012101720](https://ui.toast.com/posts/ko_202012101720)
