# Docker CI [5]



## 1. Travis CI

- github에 push된 repo의 코드를 테스트하고 테스트 성공시에는 AWS에 빌드하거나 배포해주는 도구 

  

## 2. Travis CI Flow

![13](https://user-images.githubusercontent.com/73927750/155833431-f6568a95-5546-405f-888a-b1fd3a0e7267.png)

![14](https://user-images.githubusercontent.com/73927750/155833421-8f0aab40-ebb2-492b-a50a-92de22863da9.png)

- repo를 github에 올리고
  이후에 master branch를 Travis CI가 가져가서 테스트를 진행한다
  테스트가 성공이면 AWS로 가져가서 배포한다



## 3. Travis CI 적용하기

- STEP 1. 
  github에 local repo를 push하기~

- STEP 2.
  github과 Travis CI를 연결하기
  Travis CI 로그인(깃헙 로그인) => settings => 올린 도커 repo를 활성화 => dashboard

- STEP 3.
  .travis.yml 파일 작성하기(테스트)

  ```yaml
  sudo: required		# sudo 로 실행
  
  language: generic		# 언어는 generic
  
  services:			# docker 환경으로 실행
    - docker
  
  before_install:		# script를 실행할 수 있는 환경 구성
    - echo "start creating an image with dockerfile"
    - docker build -t ghlim909/docker-react-app -f Dockerfile.dev .	
    # 시작하기 전에 이미지 빌드하기
  
  script:		# 실행할 명령(script)
    - docker run -e CI=true ghlim909/docker-react-app npm run test -- --coverage
    # -e CI=true는 Travis CI 명령, 실행 script
  
  after_success:
    - echo "Test success"
  ```

- STEP 4.

  .travis.yml 를 작성한 후에 다시 github repo에 push한다
  => travis CI에 들어가서 해당 dashboard에서 해당 repo를 찾아보면 빌드가 되고 테스트하는 과정을 볼 수 있다.



## 4. AWS EB

- EB = Elastic Beanstalk == 일종의 환경임

  => apache, nginx 같은 친숙한 서버에서 다양한 언어와 docker로 개발된 웹 응용 프로그램 및 서비스를
  배포하고 확장하기 쉬운 서비스이다.

  ![15](https://user-images.githubusercontent.com/73927750/155833423-1a618ddb-8a74-44df-93f8-314e727c8f9c.png)

  - EB에는 EC2인스턴스, 데이터베이스, Security그룹 등 다양한 요소들이 환경을 구성하고 있다.

- 지금까지는 .travis.yml 파일 안에 test가 성공했을 경우 까지만 작성되어 있다.
  => 이제 성공했을 경우 AWS EB에 자동으로 배포하는 부분을 .travis.yml안에 설정해야한다.

- .travis.yml에 deploy 부분 추가 작성하기

  ![16](https://user-images.githubusercontent.com/73927750/155833424-58546a87-8b89-4bd7-9bb7-ad541e9edbf1.png)

- .travis.yml(AWS 배포 추가)

  ```yaml
  sudo: required
  
  language: generic
  
  services:
    - docker
  
  before_install:
    - echo "start creating an image with dockerfile"
    - docker build -t ghlim909/docker-react-app -f Dockerfile.dev .
  
  script:
    - docker run -e CI=true ghlim909/docker-react-app npm run test -- --coverage
  
  deploy:
    provider: elasticbeanstalk
    region: "ap-northeast-2"
    app: "docker-react-app"
    env: "Dockerreactapp-env"
    bucket_name: "elasticbeanstalk-ap-northeast-2-xxx"
    bucket_path: "docker-react-app"
    on:
      branch: master
  ```
  
  - bucket_name를 설정하는 이유? 
    => Travis CI는 가지고 있는 파일을 먼저 압축해서 S3로 보낸다
    => S3에 적혀있는 이름을 넣는다.



## 5. AWS IAM

- Travis CI와 AWS가 연동되기 위해서는 인증이 필요함
  => AWS에서 제공하는 secret key를 Travis yml파일에 적어줘야함

  ![17](https://user-images.githubusercontent.com/73927750/155833426-76eb0ca4-57e2-4745-8cb4-463ed79443de.png)

- => 위의 인증을 위해서는 API key가 필요함

- IAM 키 다운받기

  1. IAM USER 생성
     => Identity and Access Management
     => 왜 만들까?
     => 현재 사용하는 계정은 root 계정이다 
     => root 계정은 모든 권한을 가지고 있지만 보안을 위해서 좋지 않다 => IAM 계정 생성
     => IAM 사용자는 root 사용자가 부여한 권한만 가질 수 있다
  2. IAM 계정에 ElasticBeanstalkFullAccess 권한을 부여하고 키와 비밀키를 받는다.
  3. 위의 키들을 .travis.yml에 직접 넣으면 노출되기 때문에 Travis CI의 dashboard => more options => settings 에서 각각 key등록(환경변수)

- IAM 키까지 넣은 최종 .travis.yml

  ```yaml
  sudo: required
  
  language: generic
  
  services:
    - docker
  
  before_install:
    - echo "start creating an image with dockerfile"
    - docker build -t ghlim909/docker-react-app -f Dockerfile.dev .
  
  script:
    - docker run -e CI=true ghlim909/docker-react-app npm run test -- --coverage
  
  deploy:
    edge: true			# 에러나서 추가함
    provider: elasticbeanstalk
    region: "ap-northeast-2"
    app: "docker-react-app"
    env: "Dockerreactapp-env"
    bucket_name: "elasticbeanstalk-ap-northeast-2-346423126356"
    bucket_path: "docker-react-app"
    on:
      branch: master
    access_key_id: $AWS_ACCESS_KEY
    secret_access_key: $AWS_SECRET_ACCESS_KEY
  ```

  
