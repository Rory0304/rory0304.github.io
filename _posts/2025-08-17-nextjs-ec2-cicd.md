---
title: '[CI/CD] AWS EC2 배포를 위한 CD 스크립트 작성하기'
description: >-
  나도 이제 Github Action으로 EC2 배포할 수 있다~
author: Lois
date: 2025-07-17
categories: [Next.js, CI/CD]
tags: [Infra, Next.js, Docker, AWS]
pin: false
---
## 배경
이번에 사이드 프로젝트를 진행하며 EC2 프리티어를 활용하게 되었고 EC2 로 Next.js 프로젝트를 배포하기 위한 세팅과 CICD 스크립트를 작성해보려 한다.

## 탄력적 IP(Elastic IP, EIP) 설정하기
인터넷을 통해 접속할 수 있는 고정+공인 IP 주소로, 인스턴스에 연결할 수 있는 서비스이다. 
EC2 를 설정했을때 자동으로 인스턴스의 퍼블릭 IP 가 부여가 되는데, 이는 고정이 아니라 유동적인 주소이기 때문에 인스턴스를 재실행할 경우 IP 주소가 변경이 된다.
따라서, DNS 도메인에 EC2 인스턴스 IP 주소를 연결할 때는 고정적 IP 주소를 사용해야 하며 AWS 에서는 EIP 를 제공한다.
설정하는 것은 쉽다. 

1) EC2 좌측 탭 > 네트워크 및 보안 > 탄력적 IP 탭으로 이동

2) '탄력적 IP 주소 할당' 선택

3) 상단 '작업' > 탄력적 IP 주소 연결 메뉴 선택

4) 인스턴스와 IP를 선택하고 '연결' 클릭

## CloudFlare 도메인 구입하기 - 왜 CloudFlare 인가?
우리의 웹페이지는 각각 고유한 IP 가 있으나, 사용자는 해당 IP 를 기준으로 접속하는 것이 아니라 DNS 를 통해 이동한다. 
DNS 를 EC2 와 연결을 해주려면 도메인을 먼저 구입해주어야 하며, 대표적으로 가비아나 AWS 등에서 구입이 가능하다.
나의 경우 CloudFlare 를 활용했다. 아직 프리티어를 지원하고 있었고 CloudFlare 를 활용하면 자동으로 서버 설정 없이도 HTTP > HTTPS 리다이렉트와
로드밸런서, DDOS방어에 유리하기 때문에 선택하게 되었다. 구입한 도메인의 설정 창에는 ip 를 연결하는 입력창이 있는데, 발급받은 탄력적 IP 를 입력해주면 된다. 


## HTTPS 와 SSL 설정하기
브라우저에서 접속한 사용자를 HTTP -> HTTPS 로 자동 리다이렉트해주는 것은 쉽다. CloudFlare에서는 바로 설정이 가능하다.
하지만, CloudFlare에서 Origin server로의 연결에서는 CloudFlare 기준으로 Flexible 모드로 설정할 경우 HTTP 로 연결이 되기 때문에 안전하지 않다.
이때는 Full 혹은 Full(Strict) 모드를 통해 Origin Server의 인증에 대하여 HTTPS 연결을 허용해주어야 한다.

![cloudflare-ssl](/assets/img/articles/2025-08-17-nextjs-ec2-cicd/cloudflare-ssl.png)

위 사진에서 볼 수 있듯이 나는 CloudFlare 를 앞단에 붙여주었기 떄문에 사용자가 DNS 를 기반으로 브라우저에 접속을 시도할 경우 CloudFlare 에서 자동으로 HTTP 접속자를 HTTPS 로 접속할 수 있게 해준다. 하지만 이렇게 접속한 HTTPS 로 Origin Server 에서는 한 번 더 검증을 거쳐주어야 한다. 만약 검증이 불가하다면 SSL Handshake 오류가 발생할 것이다. 즉, 우리는 Origina Server 로의 접속에 대해서도 HTTPS 세팅을 해주어야 한다.

