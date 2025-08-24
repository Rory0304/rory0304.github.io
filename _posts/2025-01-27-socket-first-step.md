---
title: '[Socket] Socket.io 첫 걸음'
description: >-
  실시간성 서비스를 개발하며 경험한 Socket.io의 사용 방법을 정리하고, 그 과정에서 마주친 문제들을 하나씩 해결해보았습니다.
author: Lois
date: 2025-01-27T04:06:31Z
categories: [Socket.io]
tags: [React, Socket.io]
pin: false
---

## 서론
웹소켓은 브라우저와 서버 사이의 양방향 통신을 구성하는 HTML5 프로토콜이다.
웹소켓 이전의 HTML 기술로는 클라이언트가 polling 방식으로 n초 간격으로 요청을 서버에 계속 전달하여 응답을 전달받는 방식으로 구현이 가능했으나, 서버측의 부담이 증가하는 단점과 부담 감소를 위해 n초의 간격을 늘릴 수록 실시간성이라고 보기 어렵다는 단점이 있다. 이를 위해 웹소켓이라는 개념이 등장하였고, 현재 거의 대부분의 브라우저에서는 웹소켓을 지원하기 때문에 순수 웹소켓만으로 실시간성 구현이 충분할 수 있다.
하지만, 프로젝트의 확장성에 따라 추후에는 리커넥션, 브로드캐스팅을 직접 구현해야하는 복잡성이 다소 존재한다. socket.io 을 활용하면 이런 실시간성에 필요한 기능을 손쉽게 구현할 수 있다. 

이번 글에서는 Socket.io 를 적용하는 방법과 그 과정에서 작동 원리, 타입 적용, 모듈화 방법을 정리해보려 한다.

<p style="color:gray">📌 Socket.io의 공식 문서의 번역 및 해석이 포함되어 있습니다. 일부 오역이 있을 수 있습니다.</p>

## Socket.io 의 특징
### 1) Engine.IO
Socket.IO 의 프로토콜은 Engine.IO 의 프로토콜을 기반으로 하여 통신 채널 생성 등 몇 가지 부가적인 기능을 제공한다.
Engine.IO 는 Socket.io 에서 서버와 클라이언트간의 full-duplex(양방향+실시간 소통 방식), low-overhead 를 가능하게 하는 프로토콜이다.
웹소켓 프로토콜을 기반으로 하며, 만약 웹소켓 연결을 지원하지 않는다면 HTTP long polling 을 폴백으로 사용한다.
- server: https://github.com/socketio/socket.io/tree/main/packages/engine.io
- client: https://github.com/socketio/socket.io/tree/main/packages/engine.io-client


### 2) Transport
Socket.io 의 웹소켓 통신을 이용할 경우 아래와 같이 특수한 쿼리 파라미터를 포함하여 요청을 보내게 된다. 
 
```
wss://api-example.com/socket.io/?EIO=4&transport=websocket&sid=GjuobXDY2gT1xssGAAEv
```
ws는 웹소켓 프로토콜을 의미하고, wss 는 ws 보다 보안 측면에서 좀 더 신뢰 가능한 웹소켓 프로토콜이다. Http와 Https과 비슷한 개념으로 TSL(Transport Layer Security) 보안 계층을 통해 전달되어 데이터가 암호화된다. 암호화되어 전달될 경우 Proxy 서버에서는 해당 데이터를 확인할 수 없게 된다.

그 다음으로 붙여지는 쿼리 파라미터는 아래와 같은 특징이 있다.

| Name           | Value     | Description           |
| ------------------ | ------------------ | ------------------ |
| EIO | 4 | (필수) 프로토콜의 버전을 포함함 |
| transport | `websocket` | (필수) transport 의 이름 |
| sid | `<sid>` | (선택) 한 번 세션이 성립될 때 만들어지는 세션 식별자로, HTTP 롱폴링 방식에서 업그레이드가 가능한지 여부에 따라 붙여짐 |

