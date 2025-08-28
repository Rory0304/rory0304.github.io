---
title: '[JS] 자바스크립트 이벤트 루프 원리'
description: >-
  알면 알수록 새로운 JS의 세계
author: Lois
date: 2024-01-11
categories: [JavaScript]
tags: [JavaScript]
pin: false
---

📌 이 글은 [JavaScript Visualized: Event Loop](https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif) 와 [자바스크립트 이벤트 루프 동작 구조 & 원리 끝판왕 글](https://inpa.tistory.com/entry/%F0%9F%94%84-%EC%9E%90%EB%B0%94%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8-%EC%9D%B4%EB%B2%A4%ED%8A%B8-%EB%A3%A8%ED%94%84-%EA%B5%AC%EC%A1%B0-%EB%8F%99%EC%9E%91-%EC%9B%90%EB%A6%AC)을 읽고 **학습 용도로 요약 정리**한 글임을 먼저 밝힙니다. 더 자세한 내용은 첨부 링크를 참고해주세요.

---

자바스크립트는 싱글 스레드 언어다. **‘싱글’ 스레드**이기 때문에 한 번에 하나의 작업만 수행한다. 하지만, 웹에서는 비동기 작업(이벤트 처리, 타이머 등)를 처리해야 하는 경우가 많기 때문에 이와 관련한 작업들은 자바스크립트 엔진이 아니라, **브라우저 내부의 멀티 스레드**에서 처리하게 된다. 즉, 브라우저는 자바스크립트 자체가 제공하지 않는 비동기 관련 기능을 제공하는데, `DOM API`, `setTimeout`, `HTTP request` 등이 있다. 

비동기 코드를 호출하면 이를 자바스크립트 엔진이 아닌, 브라우저의 Web API 에 맡기게 되고, 그 결과를 콜백 함수의 형태로 대기열인 **큐(Callback Queue)** 에 넣게 된다. 그리고 해당 작업을 처리할 준비가 되면 이를 **호출 스택 (Call stack)** 에 넣어 마무리를 한다. 그 과정에서 거치게 될 Web API, Event Table, Event Loop 에 대해서는 아래 시각 자료로 알아보자.

---

![출처: https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif](/assets/img/articles/2024-01-11-js-loop-event/step1.gif)

출처: https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif

우리가 어떤 함수를 호출하게 되면 이는 기본적으로 호출 스택인 `Call Stack` 에 저장이 된다. 콜 스택은 브라우저의 특징이 아니라, 자바스크립트의 구성 중 하나이며 스택의 구조이기 때문에 **First in, last out** 의 흐름을 따른다. 즉, **함수가 호출되어 call stack 에 저장이 되고 그 함수가 값을 반환하면 stack 에서 pop 이 되어 빠져나간다.** 위의 예제를 살펴보자. `greet()` 함수가 호출되어 콜 스택에 쌓이고, 해당 output ‘hello’ 가 반환되어 stack 에서 제거된다. 다음으로 `respond()`가 콜 스택에 쌓이고 `setTimeout` 이 반환되어 이 부분이 다시 콜 스택에 쌓인다. 
****

![출처: https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif](/assets/img/articles/2024-01-11-js-loop-event/step2.gif)

출처: https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif

그런데 `setTimeout` 은 비동기 로직이고 web API 에서 제공이 되는 기능이기 때문에, `setTimeout`에 전달된 콜백 함수인 `() ⇒ { return ‘hey’}`  가 브라우저의 web API 에 전달이 된다. 그 동안 `setTimeout` 함수와 `respond()` 함수는 각각 값을 반환했기 때문에 스택에서 제거가 된다. 

![출처: https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif](/assets/img/articles/2024-01-11-js-loop-event/step3.gif)

출처: https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif

이제 Wb API 의 한 종류인 `Timer API` 에서 타이머 스레드를 이용하여 타이머를 수행한다. `setTimeout` 의 두 번째 인자가 1000ms 동안 실행되면서 콜백 함수 `() ⇒ { return ‘hey’}` 가 **대기열**인 `Callback Queue` 에 전달된다. 

![출처: https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif](/assets/img/articles/2024-01-11-js-loop-event/step4.gif)

출처: https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif

이때 **Event Loop** 가 관여를 하게 된다. 이벤트 루프는 콜 스택과 콜백 큐를 연결하는 역할을 수행한다. 만약 콜 스택이 비어있다면, 큐의 첫 번째 요소가 콜 스택에 추가 한다. ([콜백 큐도 태스크 큐와 마이크로 태스크 큐가 존재하며, 우선순위에 따라 마이크로 태스크 큐를 먼저 처리하여 비우고 그 다음 태스크 큐를 처리한다](https://inpa.tistory.com/entry/%F0%9F%94%84-%EC%9E%90%EB%B0%94%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8-%EC%9D%B4%EB%B2%A4%ED%8A%B8-%EB%A3%A8%ED%94%84-%EA%B5%AC%EC%A1%B0-%EB%8F%99%EC%9E%91-%EC%9B%90%EB%A6%AC))

![출처: https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif](/assets/img/articles/2024-01-11-js-loop-event/step5.gif)

출처: https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif

예시를 확인하면,  `setTimeout` 의 콜백 함수 `() ⇒ { return ‘hey’}`가 큐에서 콜 스택으로 추가 되어 호출이 되면, 마찬가지로 값을 반환하고 콜 스택에서 제거된다.

요약하자면, ***이벤트 루프***는 비동기 함수 작업을 Web API 옮기고, 작업이 완료되면 콜백 함수를 큐에 넣어두고 다시 이를 자바스크립트 엔진의 콜 스택에 옮기는 역할을 수행한다. ([계속 반복적으로 실행 작업/대기 작업을 확인해주기 때문에 이름이 이벤트 ‘루프’ 라고 한다](https://inpa.tistory.com/entry/%F0%9F%94%84-%EC%9E%90%EB%B0%94%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8-%EC%9D%B4%EB%B2%A4%ED%8A%B8-%EB%A3%A8%ED%94%84-%EA%B5%AC%EC%A1%B0-%EB%8F%99%EC%9E%91-%EC%9B%90%EB%A6%AC)) 

대기열인 ***콜백 큐***는 Web API 가 수행한 비동기 함수를 받고, 이벤트 루프가 콜 스택에 넘겨두기 전까지 쌓아두는 장소이다. `Promise` 객체는 **마이크로 태스크 큐**에 적재되며, 우선순위가 가장 높다. `setTimeout`, `setInterval` 같은 일반적인 비동기 처리 함수의 콜백은 **태스크 큐, 혹은** **마이크로 태스크 큐** 에 적재된다.

---

## 참고 자료

- 원문
    - [https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif](https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif)
    - [https://inpa.tistory.com/entry/🔄-자바스크립트-이벤트-루프-구조-동작-원리](https://inpa.tistory.com/entry/%F0%9F%94%84-%EC%9E%90%EB%B0%94%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8-%EC%9D%B4%EB%B2%A4%ED%8A%B8-%EB%A3%A8%ED%94%84-%EA%B5%AC%EC%A1%B0-%EB%8F%99%EC%9E%91-%EC%9B%90%EB%A6%AC)
- [https://leetrue-log.vercel.app/js-eventloop](https://leetrue-log.vercel.app/js-eventloop)
