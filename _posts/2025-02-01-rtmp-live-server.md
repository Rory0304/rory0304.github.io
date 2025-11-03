---
title: '라이브 스트리밍 프로토콜 (feat. RTMP/HLS)'
description: >-
  라이브 스트리밍 프로토콜 이론 정리
author: Lois
date: January 11, 2025 8:49 PM
categories: [Web]
tags: [Web, RTMP, HLS]
pin: false
---

## 라이브 스트리밍 프로토콜
비디오 파일의 특성 상 파일 크기가 크기때문에, 전송 과정에서 분할을 하는 과정이 필요하다. 비디오를 청크로 분리하고 다시 조합하는데 사용하는 기술을 '스트리밍 프로토콜'이라 한다.
대표적으로 RTMP, HLS, WebRTC 가 있다.

### RTMP(Real-Time Message Protocol)
- 어도비의 flash 플레이어에 비디오 콘텐츠를 전달하는데 사용하는 방식이다.
- 송신측에서 우수한 성능을 가지고 있지만 Flash 지원 종료로 인해 HTML5 를 비롯한 최신 비디오 플레이어 등 브라우저 호환이 되지 않는 것이 특징이다. 
- TCP 기반이라 패킷의 손실 없이 전송이 가능하다.

### WebRTC (Web Real-Time Communication) 
- 웹 화상회의를 지원하기 위해 만들어진 기술로, 저지연의 peer-to-peer 가 가능하다.
- UDP 기반으로 패킷 손실의 가능성이 있다.

### HLS (HTTP Live Streaming)
- Apple 에서 개발한 미디어 스트리밍 프로토콜로, 현재 가장 널리 쓰이는 라이브 스트리밍 기술이다.
- 뒤에서 설명하겠지만, 영상을 m3u8 확장자를 가진 재생목록과 다수의 세그먼트로 쪼개어 재생목록을 만들게 되는데 이 과정에서 6초~30초 정도의 지연시간이 발생한다.


위의 스트리밍 프로토콜의 사례로는 아래와 같이 적용될 수 있다.
- Encoder: RTMP,webRTC,SRT,RTSP
- Player: HLS,webRTC,SRT,DASH,LL-HLS

## RTMP + HLS 의 구현
주로 채택하는 방식은 인코딩으로 RTMP 를, 디코딩으로 HLS 를 채택하는 것이며,
실제 라이브 환경에서는 다음의 순서로 동작을 할 수 있다.