여기서 주의할 점은 클라이언트는 세션 하나 당 2개 이상의 웹소켓을 열어서는(open) 안 되며, 만약 새션 하나 당 다수의 웹소켓이 열릴 경우 서버는 해당 웹소켓 연결을 끊어야(close) 한다.

```
A client MUST NOT open more than one WebSocket connection per session. Should it happen, the server MUST close the WebSocket connection.

출처: https://socket.io/docs/v4/engine-io-protocol/#websocket
```


### 3) Lifecycle
패킷은 네트워크 통신에서 데이터를 작은 조각으로 나눠서 전송하는 하나의 단위를 의미한다. 패킷은 패킷의 타입과 부가적인 페이로드로 구성이 되며 웹소켓 통신 시, 상황에 따라 다른 패킷이 전송된다.

![Websocket Packet](/assets/img/articles/2025-01-27-socket-first-step/websocket-packets.png)

#### Packet Type
패킷 타입은 아래와 같다. 각 용어에 대해서는 뒤에서 좀 더 알아보자.

| Packet Type           | ID     | Usage           |
| ------------------ | ------------------ | ------------------ |
| open | 0 | `Handshake` 하는 동안 사용 됨 |
| close | 1 | 통신이 close 되었을 경우를 의미함 |
| ping | 2 | `Heartbeat 메커니즘`에서 사용됨 |
| pong | 3 | `Heartbeat 메커니즘`에서 사용됨 |
| message | 4 | 상대방에게 페이로드를 전송할 때 사용됨 |
| upgrade | 5 | `upgrade` 프로세스에서 사용됨 |
| noop | 6 | `upgrade` 프로세스에서 사용됨 |

#### HandShake
서버와 연결을 생성하려면, 클라이언트는 먼저 HTTP GET 요청을 통해 웹소켓 지원 여부를 먼저 확인한다. 만약 서버에서 웹소켓 지원을 허용한다면, 이후부터 웹소켓 프로토콜을 통해 통신을 진행한다.

1. HTTP long-polling

```
CLIENT                                                    SERVER

  │                                                          │
  │        GET /engine.io/?EIO=4&transport=polling           │
  │ ───────────────────────────────────────────────────────► │
  │ ◄─────────────────────────────────────────────────────── │
  │                        HTTP 200                          │
  │                                                          │
```

2. WebSocket-only session

```
CLIENT                                                    SERVER

  │                                                          │
  │        GET /engine.io/?EIO=4&transport=websocket         │
  │ ───────────────────────────────────────────────────────► │
  │ ◄─────────────────────────────────────────────────────── │
  │                        HTTP 101                          │
  │                                                          │
```

서버가 웹소켓 연결을 허용한다면 opne 패킷으로 다음과 같은 response 를 내려주게 된다.
```
{
  "sid": "lv_VI97HAXpY6yYWAAAC",
  "upgrades": ["websocket"], // 업그레이드 가능한 통신 목록
  "pingInterval": 25000, // Heartbeat 메커니즘에서 사용하는 ping 주기
  "pingTimeout": 20000, // Heartbeat 메커니즘에서 사용하는 ping 만료 시간
  "maxPayload": 1000000
}
```

#### Heartbeat Mecanism
앞선 Handshake 과정이 완료되었다면, 다음으로 Heartbeat mechanism 을 실행하여 연결이 살아있는지를 주기적으로 체크한다.

```
CLIENT                                                 SERVER

  │                   *** Handshake ***                  │
  │                                                      │
  │  ◄─────────────────────────────────────────────────  │
  │                           2                          │  (ping packet)
  │  ─────────────────────────────────────────────────►  │
  │                           3                          │  (pong packet)
```
앞선 handshake 과정에서 받아온 pingInverval 값을 활용하여 서버는 주기적으로 ping 패킷을 전송하고, 클라이언트는 그 응답으로 pong 패킷을 전송한다. 만약 서버가 pong packet 을 못 받는다면 연결이 끊어진 것으로 간주한다. 반대로 클라이언트가 ping packet 을 pingInterval 과 pingTimeout 내에 받지 못 한다면 이 또한 커넥션이 끊어진 것으로 간주한다.

