---
title: '[트러블슈팅] 실시간 서비스에서 발생했던 FE 문제 해결 과정 정리'
description: >-
  개발 인생 처음으로 경험했던 동시접속자 이슈 회고
author: Lois
date: 2025-08-17
categories: [Next.js]
tags: [Next.js, TroubleShooting]
pin: false
---

## 배경
지난 4월 18일 진행했던 첫 베타 버전의 라이브 방송에서 100명 이상의 접속자가 동시 시청 및 상품 구매를 진행하였다. API 딜레이, 채팅 서버 문제 등 부하가 발생하여 원활하게 라이브 방송이 진행되지 않아 아쉬움이 많이 있었던 방송이었다.
당시에는 꽤 큰 고객 문제였기 때문에 밤을 세워서 문제 파악 및 대처 방안을 탐구해야 했고, 프론트에서도 최대한 API 횟수를 줄여보는 등 서버 부하를 줄여보기 위한 시도를 진행했다. 
지금 시점에서는 다행히 안정화가 되어, 그때의 기억을 떠올려 회고해본다.

## 목차
- 문제1. API 응답이 느려요
- 문제2. 이미지 로딩이 느려요
- 문제3. 버튼이 안 눌려요
- 문제4  채팅 메세지 전송이 되지 않아요

## 문제1. API 응답이 느려요
동시 접속자가 많이 발생하면서, Next.js 기반의 웹 화면 접속은 가능했으나 이후 사용자가 구매버튼을 클릭하거나 상품 리스트를 확인하는 등 액션을 취할 때 API pending 상태가 지속되었다. 해당 문제의 원인은 한 가지가 아니였고, 요약해보자면 다음과 같다.

**1) Auto-Scaling 이 자동으로 되지 않았던 문제**

백엔드 팀원분이 말씀하시길, 큰 방이 있는데 문이 하나라 유저가 한 명씩 들어갈 수만 있고, 앞선 요청들을 처리하느라 대기줄이 발생한 것이라고 하셨다. 이는 인프라단에서 로드 밸런서 auto scaling 을 활성화해줌으로써 해결을 하였다.

**2) 결제 서버 API 단에서 DB lock이 걸린 문제**

하나의 상품에 대해 여러 사용자가 동시에 결제하는 상황에서, 앞선 사용자가 카드 잔액 등으로 결제 과정에서 오류가 발생하였을 때 서버 API 로직에서 DB Lock 이 걸리는 문제가 있었다. 따라서 해당 결제 Lock 이 풀리지 않으면 뒤에서 처리되고 있는 사용자가 계속 pending 상태로 머물게 되는 문제가 있었다.

**3) CPU나 메모리 사용수치는 그리 높지 않았는데, DB transcation 만 높았던 문제**

DB transaction은 DB 상태를 변화시키기 위해 수행하는 작업의 논리적 단위로, 실제 동시접속자가 몰렸을떄 CPU나 메모리 사용량은 높지 않았는데 DB 트랜젝션이 유독 높아서 해당 수치를 줄이기 위해 백앤드와 협업하여 프론트에서 API 수를 최대한 줄여보아야 했다.

###  1) react query의 디폴트 옵션 처리
react query 의 기본 옵션 중 `refetchOnWindowFocus` 가 있다. 해당 옵션은 유저가 윈도우에서 나갔다가 다시 focus 했을 때
쿼리 데이터가 stale 하다면 자동으로 refetch 되는 옵션이다. 브라우저 내부 window 객체 이벤트 중에 `visibilitychange` 라는 이벤트가 있는데 브라우저 탭의 콘텐츠가 보이거나 숨겨질 때를 감지하고, `focus`는 창을 활성화한 상태를 감지할 수 있다.

