---
title: '[JS] 자바스크립트의 메모리 관리 방식'
description: >-
  알면 알수록 새로운 JS의 세계
author: Lois
date: August 25, 2024 5:27 PM
categories: [JavaScript]
tags: [JavaScript]
pin: false
---

## Intro,

자바스크립트에서는 메모리 할당을 변수 선언시 자동으로 해준다. C 언어(저수준언어)처럼 프로그래머가 하나하나 명시적으로 선언(ex: malloc)해줄 필요가 없다. 해제 또한 마찬가지다. C 언어는 명시적으로 해제(ex: free)를 해주어야 하지만, 자바스크립트는 더이상 메모리가 필요하지 않으면 가비지 컬랙터로 자동으로 해제해준다. 이번 포스팅에서는 이런 자바스크립트의 메모리 할당 > 사용 > 해제 의 과정을 살펴보려 한다.

📌 이 포스팅은 [JavaScript's Memory Management Explained](https://felixgerschau.com/javascript-memory-management/) 글을 재구성하였습니다. 

---

## 메모리 할당

자바스크립트는 **동적 타이핑**을 사용하는 언어다. 동적 타이핑은 사용자가 직접 타입을 지정하지 않고 값을 대입하면, 자바스크립트 엔진이 이 값에 대한 타입을 지정하게 된다. 런타임에 타입을 지정하기 때문에 작성 시점에는 오류가 발생하지 않다가 실제 실행 시점에 오류가 발생하게 된다. 예를 들면 다음과 같다. 

```tsx
let text = 'hello';
console.log(text.chartAt(0));
// 정상 작동

text = '2' / '1';
console.log(text.chartAt(0));
// 런타임에러 
```

런타임 에러가 발생하는 이유는, JS 의 동적 타이핑으로 인해 숫자 연산으로 text 가 숫자로 바뀌게 되면서 스트링 용 메소드인 charAt 을 사용하면 오류가 발생하기 때문이다.

이렇게 JS 에서 저장된 데이터는 **힙 메모리와 스택 메모리**에 위치하게 된다. 스택은 크기가 변하지 않는 데이터를 저장하는데 사용하는 자료 구조다. 정적 데이터는 컴파일 타임에 크기를 아는 데이터로, 원시값 혹은 객체 참조값이 위치한다. 그에 반해, 힙은 ‘동적’ 데이터를 저장한다. 객체나 함수가 위치할 수 있고, 고정된 메모리를 할당하지 않으며, 런타임에 그 크기를 알 수 있다. 

| **Stack**  | **Heap** |
| --- | --- |
| Primitive data types and references | Objects and functions |
| Size is known at compile time | Size is known at run time |
| Fixed memory allocated | No limit for object memory |
| 출처) https://www.geeksforgeeks.org/memory-management-in-javascript/ |  |

