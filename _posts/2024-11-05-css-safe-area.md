---
title: '[CSS] 노치 영역 대응하기'
description: >-
  CSS 로 웹과 웹뷰의 노치 영역을 대응하는 방법을 알아봅니다.
author: Lois
date: 2024-11-05 3:07 PM
categories: [CSS, CheatSheet]
tags: [CSS, WebView, CheatSheet]
pin: false
---

## CSS 로 노치 영역 대응하기

### 1. viewport-fit=cover
```html
<meta name="viewport" content="... viewport-fit=cover" />
```
viewport-fit 을 지정하지 않으면, 기본값은 'auto' 로 콘텐츠를 모두 보여줄 수 있도록 디스플레이에 축소하여 보여준다.
'cover' 로 지정 시, viewport 를 디바이스의 전체 화면으로 확대할 수 있도록 설정할 수 있다.


### 2. env()

env()는 환경 변수로 정의된 값을 CSS에 삽입할 수 있는 방법이다. iOS 브라우저에서 뷰포트의 safe-area 의 값은 미리 정의되어 있기 때문에, 노치 영역으로 가려진 콘텐츠를 모두 보여줄 수 있도록 `env(safe-area-inset-*)` 를 적용하면 된다.

```css
/* 대체값 없이 네 가지 안전 영역의 인셋(inset) 값 사용하기  */
env(safe-area-inset-top);
env(safe-area-inset-right);
env(safe-area-inset-bottom);
env(safe-area-inset-left);

/* 대체값과 함께 사용하기 */
env(safe-area-inset-top, 20px);
env(safe-area-inset-right, 1em);
env(safe-area-inset-bottom, 0.5vh);
env(safe-area-inset-left, 1.4rem);
```


### 3. 기타
- 노치 영역 혹은 펀치홀이라고도 불린다.
- safe-area-insets 의 값들은 iOS 에서 사용되는 노치 대응 값들이며 모든 브라우저에서 지원하고 있다. 하지만, 안드로이드의 safe area 는 대응하기 어렵기 때문에 해당 값들은 수동으로 설정해주어야 한다. 
현재 react-native 기반의 웹뷰를 사용하고 있었기 떄문에, 웹뷰에서 로드 시 Android 기기에 대응되는 `statusBarHeight` 을 웹뷰에 이벤트(`ReactNativeWebView.postMessage`) 로 보내주어 적용해주었다.
- 만약 웹뷰 환경이 아니라, 순수 웹의 환경에서 안드로이드 기기 대응 시에는 @aashu-dubey/capacitor-statusbar-safe-area 라이브러리를 사용하는 방법도 고려해야 할 것 같다.



## Ref
- [MDN: Viewport meta tag](https://developer.mozilla.org/ko/docs/Web/HTML/Guides/Viewport_meta_element)
- [MDN: env()](https://developer.mozilla.org/ko/docs/Web/CSS/env)
