---
title: '세션, 쿠키, 로컬 스토리지 알아보기'
description: >-
  왜 맨날 헷갈릴까
author: Lois
date: 2024-01-07
categories: [Web]
tags: [Web]
pin: false
---

## Intro,

면접에서 세션, 쿠키, 로컬 스토리지에 대한 질문을 받았는데, 개념은 알고 있었지만 로그인 구현 과정 설명에 있어서 많이 부족했다. 몇 년전에 다뤄본 적이 있었는데, 회사 들어가고 난 이후에는 한 번도 다뤄본 적이 없어서 기억을 되살려 다시 정리해보려 한다. 

---

## 등장 배경

먼저 HTTP의 특징을 잘 알아야 한다. HTTP는 요청과 응답으로 이루어지는 한 사이클이 끝나면, 연결이 바로 끊어지는 `Connectless` 의 특징을 띄며, 이로 인해 서버는 클라이언트의 이전 상태를 알 수가 없는 `Stateless` 의 특징을 가지고 있다.  이 때문에 클라이언트의 상태를 서버가 아니라, 클라이언트에 저장해두고 필요 시 서버에 전달하는 방식으로 HTTP 의 단점을 보완하려는 시도가 이루어졌으며, 그 방안으로 **‘세션’, ‘쿠키’, ‘웹 스토리지’**  있다.

## 세션, 쿠키, 로컬 스토리지의 차이점

### 1) 세션

- 일정 시간 동안 브라우저로 들어오는 요구 사항을 하나의 ‘상태’ 로 보고, 그 상태를 유지시키는 기술이다.
- object 객체로 서버에 저장이 된다.
- 서버의 능력에 따라 다르지만, 용량에 제한은 없다.
- 세션 ID 는 서버에 관리되기 때문에 비교적 안전한다.
- expires 나 max-age 옵션을 설정하지 않으면, 브라우저 닫을 때 쿠키도 함께 삭제된다. 이러한 쿠키를 세션 쿠키라 부른다.
- 정보가 서버에 있기 때문에 처리에 요구 시간이 걸리기 때문에 비교적 느리다.
- 예시) 화면을 이동해도 로그인이 풀리지 않고 유지하려는 경우

### 2) 쿠키

- 4KB 정도의 클라이언트 단에 저장하는 작은 텍스트 파일
- 파일로 저장되기 때문에 브라우저가 종료되어도 정보는 계속 남아있을 수 있다.
- 만료 기간을 설정할 수 있다.
- 하나의 도메인 당 20개의 쿠키를 저장할 수 있다.
- 서버에 요청 시 속도가 빠르지만, 클라이언트의 브라우저 로컬에 저장되기 떄문에 변질되거나 HTTP 요청 시 이를 갈취당할 수 있어 보안에 취약하다.
- 예시) 로그인 시 ‘아이디/패스워드 저장하시겠습니까?’ 알림, 팝업창을 통해 ‘오늘 이 창 보지 않기’ 체크

### 3) 로컬 스토리지

- 로컬 스토리지와 세션 스토리지가 존재한다.
- key-value의 페어로 저장이 되며, window 프로퍼티로 접근이 가능하다.
- 로컬 스토리지는 사용자가 삭제를 해주지 않는 한 데이터의 영구적인 저장이 가능하다.  반면, 세션 스토리지는 브라우저의 탭이 닫히면 초기화가 된다.

## 서버 사이드에서 클라이언트의 정보를 어떻게 얻을 수 있을까요?

로그인의 경우에는 클라이언트에서 먼저 특정 값을 보내면 서버에서 세션 아이디를 생성해서 클라이언트 사이드에 저장이 되는 방식인데, 그렇다면 반대로, 서버 사이드에서 먼저 브라우저의 쿠키 값에 접근하는 방식을 여쭤보셨던 것 같다.

