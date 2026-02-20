# Usage

This document explains the main UI and how to use the application.

1) Name and language
- Enter your display name and choose a language on the first screen.

2) Peer ID and connecting
- Your `Peer ID` is shown in the UI. Use the `Copy` button to copy it to the clipboard.
- Enter the other party's Peer ID and press `Connect` to attempt a connection.

3) Sending and receiving messages
- Type a message in the input and press `Send`.
- Messages are encrypted locally before sending and decrypted on the recipient.

4) Replying (right-click)
- Right-click on a received message to enter reply mode (system messages are excluded).
- A reply preview appears above the input; sending the message includes reply metadata so the recipient sees the quoted preview.

5) Disconnect
- While connected you can end the session with the `Disconnect` button.

6) Editing translations
- All text strings are in `translations.json`. Keys are referenced via `t()` in `script.js`.

7) Notes
- `index.html` uses `fetch` and `Babel` to load `script.js`, so host the files over HTTP (not `file://`).
- NAT/firewall traversal may require STUN/TURN servers; adjust `iceServers` in `script.js` if needed.

Troubleshooting
- If a Peer is not created or connections fail, check the browser console for PeerJS/network errors.
- If translations do not update, clear the browser cache and reload.

---

# 使用方法（日本語）

このドキュメントでは、アプリの主要な UI と使用方法を説明します。

1) 名前と言語の設定
- 最初の画面で表示名を入力し、言語を選択してください。

2) Peer ID と接続
- UI に自分の `Peer ID` が表示されます。`Copy` ボタンでコピーできます。
- 相手の Peer ID を入力して `Connect` を押して接続を試みます。

3) メッセージの送受信
- 入力欄にメッセージを入力して `Send` を押します。
- メッセージは送信前にローカルで暗号化され、受信側で復号されます。

4) 返信機能（右クリック）
- 受信メッセージを右クリックすると返信モードになります（システムメッセージは対象外）。
- 入力欄上に返信プレビューが表示され、送信すると返信メタデータ付きで相手に届きます。

5) 切断
- 接続中は `Disconnect` ボタンで接続を終了できます。

6) 翻訳の編集
- 文言は `translations.json` にまとめられています。`script.js` の `t()` で参照されます。

7) 注意点
- `index.html` は `fetch` と `Babel` を使って `script.js` をロードするため、HTTP サーバー上でホストしてください（`file://` では動作しない場合があります）。
- NAT/ファイアウォール越えには STUN/TURN が必要な場合があります。必要に応じて `script.js` の `iceServers` を変更してください。

トラブルシューティング
- Peer が生成されない・接続できない場合はブラウザコンソールを確認してください。
- 翻訳が反映されない場合はキャッシュをクリアして再読み込みしてください。
# Usage

このドキュメントでは、アプリの主要な UI と操作方法を説明します。

1) 名前と言語の設定
- アプリ起動時に表示されるフォームで名前を入力し、表示言語を選択してください。

2) Peer ID と接続
- 自分の `Peer ID` は画面上部に表示されます。`Copy` ボタンでクリップボードにコピーできます。
- 相手の Peer ID を入力して `Connect` を押すと接続を試行します。

3) メッセージの送受信
- 入力欄にメッセージを入力して `Send` を押してください。
- 送信前にローカルでメッセージは暗号化され、相手で復号化されます。

4) 返信機能（右クリック）
- 相手のメッセージ上で右クリックすると返信モードになります（システムメッセージは除外）。
- 入力欄上に返信プレビューが表示され、送信するとそのメタデータ付きで相手に届きます。

5) 切断
- 接続中は画面右上の `Disconnect` ボタンで接続を終了できます。

6) 翻訳の編集
- 言語文言は `translations.json` にまとめられています。キー名は `script.js` 内の `t()` で参照されます。

7) 注意点
- `index.html` は `fetch` と `Babel` で `script.js` をロードするため、HTTP サーバー上でホストする必要があります（`file://` では正常に動作しない可能性があります）。
- Peer 間の NAT/ファイアウォール越えには STUN/TURN サーバーが必要になる場合があります。現在は一般的な STUN サーバーを指定していますが、必要に応じて `script.js` の `iceServers` を変更してください。

トラブルシューティング
- Peer が生成されない / 接続できない: ブラウザのコンソールを確認してください。PeerJS のエラーやネットワークエラーが出力されます。
- 翻訳が反映されない: ブラウザのキャッシュをクリアして再読み込みしてください。
