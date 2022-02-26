# Docker CI [1]



## 1. docker를 사용하는 이유

- 다양한 OS의 버전이나 환경으로인해 원하는 프로그램을 installer를 통해서 다운로드할 때 오류가 자주 발생함
  => 도커를 사용하면 바로 오류 없이 다운 받을 수 있음

  

- docker 란?

  - 컨테이너를 사용하여 응용프로그램을 더 쉽게 만들고 배포하고 실행할 수 있도록 설계된 도구이며 컨테이너 기반의 오픈소스 가상화 플랫폼 생태계

    => 말그대로 원하는 프로그램들을 컨테이너로 추상화해서 프로그램을 손쉽게 이동 배포 관리해주는 것



- docker image 란?
  - 프로그램을 실행하는데 필요한 설정이나 종속성을 갖고 있는 것
  - 도커 이미지를 이용해서 컨테이너를 생성함 (도커 컨테이너 == 도커 이미지의 인스턴스)
  - 이미지 => 컨테이너 => 컨테이너를 이용해서 프로그램을 실행함



- docker 는 OS를 따로 가지고 있지 않기 때문에 VM보다 가볍다



## 2. docker image

- docker image에는 시작시 실행 될 명령어 + 파일 스냅샷으로 구성되어 있음

- 파일 스냅샷이 컨테이너의 하드디스크로 들어오고 시작시 실행 될 명령어가 실행중인 프로세스에 들어가서 명령을 수행함

  ![1](https://user-images.githubusercontent.com/73927750/155833603-59a637bb-70fa-4ae6-b5bd-3a2e3b49e554.png)

​	

- ```shell
  docker ps
  # 현재 실행중인 컨테이너를 보여줌
  
  docker ps -a
  # 전체 실행중인 컨테이너를 보여줌
  ```



- docker의 생명주기

  ![2](https://user-images.githubusercontent.com/73927750/155833604-2b886571-d0c8-44e8-a8c9-87fd3e9bcb70.png)

- ```shell
  docker run = docker create + docker start
  
  docker run <이미지 이름>
  
  docker stop <컨테이너 아이디/이름> => 하던 행위를 마치고 멈춤
  
  docker kill <컨테이너 아이디/이름> => 바로 멈춤
  
  docker rm `docker ps -a -q` => 모든 컨테이너 삭제
  
  docker rm <컨테이너 아이디/이름>
  
  docker rmi <이미지 아이디/이름>
  
  docker system prune => 현재 사용하지 않는 컨테이너, 이미지, 네트워크 삭제
  
  docker exec <컨테이너 아이디> <명령어> => 이미 실행 중인 컨테이너에 명령어를 전달
  ```

- -it 옵션(interactive terminal)

  => exec로 컨테이너 안으로 들어가서 추가 명령어를 작성할 때 계속해서 명령어를 사용할 수 있게 해주는 옵션

  -it를 붙여주지 않으면 들어갔다가 바로 나와버림 

  => 꼭 -it 옵션을 써줄것

- 컨테이너 내부에서 작업하기 위해서는?

  ```shell
  docker exec -it <컨테이너 아이디> <명령어>
  ```

  그렇다면 해당 방법을 매번 사용해야하나?

  => NO!

  sh명령어를 통해서 아예 해당 컨테이너 안으로 들어가서 그 안에서 명령어만 계속 작성할 수 있음

  ```shell
  docker run -it <이미지 이름> sh => /# 으로 바뀌면서 해당 컨테이너 안으로 들어감
  # 나올때는 ctrl + D
  ```

- docker run은 새로 컨테이너를 만들어서 실행

  docker exec은 이미 실행 중인 컨테이너에 명령어를 전달 



## 3. Dockerfile

- 기존에는 도커허브에 있던 이미지만을 사용해 왔음
  => Dockerfile를 작성해서 직접 이미지를 만들 수 있음

  

- Dockerfile 란?

  docker image를 만들기 위한 설정 파일임 

  => 컨테이너가 어떻게 행동해야 하는 지에 대한 설정들을 정의해줌

  

- Dockerfile를 만드는 순서

  1. 베이스 이미지를 명시해준다(파일 스냅샷)
  2. 추가적으로 필요한 파일을 다운 받기 위한 몇가지 명령어를 명시해준다(파일 스냅샷)
  3. 컨테이너 시작시 실행 될 명령어를 명시해준다(시작시 실행 될 명령어)



- Dockerfile 명령

  FROM : 베이직 이미지 레이어
  RUN : 도커이미지가 생성되기 전에 수행할 쉘 명령어 => 필요한 파일들을 다운로드 받는데 사용
  CMD : 컨테이너가 시작되었을 때 실행할 실행 파일 또는 쉘 스크립트(Dockerfile에서 1번만 사용가능)




- Dockerfile 예시

  ```dockerfile
  FROM node:10 # 베이스 이미지
  
  RUN npm install # 이미지가 만들어 지기 전에 실행되는 명령
  
  CMD ["node", "server.js"] # 컨테이너가 실행될 때 실행되는 명령 
  ```

  

- Dockerfile 로 docker image 만들기

  ```shell
  docker build . or docker build ./
  # Dockerfile을 docker client로 전달하는 방법 
  docker build ./ # 마지막에 반드시 ./ 써줘야함(Dockerfile이 있는 위치) 
  ```



- 결론
  베이스 이미지에서 다른 종속성이나 새로운 커맨드를 추가할 때는 

  임시 컨테이너를 만든 후 그 컨테이너를 토대로 새로운 이미지를 만든다
  그리고 그 임시 컨테이너는 지워준다
  이미지 -> 임시 컨테이너(새로운 명령어 + 새로운 파일 스냅샷) -> 새로운 이미지



- 내가 설정한 Dockerfile에 직접 커스텀한 이름지어주기(-t 옵션)

  ```shell
  docker build -t ghlim909/hello:latest ./ 
  ```

  일반적으로 이름은 [자신의 dockerhub 아이디/이름:버전]