```ts
focusManager.setEventListener((handleFocus) => {
  // Listen to visibilitychange and focus
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('visibilitychange', handleFocus, false)
    window.addEventListener('focus', handleFocus, false)
  }

  return () => {
    // Be sure to unsubscribe if a new handler is set
    window.removeEventListener('visibilitychange', handleFocus)
    window.removeEventListener('focus', handleFocus)
  }
})
```

해당 옵션은 기본적으로 true 로 처리가 되어 있다. 라이브 환경에서 셀러가 실시간으로 재고와 가격 수정을 하는 경우가 빈번하여 해당 옵션은 true 로 처리하여 빠른 상태 동기화를 지원해주었는데, 이번에 서버 부하가 발생하자 유저가 문제가 발생한 줄 알고 **탭이나 화면을 잠깐 나갔다가 들어오는 등의 액션**을 취하게 되면서 API 호출도 그에 따라 증가되는 이슈가 발생하게 되었다.

당시 서버의 부담으로 API 대기 지연이 발생하는 것을 방지하는 것이 제일 큰 목표였기 때문에, 동시성이 중요한 기능의 경우는 따로 refetch를 작성해두었고 전역으로 해당 옵션을 false 처리하였다. 그 밖에도  `retry` 라는 옵션이 있는데, API 요청이 실패했을 때 재시도하는 횟수를 조절할 수 있다. retry 의 경우 에러 코드를 코드 상 해주고 있었기 떄문에 중복으로 retry 처리를 하지 않아도 된다. 따라, 해당 옵션도 0으로 처리해주었다.

```ts
retry: 0,
refetchOnWindowFocus: false
```

### 2) BottomSheet 로직 개선
라이브커머스 특성 상, 송출 화면은 최대한 단순해야 하기 때문에 BottomSheet 를 사용하여 UI를 많이 숨겨주었다. 현재 사용되는 BottomSheet 만 해도 8개 이상(결제, 프로필, 배송지, 상품 정보 등) 이다. 문제는 이렇게 숨겨진 BottomSheet 들이 초기 웹에 접속했을 때 mount 되면서, 숨기지 않은 상태에서도 API 를 fetch 하고 있는 것이 문제였다.
불필요한 데이터는 최대한 fetch 하지 않는 것이 좋기 떄문에, Bottomsheet 가 open 상태에서만 fetch 를 할 수 있도록 구조를 변경해주었다.

```tsx
const { data } = useQuery({ enabled: isOpenBottomSheet })
```

또한, 바텀시트의 open 상태는 zustand 를 이용하여 페이지 한정하여 전역으로 상태를 관리해주고 있었는데, 아래와 같이 presentation 이라는 스토어에서 한 번에 관리를 해주고 있었다.
```tsx
const presentationStore = {
  isOpenProfileBottomSheet: false; // 프로필
  isOpenProductOrderBottomSheet: false // 결제
}

const usePresentationStore = useStore(presentationStore);

// 바텀시트 로직 단 
const { isOpenProfileBottomSheet, isOpenProductOrderBottomSheet} = usePresentationStore();

```
해당 코드의 문제점은 특정 바텀시트의 상태값을 가져올 때마다, 전체의 presentation 상태를 가져와야 한다는 것이다. zustand 가 상태 변경 여부를 판단할때, 객체의 내부값이 아니라 참조값을 기준으로 비교하기 때문이다. 특정 바텀시트의 open 여부만 알면 되는 것이지 전체 바텀시트의 open 여부는 불필요한 데이터다. 따라서, zustand store의 값을 최적화하기 위해서는 object 형태로 들고 오되, 필요한 상태만 구독하거나 useShallow 방식을 적용해주어야 한다.

```tsx
// AS-IS
const { isOpenProfileBottomSheet } = usePresentationStore();

// TO-BE
const isOpenProfileBottomSheet = usePresentationStore((state) => state.isOpenProfileBottomSheet);
```

