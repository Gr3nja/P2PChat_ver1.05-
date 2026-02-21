const { useState, useEffect, useRef } = React;

// translations will be loaded from translations.json at runtime
let translations = {};

function App() {
  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('notConnected');
  const [isTyping, setIsTyping] = useState(false);
  const [notification, setNotification] = useState('');
  const [userName, setUserName] = useState('');
  const [remoteName, setRemoteName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  const peerInstance = useRef(null);
  const connRef = useRef(null);
  const cryptoKey = useRef(null);
  // X25519鍵ペア保持用
  const myKeyPair = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [replyTo, setReplyTo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // 言語保存
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // 翻訳関数（安全なフォールバックあり）
  const t = (key) => ((translations[language] && translations[language][key]) || (translations.en && translations.en[key]) || key);

  // 通知表示
  const showNotification = (msg) => {
    setNotification(t(msg));
    setTimeout(() => setNotification(''), 3000);
  };

  // ラッパー：暗号化
  const encryptMessageLocal = async (text) => {
    if (!cryptoKey.current) {
      showNotification('noConnection');
      return null;
    }
    return encryptMessage(text, cryptoKey.current);
  };

  // ラッパー：復号化
  const decryptMessageLocal = async (data) => {
    if (!cryptoKey.current) {
      showNotification('noConnection');
      return 'Decryption Error';
    }
    return decryptMessage(data, cryptoKey.current);
  };

  // ラッパー：ファイル暗号化
  const encryptFileLocal = async (fileData) => {
    if (!cryptoKey.current) {
      showNotification('noConnection');
      return null;
    }
    return encryptFile(fileData, cryptoKey.current);
  };

  // ラッパー：ファイル復号化
  const decryptFileLocal = async (data) => {
    if (!cryptoKey.current) {
      showNotification('noConnection');
      return null;
    }
    return decryptFile(data, cryptoKey.current);
  };

  // タイムスタンプのフォーマット
  const formatTimestamp = () => {
    return new Date().toLocaleString(language === 'zh' ? 'zh-CN' : language, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // タイピングインジケーター
  const handleTyping = () => {
    if (connRef.current) {
      connRef.current.send({ type: 'typing', user: userName });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (connRef.current) connRef.current.send({ type: 'stop-typing' });
      }, 2000);
    }
  };

  const cancelReply = () => setReplyTo(null);

  // ファイル選択処理
  const handleFileSelect = async (file) => {
    if (!file) return;
    if (connRef.current && cryptoKey.current) {
      setSelectedFile(file);
      showNotification('fileSent');
    } else {
      showNotification('noConnection');
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) handleFileSelect(e.target.files[0]);
  };

  // ドラッグアンドドロップ処理
  const handleDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); };
  const handleDragLeave = (e) => { e.currentTarget.classList.remove('drag-over'); };
  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  // ファイル送信処理
  const sendFile = async () => {
    if (!selectedFile || !connRef.current || !cryptoKey.current) {
      showNotification('noConnection');
      return;
    }
    try {
      const base64Data = await fileToBase64(selectedFile);
      const encrypted = await encryptFileLocal(base64Data);
      if (!encrypted) return;

      connRef.current.send({
        type: 'file-data',
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        ...encrypted,
      });
      setMessages(prev => [...prev, {
        sender: 'local',
        text: `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`,
        timestamp: formatTimestamp(),
        isFile: true,
        fileName: selectedFile.name,
      }]);
      setSelectedFile(null);
      showNotification('fileSent');
    } catch (err) {
      console.error('File send error:', err);
      showNotification('fileTransferError');
    }
  };

  // ファイル受信処理
  const receiveFile = async (data) => {
    try {
      const decrypted = await decryptFileLocal(data);
      if (!decrypted) return;
      const base64String = arrayBufferToBase64(decrypted);
      const dataUrl = `data:${data.mimeType};base64,${base64String}`;
      setMessages(prev => [...prev, {
        sender: 'remote',
        text: `${data.fileName} (${(data.fileSize / 1024).toFixed(2)} KB)`,
        timestamp: formatTimestamp(),
        isFile: true,
        fileName: data.fileName,
        fileData: dataUrl,
        mimeType: data.mimeType,
      }]);
      showNotification('fileReceived');
    } catch (err) {
      console.error('File receive error:', err);
      showNotification('fileTransferError');
    }
  };

  // -------------------------------------------------------
  // X25519鍵交換フロー
  //
  // 【接続を開始した側 (initiator)】
  //   1. 接続確立後、自分の公開鍵を { type: 'pubkey', key: base64 } で送信
  //
  // 【接続を受けた側 (receiver)】
  //   2. pubkeyを受け取ったら、自分の公開鍵を返送
  //      同時に相手の公開鍵からderiveSharedKeyして cryptoKey.current にセット
  //
  // 【initiator】
  //   3. 相手の公開鍵を受け取ってderiveSharedKey → cryptoKey.current にセット
  //      → 両者で同じ共有AESキーが完成！
  // -------------------------------------------------------
  const handleData = async (data) => {
    if (data.type === 'pubkey') {
      try {
        // 相手の公開鍵をインポート
        const remotePubKey = await importPublicKey(data.key);

        // 共有キーを導出
        cryptoKey.current = await deriveSharedKey(myKeyPair.current.privateKey, remotePubKey);

        // receiverの場合：自分の公開鍵をまだ送っていなければ返送
        if (data.needsReply) {
          const myPubKeyBase64 = await exportPublicKey(myKeyPair.current);
          connRef.current.send({ type: 'pubkey', key: myPubKeyBase64, needsReply: false });
        }

        setMessages(prev => [...prev, { sender: 'system', text: t('keyReceived'), timestamp: formatTimestamp() }]);

        // ユーザー名を送信
        if (userName) {
          connRef.current.send({ type: 'user-info', name: userName });
        }

      } catch (e) {
        console.error('Key exchange failed:', e);
        showNotification('keyImportFailed');
      }

    } else if (data.type === 'message') {
      const decryptedText = await decryptMessageLocal(data);
      const incoming = { sender: 'remote', text: decryptedText, timestamp: formatTimestamp() };
      if (data.replyTo) incoming.replyTo = data.replyTo;
      setMessages(prev => [...prev, incoming]);
      showNotification('newMessage');

    } else if (data.type === 'typing') {
      setRemoteName(data.user || t('remoteUser'));
      setIsTyping(true);

    } else if (data.type === 'stop-typing') {
      setIsTyping(false);

    } else if (data.type === 'user-info') {
      setRemoteName(data.name);

    } else if (data.type === 'file-data') {
      receiveFile(data);
    }
  };

  // メッセージ更新時に最下部にスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const generateShortId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let id = '';
      for (let i = 0; i < 6; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
      return id;
    };

    const createPeerWithId = (id) => {
      return new Promise((resolve, reject) => {
        const peer = new Peer(id, {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
            ]
          }
        });
        const onOpen = (openId) => { peer.off('open', onOpen); peer.off('error', onError); resolve({ peer, id: openId }); };
        const onError = (err) => { peer.off('open', onOpen); peer.off('error', onError); try { peer.destroy(); } catch (e) { } reject(err); };
        peer.on('open', onOpen);
        peer.on('error', onError);
      });
    };

    const tryCreatePeer = async (retries = 5) => {
      // X25519鍵ペアを事前生成
      myKeyPair.current = await generateX25519KeyPair();

      for (let i = 0; i < retries; i++) {
        const id = generateShortId();
        try {
          const { peer, id: openId } = await createPeerWithId(id);
          peerInstance.current = peer;
          setPeerId(openId);
          setConnectionStatus('peerIdGenerated');

          // 接続を受けた側のハンドラ
          peer.on('connection', (conn) => {
            connRef.current = conn;
            setConnectionStatus('connected');
            showNotification('connectionEstablished');

            conn.on('data', handleData);
            conn.on('close', () => {
              setConnectionStatus('disconnected');
              setMessages(prev => [...prev, { sender: 'system', text: t('connectionClosed'), timestamp: formatTimestamp() }]);
              connRef.current = null;
              cryptoKey.current = null;
              showNotification('connectionClosed');
            });
          });

          peer.on('error', (err) => {
            setMessages(prev => [...prev, { sender: 'system', text: `${t('error')}: ${err.message}`, timestamp: formatTimestamp() }]);
            setConnectionStatus('error');
            showNotification(`${t('error')}: ${err.message}`);
          });

          return;
        } catch (err) {
          if (i === retries - 1) {
            console.error('Failed to create peer after retries', err);
            setConnectionStatus('error');
            showNotification('connectionError');
          }
        }
      }
    };

    tryCreatePeer();
    return () => { try { peerInstance.current?.destroy(); } catch (e) { } };
  }, []);

  // 接続を開始する側：公開鍵交換を起動
  const connectToPeer = async () => {
    if (!remotePeerId) {
      showNotification('enterPeerIdPrompt');
      return;
    }
    setConnectionStatus('connecting');
    const conn = peerInstance.current.connect(remotePeerId);
    connRef.current = conn;

    conn.on('open', async () => {
      setConnectionStatus('connected');

      // 自分の公開鍵を送信（needsReply: true で相手にも返送を促す）
      const myPubKeyBase64 = await exportPublicKey(myKeyPair.current);
      conn.send({ type: 'pubkey', key: myPubKeyBase64, needsReply: true });

      setMessages(prev => [...prev, { sender: 'system', text: t('keySent'), timestamp: formatTimestamp() }]);
      showNotification('connectionEstablished');

      conn.on('data', handleData);
      conn.on('close', () => {
        setConnectionStatus('disconnected');
        setMessages(prev => [...prev, { sender: 'system', text: t('connectionClosed'), timestamp: formatTimestamp() }]);
        connRef.current = null;
        cryptoKey.current = null;
        showNotification('connectionClosed');
      });
    });

    conn.on('error', (err) => {
      setMessages(prev => [...prev, { sender: 'system', text: `${t('connectionError')}: ${err.message}`, timestamp: formatTimestamp() }]);
      setConnectionStatus('error');
      showNotification(`${t('connectionError')}: ${err.message}`);
    });
  };

  const sendMessage = async () => {
    if (message && connRef.current && cryptoKey.current) {
      const encryptedMessage = await encryptMessageLocal(message);
      if (!encryptedMessage) return;

      const wrapper = { type: 'message', ...encryptedMessage };
      if (replyTo) wrapper.replyTo = { text: replyTo.text, sender: replyTo.sender };

      connRef.current.send(wrapper);
      setMessages(prev => [...prev, { sender: 'local', text: message, timestamp: formatTimestamp(), replyTo: replyTo ? { text: replyTo.text, sender: replyTo.sender } : undefined }]);
      setMessage('');
      setReplyTo(null);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        connRef.current.send({ type: 'stop-typing' });
      }
    } else {
      showNotification('noConnection');
    }
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') sendMessage(); };
  const handleMessageChange = (e) => { setMessage(e.target.value); handleTyping(); };
  const copyPeerId = () => { navigator.clipboard.writeText(peerId); showNotification('copyPeerId'); };
  const disconnect = () => {
    if (connRef.current) {
      connRef.current.close();
      connRef.current = null;
      cryptoKey.current = null;
      setConnectionStatus('disconnected');
      showNotification('connectionClosed');
    }
  };

  const handleNameSubmit = () => {
    if (userName.trim()) setIsNameSet(true);
    else showNotification('enterName');
  };

  // 名前入力画面
  if (!isNameSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-center gradient-bg bg-clip-text text-transparent">
            {t('enterName')}
          </h1>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder={t('namePlaceholder')}
            className="w-full p-3 border rounded-lg border-gray-300 mb-4"
            onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
          />
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">{t('language')}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-3 border rounded-lg border-gray-300"
            >
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="zh">中文</option>
              <option value="hi">हिन्दी</option>
              <option value="es">Español</option>
            </select>
          </div>
          <button
            onClick={handleNameSubmit}
            className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('start')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col pb-[44px]">
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 overflow-y-auto flex-1">
        {notification && (
          <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
            {notification}
          </div>
        )}

        {connectionStatus !== 'connected' && (
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold gradient-bg bg-clip-text text-transparent">
                {t('title')}
              </h1>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('yourPeerId')}</label>
                <div className="flex">
                  <input
                    type="text"
                    value={peerId}
                    readOnly
                    className="flex-1 p-2 border rounded-l-lg border-gray-300 font-mono text-sm"
                  />
                  <button
                    onClick={copyPeerId}
                    disabled={!peerId}
                    className="bg-indigo-500 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                  >
                    {t('copy')}
                  </button>
                </div>
              </div>
            </div>
            <div className={`mt-4 p-3 rounded-lg ${connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : connectionStatus.includes('error') ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'} connection-status`}>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus.includes('error') ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                {t('connectionStatus')}: {t(connectionStatus)}
              </div>
            </div>
          </div>
        )}

        {connectionStatus !== 'connected' && (
          <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">{t('connectToPeer')}</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={remotePeerId}
                onChange={(e) => setRemotePeerId(e.target.value)}
                placeholder={t('enterPeerId')}
                className="flex-1 p-3 border rounded-lg border-gray-300"
              />
              <button
                onClick={connectToPeer}
                disabled={!remotePeerId || connectionStatus === 'connecting'}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {connectionStatus === 'connecting' ? t('connecting') : t('connect')}
              </button>
            </div>
          </div>
        )}

        {connectionStatus === 'connected' && (
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {t('chat')} {remoteName && `with ${remoteName}`}
              </h2>
              <button onClick={disconnect} className="text-red-500 hover:text-red-700 transition-colors">
                {t('disconnect')}
              </button>
            </div>

            <div
              className="h-[60vh] overflow-y-auto border-2 border-dashed p-4 mb-4 rounded-lg bg-gray-50"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (msg.sender !== 'system') {
                      setReplyTo({ text: msg.text, sender: msg.sender, index });
                      setTimeout(() => inputRef.current?.focus(), 0);
                    }
                  }}
                  className={`mb-3 message-animation ${msg.sender === 'local' ? 'text-left' : msg.sender === 'system' ? 'text-center' : 'text-right'}`}
                >
                  <div className={`inline-block p-3 rounded-lg max-w-xs sm:max-w-md ${msg.sender === 'local' ? 'bg-blue-500 text-white' : msg.sender === 'system' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-800'} shadow-md`}>
                    <div className="text-xs opacity-70 mb-1">{msg.timestamp}</div>
                    {msg.replyTo && (
                      <div className="mb-2 p-2 rounded bg-gray-50 text-sm text-gray-600 border-l-2 border-gray-200">
                        <div className="text-xs opacity-60">{msg.replyTo.sender === 'local' ? 'You' : msg.replyTo.sender}</div>
                        <div className="truncate">{msg.replyTo.text}</div>
                      </div>
                    )}
                    {msg.isFile ? (
                      msg.mimeType && msg.mimeType.startsWith('image/') ? (
                        <div className="flex flex-col gap-2">
                          <img src={msg.fileData} alt={msg.fileName} className="max-w-xs sm:max-w-sm rounded" style={{ maxHeight: '300px', objectFit: 'contain' }} />
                          {msg.fileData && (
                            <a href={msg.fileData} download={msg.fileName} className="text-xs text-blue-300 hover:text-blue-100 underline">{msg.fileName}</a>
                          )}
                        </div>
                      ) : msg.fileData ? (
                        <a href={msg.fileData} download={msg.fileName} className="block p-2 bg-white rounded hover:bg-gray-100 text-blue-600 underline break-words">{msg.text}</a>
                      ) : (
                        <div className="break-words">{msg.text}</div>
                      )
                    ) : (
                      <div className="break-words">{msg.text}</div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="text-left mb-3">
                  <div className="inline-block p-3 bg-gray-100 rounded-lg typing-indicator">
                    <div className="text-xs text-gray-500 mb-1">{remoteName}</div>
                    <div className="text-gray-600">{t('typing')}</div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="mb-2">
              {replyTo && (
                <div className="mb-2 p-2 bg-yellow-50 border-l-4 border-yellow-300 rounded flex items-start justify-between">
                  <div className="text-sm">
                    <div className="text-xs opacity-70">返信先: {replyTo.sender === 'local' ? 'You' : replyTo.sender}</div>
                    <div className="text-sm truncate" style={{ maxWidth: '360px' }}>{replyTo.text}</div>
                  </div>
                  <button onClick={cancelReply} className="ml-3 text-sm text-gray-600">✖</button>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={handleMessageChange}
                  onKeyPress={handleKeyPress}
                  placeholder={t('inputPlaceholder')}
                  className="flex-1 p-3 border rounded-lg border-gray-300"
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  className="bg-green-500 text-white w-12 h-12 rounded-full hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center justify-center flex-shrink-0"
                  title={t('send')}
                >
                  ➤
                </button>
                <input ref={fileInputRef} type="file" onChange={handleFileInputChange} style={{ display: 'none' }} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-green-500 text-white w-12 h-12 rounded-full hover:bg-green-600 transition-colors flex items-center justify-center flex-shrink-0"
                  title={t('dragDropFile')}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                </button>
              </div>
              {selectedFile && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-sm text-gray-700 flex items-center justify-between">
                  <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                  <div className="flex gap-2">
                    <button onClick={sendFile} className="text-green-600 hover:text-green-800 font-semibold transition-colors">✓ 送信</button>
                    <button onClick={() => setSelectedFile(null)} className="text-red-600 hover:text-red-800 font-semibold transition-colors">✕ キャンセル</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const loadTranslations = async () => {
  try {
    const res = await fetch('translations.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    translations = await res.json();
  } catch (e) {
    console.error('Failed to load translations.json', e);
    translations = { en: { start: 'Start', enterName: 'Please enter your name', namePlaceholder: 'Your name', language: 'Language' } };
  }
};

loadTranslations().then(() => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
});