#### Upgrade
앞서 보았듯이 클라이언트는 HTTP Long-polling 으로 연결을 생성하고, 만약 웹소켓 이용이 가능하다면, 통신을 웹소켓으로 업그레이드하게 된다. 

1) 웹소켓으로 통신을 업그레이드하려면 클라이언트는 기존의 HTTP long-polling 통신을 멈추고, 같은 세션 ID 를 활용하여 웹소켓 통신을 open 하게 된다. 이후, 패킷 페이로드 내부에 string `probe` 를 활용하여 ping packet 으로 서버에 전달한다.

2) 서버는 HTTP long-polling 요청을 close 처리하기 위해 GET 요청에 대하여 pending 상태로 두어 noop 패킷을 전송한다. 또한, `probe`를 활용하여 pong packet 을 전달한다.

3) 마지막으로, 클라이언트는 upgrade 과정을 완료했음을 알리는 upgrade 패킷(5)을 전달하게 된다.

```
CLIENT                                                 SERVER

  │                                                      │
  │   GET /engine.io/?EIO=4&transport=websocket&sid=...  │
  │ ───────────────────────────────────────────────────► │
  │  ◄─────────────────────────────────────────────────┘ │
  │            HTTP 101 (WebSocket handshake)            │
  │                                                      │
  │            -----  WebSocket frames -----             │
  │  ─────────────────────────────────────────────────►  │
  │                         2probe                       │ (ping packet)
  │  ◄─────────────────────────────────────────────────  │
  │                         3probe                       │ (pong packet)
  │  ─────────────────────────────────────────────────►  │
  │                         5                            │ (upgrade packet)
  │                                                      │
```


## Client Initialization
### 1) 초기 설정
이제 Socket.io 를 활용하여 직접 프론트 연결을 진행해보자. 기본적으로 클라이언트에서는 socket.io-client 라이브러리에서 제공하는 `io` 메소드를 통해 소켓 인스턴스를 생성한다. 
```ts
const socket: Socket = io(url, {
  auth,
  extraHeaders,
  query,
  // 옵션 정의
});
```

공식 예제에서는 socket 인스턴스를 외부에서 하나의 파일(ex: socket.js) 로 관리하여 다른 컴포넌트에서 임포트하여 사용하는 것으로 소개하고 있었는데,
외부 포스팅을 참고해보니 react state 로 관리하는 코드도 확인할 수 있었다. 
```ts
const [socket, setSocket] = useState<Socket | null>(null);

useEffect(() => {
  setSocket(socket.io(url, { ... }))
}, [])
```
위 코드처럼 state 를 사용하여 소켓 인스턴스를 생성해도 괜찮을지 궁금했다. 잘못 관리할 경우 렌더링이 여러번 발생하여 다수의 소켓 state 가 생성이 되고 중복으로 이벤트가 발생하거나 제대로 disconnect 되지 않는 등의 문제가 있을 것 같았다.

기본적으로 소켓 인스턴스를 생성한다는 것은 새로운 connection 을 생성하는 것과 동일하다. 따라서, 컴포넌트가 리렌더링될때마다 새로운 conenction 을 매번 생성하기보단, Ref 를 이용하여 리렌더링되어도 한 번만 생성될 수 있도록 하는 것이 좋을 것 같았다.

나의 경우, socket 의 속성을 초기화해주는 initialize 코드와 socket 인스턴스를 관리하는 Ref 생성하여 소켓 인스턴스를 관리해주었다.

```ts
const initWebSocket = () => {
  const socket =  io(...)
  return socket
}
```

```ts
const socket = useRef(initWebSocket())
```

