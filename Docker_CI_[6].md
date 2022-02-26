# Docker CI [6]



## 1. back + db + front 개발

- nginx는 2가지 역할을 한다

  1. 단순하게 정적인 파일들을 보여주는 안내자 역할(server)
  2. proxy를 이용해서 요청되는 url에 따라 다르게 FE와 BE로 요청을 분리해서 보내주는 역할(proxy)

- nginx를 server + proxy 둘 다 사용

  ![18](https://user-images.githubusercontent.com/73927750/155833428-290e7269-3417-47d0-b15a-da16409a8419.png)

- BE - package.json

  ```json
  {
    "name": "backend",
    "version": "1.0.0",
    "description": "",
    "main": "server.js",
    "scripts": {
      "test": "echo \"Error: no test specified\" && exit 1",
      "start": "node server.js",
      "dev": "nodemon server.js"	=> nodemon을 이용해서 시작할때 사용
    },
    "dependencies": {
      "express": "4.16.3",
      "mysql": "2.16.0",
      "nodemon": "1.18.3",		=> 소스코드가 수정된 것을 감지하면 알아서 다시 적용해줌
      "body-parser": "1.19.0"		=> 클라이언트에서 오는 요청의 본문을 해석해주는 미들웨어
    },
    "author": "",
    "license": "ISC"
  }
  ```

- FE 안에 있는 Server를 위한 nginx 설정 nginx의 default.conf 

  ```json
  server{
    listen 3000;			
      // 3000번 포트로 들어왔을경우 아래의 location /
  
    location / {
      root /usr/share/nginx/html;	
      // /의 기본으로 보여주는 페이지(FE의 빌드파일이 위치)
  
      index index.html index.htm;	
      // 사이트의 index페이지로 할 파일명 설정
  
      try_files $uri $uri/ /index.html;	
      // react-router를 사용하기 위해서 반드시 필요한 옵션
    }
  }
  ```

  - nginx는 정적파일을 보여주기 위한 server역할과 proxy를 위한 역할로 나눠진다.
    여기서 작성되는 nginx Dockerfile은 server역할이다. 아래에서 proxy를 위한 역할로 쓸것임

- FE 운영용 Dockerfile 변경

  ```dockerfile
  FROM node:alpine as builder
  
  WORKDIR /app
  
  COPY ./package.json ./
  
  RUN npm install
  
  COPY ./ ./
  
  RUN npm run build
  
  FROM nginx
  EXPOSE 3000		# 해당 컨테이너는 3000포트를 열고 있겠다.
  COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf	
  # 내가 만든 nginx default.conf 파일을 실제 컨테이너안의 nginx에 복사해준다. 
  COPY --from=builder /app/build /usr/share/nginx/html	
  # 빌드한 파일을 index.html로 나올 수 있도록 설정
  ```



## 2. DB

- nginx처럼 개발환경과 운영환경에서 DB는 다르게 설정한다.

  - 개발환경 => 도커 환경이용
    운영환경 => AWS RDS 서비스 이용

  - why? 
    => DB작업은 중요한 데이터들을 보관하고 이용하기 때문에 실수하면 안된다. 

    => 따라서 더 안정적인 AWS RDS를 이용

- DB의 개발환경 VS 운영환경

  ![19](https://user-images.githubusercontent.com/73927750/155833429-f10b912d-f3a9-474b-9e68-c7b792a51694.png)

- mysql my.cnf	=> nginx의 conf를 작성한 것과 같은 이치로 mysql의 설정 

  ```json
  [mysqld]
  character-set-server=utf8
  
  [mysql]
  default-character-set=utf8
  
  [client]
  default-character-set=utf8
  ```

- mysql Dockerfile

  ```dockerfile
  FROM mysql:5.7
  
  ADD ./my.cnf /etc/mysql/conf.d/my.cnf
  ```

- Proxy로 쓰인 Dockerfile

  - 해당 어플리케이션은 client가 요청하는 url에 따라
    location /
    location /api/ 
    => 로 각각 BE와 FE로 나눠야함(nginx의 proxy역할)

- Proxy Nginx

  - proxy nginx default.conf 

    ```json
    upstream frontend {
        server frontend:3000;		=> FE는 3000번
    }
    
    upstream backend {		=> BE는 5000번
        server backend:5000;
    }
    
    server {
        listen 80;			=> nginx는 80번 포트를 개방
    
        location / {
            proxy_pass http://frontend;	=> url이 / 일때 FE
        }
    
        location /api {
            proxy_pass http://backend;	=> url이 /api 일때 BE
        }
    
        location /sockjs-node {		=> FE를 위한 필수 작성요소 없으면 에러남
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
        }
    
    }
    ```

  - proxy nginx Dockerfile

    ```dockerfile
    FROM nginx
    COPY ./default.conf  /etc/nginx/conf.d/default.conf
    ```



- 위에서 각각의 Dockerfile들을 만들어 주었다
  하지만 각각의 Dockerfile들을 실행해도 컨테이너 환경은 각각 독립적으로 작동하기 때문에 서로 통신할 수 없다
  => 따라서 docker-compose파일을 작성한다.
  => 위의 내용들을 실행할 docker-compose.yml파일 작성

- docker-compose.yml

  ```yaml
  version: "3"
  services:
    frontend:
      build:
        dockerfile: Dockerfile.dev
        context: ./frontend
      volumes:
        - /app/node_modules
        - ./frontend:/app
      stdin_open: true		# react를 사용하기 위해서는 필수적 요소 없으면 에러남
  
    nginx:
      restart: always
      build:
        dockerfile: Dockerfile
        context: ./nginx
      ports:
        - "3000:80"
  
    backend:
      build:
        dockerfile: Dockerfile.dev
        context: ./backend
      container_name: app_backend
      volumes:
        - /app/node_modules
        - ./backend:/app
  
    mysql:
      build: ./mysql
      restart: unless-stopped
      container_name: app_mysql
      ports:
        - "3306:3306"
      volumes:		# volume 부분에서 호스트 파일 시스템이 참조한다
        - ./mysql/mysql_data:/var/lib/mysql
        - ./mysql/sqls/:/docker-entrypoint-initdb.d/
      environment:
        MYSQL_ROOT_PASSWORD: root
        MYSQL_DATABASE: myapp
  ```

- volume를 이용해서 데이터 베이스 데이터를 유지하는 방법

  기존에 volume을 사용한 이유는 리액트나 노드에서 코드가 수정되었을 때 바로 적용되게 하기 
  위해서 사용했었지만
  이번에는 데이터베이스에 저장된 자료를 컨테이너를 지우더라도 남아있게 하기위한 volume이다
  => 왜냐하면 원래 컨테이너를 지우면 컨테이너에 저장되어 있던 데이터들도 지워지기 때문에

  컨테이너에서 변화가 일어난 데이터가 컨테이너 안에 저장되는 것이 아닌
  *호스트 파일 시스템에 저장되고 그 중에서도 도커에 의해서만 통제가 되는 도커 Area에 저장 되므로
  컨테이너를 삭제해도 변화된 데이터는 사라지지 않는다

  ![20](https://user-images.githubusercontent.com/73927750/155833430-74bff69b-7278-4efd-be4e-b289865a45d2.png)

  ```yaml
   # docker-compose.yml의 mysql에서(위의 docker-compose.yml에 적용해놓음)
   mysql:
      build: ./mysql
      restart: unless-stopped
      container_name: app_mysql
      ports:
        - "3306:3306"
      volumes:				=> volume 부분에서 호스트 파일 시스템이 참조한다
        - ./mysql/mysql_data:/var/lib/mysql
        - ./mysql/sqls/:/docker-entrypoint-initdb.d/
      environment:
        MYSQL_ROOT_PASSWORD: root
        MYSQL_DATABASE: myapp
  ```

  