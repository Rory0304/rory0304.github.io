---
title: '[Docker] Next.js 14 Docker 적용 방법 살펴보기'
description: >-
  Next.js 14 버전의 웹에 Docker를 세팅하는 방법
author: Lois
date: 2024-03-02
categories: [Next.js, CI/CD]
tags: [Infra, Next.js, Docker, AWS]
pin: false
---

## 배경
회사에서 Next.js 14 버전의 프로젝트의 Docker 세팅을 담당하게 되었다. Docker는 말만 들어봤고, vercel 이나 heroku 배포 경험은 있으나 직접 사내 프로젝트를 AWS 에 접근하여 배포하는 것은 처음 해보는 일이라 때문에 초기 학습이 필요한 상황이었다.


## 이 글을 읽으면
- Docker 의 기본 개념을 알 수 있다.
- Next.js 프로젝트를 Docker 세팅하는 방법을 알 수 있다.


## Docker 란
공식 문서에서 설명하고 있는 [Docker 의 개념](https://docs.docker.com/get-started/docker-overview/#fast-consistent-delivery-of-your-applications)을 잠시 살펴보자. 


> Docker is an open platform for developing, shipping, and running applications.
> Docker enables you to separate your applications from your infrastructure so you can deliver software quickly.
> With Docker, you can manage your infrastructure in the same ways you manage your applications.
> By taking advantage of Docker's methodologies for shipping, testing, and deploying code, you can significantly reduce the delay between writing code and running it in production.


간단히 말해, Docker 는 앱의 실행 환경을 하나의 ‘이미지’ 로 만들어서, 어디에서든 똑같이 실행할 수 있도록 도와주는 도구이다. 위에서 사용하고 있는 핵심 용어는 `Container` 와 `Image` 이다.

### 1) 도커 컨테이너
도커 컨테이너는 애플리케이션 코드를 실행하는데 필요한 코드, 종속성, 라이브러리가 포함된 런타임 환경으로, 가상머신에서 실행된다. 


### 2) 도커 이미지
도커 이미지(컨테이너 이미지)는 컨테이너를 생성하는데 사용되는 독립적인 실행 파일로, 컨테이너가 실행해야 하는 라이브러리/종속성/파일이 포함되어 있다.
도커 이미지는 공유가 가능하기 때문애 한 번에 여러 위치에 배포가 가능하다.

![docker-image-container](/assets/img/articles/2024-03-02-nextjs-docker/docker-container-image.png)
(출처: https://aws.amazon.com/ko/compare/the-difference-between-docker-images-and-containers/)

### Without Docker
Docker 없이 코드를 배포하는 방식은 어떨까?
tar.gz로 코드 파일 압축을 하고, scp-action으로 EC2 에 직접 전송하는 방식이 있으나, 큰 파일인 경우 전송 시간이 오래 걸릴 수 있으며 빌드 파일의 버전 관리가 어렵다는 문제점이 있다. 다른 방법으로는 소스 코드를 S3 에 올려서 codeDeploy 를 통해 EC2 인스턴스에 보내는 방식을 취할 수 있다.
하지만, EC2 환경에서 직접 Next.js 의 빌드 결과물을 운용할 경우 아래와 같은 불편 사항을 확인할 수 있다.

#### 의존성 관리의 복잡성
여러 프로젝트가 같은 EC2 서버에 있을 경우를 생각해봐도 의존성 관리가 복잡해질 수 있음을 예상할 수 있다. EC2 에 설치한 의존성이 여러 프로젝트에서 똑같이 사용되지 않을 수 있기 떄문이다. 

#### EC2 인스턴스의 자원
프로덕션 EC2 환경에서 직접 빌드를 하는 것보다는 빌드된 결과물만 EC2 환경에서 실행하는 것이 자원 절약에 좋을 것이다.

#### 롤백의 어려움
만약 특정 라이브러리 버전을 업데이트하여 v2.0 으로 배포를 했다고 가정하고, 추후 라이브러리 의존성 문제로 v1.0 으로 롤백을 해야 한다고 생각해봅시다. 문제는 서버의 버전은 이미 최신 버전이기 때문에 롤백을 위해서는 이전의 라이브러리 버전으로 다운그레이드를 해준 후 배포가 되어야 한다.
만약 긴급하게 롤백이 필요하거나, 해당 서버에 이미 최신 버전에 의존하고 있는 다른 프로젝트가 존재한다면 문제를 해결하기 위해 태초의 상태로 돌아가야 하는 지경에 이르게 된다.

위의 문제점들은 Docker 에서는 완전히 독립된 패키지로 만듦으로써 해결을 할 수 있다.
즉, Docker 는 앱의 실행 환경을 하나의 ‘이미지’ 로 만들어서 어디서든 똑같은 환경으로 실행할 수 있도록 도와주며 여러 프로젝트를 같은 서버 환경에서 운용이 가능하다. 또한, 롤백을 할 경우에도 복잡한 절차 없이 완전히 독립된 이미지로 교체를 해주기만 하면 된다.


## Dockerfile 작성하기
### Step0. 멀티스테이지 빌드 DockerFile
이제, next.js 웹앱을 배포하기 위한 Dockerfile을 작성해보자. 멀티스테이지 방식은 최종 컨테이너 이미지에는 필요없는 환경을 제거할 수 있도록 단계를 나누어 컨테이너 이미지를 만드는 방법이다.

- 각   빌드 스테이지에만 필요한 의존 파일을 모두 삭제한 상태로 컨테이너를 실행 가능하다. 즉, 조금 더 가벼운 크기의 컨테이너 사용 가능해진다.
- FROM 명령어를 이용하여 각 빌드 단계를 구분한다. 최종 이미지에서는 빌드 결과물만 복사하여 포함한다.
- Next.js 에서 standalone 모드를 이용하면, 따로 node_modules 설치 없이, .next/standalone 폴더를 생성하여 프로덕션 환경에 필요한 파일들만 자동으로 포함할 수 있다. [(공식 문서)](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)


```docker
# node:22.1.0-alpine를 베이스로 사용
FROM node:22.1.0-alpine AS base

### deps: 의존성 설치 단계
# deps 라는 이름으로 복사
FROM base AS deps
# 관련 패키지 설치
# libc6-compat: Node.js 와 같은 특정 프로그램이 Linux 에서 제대로 실행되기 위해 사용
RUN apk add --no-cache libc6-compat

# app 경로로 이동
WORKDIR /app

# package.json, yarn.lock, package-lock.json 복사
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# 패키지 매니저에 따라 install
RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; \
    fi

### buildenavr: 빌드 단계
# buildenavr 라는 이름으로 복사
FROM base AS buildenavr

# app 경로로 이동
WORKDIR /app

# 이전에 복사한 deps 로 부터 node_modules 를 복사하여 사용
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 패키지 매니저에 따라 build 실행
RUN \
    if [ -f yarn.lock ]; then yarn run build; \
    elif [ -f package-lock.json ]; then npm run build; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
    else echo "Lockfile not found." && exit 1; \
    fi

### runner: 실행 단계
# runner 라는 이름으로 복사
FROM base AS runner

# app 경로로 이동
WORKDIR /app

# 도커 컨테이너에서 시스템 그룹 node.js 를 생성하고 id 를 1001 로 설정
RUN addgroup --system --gid 1001 nodejs
# nextjs 사용자를 생성할 때 해당 그룹에 추가
RUN adduser --system --uid 1001 nextjs

# 최종적으로 도커 이미지에 들어가게 되는 구성을 복사
COPY --from=builder /app/public ./public

# .next 폴더의 소유권을 앞서 만든 next.js(사용자):nodes.js(그룹) 권한으로 할당
RUN mkdir .next
RUN chown nextjs:nodejs .next

# .next 폴더에 캐시 내용 포함
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# root가 아닌 nextjs 사용자로 실행
# 3000 포트를 열어서 next.js 를 실행
USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD HOSTNAME="0.0.0.0" node server.js
```
(출처: https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile)

우리 조직에서는 AWS ECR + ECS 의 조합을 사용하고 있다. 실제 배포단계에서는 Dockerfile 을 생성하고, 이를 ECS 에서 실행할 수 있도록 CD 스르립트를 작성해주어야 한다.

### Step1. Dockerfile 을 ECR에 push하기
ECR(Elastic Container Registry) 은 Dcoker 컨테이너 레지스트리 서비스로, Docker 이미지를 안전하게 저장, 관리, 배포할 수 있도록 도와준다.

- Registry: Docker 이미지를 저장하는 저장소로 계정 당 한 개의 레지스트리 제공
- Repository: 특정 이미지를 저장하는 컨테이너
- Image: 컨테이너 이미지 - 태그와 태그에 대한 digest 로 식별함 
  - digest: 이전 내용의 변경점을 sha256을 통해 해시값을 구하는 것 -> 무결성 보장

```yml
- name: ECR 에 로그인
  id: login-ecr
  uses: aws-actions/amazon-ecr-login@v2

- name: 도커 이미지 Build하여 Amazon ECR 푸쉬
  id: build-image
  env:
      ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
      ECR_REPOSITORY: ${{ env.AWS_ECR_REPOSITORY }}
      IMAGE_TAG: ${{ github.sha }}
  run: |
      docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
      docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT
```

만들어진 Dockerfile을 기반으로 ECR에 push를 하게 되면 아래와 같이 ECR콘솔에서 확인이 가능하다.
이제 해당 도커 이미지를 배포하기 위해 ECS 에서 푸쉬된 도커 파일을 실행한다.

### Step2. Dockerfile 을 ECS를 통해 배포하기
ECS(Elastic Container Service)는 도커 컨테이너를 AWS 에서 실행시킬 수 있도록 하는 오케스트레이션 서비스다.
*오케스트레이션 서비스: 대규모 애플리케이션을 배포 할 수 있도록 컨테이너의 네트워킹 및 관리를 자동화하는 프로세스

EC2만으로도 비슷한 방법으로 ECR의 도커 이미지를 가져와서 docker run 을 통해 배포가 가능하지 않을까?
물론 ECR + EC2 조합으로도 배포가 가능하다. 작은 규모의 어플리케이션이며 트래픽이 많지 않다면 이 조합으로도 충분하다. 
하지만 동시에 배포하는 스케줄링이 여러개 실행된다거나 SSG/SSR 을 사용하는 페이지에 트래픽이 불규칙하게 몰리는 상황이라면 ECS 에서는 Fargate 를 통해 auto scaling 이 가능하기 때문에 비용과 효율성면에서 장점이 있다.

ECS 를 적용하기 위해서는 다음 3가지의 설정이 필요하다.
- Task Definition: ECS의 최소 단위는 Task이다. Task의 구성은 Task Definition에서 진행한다. - 컨테이너에서 사용할 이미지와 리소스의 스펙을 정의
- Service: Task Definition를 참고하여 Task를 실행함
- Cluster: 컨테이너의 논리적인 그룹

```yml
- name: Dockerfile id를 ECS task definition에 추가
  id: task-def
  uses: aws-actions/amazon-ecs-render-task-definition@v1
  with:
    task-definition: task-definition.json
    container-name: container
    image: ${{ steps.build-image.outputs.image }}

- name: ECS task definition 실행
  uses: aws-actions/amazon-ecs-deploy-task-definition@v1
  with:
    task-definition: ${{ steps.task-def.outputs.task-definition }}
    service: my-service
    cluster: my-cluster
```



## Ref
- [Next.js와 AWS ECS, CI/CD 그리고 CDN을 곁들인 - by 안건환님 - 프론트엔드 소모임 240529](https://www.youtube.com/watch?v=dCZKSMO_ebg)
- [devcomet EC2와 GitHub Actions를 활용한 배포 파이프라인 구축: 효율적인 CI/CD 구현 가이드](https://notavoid.tistory.com/157)
- [Next.js-배포에-대한-고민](https://velog.io/@jwo0o0/Next.js-배포에-대한-고민)

