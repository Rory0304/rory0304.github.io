---
title: 'RxJS 로 polling 을 구현하는 방법 탐구'
description: >-
   프론트에서 api 를 주기적으로 호출하여 서버의 response 를 확인하는 방법은 무엇일까?
author: Lois
date: 2023-01-05
categories: [JavaScript]
tags: [JavaScript, Rxjs]
pin: false
---

## 배경
서버에서 대량의 데이터를 처리하는 과정에서 비동기 작업에 시간이 소요되었고,
프론트는 해당 작업이 언제 끝나는지 알지 못하기 때문에, 작업이 끝났는지 여부를 확인하는 엔드포인트를 주기적으로 호출하는 polling 을 구현해주어야 했다. 

> 
> 1) 대량의 데이터 처리를 위한 [POST]/bulk 를 요청한 후, `taskId`를 받는다.
>
> 2) `taskId`를 기준으로 [GET]/progress 를 요청한다. 이때 응답은 비동기 작업이 끝났다면 `true`, 끝나지 않았다면 `false`이다.
> 
> 3) 만약 비동기 작업이 50초 이상 소요되거나, 중간에 유저가 요청 취소를 할 경우  polling 요청을 끝낸다.
> 

polling 을 구현하면서, 처음에는 `setInterval`과 `setTimeout` 을 활용하여 순수 JS 로 구현을 해보았으나 API 요청 이후 후속 작업처리가 까다로웠다. 코드를 이해하기도 쉽지 않았고, 팀의 컨벤션에도 맞지 않아 RxJS 를 적용해보기로 했다.

---

## Polling 이란
우선, polling 이 무엇인지에 대해 알아보자. http 모델은 클라이언트 request에 따른 서버의 response 를 얻을 수 있는 단방향 구조이다. 하지만, ‘양방향’인 것처럼 만들어주어야 할 상황도 생겼고, 당시에 고안된 방식이 polling 이다.

**polling 은 클라이언트에서 서버로 주기적으로 request 를 하는 방법**이다.
시간 간격을 유지하며 요청할 수 있기에 응답 간격 또한 유지할 수 있다. 하지만, 이 방식은 실시간 통신이 필요할 경우 적합한 방식은 아니다. 시간 간격을 줄여서 요청을 계속 보내면 서버 부하가 생길 수 있기 때문이다.

이를 개선한 방식이 long polling 이다. 주기적으로 물어보는 polling 과는 다르게, **long polling 은 한 번 요청을 보냈을 때, 답이 올때까지 (혹은 time out이 될 때까지) 기다리는 방식**이다. 만약 time out 혹은 원하는 응답이 아닌 경우 다시 클라이언트에서 connection을 연결한다. 

웹소켓의 개념과도 약간 헷갈렸는데, 웹소켓은 우선 양방향 통신이고 한 번 연결이 되면 지속적으로 연결이 된다. 하지만, Long polling은 클라이언트의 요청이 서버에 의해 유지가 되다가 데이터가 생기면 응답하고 연결을 끊는 방식이다.

---

## JS 로 Polling 구현하기
처음에는 주기적으로 API 요청을 한다는 것에 집중해서 순수 JS를 활용하여 polling 을 구현해주었는데, 그 과정에서 배운 내용을 정리하면 다음과 같다. 

### setInterval 은 함수의 실행 시점부터 지연 시간을 설정한다.
`setInterval` 은 기본적으로 func 를 실행하는데 소요되는 시간도 지연 간격에 포함한다.
개발자가 원하는 동작은 지연 간격마다 함수를 호출하는 것이겠지만, setInterval 를 사용하면 명시한 시간 간격보다 짧게 func 를 실행하게 되기 때문에 의도하지 않은 결과가 나올 수 있다.
예를 들어, 함수 호출에 걸리는 시간이 지연 시간보다 길다면, 함수가 무한으로 계속 호출될 수 있다. 
반면, `setTimeout`은 명시한 지연 시간을 보장한다. 즉, 함수의 실행이 종료된 이후에 다음 함수 호출을 스케줄링할 수 있다. 아래 그림을 통해 이해하면 쉽다.

#### setInterval
![interval](/assets/img/articles/2023-04-30-rxjs-polling/setInterval.png)

#### setTimeout
![timeout](/assets/img/articles/2023-04-30-rxjs-polling/setTimeout.png)

