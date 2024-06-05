# web-retrieval-augmented-generation-server

## 開発手順

### コンテナ起動前

初回のみ
docker network create web-retrieval-augmented-generation-network

### コンテナ起動後

初回と package.json 変更時
npm i

## デバッグ

VSCode のデバッグ機能を利用する
F5 で起動
変更の反映はデバッグの再起動

呼び出しは rest-client 拡張機能を利用
rest-client フォルダに http ファイルを作成して行う
cookie の削除は以下コマンドで /root/.rest-client/cookie.json を削除して VSCode の Reload Window
rm /root/.rest-client/cookie.json

## データベース backup

db コンテナ内で以下コマンド実行
mariadb-dump --no-data --databases web_rag_db -u root -p > /docker-entrypoint-initdb.d/backup.sql
コンテナ作成時に実行されるもので git 管理する

## memo

デバッグ時の保存時に自動再起動できる ts-node-dev や nodemon は不可を考慮して今回は使わない

ts-node で --env-file がまだサポートされていないため dotenv で env 読み込む

## todo

テストのために jest を導入したい

本番実行時はコマンドで console.XXX 系をファイルにも出力するようにする

共通処理などの import を絶対パスで行いたいので sconfig.json で baseUrl と paths を定義する

データベース接続などで using を利用したい

request の値検証を最適化したいが express-validator を使用するのがベストか

OpneAI へのファイルアップロードは stream を使いたい

rest client で url に定数使いたい

session の各項目更新
