# P2PChat_ver1.05-
Peer.jsを使用した静止チャットwebサイトです。

# アップデート-Update
Ver10.4α
- 多言語対応化
- UIの改善

Ver10.5α
- jsの軽量化
- 「○○が入力中です」みたいな奴の追加

Ver1.00β
- コード全体の軽量化
- translation.jsonの追加
- 返信機能の追加

Ver1.05β
- ファイル送信機能とか
- 画像送信機能
- 見栄えをよくしたい

Lightweight browser-based P2P encrypted chat demo.

Features:
- Minimal UI (React + Tailwind)
- P2P connections via PeerJS
- End-to-end message encryption using AES-GCM (Web Crypto API)
- Multilingual text loaded from `translations.json`
- 6-character alphanumeric Peer ID generation with retry on collision

JavaScript libraries used (loaded via CDN in `index.html`) and license:
- React: https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js (MIT)
- ReactDOM: https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js (MIT)
- Babel (standalone): https://cdn.jsdelivr.net/npm/@babel/standalone@7.20.15/babel.min.js (MIT)
- PeerJS: https://cdn.jsdelivr.net/npm/peerjs@1.4.7/dist/peerjs.min.js (MIT)

These libraries are distributed under the MIT license. When reusing or redistributing, please follow each project's license terms.

Development notes:
- Edit `translations.json` to add or modify languages.
- Adjust `generateShortId()` / `tryCreatePeer()` in `script.js` to change PeerID format or retry policy.
- For production use, consider a dedicated PeerServer or alternative signaling for reliability and NAT traversal (TURN).

---

# 日本語版

軽量なブラウザベースの P2P 暗号化チャットのデモです。

特徴:
- シンプルな UI（React + Tailwind）
- PeerJS による P2P 接続
- AES-GCM（Web Crypto API）によるメッセージ暗号化
- `translations.json` から読み込む多言語対応
- 衝突時に再試行する 6 文字英数字の Peer ID を生成

使用している JavaScript ライブラリ（`index.html` で CDN 読み込み）とライセンス:
- React: https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js (MIT)
- ReactDOM: https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js (MIT)
- Babel (standalone): https://cdn.jsdelivr.net/npm/@babel/standalone@7.20.15/babel.min.js (MIT)
- PeerJS: https://cdn.jsdelivr.net/npm/peerjs@1.4.7/dist/peerjs.min.js (MIT)

上記ライブラリは MIT ライセンスで配布されています。再利用・再配布する場合は各プロジェクトのライセンス条項に従ってください。
開発メモ

- 翻訳は `translations.json` にまとめています。言語を追加・編集する場合はここを更新してください。
- PeerID の仕様は `script.js` 内の `generateShortId()` / `tryCreatePeer()` を編集してください（文字セット・桁数・再試行回数）。
- PeerJS のデフォルトクラウドサーバーを使用していますが、プロダクションでは自前の PeerServer または WebRTC シグナリングを検討してください。

ライセンス

個人用途のデモ。商用利用する場合は事前に確認してください。