출처: [setTimeout과 setInterval을 이용한 호출 스케줄링](https://ko.javascript.info/settimeout-setinterval)


### Closure 개념에 유의해야 한다.
polling 으로 호출하는 것의 단점은 언제 서버의 작업이 완료되는지 알 수 없다는 것이다. 유저가 작업이 완료될때까지 기다리기만 할 수는 없다. 따라서, polling 작업에도 한계점을 걸어주어야 하며, 이를 count state 로 관리를 해주었다.

```tsx
const [count, setCount] = useState(0)

React.useEffect(() => {
  const timer = setInterval(() => {
    setCount(current => current + 1)

    // 항상 0 으로 출력된다.
    console.log("count", count)

    if (count === 5) clearInterval(timer)

}, 1000)}, [])
```

하지만 위 코드를 실행해봤을때 `count` state 를 interval 외부에서 출력했을 때는 정상 출력되지만, interval 내부에서는 제대로 출력되지 않았다. 이유는 `useEffect` 가 mount 된 시점의 count 0의 값을 캡처하여 setInterval 를 실행시키기 때문에, useEffect 에 의존성 배열로 추가하지 않는 한, 인터벌의 콜백은 오직 count 0의 값만을 알 수 있다.
우리가 state 를 사용하는 이유는 컴포넌트의 리렌더링을 위함인데, 마운트된 시점에 이미 실행된 타이머 함수에 관해서는 state 가 업데이트 되어도 영향을 미치지 않는다. ([출처](https://stackoverflow.com/questions/53024496/state-not-updating-when-using-react-state-hook-within-setinterval))

조금 더 개념을 확장해보자. **클로저는 함수와 그 함수가 접근하던 외부 스코프의 변수 환경을 함께 보존하는 개념**이다.

> 성립 조건
> 1. 내부 함수가 외부 스코프의 변수나 함수에 접근할 수 있다.
> 2. 그 내부 함수가 나중에 실행될 때에도 외부 스코프의 변수나 함수에 접근이 가능하다. 
> 
> 특징
>
> 클로저는 외부 함수가 종료되어도 캡쳐한 변수 환경은 내부함수에서 살아있는 특징이 있다. 

브라우저에서 자바스크립트의 실행 과정을 한 번 간단히 떠올려보자.
Timer 비동기 함수가 콜 스택에 쌓이면, Web API 가 역할을 위임받아 비동기 함수의 콜백 함수를 대기열인 태스크큐(콜백큐)에 넣게 된다. 이 태스크 큐는 콜 스택이 비면 실행된다. 

setInterval 의 경우 콜스택에 넣었다가 바로 실행 후 종료되며
이벤트루프에 의해 Web API에 옮겨져 타이머가 작동이 된다. 
타이머가 종료되면 이벤트루프에 의해 콜백함수는 태스크큐로 옮겨져 적재된다.해당 함수들은 콜스택이 비었을때 콜백큐에서 옮겨져 실행된다.


클로저는 외부 함수가 종료되어도 외부 함수가 종료되어도 내부함수가 캡쳐한 변수 환경을 기억한다. 따라서, setInterval은 종료되었지만, setInterval의 내부함수인 console.log 는 초기값인 0을 기준으로 실행이 된다. 

따라서, interval 내부에서 state 를 관리하려면 setState 의 콜백을 이용하거나, ref 를 이용하여 호출 시점에 해당 값을 알 수 있도록 설정하는 방법이 있다.

## Rxjs 기본 개념
rxjs 의 핵심 개념은 다음과 같다.

> Observable model allows you to treat streams of asynchronous events with the same sort of simple, composable operations that you use for collections of data items like arrays
>
> Observable 모델을 사용하면 Array 메소드와 동일한 방식으로 비동기 이벤트의 스트림을 처리할 수 있다.
>
> 출처: https://reactivex.io/intro.html
> 

아직 잘 안 와닿을 수 있다. 이 개념을 이해하기 위해서는 크게 ‘선언형 프로그래밍’ 과 ‘observer 패턴’을 알아야 한다. 

**1) 선언형 프로그래밍**

 프로그래밍 패러다임에는 크게 2가지 방식이 있다. ‘명령형 프로그래밍’과 ‘선언형 프로그래밍’. 명령형 프로그래밍은 ‘어떻게’ 할 것인가에 집중하는 반면, 명령형 프로그래밍은 ‘무엇’을 할 것인가에 집중한다. 이게 무슨 말인지 코드를 통해 이해해보자. 아래의 코드는 `배열에서 5 이상의 숫자를 필터링한 후, 각 숫자에 2를 곱하고 그 숫자들의 총 합`을 구하는 코드이다. 

- 명령형을 사용한 예시

```tsx
const numbers = [1, 6, 2, 9, 8, 3, 7];
let sum = 0;

// 배열을 loop로 돌면서,
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] >= 5) { // 5 이상의 숫자인지 확인 후,
    const multipliedNumber = numbers[i] * 2; // 각 수에 2를 곱하고,
    sum += multipliedNumber;// 합을 구하는 sum 에 해당 결과를 더함
  }
}

console.log(sum); // 결과 출력
```

- 선언형을 사용한 예시

```tsx
const numbers = [1, 6, 2, 9, 8, 3, 7];

const filteredAndSummedResult = numbers
  .filter(num => num >= 5) // 5 이상의 숫자 필터링해
  .map(num => num * 2) // 각 숫자에 2를 곱해
  .reduce((sum, num) => sum + num, 0); // 숫자들의 총 합 구해

console.log(filteredAndSummedResult); // 결과 출력
```


위 코드를 살펴봤을 때 명령형 코드는 ‘어떻게’ 에 대한 조건을 서술하는 반면, 선언형 코드는 method 를 적절히 조합하여 ‘무엇’을 할지 의미만을 서술하고 있다. 이런 선언형 방식을 적용하면 재사용에 용이하고 가독성을 높이는 장점이 있다. 

**2) observer 패턴**

 observer 는 객체의 상태 변화를 관찰하는 ‘관찰자’ 들로 설명이 되어 있다. 즉,  observer 를 객체에 등록해서 해당 객체의 상태 변화가 있을 때마다 메서드를 통해 observer 에게 통지하는 디자인 패턴이다. 위에서 설명한 선언형 프로그래밍에서 ‘이벤트’ 를 다뤄보자. `숫자를 입력받는 이벤트를 연속으로 받아서, filteredAndSummedResult` 를 실행하다고 하면, 

```tsx
const [events, setEvents] = React.useState([])

window.addEventListener('enter', e => setEvents(current => [...current, e] ))

// addClickEvent 변화가 있을 때 filteredAndSummedResult를 수행함
React.useEffect(() => {
  filteredAndSummedResult(events)
}, [events])
```

위와 같이 작성해볼 수 있겠다. 만약, 이벤트를 모으고 변화를 감지하는 코드를 특정 메소드 혹은 객체로 만들어볼 수 있다면 선언형으로 바꿔볼 수 있을 것이다. rxjs 에서는 이벤트를 모은 배열 형태의 구조인 `Observable` 를 정의하고, Observable의 변화를 감지하여 관련 작업 수행하는 `fromEvent` 내장 메소드를 만들어두었다. 위 코드를 rxjs를 사용하여 선언형으로 바꿔보면 다음과 같다.

```tsx
import {fromEvent, filter, map, scan} from 'rxjs'; 

//
fromEvent(document, "keyup")
.pipe(
  filter((e) => e.keyCode === 13),
  map((event) => event.target.value),
  filter((num) => num >= 5),
  map((num) => num * 2),
  scan((sum, num) => sum + num, 0)
)
.subscribe((event) => {
  console.log(event);
});
```

---

## RxJS 를 이용한 polling
서두에서 언급한 로직을 다시 가져와서 RxJS로 구현해보자.
> 
> 1) 대량의 데이터 처리를 위한 [POST]/bulk 를 요청한 후, `taskId`를 받는다.
>
> 2) `taskId`를 기준으로 [GET]/progress 를 요청한다. 이때 응답은 비동기 작업이 끝났다면 `true`, 끝나지 않았다면 `false`이다.
> 
> 3) 만약 비동기 작업이 50초 이상 소요되거나, 중간에 유저가 요청 취소를 할 경우 polling 요청을 끝낸다.
> 