![rtmp-hls](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*sZRnO0jx7X0TbDbf6eMfNg.png)
(출처: https://www.wowza.com/blog/hls-latency-sucks-but-heres-how-to-fix-it)

> Step1. 카메라에서 영상 ▶ Encoder(인코더)
>
> Step2. Encoder ▶ Media Server
>
> Step3. Media Server ▶ 영상 플레이어
>
> Step4. 영상 플레이어 ▶ 시청자(Client)

#### Step1. 카메라에서 영상 ▶ Encoder(인코더)
먼저 카메라 영상을 코덱을 활용하여 영상을 압축하는 과정을 먼저 거친다. 여기서 '코덱'이란, 인코딩(Encoding)+디코딩(Decoding)의 합성어로 디지털 미디어 데이터를 압축하고 압축을 해제하는 기술을 의미한다. RTMP 인코더를 사용하기 때문에 음석 코덱 방식으로 audio(ACC) 와 영상 코덱 방식으로 video(H.264) 코덱을 사용한다. 

#### Step2. Encoder ▶ Media Server
인코딩 과정을 거친 데이터를 미디어 서버로 영상을 전송하게 된다. 이때 CDN 서버를 이용하면 지리적으로 가까운 위치에 있는 서버에 전송을 할 수 있어서 낮은 지연시간을 확보할 수 있다.

#### Step3. Media Server ▶ 영상 플레이어
이렇게 인코딩된 결과를 미디어 서버에서 HLS 를 이용하여 재생목록을 제공한다.
먼저 HLS는 연속된 비디오를 작은 세그먼트로 나누어 HTTP 를 통해 전송하게 되는데, 그 구성요소는 다음과 같다.

- 플레이리스트 파일 (m3u8): 세그먼트 정보를 담은 메타데이터로, 어떤 순서로 몇 초간 재생할 것인지 등이 명시되어 있다.
  - m3u8 파일은 다음 2가지로 나뉠 수 있다.
     - Media Playlist는 시간대에 따른 ts 파일 목록을 명시한다.
     - Master Playlist 는 네트워크 품질에 따라 재생할 수 있는 Media playlist 목록이 적혀 있고 상황에 맞게 고/저품질의 영상을 재생한다.

- 미디어 세그먼트 (ts/mp4): 분할된 세그먼트들은 mp2ts(.ts)와 mp4로 구성된다.
  - MPEG2 Transport Stream == mp2ts

#### Step4. 영상 플레이어 ▶ 시청자(Client)
HLS 를 이용하여 생성된 재생 목록은 미디어 서버에서 HTTP 를 통해 클라이언트에 전송된다. 클라이언트 측에서 HLS 전용 플레이어(hls.js) 를 선택한 경우 manifest 파일을 파싱하는 과정을 거쳐서 해상도와 mp4 등의 정보를 얻고 유저의 Network Bandwidth 를 측정하여 적절한 영상 정보를 재생하게 된다.


## HLS 시작하기
### 도움이 될 자료
- [HLS 문서](https://github.com/video-dev/hls.js/blob/master/docs/API.md#getting-started)
- [HLS Demo](https://hlsjs.video-dev.org/demo/)

#### 용어 설명
문서에서 자주 사용되는 용어는 Level, Fragment, Buffer 다.
Level은 동일한 콘텐츠의 서로 다른 품질/비트레이트 버전을 의미한다. 각각의 레벨은 독립적인 Media playlist 를 가지고 있고 화질에 따라 레벨을 선택해서 영상 정보를 변경할 수 있다.
Fragment 는 다른 말로 Segment 즉 앞서 설명한 미디어 세그먼트(.ts 혹은 .m4s 포맷)이다.
HLS 플레이어는 비디오 재생에 따른 이벤트를 제공해주고 있다. 예를 들면 다음과 같다.

- Hls.Events.FRAG_LOADING: Fragment 로딩 시작
- Hls.Events.FRAG_LOADED: Fragment 로딩 완료
- Hls.Events.FRAG_PARSED: Fragment 파싱 완료
- Hls.Events.LEVEL_SWITCHING: Level 변경 
- Hls.Events.LEVEL_SWITCHED: Level 변경 완료

Buffer 는 현재 재생 위치보다 미리 다운로드하여 메모리에 저장해둔 비디오/오디오 데이터다. (pre-loaded segments of video and audio data)
버퍼를 사용함으로써 우리는 네트워크 속도가 느려져도 미리 다운로드된 영상을 계속 재생할 수 있다. 우리가 흔히 아는 '버퍼링'은 네트워크 상태가 안 좋을 때 영상의 소리나 재생이 멈춰있는 현상을 의미한다. 즉 버퍼를 위한 다운로드 속도보다 재생 속도가 빠를 경우 버퍼가 고갈되어 재생이 멈추고 로딩 상태에 머물게 된다. 이 경우 버퍼링 상태인지 판단하여 로딩 UI를 보여주거나, 버퍼 사이즈를 알맞게 조절하여 최적화할 수 있다.
```
maxBufferLength: 30 // 30초 앞까지 미리 다운로드
backBufferLength: 90 // 90초 이전 데이터 유지
maxBufferSize: 60 * 1000 * 1000, // 최대 60MB까지 버퍼링
```
여기서 유의해야 하는 점은 buffer 의 사이즈를 너무 많이 부여하거나, 너무 적게 부여할 경우 발생하는 문제이다. 만약 maxBufferLenght 를 짧게 설정할 경우, 메모리 절약과 빠른 ABR 반응을 지원할 수 있으나 네트워크 변동에는 취약할 수 있다. 하지만 긴 값으로 설정할 경우 안정적으로 재생이 가능하고, 네트워크 변동에 강하지만 메모리의 사용이 증가할 수 있다.


### HLS 영상 트러블 슈팅
#### 1. 코덱 설정을 확인
우선 가장 많이 발생한 이슈가 영상이 안 보이거나 소리가 안 들리는 이슈였다. 
```
// hls.js Error log
A media error occurred: bufferAddCodecError
A media error occurred: bufferIncompatibleCodecsError
```
관련하여 다양한 원인이 있겠으나, 나의 경우 iOS 기기에서 송출한 영상을 안드로이드에서 시청할 경우와 특정 안드로이드 기기에서 송출했을 경우 발생했다.
현재 미디어 서버의 인코딩(*FFmpeg: 코덱과 트랜스코딩을 할 수 있는 프로그램) 설정값은 다음과 같았다.

```
// Node Media Server 오디오 인코딩 구성
acParam: [
  '-b:a', // 오디오 비트레이트
  '128k', //
  '-ar', // 샘플레이트
  '44100', //
  '-ac', // 오디오 채널수
  '2',
]
```
원인은 오디오 코덱 호환성 문제로 추가적인 설정을 해주어야 했다. 오디오 AAC 코덱은 여러 프로파일이 있는데, 일부 Galaxy 기기는 특정 AAC 프로파일만 지원할 수 있다고 한다.
또한, 송출 시 기본적인 오디오 레벨이 너무 낮아서 일부 기기에서 들리지 않을 수 있다. 이는 백엔드에서 오디오 코덱을 범용(aac_low)으로 설정하여 해결해주었다.

#### 2. 절전 모드인지 확인
기본적으로 iOS 절전 모드인 경우, 영상의 자동재생은 지원하지 않는다. 
이는 명시적으로 사용자가 영상을 재생을 할 수 있도록 해야 하고, 재생 버튼 UI 숨겨야 할 경우 전체 화면 터치 등과 같은 방식으로 우회하는 방식을 취할 수 있다. 

#### 3. 비디오 자동 재생
브라우저 정책 상, 비디오는 음소거 상태여야 자동재생이 가능하며 코드 상 강제로 자동 재생을 해줄 경우, 다음과 같은 오류가 발생한다.
```
Unhandled Promise Rejection: NotAllowedError: The request is not allowed by the user agent or the platform in the current context, possibly because the user denied permission.

```
From MDN, 비디오가 자동재생이 되는 조건
- 오디오가 음소거 상태거나 볼륨이 0으로 설정될 것
- 사용자가 사이트와 상호작용 (클릭, 탭, 키 누르기 등) 할 것
- 사이트가 autoplay 허용 사이트일 것 (브라우저가 자동으로 등록하거나 사용자가 수동으로 사이트에 autoplay를 허용하는 경우)
- Permissions Policy를 사용해 아이프레임과 도큐먼트에 autoplay 권한을 부여하는 경우

브라우저 정책에 따라서도 제한 사항이 있다. 만약 비디오 자동 재생이 처음에는 멈췄다가 새로고침 한 후 잘 되는 경우는 '크롬의 미디어 참여지수'와 관련이 있을 수 있다. 즉, 크롬에서는 미디어 참여 지수에 따라 미디어 재생을 실행하며, 한 번 영상을 본 경우에는 [미디어 참여 지수](https://developer.chrome.com/blog/autoplay?hl=ko#media_engagement_index)가 임계값을 넘기기 때문에 자동 재생이 될 수 있다. 

만약 강제로 첫 진입시에 영상 자동 재생 + 오디오 자동 재생을 해주어야 하는 경우, fake sample video 를 먼저 띄워서 1초 간의 딜레이를 준 다음 Origin 영상으로 대체하는 방식으로 우회해줄 수 있다. [참고 자료](https://blog.naver.com/sooni_/222882037109)는 해당 링크를 참고 한다.

#### 4. iOS 15-16 버전 대응
HLS.js 특성 상, 브라우저에서 MSE(media source extensions) 가 지원되지 않는다면 실행하지 않는다. 아쉽게도 iOS 사파리 15-16 버전에서는 MSE 가 제대로 동작하지 않기 때문에 Hls.js 를 사용할 수 없다. 이때는 iOS 의 네이티브 HLS 를 사용하는 것으로 분기 처리를 해주어야 한다.

```ts
// MSE 지원 여부 확인
if (Hls.isSupported()) {
  var hls = new Hls();
  hls.loadSource(videoSrc);
  hls.attachMedia(video);
}

// 지원하지 않는다면 ios native 사용 가능한지 확인
if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = videoSrc;
}
```

#### 5. 오류 제어
RTMP 송출을 바로 시작했다고 해서, HLS 플레이어가 바로 실행되지는 않는다. 2-3s delay 가 발생하며 그전까지는 송출 서버 api 호출시 오류 응답이 내려간다.
하지만 문제는 실제로 송출 정보가 존재하지 않거나, 송출자가 실수로 송출 후 나갔다가 재시작을 했을 경우 그 짧은 간격 사이에도 오류가 발생할 수 있다.
따라서 1) player 시작은 했는데 아직 응답이 없는 것인지 2) 실제로 존재하지 않는 URL인지 3) 송출 재시작 되기까지 오류인지 판단을 해주어야 한다.

1) Player 시작은 했는데 응답이 없는 경우
물론 Socket 이벤트로 송출 시작 이벤트를 건네주고는 있으나, 실질적으로 바로 비디오 재생은 불가하기때문에 그 전까지는 load error가 발생한다.
따라서 송출 시작 후 delay 에 대해서는 주기적으로 비디오 정상 동작이 가능한지 확인해주어야 한다.
이때 사용한 것이 polling 이며 5초 주기적으로 확인하고 max count 만큼 실행되었다면 polling 을 끝내는 방식으로 진행했다.

2) 실제로 존재하지 않는 URL 인 경우
HLS.js 플레이어에서 m3u8을 로드했을떄 `MANIFEST_LOAD_ERROR` 상태값을 기반으로 실제 존재하지 않는 송출 정보임을 확인할 수 있다.