w3school 의 참고자료를 확인했으나, 여기서 몇 부분 잘못된 정보가 존재한다고 한다. 이 [이슈1](https://github.com/leonardomso/33-js-concepts/issues/481)와 이 [이슈2](https://stackoverflow.com/questions/74004695/how-v8-handle-stack-allocated-variable-in-closure)에 따르면, 자바스크립트의 원시 값에서는 ‘문자열’ 이라는 크기가 변하는 데이터가 존재하고, 동적으로 변하는 원시값의 경우 “원시값을 저장한다고 알려진(myths)” 스택에 바로 저장되지는 않는다. 그래서 자바스크립트는 기본적으로 원시값인지 여부에 상관없이 ‘힙’에 할당한다.

*원시값: 문자(string), 숫자(number), bigint, 불린(boolean), 심볼(symbol), null, undefined의 종류가 있고, 객체가 아니며, 메서드나 속성을 가지지 않는 단순한 데이터 타입

> (V8 developer here.)
> 
> 
> I don't know where this myth is coming from that **"primitives are allocated on the stack". It's generally false:** **the regular case in JavaScript is that everything is allocated on the heap, primitive or not.**
> 
> There may be implementation-specific special cases where some heap allocations can be optimized out and/or replaced by stack allocations, but that's the exception, not the rule; and it's never directly observable (i.e. never changes behavior, only performance), because that's the general rule for all internal optimizations.
> 
> To dive deeper, we need to distinguish two concepts: variables themselves, and the things they point at.
> 
> **A variable can be thought of as a pointer.** In other words, it's not in itself the "container" or "space" where an object is allocated; **instead it's a reference that points at an object that's allocated elsewhere.** All variables have the same size (1 pointer), the things they point at can vary wildly in size. One illustrating consequence is that the same variable can point at different things over time, for example you could have a loop over an array where `element = array[i]` points at each array element in turn.
> 
> In modern, high-performance JS engines, function-local variables are usually stored on the stack (regardless of what they point at!). That's because this is both fast and convenient. So while this is technically still an implementation-specific exception to the rule that everything is allocated on the heap, it's a fairly common exception.
> 
> As you rightly observe, storing variables on the stack doesn't work if they need to survive the function that created them. Therefore, JavaScript engines perform analysis passes to find out which variables are referenced from nested closures, and store these variables on the heap right away, in order to allow them to stay around as long as they are needed.
> 
> I wouldn't be surprised if an engine that prefers simplicity over performance chose to always store all variables on the heap, so it wouldn't have to distinguish several cases.
> 
> Regarding the value that the variable points at: that's always on the heap, regardless of its type or primitive-ness (with exceptions to the rule, see below).
> 
> `var a = true` --> `true` is on the heap.
> 
> `var b = "hello"` --> `"hello"` is on the heap.
> 
> `var c = 42.2` --> `42.2` is on the heap.
> 
> `var d = 123n` --> `123n` is on the heap.
> 
> `var e = new Object();` --> the object is on the heap.
> 
> Again, there are engine-specific cases where heap allocations can be optimized out under the right circumstances. For example, V8 (inspired by some other VMs) has a well-known trick where it can store small integers ("Smis") directly in the pointer using a tag bit, so in this case the pointer doesn't actually point at a value, the pointer *is* the value so to speak. An alternative trick is called "NaN-boxing", it's used e.g. by Spidermonkey and has the effect that *all* JS Numbers can be stored directly in the pointer (or technically the other way round: everything's a Number in this approach, and pointers are stored as special numbers).
> 
> As another example, once a function gets hot enough for optimization, an optimizing compiler may be able to figure out that a given object isn't accessible outside the function and hence doesn't need to be allocated at all; if necessary some of the object's properties will be held in registers or on the stack for the part of the function where they are needed.
> 
> So, to summarize the above:
> 
> - "All primitives are allocated on the stack" is incorrect. Most primitives are allocated on the heap.
> - Sometimes, an engine can avoid allocations (of both primitives and objects), which may or may not mean that the respective value is briefly held on the stack (it could also be eliminated entirely, or only ever held in registers). Such optimizations never change observable behavior; in cases where doing the optimization *would* affect behavior, the optimization can't be applied.
> - Variables, regardless of what they refer to, are stored on the heap or on the stack or not at all, depending on the requirements of the situation.

![stack and heap](/assets/img/articles/2024-08-25-js-memory/stack-and-heap.png)

즉, 우리는 '변수'와 '값' 에 대한 구분이 필요한데 - 변수는 포인터 역할을 하기 때문에 같은 크기(포인터 1개)를 가지지만 그것이 가르키는 '값'은 크기가 천차만별이다.
따라서 원시값들은 모두 '힙'에 저장이 되며 함수 내 지역변수들은 대부분 '스택'에 저장이 된다.

---

## 메모리 해제
자바스크립트는 메모리 해제를 위해 ‘가비지 컬렉터’ 를 사용한다. 가비지 컬렉터는 주기적으로 메모리를 스캔하여, 더이상 어떤 변수나 함수가 필요하지 않다면 메모리를 해제하는 방식을 취한다.

만약 메모리를 해제하지 않고 지속적으로 사용하게 되면 몇 가지 문제가 발생할 수 있다. 첫 번째는 **메모리 누수** 현상이다. 메모리 누수는 일부 프로그램 오류로 사용되는 메모리를 해제하지 못하는 것을 의미한다. 더이상 사용하지 않는 메모리임에도 계속 누적이 되면 시스템 자원 부족과 성능 저하를 초래하게 된다. 두 번째로, 메모리는 한정된 자원이기 때문에 적절히 해제하지 않으면 다른 자원을 효율적으로 활용하지 못하게 된다. 

그럼 ‘메모리가 더이상 사용되지 않음’ 을 어떤 식으로 판단할 수 있을까? [현실적으로 메모리가 사용되지 않는 바로 그 순간에 해제하는 알고리즘은 존재할 수 없다.](https://developer.mozilla.org/ko/docs/Web/JavaScript/Memory_management#%ED%95%A0%EB%8B%B9%EB%90%9C_%EB%A9%94%EB%AA%A8%EB%A6%AC%EA%B0%80_%EB%8D%94_%EC%9D%B4%EC%83%81_%ED%95%84%EC%9A%94%EC%97%86%EC%9D%84_%EB%95%8C_%ED%95%B4%EC%A0%9C%ED%95%98%EA%B8%B0) 다시말해, 메모리가 여전히 필요한지 아닌지를 판단하는 것은 **비결정적인 문제**다. 메모리 수집이 언제 수행될지 예측할 수 없기 때문이다. 그 대신, 가비지 컬렉터는 근사값을 구하는 알고리즘을 사용한다. 대표적으로 `Mark-and-Sweap` 과 `Reference-counting garbage collection` 이 있다.  

### 1) Reference-counting GC

어떤 다른 객체도 참조하지 않는 객체라면, 이를 더이상 필요 없는 객체로 보고 ‘Garbage’ 로 인식하는 방식이다.

아래 영상을 확인해보자. 마지막 person 과 newPerson 이 null 로 바뀌면서 person 객체는 더이상 참조를 하지 않기 때문에 가비지로 수집이 된다.

![javascript-memory-management](/assets/img/articles/2024-08-25-js-memory/memory-allocate.gif)
출처) https://felixgerschau.com/javascript-memory-management/

이 알고리즘은 단순하지만, ‘순환 참조’ 문제가 존재한다. 즉, 하나 이상의 객체가 서로 참조하고 있는 상황에서 더 이상 코드를 통해 접근할 수 없을 때 문제가 발생한다. MDN 의 예시를 살펴보자.

```tsx
function f() {
  const x = {};
  const y = {};
  x.a = y; // x는 y를 참조합니다.
  y.a = x; // y는 x를 참조합니다.

  return "azerty";
}

f();
```

위 예시에서 두 객체는 서로를 참조한다. f 함수 호출이 완료되면 이제 두 객체는 스코프를 벗어나고, 그 시점에서 두 객체는 불필요하기 때문에 할당된 메모리는 회수되어야 한다. 하지만, 두 객체가 서로를 ‘참조’ 하고 있으므로 참조의 여부로 가비지를 판단하는 Reference-Counting GC 알고리즘에서는 두 객체가 다 가비지로 표시하지 않게 된다. 

### 2) Mark-and-Sweep

위에서 봤던 순환 참조 문제를 해결하기 위해, mark-and-sweep 알고리즘은 루트 객체가 도달할 수 있는지 여부를 판단하는 방식이다. 여기서 루트는 브라우저에서는 ‘window’ , Node.js 에서는 ‘global’ 를 의미한다.  즉, 루트에서 시작해서 루트가 참조하는 객체들 혹은 참조하는 객체가 참조하는 객체를 찾고, 만약 도달할 수 없는 객체라면 garbage 로 우선 표기(mark)하며, 나중에 해제(sweep) 하는 방식이다. 

다음과 같이 순환참조가 이루어진 son, dad 객체가 있다고 가정하자. 아까 본 Reference-counting 알고리즘은 dad 와 son이 null 처리 되어도 서로 참조를 하고 있는 상태이기 때문에 메모리 해제를 할 수 없다.

```tsx
let son = {
  name: 'John',
};

let dad = {
  name: 'Johnson',
}

son.dad = dad;
dad.son = son;

son = null;
dad = null;

// Ref: https://felixgerschau.com/javascript-memory-management/
```

하지만, 위 상황에서 Mark-and-Sweep 방식은 루트 객체가 더이상 dad 와 son 의 객체에 도달할 수 없기 때문에 가비지로 수집이 된다. 참고로, 현재 모든 최신 브라우저는 mark-and-sweep 방식을 취한다.

### 3) 개발자의 실수

때로는 개발자의 실수로 JS에서 자동으로 메모리 누수 문제를 해결할 수 없는 경우가 있다. 예를 들면, 이벤트 리스너를 등록하고 제거를 하지 않거나, 타이머 메소드를 사용하고 clear 를 하지 않는 경우가 있다. var 키워드를 사용했을 경우 반복문이 종료된 뒤에서 변수의 값은 계속 참조되는 현상이 발생하기 때문에, let 이나 const 를 대신 사용하는 방식을 취해야한다. 그 밖에 개발자가 쉽게 저지를 수 있는 실수는 다음과 같다. 

- 해제하지 않은 이벤트 리스너
- 해제하지 않은 JS의 타이머 메소드
- var 같은 전역 키워드의 사용
- DOM 의 참조: (ex: DOM 엘리먼트를 배열에 추가한 후, removeChild 를 통해 해당 DOM 엘리먼트를 제거할 경우 배열에 속한 element 도 동일하게 제거해주어야 함)
- 콘솔 로그의 출력

---

## Ref
- [https://velog.io/@sejinkim/자바스크립트의-메모리-관리-설명](https://velog.io/@sejinkim/%EC%9E%90%EB%B0%94%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8%EC%9D%98-%EB%A9%94%EB%AA%A8%EB%A6%AC-%EA%B4%80%EB%A6%AC-%EC%84%A4%EB%AA%85)
- [https://velog.io/@muman_kim/JavaScript-가비지-컬렉터에서의-메모리-누수는-언제-일어날까Garbage-Collector](https://velog.io/@muman_kim/JavaScript-%EA%B0%80%EB%B9%84%EC%A7%80-%EC%BB%AC%EB%A0%89%ED%84%B0%EC%97%90%EC%84%9C%EC%9D%98-%EB%A9%94%EB%AA%A8%EB%A6%AC-%EB%88%84%EC%88%98%EB%8A%94-%EC%96%B8%EC%A0%9C-%EC%9D%BC%EC%96%B4%EB%82%A0%EA%B9%8CGarbage-Collector)
- [https://beenlog.tistory.com/45](https://beenlog.tistory.com/45)