우선 나는 `useTaskGet` 이라는 공통 hook 을 만들어 progress를 확인하는 API 로직을 작성했다.
`useTaskGet` hook 에서는 `taskId` 와 polling 이 성공했을 시 실행하는 `onSuccess` 콜백, 실패했을 시 실행하는 `onFail` 함수를 props 로 받는다.
그리고 hook 의 리턴 값으로 `taskStatus (’done’ 또는 ‘null’)` 을 반환한다. 예를 들어 onSuccess 로직으로는 polling 을 성공한 후 alert 을 띄우거나 modal 을 닫는 경우를 고려한다. 

```tsx
import React from "react";
import getTask from "../pages/api/getTask";
import {
  Subject,
  interval,
  take,
  from,
  first,
  takeUntil,
  mergeMap
} from "rxjs";
import { useUnmount } from "react-use";

interface useTaskGetProps {
  taskId: string;
  onSuccess: () => void;
  onError: () => void;
}

const useTaskGet = ({ taskId, onSuccess, onError }: useTaskGetProps) => {
  const [taskStatus, setTaskStatus] = React.useState<string | null>(null);
  const unsubscribeTask = React.useRef(new Subject());

  const pollingStatus = () => {
    interval(1000)
      .pipe(
        take(5),
        takeUntil(unsubscribeTask.current),
        switchMap(() => from(getTask(taskId))),
        first((task) => Boolean(task), null)
      )
      .toPromise()
      .then((res) => {
        if (res) {
          setTaskStatus(res.result || null);

          if (res.result === "done") {
            onSuccess();
            return;
          }
        }
      })
      .catch((err) => {
        onError();
        return;
      });
  };

	// task id가 존재하면 폴링 로직을 실행함
  if (taskId) {
    pollingStatus();
  }

 // 언마운트 되었을때 polling 로직을 complete 처리
  useUnmount(() => {
    unsubscribeTask.current.complete();
    unsubscribeTask.current.complete();
  });

  return { taskStatus };
};

export default useTaskGet;
```