3) 송출자의 실수로 송출 재시작하는 경우
만약 송출 중에, 실수로 앱을 나가게 된다면 시청자 입장에서는 시청하고 있다가 더이상 송출할 영상 정보가 없기 떄문에 오류가 발생할 수 있다.
다만 바로 오류 UI 를 보여주기 보다는 어느정도 송출자가 다시 시작할 수 있는 delay 를 부여하는 것이 UX 적으로 좋다고 한다.
이때는 HLS 설정값 중 `maxNumRetry` 를 활용하여 에러 발생 후 retry 시도 횟수를 조절한다.

```
// 재생 불가한 상태에서 Hls 에서는 LEVEL_LOAD_ERROR 를 제공한 후 자동으로 retry 를 진행하게 되며, retry 설정값 이내에 재생이 가능한 경우 자동 재생한다.
`levelLoadingMaxRetry` : 3 (특정 레벨의 로딩이 실패했을 경우 최대 재시도 횟수로, retry 를 최대 3번만 진행한다는 의미)
```
참고 자료) [Retry on network error rather than throwing a fatal error](https://github.com/video-dev/hls.js/issues/1714#issue-323059423)


## Ref
- [미디어 기술 이해 6단계로 알아보는 라이브 생방송 송출 원리](https://medium.com/naver-cloud-platform/%EB%AF%B8%EB%94%94%EC%96%B4-%EA%B8%B0%EC%88%A0-%EC%9D%B4%ED%95%B4-6%EB%8B%A8%EA%B3%84%EB%A1%9C-%EC%95%8C%EC%95%84%EB%B3%B4%EB%8A%94-%EB%9D%BC%EC%9D%B4%EB%B8%8C-%EC%83%9D%EB%B0%A9%EC%86%A1-%EC%86%A1%EC%B6%9C-%EC%9B%90%EB%A6%AC-86a5137a3655)