웹 브라우저에서 서버로 요청을 보낼 때 브라우저는 해당 도메인에 속한 쿠키 정보를 요청과 함께 서버로 전달하게 된다. 이 쿠키 정보는 요청 헤더에 포함되어 서버로 전송이 된다. 이 값을 통해 클라이언트 정보를 얻을 수 있다. 

예를 들어, Express 프레임워크를 사용한다고 하면, app.get(’/’) 을 listen 하고 있는 다음 그 경로로 브라우저 요청이 들어온다면 요청 헤더 속성을 통해 클라이언트 정보에 접근이 가능하게 된다. 쿠키는 이 헤더 중에서 ‘cookie’, 또는 ‘set-cookie’ 라는 속성에 포함이 된다. 

```tsx
const express = require('express');
const app = express();

app.get('/', (req, res) => {
    // 클라이언트의 쿠키 값을 가져옴
    const cookies = req.headers.cookie;
    // cookies 변수에 클라이언트의 쿠키 값들이 문자열 형태로 들어있음
    console.log(cookies);

    // 이후 쿠키 값을 파싱하여 필요한 작업을 수행할 수 있음
    // ...

    res.send('Hello World');
});
```

next 13 버전에서는 ‘next/headers’ 에서 접근이 가능하다. 

```tsx
import { cookies } from 'next/headers'
 
export default function Page() {
  const cookieStore = cookies()
  const theme = cookieStore.get('theme')
  return '...'
}
```

next 12 버전에서는 getServereSideProps 의 req.headers 에서 접근이 가능하다. 

```tsx
export async function getServerSideProps(context) {
  const cookies = context.req.headers.cookie;
  return {
    props: {},
  };
}
```

Next.js 의 서버 사이드에서는 따로 브라우저에 요청을 listen 않고 cookie 값을 얻을 수 있는데 이렇게 할 수 있는 이유는 무엇일까? Docs 를 잠깐 살펴보자.

> The `req` in the context passed to `getServerSideProps` provides built in middleware that parses the incoming request (`req`). That middleware is: `req.cookies` - An object containing the cookies sent by the request. Defaults to `{}`
> 

우선, **getServerSideProps 의 req 값은 Next.js 의 middleware 에서 req.cookies 를 파싱한 값**이다. 미들웨어는 유저가 보낸 요청과 응답 사이클 도중에 중간의 목적에 맞게 처리하기 위해 거쳐가는 장소로 보면 된다.

> Middleware runs before cached content, so you can personalize static files and pages. Common examples of Middleware would be authentication, A/B testing, localized pages, bot protection, and more. Regarding localized pages, you can start with i18n routing and implement Middleware for more advanced use cases.
> 

 Next.js 의 미들웨어는 캐시된 페이지보다 먼저 수행되기 때문에 정적 파일나 페이지를 개인화할 수 있다. 일반적으로 authentication, A/B 테스트, 로컬라이즈 페이지, bot protection 등에 사용된다.

![nextjs-middleware](/assets/img/articles/2024-01-07-session-cookie-storage/nextjs-middleware.png)

아, 간단한 방법이었는데, 당시에 질문 받았을 때는 기억이 잘 안났다. 엉뚱하게 미들웨어로 접근이 가능하다고 말씀을 드렸는데, 예전에 회사 코드에서 auth 를 미들웨어로 처리했던 기억이 나서 그랬던 것 같다.  아무튼, 기억하자. 서버 사이드에서 클라이언트의 쿠키 값은 요청 헤더의 쿠키 값을 통해 접근이 가능하다. 

## 간단한 로그인 구현하기

이론 만을 알기 보다는, 실전을 통해 습득하면 오래 기억할 수 있다. 간단한 로그인 구현을 통해 세션, 쿠키를 활용해보자. 시나리오는 아래와 같다.

1) 유저가 id 와 pw 를 서버에 전달한다.