[코드 해석]

- interval 로 1초에 한 번씩 값을 내보낸다.
- take는 발생된 값 중 몇 개의 값을 받을 것인지 지정한다. (take(5): 5개의 값)
- takeUntil의 조건은 subscribe 가 유지될 때까지이다.
- api에서 받은 값을 from 을 통해 옵저버블로 변경하여, switchMap 으로 값을 매핑시킨다.
- first 는 조건에 맞는 첫 번째 값을 반환한다. 조건에 맞지 않다면 null 을 반환한다.
- polling 하는 동안 success 한다면 onSuccess 를 시도하고, error 가 발생한다면 onFaile 을 시도한다.
- unmount 될 때 subscribe 를 취소한다.

---

## 번외

번외로 만약 polling 하는 도중에, 사용자가 모달 창을 닫는 등의 `Interrupt` 가 발생한다면 어떻게 처리하면 좋을까? 회사 코드를 살펴보니 주로 사용하던 패턴이 `abortController` 을 사용하는 것이었다. abortController 는 GET 메소드와 POST 메소드에서 사용하기 위한 조건이 다르다.

GET 메소드에서는 단순히 signal 을 전송하는 것으로 보낸 요청을 취소하는 것이 가능하지만, POST 메소드의 경우에는 백엔드에서 abort signal 을 이용하여 도중에 취소할 수 있는 로직을 추가해주어야 한다.

아래는 abortController 를 사용하는 방법에 대한 MDN 예제이다. ([MDN 라이브 데모](https://mdn.github.io/dom-examples/abort-api/))

```tsx
const controller = new AbortController(); // AbortController 객체를 생성해준다.
const signal = controller.signal;

const url = "video.mp4";
const downloadBtn = document.querySelector(".download");
const abortBtn = document.querySelector(".abort");

downloadBtn.addEventListener("click", fetchVideo);

abortBtn.addEventListener("click", () => {
  controller.abort(); // 취소 시, abort 메소드를 호출한다.
  console.log("Download aborted");
});

function fetchVideo() {
  fetch(url, { signal }) // fetch api 의 옵션인 signal을 추가한다.
    .then((response) => {
      console.log("Download complete", response);
    })
    .catch((err) => {
      console.error(`Download error: ${err.message}`);
    });
}
```

---

## Ref
- [https://yozm.wishket.com/magazine/detail/1753/](https://yozm.wishket.com/magazine/detail/1753/)
- [https://pks2974.medium.com/rxjs-간단정리-41f67c37e028](https://pks2974.medium.com/rxjs-%EA%B0%84%EB%8B%A8%EC%A0%95%EB%A6%AC-41f67c37e028)
- [https://kamang-it.tistory.com/entry/Webhttp통신을-이용한-양방향-통신기법-long-polling](https://kamang-it.tistory.com/entry/Webhttp%ED%86%B5%EC%8B%A0%EC%9D%84-%EC%9D%B4%EC%9A%A9%ED%95%9C-%EC%96%91%EB%B0%A9%ED%96%A5-%ED%86%B5%EC%8B%A0%EA%B8%B0%EB%B2%95-long-polling)
- [React에서 setInterval 현명하게 사용하기(feat. useInterval)](https://mingule.tistory.com/65)