### 2) Listening to events
이제 클라이언트에서 소켓 연결을 진행했다면, 서버와 통신할 수 있는 이벤트를 정의해보자. 
이때는 서버사이드와 클라이언트 사이드간 어떤 이벤트를 주고 받을지 논의가 필요하다. 이벤트 통신을 위한 타입(`eventName`)이 정의되었다면, 이벤트 리스너(`listener`)를 등록해준다. Socket.io는 다음과 같은 이벤트 등록 메소드를 제공한다.

#### Event Listener
- `socket.on(eventName, listener)`: 이벤트 수신 리스너를 등록
- `socket.once(eventName, listener)`: 지정된 이벤트에 대한 일회성 리스너를 등록
- `socket.off(eventName, listener)`: 등록된 이벤트 수신 리스너를 제거
- `socket.removeAllListeners([eventName])`: 등록된 다수의 이벤트 수신 리스너를 제거

#### EventName
- `connect`: 클라이언트가 서버에 연결되었을 때 실행되는 이벤트
- `connect_error`: 연결 오류가 발생했을 때 실행되는 이벤트
- `disconnect`: 클라이언트 또는 서버가 연결을 끊었을 때 실행되는 이벤트로, 연결이 끊긴 상황에 대한 이유(`reason`) 을 알 수 있다.
  - `io server disconnect`: 서버에서 강제적으로 서버 소켓의 연결을 끊은 경우
  - `io client disconnect`: 클라이언트에서 수동으로 서버 소켓의 연결을 끊은 경우
  - `ping timeout`: 서버가 ping timeout 이내에 응답하지 않은 경우
  - `transport close`: 연결이 닫힌 경우 (ex. 연결 유실, 네트워크 연결 방식 변경)
  - `transport error`: 연결 중 에러가 발생한 경우 (ex. 서버가 죽은 경우)

만약 TS를 사용한다면, 이벤트 리스너 등록시, 서버로부터 받는 값에 대해 타입 추론이 어려울 수 있다. 모든 값이 `any` 로만 정해진다면 추후 코드가 방대해질 때 제대로 파악하기 어려워진다.
Socket 에서도 클라이언트와 서버 사이드에서 주고 받는 데이터의 타입을 정의할 수 있다. 

```tsx
//
// 참고: https://socket.io/docs/v4/typescript/#types-for-the-client
//
interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
}

interface ClientToServerEvents {
  hello: () => void;
}

// please note that the types are reversed
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io();

socket.on("basicEmit", (a, b, c) => {
  // a is inferred as number, b as string and c as buffer
});
```

### Socket 이벤트 관리
socket 인스턴스를 임포트한 후, on, off 등의 이벤트를 등록하는 방식으로 실시간 소통이 가능하다.

```tsx
import { socket } from './socket.ts'

socket.connect();
socket.on(eventName, listener);
```
물론 이 방법도 문제는 없으나, 클라이언트의 특성 상 여러 컴포넌트에서 소켓을 연결하고 이벤트 리스너를 등록할 수 있다는 점을 고려한다면 개선이 필요한 지점이다. 예를 들어, 위 코드에서 동일한 소켓 인스턴스를 자식 컴포넌트에 사용하려면 어떻게 해야 할까? 취할 수 있는 방법은 간단하게 3가지 방식으로 추려볼 수 있다. 1) 부모 컴포넌트에 props drilling 을 해주기 2) hook 을 이용하기 3) Context API 를 활용하기

코드 확장성을 고려한다면 1번 방식은 적절하지 않으며, 2번 hook 방식은 여러 컴포넌트에서 활용했을 때 socket 인스턴스가 매번 새롭게 생성될 수 있기 때문에 적절하지 않다. 예를 들어, 서버에서 소켓의 옵션값을 활용한다고 가정해보자. 클라이언트에서는 auth token 또는 query 파라미터를 설정할 수 있는데, 이 값들은 변동 가능성이 있기 때문에 한 번 생성한 socket 인스턴스를 활용하여 `socket.auth` 또는 `socket.io.opts.query` 적용으로 속성을 변경해줄 수 있어야 한다.