리렌더링을 더 최소화 하고 싶다면 [shallow 기능](https://zustand.docs.pmnd.rs/guides/prevent-rerenders-with-use-shallow)을 활용하여, 해당 스테이트의 값이 이전값과 다른지 비교후 달라졌을 때만 렌더링을 시켜줄 수 있다.

```tsx
import shallow from 'zustand/shallow'

const { isOpenProfileBottomSheet, isOpenProductOrderBottomSheet } = usePresentationStore(
  (state) => ({ isOpenProfileBottomSheet: state.isOpenProfileBottomSheet, isOpenProductOrderBottomSheet: state.isOpenProductOrderBottomSheet }),
  shallow
)
```

서버단의 DB transaction 문제를 위 방식을 취하여 해결을 시도하였고, 그 결과 초기 진입에서 사용되던 API 호출수를 15 -> 10번으로 줄일 수 있었다.

## 문제2. 이미지 로드가 느려요
### 1) 원본 이미지의 용량을 줄이기 
셀러마다 상품을 100개 이상씩 등록하는 경우가 있었는데, 따로 이미지 최적화를 할 수 있는 기능이 적용되지 않았다보니 정방향 원본 이미지 용량 그대로 업로드되는 경우가 있었다. 앱에서는 이미지를 정방향 crop으로 하고 있었고, 앱 자체에서 이를 다시 Resize 하기에는 렌더링되는 비용과 시간이 소요되다보니 프론트가 아닌 서버에 이미지 업로드 API 를 호출했을 때 resize query 도 같이 보내는 것으로 해결을 해주었다.

하지만 이미지 용량을 줄인 것과 별개로 100개의 이미지를 페이지네이션으로 여러번 호출하였을때 웹이 터지는 문제가 발생하였다. 실제로 실사용자 50명 정도가 100개 이상의 이미지를 페이지네이션 한 상황에서 웹이 죽어버렸고, AWS 대시보드에서 확인해보니 CPU 사용률도 99%까지 치솟았다.

### 2) Next image 컴포넌트를 적절히 사용하기
Next.js 이미지의 서버사이드 호출이 서버 부담이 생기는 것인가 싶어서 순수 img 태그로 변경해주어 해결을 할 수 있었다. 무지성으로 Next 이미지 컴포넌트를 사용했던 것이 문제였다. 

#### Next.js 이미지 최적화 과정
여기서 잠깐 Next.js 이미지를 최적화하는 과정을 살펴보자. 우리가 Next 웹앱을 서버에 올리고 next build 를 하게 되면 자체적인 로직에 의해 .next 폴더와 minial한 sever.js 파일을 만들어 Next 웹을 실행한다. (참고: [공식 문서](https://nextjs.org/docs/app/api-reference/config/next-config-js/output))

next 기본 설정으로 [unoptimized](https://nextjs.org/docs/app/api-reference/components/image#unoptimized) 가 false 로 설정되어 있다. 이 설정으로 인해 서버에서 이미지 최적화를 진행한다. Next Image 컴포넌트를 외부 이미지 링크와 함께 호출을 하게 되면 Next 웹 서버에서 이미지 [defaultLoader](https://github.com/vercel/next.js/blob/0fdaf93770d66d61b588bc8d06c5ec2ec0e66323/packages/next/src/shared/lib/image-loader.ts#L97C1-L100C11) 가 실행되어 내부적으로 `/_next/image` 라는 이미지 최적화를 위한 라우트를 만든다. 이게 곧 src 로 변환이 되어 요청이 된다.

![next image cache](/assets/img/articles/2025-06-12-live-troubleshotting/next-image-cache.png)

이렇게 변환된 `/_next/image` 는 첫 요청이 들어왔을 떄 서버에서 최적화된 이미지를 만들어 `<distDir>/cache/images` 폴더에 동적으로 저장을 한다. 추후 요청이 왔을 때 캐시된 최적화 결과를 재사용하게 되어 빠른 속도로 보여줄 수 있게 된다. (참고: [내부 소스 코드](https://github.com/vercel/next.js/blob/canary/packages/next/src/server/image-optimizer.ts))


#### CDN 과 next 이미지 컴포넌트
위 과정에서 보았듯, next 기본 설정으로 `unoptimized` 를 false 처리해두었다면
**[ API 로 리사이징된 이미지를 S3 에 저장 > CDN 의 캐시 설정 지원 > CDN 의 이미지 URL 호출 > 이미 캐시된 이미지를 next 서버의 캐시 폴더에 다시 최적화하여 저장 ]**하게 되며 최적화나 캐시의 과정을 2번씩 호출하게 되는 문제가 발생하게 된다.

더 큰 문제는 100개의 이미지를 페이지네이션하면서 Next 웹서버에서 최적화를 하게 되어 서버 CPU 부담이 생기게 되어 웹이 뻗어버리는 것이였다. 

[Github 에서도 관련 이슈](https://github.com/vercel/next.js/discussions/21294)가 있었고, [CDN 으로도 충분하다는 의견](https://github.com/vercel/next.js/discussions/21294#discussioncomment-8361960)이 대다수였다. Next config 설정에서 `unoptimized` 설정을 true 로 설정하여 기본적인 최적화를 막거나 NextImage 컴포넌트에서 false 처리를 해주는 방법, 순수 img 태그를 취하여 해결할 수 있다. 

```tsx
import Image from 'next/image'
 
const UnoptimizedImage = (props) => {
  // Default is false
  return <Image {...props} unoptimized />
}
```

```js
module.exports = {
  images: {
    unoptimized: true,
  },
}
```

결과적으로 서버 API 에서 이미지 리사이징으로 용량을 줄임 + lazy load + CDN 적용으로 인해 이미지가 보다 빠르게 로드가 될 수 있었다.

![next-image-optimization](/assets/img/articles/2025-06-12-live-troubleshotting/next-image-optimization.png)

## 문제3. 버튼이 안 눌려요
셀러가 선착순 구매 이벤트를 진행하면서, 유저들이 이벤트 달성을 위해 동시에 다수의 결제 버튼을 클릭하여 구매 애니메이션 UI 가 연속으로 보여지게 되었다.
참고로 구매 애니메이션 UI는 다음과 같다.

![chat-animation](/assets/img/articles/2025-06-12-live-troubleshotting/chat-animation.gif)

구매 이벤트가 동시에 여러개 발생하게 되면서, 애니메이션이 그려지는 동안 앱 화면과 iOS 웹에서 유저가 누른 버튼이 제대로 실행되기까지 지연되는 문제가 발생했다.

### 원인
당시에는 UI Blocking 문제를 예상하지 못하여, `renderChatMessage` 이라는 map 함수를 통해 애니메이션 socket 이벤트를 단순히 뿌려주고 있었다.

```tsx
// Fade out 을 위한 메세지 제거
const removeMessage = (messageId: number) => {
  messages.filter(( ... ))
}

// 신규 메세지 추가 후, animation 타이머 시작
useEffect(() => {
  const timers = messages.map(item => setTimeout(() => removeMessage(item), 1000));
  return () => timers.forEach(clearTimeout);
}, [messages]);


const renderChatMessage = (message) => {
  // fade in, fade out 적용된 애니메이션 컴포넌트
  return <EventChatMessage message={message} />
}

return(
  <AnimatePresence>
      {messages.map(renderChatMessage)}
  </AnimatePresence>
)
```

여기서 나는 JS 가 싱글스레드로 동작한다는 것을 잊지 말았어야 했다...싱글 스레드 특성 상, 콜스택이 높은 빈도로 점유를 하고 있다면 다른 작업을 처리하기 까지 딜레이가 발생하기 때문이다. UI Blocking 이 생기는 이유도, 콜스택이 비워지지 않으면 대기중인 UI 액션들도 콜스택으로 갈 수가 없기 때문에 실제로 이벤트가 발생하여도 뷰에 보여지기까지 지연 현상이 발생하게 된다. 또한 Timer 를 제대로 cleanup 하지 않으면 모바일 기기에서 메모리 점유가 발생하여 앱이 간혹 크래시되는 문제도 있었다. 

### 해결
구매 이벤트 애니메이션의 경우 1회성 이벤트이며 히스토리가 남지 않는 심미성을 위한 UI 이다. 따라, 애니메이션의 경우 구매 이벤트가 100번 이상 동시 발생하였을 때 100개의 이벤트를 모두 순차적으로 렌더링하는 것이 아니라, 최대 20개의 최신 이벤트를 큐에서 다루고, 이를 5개씩 순차적으로 애니메이션을 보여줄 수 있도록 타협을 하였다.

1. 메시지 큐: 최신 메시지들을 큐에 저장하며 최대 maxsize 가 20으로 한정한다.
- 만약 socket 으로부터 들어온 이벤트 메세지가 maxSize 를 초과한다면, 최신 20개의 메세지만 남기고 이전의 메세지는 삭제한다.
- max 20을 지정한 이유: 히스토리가 유지되어야 하는 채팅 메세지면 모르겠으나, 오로지 심미성을 위한 애니메이션 컴포넌트라면 예측 가능한 메모리를 지정하여 메모리 누수를 방지하는 것이 좋을 것이라 생각했다.

2. 디스플레이 큐: 메세지 큐에 데이터가 있을 때마다 5개씩 렌더링한다.
- 배치 처리: 메시지 큐에서 최신 메세지 중 최대 5개의 메시지만 먼저 화면에 표시하고, 남은 메세지가 있다면 interval로 배치 처리한다.
- 메세지는 1.5초 정도 보여주고, 자동으로 fade out 되어 제거된다.
- max 5를 지정한 이유: 메세지가 동시에 fade-in / fade-out 이 보여졌을 때 사용자가 읽기 편해야하기 때문에, display 의 최대 수에도 제한을 두었다.

3. CleanUp: 타이머 정리를 하여 메모리 누수 방지한다.

## 문제4. 채팅 메세지 전송이 되지 않아요
문제의 발단은 서버 부하로 채팅 API 및 소켓 응답이 제대로 되지 않았던 문제였다. 현재 백엔드 구조 상, 일반 API 스펙과 채팅 API 스펙이 같은 DB 에서 사용되고 있었는데,
사용자가 늘어남에 DB 부하를 줄이기 위해 로드 밸런서와 분산 DB로 작업을 진행해주어야 했고, 이를 Redis 를 적용해주는 작업이 진행되었다.

이상하게도, Redis 로 마이그레이션 시점 이후, 채팅 연결 시도 시 `Socket transport error` 가 지속하여 발생하였다. 해당 오류가 특히 websocket 으로 upgrade 되는 과정에서 발생한 transport 정책과 관련된 문제라, 확인해봤을 때 FE/BE 둘다 polling -> websocket 으로 동일하게 설정되어 있어서 해결책을 찾는데 시간이 걸렸다.

본래라면 polling 첫 시도로 인해 Long polling HTTP 로 요청을 보내고 그에 따라 응답을 받아야 하는데, 각 요청이 독립적이고 상태를 유지하지 않는 특성으로 인해 접속되는 Worker 가 계속 변하면서 요청들이 각각 다른 서버로 라우팅되어 발생하는 문제인듯 했다.

WebSocket 전송 방식은 전체 세션에 대해 TCP 통신을 하기 때문에, 백엔드 팀원분이 HTTP long polling 방식을 비활성화하는 방안을 제안해주셨고, 모든 브라우저의 대응보다는 고객 한 사람의 이슈를 해결하는 것이 중대했기 때문에 Websocket 을 우선적으로 통신하는 것으로 타협하였다.

```tsx
import { io } from "socket.io-client";

const socket = io({
  transports: ["websocket"],
  // { ... }
});
```