2) 서버는 클라이언트의 요청 헤더 필드인 ‘cookie’ 를 확인하여, 클라이언트가 해당 세션 ID 를 보냈는지 확인함

3) 세션 ID 가 없다면, 서버는 세션 ID 를 생성하여 클라이언트에 전송함

4) 클라이언트는 재로그인 시, 세션 ID가 저장된 쿠키를 이용하여 서버에 세션 ID를 전달함

5) 로그아웃 시, 서버는 세션ID를 삭제함.

백엔드는 express 와 클라이언트는 React 를 사용하고, 백엔드의 server.js 는 아래와 같이 작성한다.

```tsx
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const fileStore = require("session-file-store")(session); // session file store

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    allowedHeaders: [
      "set-cookie",
      "Content-Type",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Credentials",
    ],
  })
);

app.use(cookieParser("secret"));

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      domain: "localhost",
      path: "/",
      maxAge: 24 * 6 * 60 * 10000,
      httpOnly: false,
      secure: false, // test for localhost
    },
    name: "session-cookie",
    store: new fileStore(),
  })
);

app.get("/autoLogin", (req, res, next) => {
  // 세션 ID가 포함이 되어 있는지 확인
  if (req.session.user) {
    return res.sendStatus(200);
  } else {
    return res.sendStatus(401);
  }
});

app.post("/login", (req, res) => {
  const id = req.body.id;

  // 로그인 로직 수행 후 사용자 정보를 세션에 저장
  // 만약 세션이 없다면, 세션 등록
  if (typeof req.session.user === "undefined") {
    req.session.user = id;
  }

    req.session.save(function () {
      res.status(200).send(`Login Success`);
    });
});

app.get("/logout", (req, res) => {
  // 세션 데이터 삭제 (로그아웃 처리)
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).send("Internal Server Error");
    } else {
      // 클라이언트의 브라우저에서 세션 쿠키 삭제
      res.send("Logged out successfully!");
    }
  });
});

app.listen(8000, () => console.log("Backend Running on Port 8000"));
```

위 코드를 하나씩 뜯어보자.

**1) Express App 설정**

```tsx
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    allowedHeaders: [
      "set-cookie",
      "Content-Type",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Credentials",
    ],
  })
);
```

- Origin: `Access-Control-Allow-Origin` **로,** 통신을 허용한 주소를 명시한다.
- credentials: `Access-Control-Allow-Credentials` 로, 인증 정보를 담아서 보낼지 결정하는 항목이다. 만약 쿠키 같은 인증 헤더 정보를 포함한다면 ‘true’ 로 설정한다.
- allowedHeaders: `Access-Control-Allow-Headers` 로, 헤더가 어떤 식으로 구성될지 설정한다.
    - set-cookie: 서버가 브라우저에 쿠키를 전달하기 위해서는 set-cookie 라는 응답 헤더에 쿠키 정보를 명시한다.

```tsx
app.use(cookieParser("secret"));

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      domain: "localhost",
      path: "/",
      maxAge: 24 * 6 * 60 * 10000,
      httpOnly: false, // test for localhost
      secure: false, // test for localhost
    },
    name: "session-cookie",
    store: new fileStore(),
  })
);
```

- `cookieParser`: 요청과 함께 들어온 쿠키를 해석하여 바로 req.cookies 객체로 생성한다.
- `session`: express-session은 express 에서 세션 값을 생성할 수 있는 라이브러리이다.
    - secret: 암호화를 위한 키 값
    - resave (default true): true 라면 세션이 변경 사항이 없더라도 항상 새롭게 저장됨
    - saveUninitialized (default true): 세션이 생성되었지만 변경 사항이 없는 상태는 uninitialized 라고 하며, true 라면  uninitialized 도 저장하게 된다. false 로 설정하면 저장하지 않기 때문에 리소스 활용 측면에서 유리하다.
    - cookie: Session ID 를 저장할 쿠키에 대한 설정으로 localhost 테스트를 위해서는 secure 과 httpOnly 를 을 false 로, domain 을 localhost 로 설정한다.
    - name: 세션 id 를 저장할 이름
    - store: 보통 redis를 이용하여 세션 값을 DB에 저장하지만, 간단한 테스트이기 때문에 로컬 file store 를 사용했다. 세션이 업데이트될 때마다 세션 file 이 변경될 것이다.

