# web-retrieval-augmented-generation-server

## 開発準備

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

## memo

デバッグ時の保存時に自動再起動できる ts-node-dev や nodemon は不可を考慮して今回は使わない

ts-node で --env-file がまだサポートされていないため dotenv で env 読み込む

テストのために jest を導入したい
