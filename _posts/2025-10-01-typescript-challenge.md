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

## Day1
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