**2) Login 처리**

```tsx
app.post("/login", (req, res) => {
  const id = req.body.id;

  // 로그인 로직 수행 후 사용자 정보를 세션에 저장
  // 만약 세션이 없다면, 세션 등록
  if (typeof req.session.user === "undefined") {
    req.session.user = id;
  }

    req.session.save(function () {
      res.status(200).send(`Login Success`);
    });
});

```

- 클라이언트로부터 login 요청을 받으면, id 와 password 를 body 로부터 얻어온다.
- 만약 클라이언트의 세션에 유저 정보가 없다면 새롭게 세션을 등록한다.
- 세션이 있다면 아직 만료되지 않았기 때문에 로그인이 이루어진다.

**3) 자동 로그인 처리**

```tsx
app.get("/autoLogin", (req, res, next) => {
  // 세션 ID가 포함이 되어 있는지 확인
  if (req.session.user) {
    return res.sendStatus(200);
  } else {
    return res.sendStatus(401);
  }
});
```

- 클라이언트에서 autoLogin 요청을 처리한다.
- 서버에서는 요청 헤더에 담긴 쿠키 값을 통해 쿠키 존재 여부를 확인할 수 있다.

**4) 로그아웃 처리**

```tsx
app.get("/logout", (req, res) => {
  // 세션 데이터 삭제 (로그아웃 처리)
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).send("Internal Server Error");
    } else {
      // 클라이언트의 브라우저에서 세션 쿠키 삭제
      res.send("Logged out successfully!");
    }
  });
});
```

- `req.session.destory`: 서버의 세션 데이터를 없애고, 클라이언트의 쿠키에 담긴 세션을 업데이트한다. 세션 데이터가 없기 때문에 login 되었는지 확인하는 요청을 보내도 확인하지 못한다.

이제 제대로 작동하는지 확인해보자. chrome > application > 좌측 Cookies 를 통해 쿠키 값을 확인할 수 있다. 

먼저 로그인을 하면, 서버에서 새로운 세션 ID 를 생성하여 클라이언트에 전달하게 된다. 우리는 1일로 expires 를 설정했기 때문에 오늘(30일) 에서 내일(31일)까지 유효하다.

![session-cookie](/assets/img/articles/2024-01-07-session-cookie-storage/session-cookie.png);

하단의 ‘Cookie Value’ 패널에서는 값을 Decode 했을 때 결과를 알 수 있다. 문자열은 서버의 로컬 파일 스토리지에 저장된 세션 파일의 이름과 동일하며, 해당 세션 파일을 열어보면 유저 값이 전달되었는지 확인할 수 있다. 

![session-cookie-2](/assets/img/articles/2024-01-07-session-cookie-storage/session-cookie-2.png);

---

## 참고 자료
- [node.js express 5. middleware란? 미들웨어 정의, 미들웨어 유형](https://psyhm.tistory.com/8)
- [https://velog.io/@pds0309/nextjs-미들웨어란](https://velog.io/@pds0309/nextjs-%EB%AF%B8%EB%93%A4%EC%9B%A8%EC%96%B4%EB%9E%80)
- [https://www.daleseo.com/js-jwt/](https://www.daleseo.com/js-jwt/)
- [https://inpa.tistory.com/entry/EXPRESS-📚-express-session-미들웨어](https://inpa.tistory.com/entry/EXPRESS-%F0%9F%93%9A-express-session-%EB%AF%B8%EB%93%A4%EC%9B%A8%EC%96%B4)