#### 1) 오류 로그
```
Error 525: SSL handshake failed” 
```
[Error 525: SSL handshake failed 관련 문서](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-525/#error-525-ssl-handshake-failed)

살펴보니 Cerbot 무료 인증서를 Nginx 에 설정해주는 커스텀 방식이 있는데, 나는 CloudFlare 를 사용해주고 있기 때문에 CloudFlare 에서 제공해주는 Origin 증명서를 적용해주기로 했다. Cerbot 인증서를 EC2 에 세팅하는 방법은 [해당 문서](https://blog.cocoblue.me/certbot-cloudflare-integration/)를 참고해준다. 

#### 2) 참고 자료
[CloudFlare 인증서를 AWS 에 세팅하기](https://neocree.com/aws-%ED%98%B8%EC%8A%A4%ED%8C%85-%EA%B2%8C%EC%9E%84-%EC%84%9C%EB%B2%84%EC%97%90-%EB%8C%80%ED%95%B4-cloudflare-ssl%EC%9D%84-%EC%84%A4%EC%A0%95%ED%95%98%EB%8A%94-%EB%B0%A9%EB%B2%95-%EB%8B%A8%EA%B3%84/)
[SSL 인증이 필요한 이유](https://blog.naver.com/skinfosec2000/222135874222)


## AWS + Github Permission 설정하기
이제 EC2/DNS/HTTP/HTTPS 세팅이 모두 되었다면, github action script 를 활용하여 코드가 배포되면 자동으로 서버에 배포할 수 있도록 스크립트를 작성해보자.
본래라면 직접 SSL 접속하여 pm2 등을 통해 반복적으로 배포를 해야하지만 github action script 를 사용하면 쉽게 배포 트리거를 할 수 있다. 

### 1) AWS 로그인
AWS 에 로그인할 수 있는 github 액션 스크립트를 먼저 구성해보자.
해당 명령어로 aws-access-key-id 와 aws-secret-access-key 를 이용하여 로그인을 할 수도 있으나, 보안상 권장되지 않는 방법이기 때문에
IAM role base 로 진행한다. 참고 자료는 [공식문서](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws#configuring-the-role-and-trust-policy)를 참고한다. 

1) IAM 에 접속하여 identity provider 에 깃허브 oidc 추가한다. 
- For the provider URL: https://token.actions.githubusercontent.com
- For the "Audience": sts.amazonaws.com

2) 생성된 자격공급자에 역할을 부여한다.
- '웹 자격증명' 선택 > step1에서 설정한 'provider와 'Audience' 를 선택
- Github 구성 정보를 입력 > 개인인 경우 개인 github id 입력

3) 권한을 설정한다. 
나의 경우 EC2 에 로그인하여 ECR 에 접속 > Docker 이미지를 올리는 것이 목적이었기 때문에 `AmazonEC2ContainerRegistry` 를 설정해주었다. 

4) IAM Role 에서 생성한 자격의 ARN 을 복사해준다.
이제 해당 권한으로 Github action 에 로그인하고 ECR 에 접근을 해줄 것이다. 

5) github script 작성
github action 으로 aws-actions/configure-aws-credentials 를 활용한다.

```yaml
- name: Configure AWS Credentials
    uses: aws-actions/configure-aws-credentials@v3
    with:
        role-to-assume: arn:aws:iam::xxxx:role/github_action
        aws-region: ${{ env.AWS_REGION }}
```

### 2) AWS ECR Login
```yml
- name: Login to Amazon ECR
  id: login-ecr
  uses: aws-actions/amazon-ecr-login@v2
```

### 3) ECR 에 Docker 이미지 빌드/푸쉬하기
만약 Docker 를 사용한다면 이 또한 cd 에서 ECR 에 푸쉬할 수 있도록 자동화할 수 있다. 앞선 Step2 에서 우리는 Role 을 이용하여 ECR 에 로그인을 할 수 있으며 해당 스텝의 id를 `login-ecr` 로 설정해주었다. 따라서, 해당 id 를 활용하여 `steps.login-ecr.outputs.registry` 로 ECR Registry 를 알 수 있다. 이를 env 에 할당해준다.

```yml
- name: Build, tag, and push docker image to Amazon ECR
  env:
      ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
      ECR_REPOSITORY: ${{ env.AWS_ECR_REPOSITORY }}
      IMAGE_TAG: ${{ github.sha }}
  run: |
      docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
      docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
```

### 4) ECR 의 이미지를 EC2 에 배포하기
```yml
- name: Deploy to EC2
  env:
      ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
      ECR_REPOSITORY: ${{ env.AWS_ECR_REPOSITORY }}
      IMAGE_TAG: ${{ github.sha }}
  uses: appleboy/ssh-action@v0.1.5
  with:
      host: ${{ secrets.EC2_IP_ADDRESS }}
      username: ubuntu
      key: ${{ secrets.EC2_SSH_PRIVATE_KEY }}
      envs: ECR_REGISTRY, IMAGE_TAG, ECR_REPOSITORY, AWS_REGION
      script: |
          cd /home/ubuntu/xxx
          aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker pull $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker stop xxx || true
          docker rm xxx || true
          docker run -d --name xxxx -p 3000:3000 $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
```

EC2 에 접근하기 위해 appleboy/ssh-action@v0.1.5 를 활용한다. 이때는 github secret 에 EC2 ip 와 ssh key 를 저장해주어야 한다.