```tsx
const socket: Socket = io(url, {
  auth,
  extraHeaders,
  query
});

// 새로 생성하는 것이 아니라, 기존의 socket 인스턴스에 연결을 해주어야 함
socket.auth = authTokens.accessToken;
socket.io.opts.query = newQuery;
```

만약 hook 을 적용한다면 여러 컴포넌트에서 동일한 socket 인스턴스를 바라볼 수 없게 된다. 싱글톤 방식으로 socket instance 를 관리해준다고 하여도, 추후 다른 컴포넌트에서 socket initialize 를 시도할 경우, 기존에 생성한 소켓 인스턴스가 제대로 cleanup 되지 않을 수 있기 때문에 싱글톤 + hook 의 조합도 적절하지 않을 것 같았다.

그래서 나는 3번째인 Context API 를 활용하였다. Context API로 하나의 웹소켓 인스턴스를 생성 및 관리하고, Provider 하위의 자식 컴포넌트에서 인스턴스 변경이 있어도 다른 컴포넌트에서 변경된 소켓을 바라볼 수 있기 때문에 props drilling 문제를 해결하면서도 속성 변경에 대응할 수 있었다.

```tsx
const socket = initWebSocket();

//
<WebSocketContext.Provider value={{ socket }}>
  {children}
</WebSocketContext.Provider>

// 하위의 Component A
const { socket } = useContext(WebSocketContext);

// socket 의 속성을 변경해야 할 경우 적용
useEffect(() => {
  socket.io.opts.query = query;

}, [query, socket])
```

더 나아가, socket 인스턴스의 connect, disconnect 하는 것은 WebSocket용 Provider 와 함께 정의되어야 하기 때문에 Provider 내부에서 정의해주었고, 이벤트를 on, off 하는 코드는 컴포넌트에서 context 를 통해 분산하여 관리하는 것이 아니라 따로 hook 으로 분리하여 하나의 파일에서 유지보수할 수 있도록 개선하였다.

#### AS-IS

```ts
// Parent
const { socket } = useContext(WebSocketContext);

useEffect(() => {
  socket.connect()

  return () => {
    // unmount 될때 disconnect
    socket.disconnect()
  }
}, [])

return (
  <WebSocketProvider value={{ socket }}>
    <ComponentB />
    <ComponentC />
  </WebSocketProvider>
)

// Component B
const { socket } = useContext(WebSocketContext);

useEffect(() => {
  socket.on(eventNameA, listener)

  return () => {
    socket.off(eventNameA, listener)
  }
}, [])

// Component C
const { socket } = useContext(WebSocketContext);

useEffect(() => {
  socket.on(eventNameB, listener)

  return () => {
    socket.off(eventNameB, listener)
  }
}, [])
```

#### TO-BE

```ts
// WebSocketProvider.tsx
const { socket } = useWebSocketConnect();

return (
  <WebSocketProvider value={{ socket }}>
    <ComponentB />
    <ComponentC />
  </WebSocketProvider>
)

// useWebSocketEventHandler
export const useWebSocketEventHandler = () => {
  const { socket } = useContext(WebSocketContext);

  if (!socket) {
    throw new Error('This hook must be used within a WebSocketProvider');
  }

  const on = <K extends keyof WebSocketEventResponseDataMap>(
    event: string,
    listener: (arg: WebSocketEventResponseDataMap[K]) => void,
  ) => {
    console.log('[socket event on]', event);
    socket.on(event, listener);
  };
}

// Component A, B
const { on, off } = useWebSocketEventHandler();

useEffect(() => {
  on(WebSocketEventResponseDataMap.eventNameA, listener)

  return () => {
    off(WebSocketEventResponseDataMap.eventNameA, listener)
  }
}, [])
```

## Refs
- [ko.javascript.info 웹소켓](https://ko.javascript.info/websocket)
- [What do the number codes mean next to the WebSocket messages?](https://stackoverflow.com/questions/25349773/what-do-the-number-codes-mean-next-to-the-websocket-messages)
