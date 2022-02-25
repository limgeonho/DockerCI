# Docker CI [7] - Final



## 1. back + front + RDS + Travis CI + EB + docker hub

- AWS 배포 과정
  => github에 push 

  => master branch에 push가 되면 

  => Travis CI가 감지 후 테스트
  => 테스트가 성공하면 Dockerfile을 이용해서 Image를 생성(빌드) 후 Docker hub에 저장 

  => Docker Hub에서는 Travis CI에서 빌드된 이미지를 보관
  => AWS EB가 가져가려고 할 때 전달 

  => AWS EB에서 최종 배포 



- docker 환경의 mysql부분 정리
  이제부터는 개발환경이 아니라 운영환경이기 때문에 docker-compose.yml에서 mysql에 관한 사항이 필요 없다

  => AWS RDS에서 연결해야함
  => docker-compose.yml에서 mysql에 관한 내용은 전부 주석 처리

  

## 2. 최종 배포 하기

1. gitbub에 push(master branch)
   - .gitignore를 통해서 불필요한 파일 ex) BE의 node_modules등을 추가하고 github에 push 한다