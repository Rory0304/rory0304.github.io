---
title: '[Next.js] 재미있었던 on-damand ISR 도입기 '
description: >-
   on-demand ISR 로 팀의 생산성을 개선해보자.
author: Lois
date: 2023-01-05
categories: [Next.js]
tags: [Next.js]
pin: false
---

## Intro,

 현재 회사 블로그를 운영 중에 있는데, 콘텐츠 팀이 콘텐츠를 Headless CMS 로 작성을 하면, 개발팀에 배포 요청을 하고, 배포를 하는 과정을 거치고 있다. 

![flow](/assets/img/articles/2023-04-30-on-demand-isr/flow.png)

이전에 마크다운 파일을 직접 작성하여 퍼블리싱하던 입장에서, Headless CMS 는 상당히 편했지만, 계속 반복적인 배포 요청이 개발팀에 쌓이고, 수동 작업을 계속 진행하니 여간 귀찮은 일이 아니었다. 그때 팀장님께서 on-demand ISR 에 대해 문서를 공유해주셨고 이 문제를 해결할 수 있는 방안인 것 같아 적용해보려 한다.

## ISR 이란?

문서에서 설명하는 ISR은 다음과 같다. 

> Next.js allows you to create or update static pages *after* you’ve built your site. Incremental Static Regeneration (ISR) enables you to use static-generation on a per-page basis, **without needing to rebuild the entire site**. With ISR, you can retain the benefits of static while scaling to millions of pages.

> Next.js를 사용하면 사이트를 구축한 후 정적 페이지를 만들거나 업데이트할 수 있습니다. ISR을 사용하면 전체 사이트를 다시 빌드할 필요 없이 페이지 단위로 정적 생성을 사용할 수 있습니다. 정적 페이지의 이점을 유지하면서 수백만 페이지로 확장할 수 있습니다.
> 

여기서 핵심은, **사이트를 구축한 후 재빌드할 필요없이 정적 페이지 생성이 가능**하다는 점이다. 우리가 흔히 아는  SSR / CSR / SSG 의 경우에는 각각의 장단점이 존재했다. SSR 은 매번 최신 정보를 패치할 수 있지만 그 과정에서 화면 깜빡임이 발생한다. CSR은 렌더링을 클라이언트에서 진행하기 때문에 로딩 화면을 보여주어야 한다. SSG 는 빌드 시간에 화면을 생성하기 때문에 최신 정보를 유지하기 어려운 단점이 있다. 

이에 대해 ISR 은 위의 단점을 보완하면서 장점을 취할 수 있다. 즉, 빌드 타임에 페이지를 pre-render 하고 요청이 들어오면 처음에 캐시된 페이지를 보여주다가 이후 새롭게 재생성된 페이지를 보여줄 수 있다. ISR 을 적용하는 방법은 pages 라우터 방식 (v12) 에서는 getStaticProps 에 revalidate 옵션을 건네면 된다. 아래는 공식 문서의 예시이다. 

```tsx
function Blog({ posts }) {
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
 
// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// revalidation is enabled and a new request comes in
export async function getStaticProps() {
  const res = await fetch('https://.../posts')
  const posts = await res.json()
 
  return {
    props: {
      posts,
    },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    revalidate: 10, // In seconds
  }
}
 
// This function gets called at build time on server-side.
// It may be called again, on a serverless function, if
// the path has not been generated.
export async function getStaticPaths() {
  const res = await fetch('https://.../posts')
  const posts = await res.json()
 
  // Get the paths we want to pre-render based on posts
  const paths = posts.map((post) => ({
    params: { id: post.id },
  }))
 
  // We'll pre-render only these paths at build time.
  // { fallback: 'blocking' } will server-render pages
  // on-demand if the path doesn't exist.
  return { paths, fallback: 'blocking' }
}
 
export default Blog
```

하나씩 해석해보자. 먼저 `getStaticPaths` 를 통해 빌드 타임에서 페이지 pathname 을 생성한다. 이때 fallback 으로 `blocking`옵션을 제공한다. fallback 을 잠깐 살펴보면 3가지 옵션이 존재한다. false/true/blocking.

- `false` : 사전에 빌드하지 않은 경로로 접근 시 404 오류를 발생시킴
- `true`: 사전에 빌드하지 않은 경로로 접근 시 먼저 페이지의 fallback (loading) 버전을 보여주고, 해당 pathname 을 빌드 경로로 추가한 뒤 새로운 페이지를 생성하여 보여준다.
- `blocking`: true 와 비슷하게 동작하지만, fallback 버전을 보여주는 것이 아닌 브라우저 로딩 화면을 보여준다.

