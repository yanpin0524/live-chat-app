## 介紹

<ul>
  <li>以 socket.io 打造的群組聊天室</li>
  <li>分別以 Vue.js 打造前端使用者介面；後端使用 Node.js 搭配 Express 框架建構，使用關連式資料庫 mysql 作為 database，以 socket.io 建立伺服器與客服端的雙向溝通，並使用 Redis 建立快取功能，提升回覆速度，傳送圖片則加入經過 RabbitMq 來壓縮圖片的功能</li>
  <li>使用者可以在專案中發布推文、留言、按讚、追蹤使用者，管理者則能夠在後台管理所有使用者以及留言。</li>
  <li>此 repository 為專案後端 repository</li>
</ul>

## 圖片範例

### 一般使用者首頁

![image](https://github.com/yanpin0524/live-chat-app/blob/main/public/intro.png)

## API 文件

[api 文件](https://www.notion.so/API-166fecbd8f684735af346e816aa26747)

## 專案後端開發人員

> [Kate-Chu](https://github.com/Kate-Chu)<br>
> [yanpin0524](https://github.com/yanpin0524)

## 專案前端開發人員

> [SeijoHuang](https://github.com/SeijoHuang)<br>
> [IreneLIU](https://github.com/Irene289)

## 完整專案本地安裝流程

1. 請確認電腦已經安裝 Node.js、npm 、Mysql workbench、Redis 與 RabbitMq
2. 打開終端機，輸入以下指令將此專案 clone 到本地

```
git clone https://github.com/yanpin0524/live-chat-app.git
```

3. 終端機移動至專案資料夾，輸入指令安裝套件

```
cd 專案資料夾
npm install
```

4. 安裝完畢後，請開啟 Mysql Workbench，進入資料庫後，輸入以下指令建立資料庫

```
CREATE DATABASE live_api_chat;
```

5. 打開 config 資料夾內的 config.json 檔案，確認 development 資料庫環境設定與本機資料相符

```
  "development": {
    "username": "資料庫使用者帳號",
    "password": "資料庫密碼",
    "database": "live_api_chat",
    // ...
  },
```

6. 在終端機依序輸入以下內容，建立相關資料表以及種子資料

```
npx sequelize db:migrate
npx sequelize db:seed:all
```

7. 當種子資料建立完畢後，請繼續輸入以下內容，開始運行後端伺服器

```
npm run dev
```

8. 若是跑出以下內容，代表伺服器已經成功運行了

```
Example app listening on http://localhost:3000
```

## 後端開發工具

    1. amqplib: v0.9.1
    2. bcryptjs: v2.4.3
    3. body-parser: v1.18.3
    4. chai: v4.2.0
    5. cors: v2.8.5
    6. dotenv: v16.0.0
    7. eslint: v7.32.0
    8. eslint-config-standard: v16.0.3
    9. eslint-plugin-import: v2.23.4
    10. eslint-plugin-node: v11.1.0
    11. eslint-plugin-promise: v5.1.0
    12. express: v4.16.4
    13. express-fileupload: v1.4.0
    14. express-handlebars: v6.0.5
    15. express-session: v1.15.6
    16. faker: 4.1.0
    17. imgur: v1.0.2
    18. jsonwebtoken: v8.5.1
    19. lodash: v4.17.21
    20. multer: v1.4.2
    21. mysql2: v1.6.4
    22. passport: v0.4.0
    23. passport-jwt: v4.0.0
    24. passport-local: v1.0.0
    25. redis: v3.1.2
    26. sequelize: v6.18.0
    27. sequelize-cli: v5.5.0
    28. sharp: v0.30.6
    29. sinon: v10.0.0
    30. sinon-chai: v3.3.0
    31. socket.io: v4.5.1
    32. uuid: v8.3.2