로그인이 성공한 후, 어떤 명령어를 사용할 것인지 script 에 작성해준다. 
1) `ECR_REPOSITORY` 에 푸쉬된 `IMAGE_TAG` 의 이미지를 가져온다.
2) 기존에 실행되는 도커가 있다면 stop 해주고, 제거한다. 
3) 선택한 이미지를 3000포트로 listen 하고 next.js 를 3000포트로 실행해준다. 


## Trouble Shooting
위 과정을 진행하면서 겪었던 문제 사항을 정리해본다. 오류 관련 해결 방법은 링크를 작성해두었다. 

### 1. SSL 접근 시, `port 22: Operation timed out` 오류
- EC2 서버의 방화벽을 설정하고, 22번 포트를 안 열어주어서 생긴 문제일 수 있다. 이때는 AWS 콘솔에서 방화벽을 비활성화해주어야 한다.
EC2 서버를 중단하고, [인스턴스 설정 - 사용자 데이터 편집] 에 들어가서 아래의 코드를 복붙해준다.

```

Content-Type: multipart/mixed; boundary="//"
MIME-Version: 1.0
--//
Content-Type: text/cloud-config; charset="us-ascii"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
Content-Disposition: attachment; filename="cloud-config.txt"
#cloud-config
cloud_final_modules:
- [scripts-user, always]
--//
Content-Type: text/x-shellscript; charset="us-ascii"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
Content-Disposition: attachment; filename="userdata.txt"
#!/bin/bash
ufw disable
iptables -L
iptables -F
--//
```
그리고 다시 인스턴스를 재실행하여 ssh 접근이 가능한지 확인 후, 방화벽을 비활성화하거나 22번 포트에 대해서 접근이 가능하도록 열어준다.

### 2. `An error occurred (AccessDeniedException) when calling the GetAuthorizationToken operation`

```
An error occurred (AccessDeniedException) when calling the GetAuthorizationToken operation: ...
is not authorized to perform: ecr:GetAuthorizationToken on resource: * because no identity-based policy allows the ecr:GetAuthorizationToken action
```
[해당 문서](https://docs.aws.amazon.com/ko_kr/AmazonECR/latest/userguide/security_iam_id-based-policy-examples.html)를 참고하여 AmazonEC2ContainerRegistryReadOnly 권한 부여를 해주어야 한다.


### 3. Docker login insecure 경고문 해결하기
- [https://choo.oopy.io/497e3b1e-250b-4e85-b85d-59ea02c3697d](https://choo.oopy.io/497e3b1e-250b-4e85-b85d-59ea02c3697d)
- [https://beta.velog.io/@woody_59/Docker-failed-to-solve-nginx1.21.0-alpine-error-getting-credentials-err-exit-status-1-out-ERROR](https://beta.velog.io/@woody_59/Docker-failed-to-solve-nginx1.21.0-alpine-error-getting-credentials-err-exit-status-1-out-ERROR)


### 4. `no basic auth credentials`
- [https://velog.io/@kwg527/AWS-ECR-no-basic-auth-credentials-에러-GitHub-Actions-배포-중-발생](https://velog.io/@kwg527/AWS-ECR-no-basic-auth-credentials-에러-GitHub-Actions-배포-중-발생)


### 5. `docker permission denied`
- [https://github.com/occidere/TIL/issues/116](https://github.com/occidere/TIL/issues/116)


### 6. `docker:listen tcp 0.0.0.0:80: bind: address already in use`
```
err: docker: Error response from daemon: driver failed programming external connectivity on endpoint ...:
failed to bind port 0.0.0.0:80/tcp: Error starting userland proxy: listen tcp4 0.0.0.0:80: bind: address already in use.
```
도커 컨테이너의 포트를 기존에 사용중인 80포트에 할당하여 생긴 문제로, 사용 가능한 포트로 다시 설정을 해주어야 한다. 참고로 docker run -p 3000:80 의 의미는 도커 컨테이너의 80 포트를 호스트의 3000으로 할당한다는 뜻이다. 



### 7. SSL Handshake Error
만약 SSL 인증서는 제대로 설정이 되었는데, DNS 접속 시 해당 오류가 계속 발생한다면
Nginx 와 CloudFlare 의 설정이 중복된 것은 아닌지 확인이 필요하다.

나의 경우 CloudFlare 설정에서 Origin server 설정에 3000 포트를 자동으로 리다이랙트 처리가 되어 있었고, 해당 부분을 Nginx 에서도 관리를 하고 있었기 때문에 생긴 오류였다. 해당 룰을 제거해주었더니 SSL Handshake 오류가 해결이 되었다.

[https://community.cloudflare.com/t/getting-ssl-handshake-errors/700265/6](https://community.cloudflare.com/t/getting-ssl-handshake-errors/700265/6)