`getStaticProps` 버전에서는 `revalidate: 10` 옵션이 추가 되었다. 이는 해당 페이지에 요청이 간 후 10초 뒤 regenerate 하겠다는 의미이다. 여기서 중요한 점은 10초마다 갱신하는 것이 아니라, 유저의 ‘요청’ 이 들어오면 10 초 후 갱신을 하겠다는 것이다. 그 시간 전까지는 캐시된 페이지를 보여준다. 만약 유저의 요청이 없다면 페이지는 regenerate 하지 않는다. 

![static generation](/assets/img/articles/2023-04-30-on-demand-isr/static-generation.png)

## on-demand ISR 을 적용해보자.

ISR 방식을 확장하여 사용자의 요청이 아니라 페이지의 변화가 있을 때 요청을 보내어 새롭게 페이지를 생성하는 방식을 생각해볼 수도 있다. 이때 사용하는 것이 on-demand (“필요에 의한”) 방식이다. 보통 CMS Headless 서비스에서는 페이지 변화를 감지하여 프론트엔드에 요청을 보낼 수 있는 hook 을 제공해주고 있다. 이를 활용한다면, 다음과 같은 과정에서 on-demand ISR 을 적용해볼 수 있다. 

step1) CMS 서비스에서 페이지 데이터가 업데이트 된다.

step2) CMS hook 을 통해 웹에 revalidation 요청을 보낸다.

step3) 요청을 받은 시점에 페이지를 재생성하는 로직을 실행한다.

이를 시각화하면, 다음과 같다. 운영팀의 콘텐츠 업데이트에 대하여 CMS 서비스에서는 이를 감지하고, 미리 등록된 hook 을 통해 페이지를 재생성하도록 요청을 보내게 된다.

![flow2](/assets/img/articles/2023-04-30-on-demand-isr/flow2.png)

그렇다면, 페이지 재생성을 어떤 식으로 트리거하면 좋을까? 대부분의 CMS 서비스에서는 명칭은 다를지 몰라도, hook 이라는 서비스가 있다. 콘텐츠 변경에 대하여 어떤 액션을 취할 것인지 설정할 수 있는 기능으로, Github 의 Action 과 동일하다고 보면 된다. 대표적으로 Contentful 은 아래와 같은 웹 hook 설정을 지원한다. 

![custom events](/assets/img/articles/2023-04-30-on-demand-isr/event.png)

https://www.contentful.com/developers/docs/webhooks/content-events/

hook 을 설정하기 위해서는 우선, 서버사이드 로직을 별도로 추가해주어야 한다. 예를 들어, CMS 의 hook 트리거에 대하여 요청이 들어왔을 때 서버 사이드에서 실행하는 로직은 다음과 같이 작성해볼 수 있다. Next.js 에서는 [API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) 를 통해 별도의 API 엔드포인트를 설정해줄 수 있다. 

```tsx
// pages/api/revalidate.js

export default async function handler(req, res) {
  // 요청에 담긴 secret 토큰이 env 에서 설정해준 토큰과 일치하는지 여부를 확인함
  if (req.query.secret !== process.env.MY_SECRET_TOKEN) {
    return res.status(401).json({ message: 'Invalid token' })
  }
 
  // 일치한다면 아래의 로직을 실행함
  try {
    // revalidate 할 페이지에 revalidate 요청을 보냄
    await res.revalidate('/path-to-revalidate')
    // revalidate 가 성공했다면 아래의 response 를 전송
    return res.json({ revalidated: true })
  } catch (err) {
    // 에러가 발생한다면, 마지막으로 생성된 페이지를 보여줌
    return res.status(500).send('Error revalidating')
  }
}
```

위와 같이 설정을 했다면, 이제 아래의 POST 요청에 대하여 페이지 revalidate 가 실행될 것이다.

```tsx
https://<your-site.com>/api/revalidate?secret=<token>
```

---

## Caveats

- ISR 방식은 Next.js 로 운영되는 사이트에서만 적용이 가능하다.
- revalidate 옵션이 생략된다면 기본값인 false(재검증 없음) 를 사용한다. on-demand ISR 방식에서는 custom trigger 를 생성하여 revalidate() 가 호출될 때에만 재검증을 진행한다.

---

## 결론

회사에서 on-demand isr 과 headless cms 의 조합을 적용해보는 것은 꽤 많은 것을 배울 수 있었다. 그 과정에서 nextjs의 fallback 방식을 새롭게 알아보기도 했고, ISR 이라는 새로운 렌더링 방식을 탐구하는 것이 재미있었다. 그리고 무엇보다 팀에게 도움이 되는 일을 한다는 것이 개발의 동기 부여가 되었던 것 같다. 반복적이고 수동으로 이루어지는 프로세스를 어떤식으로 자동화하면 좋을지 조금 더 고민해보며, 적용해보고 싶다.
