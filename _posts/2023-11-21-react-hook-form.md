---
title: "React hook form 렌더링 이슈 해결하기"
description: >-
  React hook form 을 사용하며 마주했던 컴포넌트 렌더링 문제를 해결해보자
author: Lois
date: 2023-11-21
categories: [React]
tags: [React]
pin: false
---

## 배경
여러 인풋들을 관리하는 react hook form 에서 하나의 input 에 변화가 감지되면, 그와 상관없는 다른 컴포넌트들도 리렌더링되는 문제가 발생하였다. 추측하기에, 부모 컴포넌트로 감싸주고 있는 `Provider` 와 그의 context 로부터 받아오는 `watch`, `isDirty` 플래그가 원인인 것으로 보였다.

## 🧐 원인 파악하기
우선 인풋들은 공통적으로 비제어 방식인 register 를 사용하고 있었기 때문에 리렌더링이 발생하면 안 되는 것으로 알고 있었다. 내가 무언가 잘못 알고 있는걸까? 문서로 다시 돌아가서 비제어와 제어 컴포넌트의 개념부터 다시 숙지해보았다.

### 1) 문서 다시 보기

- **비제어와 제어 컴포넌트의 차이**
    - `제어 컴포넌트`: React state 에 의해 값이 제어되는 컴포넌트, 입력마다 렌더링하기 때문에 불필요한 리렌더링이 실행될 수 있다.
    - `비제어 컴포넌트`: Ref 를 이용하여 값이 제어되는 컴포넌트, 입력할 때마다 리렌더링을 호출하지 않는다. submit같이 특정 이벤트가 실행될 때 함수 내에서 Ref 를 통해 값에 접근하게 된다.

- **React hook form 에서의 비제어, 제어 컴포넌트**
    - 우선, react hook form 에서 인풋을 작성하는 방법은 2가지이다. register와 Controller
    - `register`: 비제어 인풋이 onChange 변화를 구독하거나, react hook form 에 의한 value를 감지할 경우 사용
    - `Controller`: Wrapper 컴포넌트를 이용하여 AntD 나 MUI 같은 제어 컴포넌트를 분리하고, 해당 범위 내에서 다시 렌더링할 수 있도록 함

### 2) 궁금증 정리

1️⃣ **비제어 컴포넌트를 위해 register 를 사용해주어도 리렌더링이 발생하는 이유는?**

우선 첫 번째로, register 를 사용해도 리렌더링되는 이유는 useForm 에서 설정해준 mode 의 값에 있었다. 나는 인풋의 validation 을 입력할 때마다 인풋 검증을 해주어야 했기 때문에 `mode: ‘onChange’` 로 설정해주었다. 

문서를 확인해보니, onChange 로 설정해줄 경우 리렌더링이 발생할 수 있고, 퍼포먼스에 영향을 줄 수 있다고 경고를 해주고 말하고 있었다.

> Validation is triggered on the `change`event for each input, leading to multiple re-renders. Warning: this often comes with a significant impact on performance.
>

일단, 비제어 컴포넌트인 register 를 사용해주어도 mode 의 값에 따라 리렌더링될 수 있음을 확인하였으나, 이게 성능 저하의 직접적인 원인은 아닌 것으로 생각되었다. 생성한 인풋의 수가 일단 적고, onChange 에 따라 상관이 없는 다른 인풋들까지 리렌더링되기 때문이다. 해결해야 하는 점은, input change 를 해당 컴포넌트에서만 리렌더링될 수 있도록 제어해주어야 한다.

2️⃣ **FormProvider 와 useFormContext 로 부터 받아오는 값이 자식 요소 리렌더링에 영향을 미치는가?**

Provider 와 useFormContext를 이용하여 작성한 코드는 다음과 같다.

```tsx
// root
const methods = useForm<ProjectFormValues>({
    mode: "onChange",
    defaultValues: {
      payload: PROJECT_FORM_DEFAULT_VALUES.payload,
      isFetching: false,
      refetch: refetch,
    },
  });

<FormProvider {...methods}>{children}</FormProvider>

// children
const { watch, formState: { defaultValues, isDirty } } = useFormContext();

const title = watch('payload.title');
```

👉 코드 해석
- react hook form 의 메소드를 자식 컴포넌트에서도 쉽게 사용할 수 있도록, root를 FormProvider 로 묶어주었다.
- 자식 컴포넌트에서 useFormContext 를 이용하여 isDirty 와 watch 등과 값은 메소드를 사용한다.

