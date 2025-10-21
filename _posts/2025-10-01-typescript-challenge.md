---
title: '[월간 챌린지] Typescript'
description: >-
  TypeScript 예제 살펴보기
author: Lois
date: 2025-10-01
categories: [TypeScript]
tags: [TypeScript]
pin: false
---

## Problem Set
[Type Challenges](https://github.com/type-challenges)

## Easy
### 1. Pick 구현하기
```ts
type MyPick<T, K extends keyof T> =  {
  [P in K]: T[P]
}
```

- `keyof`: 객체 타입에서 객체의 키 값들을 숫자나 문자열 리터럴 유니온으로 생성 
숫자 인덱스인 경우 아래와 같이 keyof 는 number 타입을 가진다.

```ts
interface NumberMap {
  [index: number]: string;
}
type NumberKeys = keyof NumberMap; // number
```

- `extends`: 제네릭 타입을 extends 연산자 우측 타입의 하위 타입으로 제한


### 2. Readonly 구현하기
```ts
type MyReadonly<T> =  {
  readonly [P in keyof T]: T[P]
}
```
- `Readonly`: `T`의 모든 프로퍼티를 읽기 전용(재할당 불가)으로 바꾸는 내장 제네릭

### 3. 배열을 받아, 각 원소의 값을 key/value로 갖는 오브젝트 타입을 반환
```ts
type TupleToObject<T extends readonly (keyof any)[]> = {
  [Key in T[number]]: Key
}
```

- `keyof any`: `string | number | symbol` (각 원소의 타입을 얻을 수 있음)
- `symbol` 타입: 객체의 프로퍼티 키를 고유하게 설정함으로써 프로퍼티 키의 충돌을 방지하기 위해 사용 ([출처](https://inpa.tistory.com/entry/JS-📚-자료형-Symbol-🚩-정리))
- `T[number]`: Indexed Access Type

```ts
type Fruits = ['apple', 'banana', 'orange'];

// T[number]는 배열의 모든 요소 타입을 유니온으로 추출
type Fruit = Fruits[number];
// 결과: 'apple' | 'banana' | 'orange'
```

### 4. 배열 첫 원소의 타입을 반환
```ts
type First<T extends any[]> = T extends [infer A, ...infer rest] ? A : never

```
- 첫 번째 원소 A 로 잡고, 나머지 rest 로 분해할 수 있다면 첫 번째 원소 A의 타입을 반환
- `infer`: 제네릭 타입에서 특정 타입을 추론할 수 있게 해주는 키워드로, 조건부에서 사용함

### 5. 배열을 받아 길이를 반환
```ts
type Length<T extends readonly any[]> = T['length']
```
- T 타입의 length 프로퍼티 타입을 추출

### 5. Exclude 구현하기
```ts
type MyExclude<T, U> = T extends U ? never : T
// MyExclude<'a' | 'b' | 'c', 'a'> // 'b' | 'c'

```
- 제네릭 타입을 대상으로 한 조건부 타입을 구현해야 함. 입력이 유니온 타입이라면 각 구성원에 대해 개별적으로 적용

```ts
type Box<T> = T extends number ? 'num' : 'other'

type x = Box<1> // 'num'
type y = Box<'1'> // 'other'
type z = Box<1 | '1'> // 'num' | 'other'
```

- 해설: `never` 타입은 any 타입을 포함하여 어떤 값도 가질 수 없음을 나타낸다. 때때로 '점유할 수 없는' 또는 '바닥 타입'이라고 한다. (출처: [타입스크립트의 Never 타입 완벽 가이드](https://ui.toast.com/posts/ko_20220323))


```ts
type A = 'a' | 'b' | 'c';
type B = 'a' | 'd';


type MyExclude<T, U> =  T extends U ? never : T;
type C = MyExclude<A, B>; 

/**
type C =
   ('a' extends 'a' | 'd'  ? never : 'a')
  | ("b" extends 'a' | 'd'  ? never : 'b')
  | ("c" extends 'a' | 'd'  ? never : 'c')
**/
```

### 6. 타입에 감싸인 타입이 있을 때, 안에 감싸인 타입을 구하기
```ts
type MyAwaited<T extends PromiseLike<any>> = T extends PromiseLike<infer U>
  ? U extends PromiseLike<any>
    ? MyAwaited<U>
    : U
  : never;
```
- `infer` 을 이용하여 조건부 체크후 재귀로 실행하기
- `Like`: 넓은 의미의 타입 적용을 지원하는 타입으로, ArrayLike, PromiseLike 등이 있음.
Promise 개념이 등장했을 때는 then 만 지원하는 라이브러리가 많았고, 이후 catch, finally 가 정식 문법으로 추가되어 Promise 타입은 문법에 맞추어 then, catch, fianlly를 모두 지원하는 타입이 되었고
PromiseLike 는 과거의 라이르러리 호환성에 맞춰 then 만 지원하는 타입도 포함할 수 있도록 확장한 것. ArrayLike 는 배열 메서드가 없는 객체이기 때문에, rest 파라미터의 사용이 불가하다. 

### 7. Includes 구현하기
```ts
type Includes<T extends readonly any[], U> = T extends [infer First, ...infer Rest] ? Equal<First, U> extends true ? true : Includes<Rest, U> : false
```

### 8. `Parameters<T>` 구현하기
```ts
type MyParameters<T extends (...args: any[]) => any> = T extends (...any: infer S) => any ? S : any 
```
- `infer S`: 함수의 매개변수를 S로 추론
- `(...any: infer S)`: 매개변수 이름은 무시하고, 타입만 추론함. 이때 S 는 매개변수 타입들의 튜플/배열임


## Medium
### 1. `ReturnType<T>` 구현하기
```ts
type MyReturnType<T extends Function> = T extends (...args: any) => infer R ? R : never
```

### 2. `Omit<T, K>` 구현하기
```ts
type MyOmit<T, K extends keyof T> = {[P in keyof T as P extends K ? never: P] :T[P]}
```
- Omit 과 Exclude 차이: Exclude 는 유니온 타입 T 에서 U 를 제거. Omit 은 객체 타입 T의 프로퍼티 키에서 K를 제거


### 3. `T`에서 `K` 프로퍼티만 읽기 전용으로 설정해 새로운 오브젝트 타입 만들기
```ts
type MyReadonly<T> = {
  readonly [P in keyof T]: T[P]
}

type MyOmit<T, K> = {[P in keyof T as P extends K ? never : P]: T[P]}

type MyReadonly2<T, K extends keyof T = keyof T> = MyReadonly<Pick<T, K>> & MyOmit<T, K>
```
- `K extends keyof T = keyof T`: K는 T의 키 집합 중 일부이며, 기본값은 keyof T(모든키)