react hook form 의 FormProvider 는 Context API 를 사용한다. Context API 의 가장 큰 문제는 Context 를 구독중인 모든 컴포넌트는 Provider 의 value prop이 바뀔 때마다 다시 렌더링될 수 있다는 점이다. 

> All consumers that are descendants of a Provider will re-render whenever the Provider’s `value` prop changes.
>

FormProvider 의 성능 문제는 [Form Provider Performance](https://react-hook-form.com/advanced-usage#FormProviderPerformance) 문서에서도 잘 나와있는데, **Context API 를 기반으로 하여 props-drill 없이 하위 컴포넌트로 데이터를 보내줄 수는 있으나, react hook form 이 상태를 업데이트할 경우 하위 컴포넌트들도 모두 리렌더링될 수 있음을 경고하고 있다. 따라서, 개발자는 React memo 를 이용하여 최적화 작업을 따로 해주어야 한다고 한다…😢** 참고로, chrome 개발자 도구의 리액트 devtools 가 퍼포먼스 성능에 영향을 미칠 수 있으니, 본격적으로 성능을 최적화하기 전에 이 부분이 문제가 아닌지 확인하길 추천하고 있다.

> This also causes the component tree to trigger a re-render when React Hook Form triggers a state update, but we can still optimise our App if required via the example below.
>
> Note:Using React Hook Form's [Devtools](https://react-hook-form.com/dev-tools) alongside [FormProvider](https://react-hook-form.com/docs/formprovider) can cause performance issues in some situations. Before diving deep in performance optimizations, consider this bottleneck first.
>

Form Provider 의 성능 최적화 방법은 `React.memo` 를 이용하는 것이다. 하위 인풋 컴포넌트에 methods 를 전달하기 전, 하위 컴포넌트를 memo 로 한 번 감싼다. 그에 따라 methods 중 isDirty의 변화가 있을 때만 리렌더링될 수 있도록 한다.

```tsx
import React, { memo } from "react"
import { useForm, FormProvider, useFormContext } from "react-hook-form"

// we can use React.memo to prevent re-render except isDirty state changed
const NestedInput = memo(
  ({ register, formState: { isDirty } }) => (
    <div>
      <input {...register("test")} />
      {isDirty && <p>This field is dirty</p>}
    </div>
  ),
  (prevProps, nextProps) =>
    prevProps.formState.isDirty === nextProps.formState.isDirty
)

export const NestedInputContainer = ({ children }) => {
  const methods = useFormContext()

  return <NestedInput {...methods} />
}

export default function App() {
  const methods = useForm()
  const onSubmit = (data) => console.log(data)
  console.log(methods.formState.isDirty) // make sure formState is read before render to enable the Proxy

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <NestedInputContainer />
        <input type="submit" />
      </form>
    </FormProvider>
  )
}
```

또 한가지 해결해야 부분은, context 로 부터 받아오는 props 이다. 만약 isDirty 의 변화가 있을 때만 리렌더링될 수 있도록 메모이제이션을 했다고 하자. 그렇다면 watch 같이 특정 state 를 가져오는 메소드는 그대로 사용해도 괜찮은 것일까? 문서를 꼼꼼하게 다시 확인해보니, watch 가 아니라 useWatch 를 사용하는 것을 추천해주고 있었다. 

> The only difference between `useWatch` and `watch` is at the root ([`useForm`](https://react-hook-form.com/docs/useform)) level or the custom hook level update.
> 
> - `watch` - This API will trigger re-render at the root of your app or form, consider using a callback or the useWatch api if you are experiencing performance issues.
> - `useWatch` - Behaves similarly to the `watch` API, however, this will isolate re-rendering at the custom hook level and potentially result in better performance for your application.
>
> 출처) https://react-hook-form.com/docs/usewatch
>

watch 와 useWatch 의 차이점은 root level 인지, custom hook level 의 업데이트인지에 따라 다르다. **watch API 의 경우 폼의 상단인 root 에서 리렌더링을 감지**하기 때문에 특정 필드 변경이 없음에도 리렌더링이 발생할 수 있는 반면, **useWatch의 경우 custom hook level 에서 독자적으로 리렌더링이 일어난다.** 즉, 감시중인 필드가 변경될때만 해당 부분을 리렌더링하기 때문에 다른 필드의 변경 사항에 영향을 주지 않는다.

이외에도, 다양한 최적화 기법이 존재한다. 아래 github 이슈 답변을 참고해서 리렌더링 문제를 해결해보자.

> - Consider using [`useWatch`](https://react-hook-form.com/api/usewatch) instead of [`watch`](https://react-hook-form.com/api/useform/watch) to localize rerenders at the component level where the value actually needs to watched.
- The use of [`useFormState`](https://react-hook-form.com/api/useformstate) instead of [`useFormContext`](https://react-hook-form.com/api/useformcontext) to get only the form's state instead of all it's methods.
- Use [`getValues`](https://react-hook-form.com/api/useform/getvalues) to retrieve some form value instead of [`watch`](https://react-hook-form.com/api/useform/watch) to avoid subscribing (aka. rerendering) to form values.
- Use [`reset`](https://react-hook-form.com/api/useform/reset) when you need to manually set most of the forms values instead of `setValue` which sets them one by one.
- Consider uncontrolled inputs via [`register`](https://react-hook-form.com/api/useform/register) instead of [`Controller`](https://react-hook-form.com/api/usecontroller/controller) / [`useController`](https://react-hook-form.com/api/usecontroller) to avoid updating the forms state
>
> https://github.com/orgs/react-hook-form/discussions/7611
>

## 🔨 해결하기
### 1) watch 대신 useWatch 이용
앞서 확인했듯이, watch 는 root 에서 감지하기 때문에, 필드 변경 없어도 리렌더링이 발생한다. 따라서, 컴포넌트 단위에서 감지를 하는 useWatch 로 변경해주었다.

```tsx
// before
const { watch } = useFormContext<ProjectFormValues>();
const watchedIsFetching = watch("isFetching");

// after
const { control } = useFormContext<ProjectFormValues>();
const watchedIsFetching = useWatch({ control: control, name: "isFetching" });
```


### 2) React.memo 를 이용하여 컴포넌트 최적화
다른 인풋의 변경사항 대해 리렌더링이 일어나지 않도록, React.memo 의 두 번째 파라미터 콜백을 이용하여 조건부로 리렌더링이 발생할 수 있도록 설정해주었다. 다만 상황 상 isDirty 뿐만 아니라, error 가 발생했는지 여부에 따라 리렌더링이 되어야 하기 때문에, 메소드 중 `getFieldState` 객체 값이 같은지를 비교해주었다. (복잡하지 않은 객체였고, 함수가 아닌 boolean 값으로만 이루어졌기 때문에 JSON.stringify 로 변환하여 shallow equal 로 판단해주었다.)

```tsx
const ProjectTitleInput: React.FC<ProjectTitleInputProps> = ({
  methods: { control }}) => { ... }

export default React.memo(
  ProjectTitleInput,
  (prev, cur) =>
    JSON.stringify(prev.methods.control.getFieldState("payload.title")) ===
    JSON.stringify(cur.methods.control.getFieldState("payload.title"))
);
```

### 3) register 대신 Controller 로 리팩토링, 자식 컴포넌트 분리
validation 처리 조건을 `mode:onChange` 즉, input 이 바뀔 때마다 처리해주는 것으로 설정해두었기 때문에, 입력마다 변화를 감지하여 컴포넌트를 리렌더링할 것이다. 그렇다면 Controller 나 register 둘다 마찬가지로 리렌더링되기 때문에, 사용하기 편한 Controller 를 사용하는 것이 오히려 좋을 것이라 판단했다. register 의 경우 input 의 에러 처리 및 value watch 를 하기 위해 추가 메소드를 사용해주어야 하기 때문이다. 하지만, Controller 는 render 에서 field 를 통해 바로 확인할 수 있다.

#### Before
값 감지를 위해 watch, errors 를 context 로부터 가져와야 한다.

```tsx
const {
    register,
    watch,
    formState: { error },
  } = useFormContext<ProjectFormValues>();

// [INPUT REGISTER]
  const titleInputRegister = register("payload.title", {
    required: "필수 입력 항목입니다.",
    maxLength: {
      value: PROJECT_TITLE_MAX_LENGTH,
      message: "200자 이하로 작성해주세요.",
    },
  });

const watchedTitle = watch("payload.title");

return(
  <TextInput {...titleInputRegister}
  placeholder={"제목을 입력하세요"}
  label={"프로젝트 제목"}
  labelTextAlt={`${watchedTitle.length}/${PROJECT_TITLE_MAX_LENGTH}자`}
  error={Boolean(errors.payload?.title)}
  ErrorMessage={<ErrorMessage name="payload.title"
                 render={({message}) => (message ? <span className="mt-2 text-danger">{message}</span> : null)}/>}
  />
)
```

#### After
error 와 watch 를 Controller 에서 전달되는 field와 fieldState 로 확인할 수 있다.

```tsx
<Controller
  control={control}
  name='payload.title'
  render={({ field, fieldState: { error } }) => (
    <TextInput
      {...field}
      placeholder={"제목을 입력하세요"}
      label={"프로젝트 제목"}
      labelTextAlt={`${field.value.length}/${PROJECT_TITLE_MAX_LENGTH}자`}
      error={Boolean(error?.message)}
      ErrorMessage={
        <ErrorMessage
          name="payload.title"
          render={({ message }) =>
            message ? (
              <span className="mt-2 text-danger">{message}</span>
            ) : null
          }
        />
      }
    />
  )}
>
```

그 밖에, 인풋 컴포넌트 메모이제이션을 위하여 부모 컴포넌트 내에서 한 번에 관리되었던 모든 인풋 컴포넌트들을 따로 분리하고 dependency 인 method는 prop 으로 모두 넘겼다.

```tsx
const methods = useFormContext<ProjectFormValues>();

{/* Title Input */}
<ProjectTitleInput methods={methods} />

{/* Area Input */}
<ProjectAreaSelect methods={methods} />

{/* Thumbanil Image Input */}
<ProjectThumbnailInput methods={methods} />
```

### 4) profiling 을 이용한 성능 측정
react dev tool 의 profiling 을 이용하여, 인풋이 하나 변화할 때 마다 성능을 측정해보려한다. 위 방안을 적용해보았을 때 실제로 효과가 있었는지 확인해보자.

### react dev tool 이용 방법 간단 정리
- `Flamegraph`: 각 막대는 리액트 컴포넌트들이며, 너비는 컴포넌트와 해당 자식을 렌더링하는데 걸리는 시간이며 시간이 오래 걸릴 수록 노란색 > 파란색 (상대적으로 시간이 적게 걸림) > 회색 (렌더링하지 않음) 으로 확인할 수 있다.
- `Ranked`: 컴포넌트 자체에 소요된 시간을 다룬다.

### Before 최적화
- 전체 렌더링 시간: 4.7ms
- title input 이 한 번 변경될 때마다 모든 인풋들도 리렌더링된다. 원인은 앞서 살펴본바와 같이 root 로 부터 호출하는 watch 메소드의 사용과 Context 를 구독 중인 하나의 부모 컴포넌트 내에서 register 로 등록된 인풋 컴포넌트들을 관리하고 있었기 때문에 Context value 가 변경될 때마다 부모 컴포넌트도 렌더링 되고 이로 인해 자식 컴포넌트들도 변경이 되는 문제가 있을 것이다.
![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/cb10c339-4940-4391-9ac9-19dcc053c913/f681240d-63e0-44aa-83f5-8de30709efd3/Untitled.png)

### After 최적화
- 전체 렌더링 시간: 0.5ms (4.7ms → 0.5ms !! 무려 4ms 나 줄일 수 있었다.)
- watch → useWatch 로의 변경, 부모 컴포넌트에서 한 번에 관리되면 자식 인풋 컴포넌트들 분리 및 메모이제이션 등의 방식을 취했고
- 결과적으로 **Title input 이 한 번 변화했을 때, 메모이제이션이 된 컴포넌트는 재랜더링되지 않으며 오직 Title input 만 리렌더링되는 것을 확인할 수 있었다! 🙌**

![Untitled](https://prod-files-secure.s3.us-west-2.amazonaws.com/cb10c339-4940-4391-9ac9-19dcc053c913/5f9b0b94-a8c1-4ac9-8aca-196abdc0e0c2/Untitled.png)


## 🧩 번외

머리로만 이해하고 있던 React.memo 와 hook form 의 최적화 기법을 실제로 적용해보고, 내가 개선한 방법이 효과가 있다는 것을 Profiling 을 통해서 수치로 확인해본 것도 처음이다. 이론을 검증하는 과정이 재미있었다. 프론트엔드 분야에서 재미를 느낄 분야가 하나 더 늘어서 좀 더 파고들어보고 싶다.
그 밖에 문제를 해결하는 과정에서 여러 새로운 정보를 확인하게 되었는데, 이 부분은 추후 다른 포스팅에서 다뤄보려 한다.

### **Q1. memo 를 사용하는 것이 과연 좋을까?**
- 언제 React.memo 를 사용해야 할까?
    - 컴포넌트가 같은 props 로 자주 렌더링되거나, 무겁고 비용이 큰 연산이 있는 경우
- 언제 React.memo 를 사용하지 말아야 할까?
    - 렌더링될 때 props 가 다른 경우가 대부분인 컴포넌트
    - React.memo 로 래핑하더라도 props 의 비교를 위해 비교 함수를 수행하고, 거의 false 를 반환하기 때문에 비교가 불필요해진다.
- [참고자료) 리액트 현명하게 사용하기](https://ui.toast.com/weekly-pick/ko_20190731)

### **Q2. useContext 의 리렌더링**
- 상위 컴포넌트를 memo 또는 shouldComponentUpdate 를 이용하여 최적화해두어도, useContext 를 사용하고 있는 컴포넌트 자체부터 다시 리렌더링된다. ⇒ 이때 Context 분리가 필요하다.
- A component calling `useContext` will always re-render when the context value changes.

### **Q3. 순수 함수를 만드는 방법**
- onSubmit 에서 참고하고 있는 모든 메소드(함수, 값 등)를 props 로 넘겨주어야 하는가?
    - 순수함수는 동일한 입력값에 대해서 항상 동일한 출력값을 반환하며, 사이드 이펙트를 주지 않는다.
    - 사이드 이펙트: 예상하지 못한 상황이 발생할 여지가 있는 경우를 의미
        - 참고 중인 매개 변수를 변화시키는 함수
        - 비동기 요청을 보낼 때 오류 발생 여지가 있는 함수
        - console.log, Math.random() 등 호출 할 때마다 값이 달라지는 메소드를 사용하는 경우
        - 위와 같은 경우는 순수함수가 될 수 없다.
    - 모든 함수를 순수 함수로 만들 수는 없다. 순수 함수는 앱의 안정성을 높이기 위한 방법일 뿐이다.
- 출처) https://maxkim-j.github.io/posts/js-pure-function

### **Q4. React 18 버전의 동시성에 대하여**

- 18 버전 이전에 리액트가 겪고 있던 문제는 ‘Blocking Rendering’ 이다. 예를 들어, Form input 의 이벤트가 여러번 발생하면 연관된 UI 들 또한 변경되어 성능이 떨어지는 문제이다.
- 이를 해결하기 위해 리액트에서는 렌더링 동시성을 구현하기 위해 Expiration Time 과 Lane 을 도입했다.
    - Expiration Time: 이벤트의 우선순외와 업데이트 발생 시점을 기준으로 **시간 데이터**를 계산한다. ⇒ 우선순위가 주어진다면, 이전 작업에 대한 완료 없이는 이후의 작업들은 block 처리
    - Lane 모델: 업데이트 우선순위와 배치 여부를 분리하여 관리하고 시간에 비의존적이다. 불필요한 렌더링을 건너뛸 수 있다.
- 렌더링 과정의 진행 ⇒ 렌더링 중간에 이벤트가 발생하면 각각의 작업을 레인에 배정한다 ⇒ 낮은 순위 렌더링을 멈추고, 높은 순위 렌더링과 페인팅을 수행한다 ⇒ 팬딩 상태의 낮은 순위 렌더링을 리베이스한다.
- 출처) https://leetrue-log.vercel.app/leetrue-concurrency-parallelism

---

## 참고 자료
- [https://goshacmd.com/controlled-vs-uncontrolled-inputs-react/](https://goshacmd.com/controlled-vs-uncontrolled-inputs-react/)
- [https://beomy.github.io/tech/react/react-hook-form/#controlled의-경우-controller-컴포넌트](https://beomy.github.io/tech/react/react-hook-form/#controlled%EC%9D%98-%EA%B2%BD%EC%9A%B0-controller-%EC%BB%B4%ED%8F%AC%EB%84%8C%ED%8A%B8)
- [Concurrent React가 가져온 변화: 급하지 않은 렌더링 구분하기](https://blog.lablup.com/posts/2023/01/29/concurrent-react/)
- [https://velog.io/@bnb8419/React-Profiler](https://velog.io/@bnb8419/React-Profiler)

