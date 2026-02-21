const { useState, useEffect, useRef } = React;

// テキスト系MIMEタイプかどうか判定
const isTextFile = (mimeType, fileName) => {
  // 明らかなバイナリは除外
  const binaryMimes = [
    'application/octet-stream',
    'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed',
    'application/x-7z-compressed', 'application/x-tar', 'application/gzip',
    'application/x-bzip2', 'application/x-xz', 'application/x-lzip',
    'application/x-lzma', 'application/zstd', 'application/x-compress',
    'application/pdf', 'application/msword', 'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation',
    'application/epub+zip',
    'application/exe', 'application/x-msdownload', 'application/x-msdos-program',
    'application/x-elf', 'application/x-mach-binary', 'application/x-sharedlib',
    'application/x-executable', 'application/vnd.android.package-archive',
    'application/java-archive', 'application/wasm',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
    'image/tiff', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/heic',
    'image/heif', 'image/avif', 'image/jp2', 'image/jxl', 'image/x-xcf',
    'image/vnd.adobe.photoshop',
    'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/flac',
    'audio/ogg', 'audio/aac', 'audio/x-m4a', 'audio/x-aiff', 'audio/x-ms-wma',
    'audio/opus', 'audio/amr',
    'video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/x-matroska',
    'video/webm', 'video/x-flv', 'video/mpeg', 'video/x-ms-wmv', 'video/3gpp',
    'video/ogg', 'video/av1',
    'font/ttf', 'font/otf', 'font/woff', 'font/woff2',
    'application/x-font-ttf', 'application/x-font-otf',
    'application/font-woff', 'application/font-woff2',
    'application/x-sqlite3', 'application/vnd.ms-access', 'application/x-dbase',
    'application/x-parquet', 'application/x-hdf', 'application/x-netcdf',
    'application/x-iso9660-image', 'application/x-raw-disk-image',
    'model/stl', 'model/obj', 'model/gltf-binary', 'application/x-fbx', 'application/x-blender',
    'application/x-pkcs12', 'application/x-x509-ca-cert', 'application/x-pem-file',
    'application/x-deb', 'application/x-rpm', 'application/vnd.snap',
    'application/x-apple-diskimage', 'application/x-msmetafile',
  ];
  const binaryExts = [
    '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
    '.lz', '.lzma', '.zst', '.z', '.tgz', '.tbz2', '.txz',
    '.cab', '.lha', '.lzh', '.ace', '.arj',
    '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
    '.elf', '.out', '.com', '.msi', '.apk', '.ipa',
    '.jar', '.war', '.ear', '.dex',
    '.pdf', '.doc', '.docx', '.odt', '.rtf',
    '.xls', '.xlsx', '.ods', '.ppt', '.pptx', '.odp',
    '.epub', '.mobi', '.azw', '.azw3', '.xps', '.oxps',
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.ico',
    '.tiff', '.tif', '.heic', '.heif', '.avif', '.jp2', '.jxl',
    '.psd', '.xcf', '.ai', '.eps', '.raw', '.cr2', '.cr3',
    '.nef', '.arw', '.orf', '.rw2', '.dng',
    '.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a',
    '.aiff', '.aif', '.wma', '.opus', '.amr', '.mid', '.midi', '.ape', '.wv',
    '.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv',
    '.wmv', '.mpeg', '.mpg', '.m4v', '.3gp', '.3g2',
    '.ts', '.mts', '.m2ts', '.vob', '.ogv', '.rm', '.rmvb',
    '.ttf', '.otf', '.woff', '.woff2', '.eot', '.fon', '.pfb', '.pfm',
    '.sqlite', '.sqlite3', '.db', '.mdb', '.accdb', '.dbf',
    '.parquet', '.feather', '.arrow', '.hdf5', '.h5', '.nc',
    '.npy', '.npz', '.pkl', '.joblib', '.pt', '.pth', '.onnx',
    '.pb', '.tflite',
    '.class', '.pyc', '.pyo', '.pyd', '.o', '.a', '.lib', '.obj',
    '.iso', '.img', '.dmg', '.vhd', '.vhdx', '.vmdk', '.qcow2',
    '.stl', '.obj', '.glb', '.gltf', '.fbx', '.blend',
    '.dae', '.3ds', '.max', '.dwg', '.dxf',
    '.pfx', '.p12', '.cer', '.crt', '.der', '.key',
    '.deb', '.rpm', '.snap', '.appimage', '.pkg',
    '.swf', '.fla', '.wasm', '.wmf', '.emf',
    '.pdb', '.idb', '.dump', '.core',
  ];

  if (mimeType) {
    if (mimeType.startsWith('image/')) return false;
    if (mimeType.startsWith('video/')) return false;
    if (mimeType.startsWith('audio/')) return false;
    if (binaryMimes.some(m => mimeType.startsWith(m))) return false;
    if (mimeType.startsWith('text/')) return true;
    if (['application/json', 'application/xml', 'application/javascript',
         'application/typescript', 'application/x-sh'].includes(mimeType)) return true;
  }

  if (fileName) {
    const lower = fileName.toLowerCase();
    if (binaryExts.some(e => lower.endsWith(e))) return false;
    // 拡張子がないかテキスト系っぽければtrue（Makefile, Dockerfileなど）
    return true;
  }

  return false;
};

// DataURLからテキストを取得
const getTextFromDataUrl = (dataUrl) => {
  try {
    const base64 = dataUrl.split(',')[1];
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch { return null; }
};

// モーダルコンポーネント
function Modal({ onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{ position: 'fixed', top: '12px', left: '12px', zIndex: 60 }}
        className="bg-black bg-opacity-60 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-opacity-90"
      >✕</button>
      <div onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// 画像モーダル（ホイールズーム）
function ImageModal({ src, fileName, onClose }) {
  const [scale, setScale] = useState(1);
  const onWheel = (e) => {
    e.preventDefault();
    setScale(s => Math.min(10, Math.max(0.2, s - e.deltaY * 0.001)));
  };
  return (
    <Modal onClose={onClose}>
      <div
        onWheel={onWheel}
        style={{ cursor: 'zoom-in', userSelect: 'none' }}
        className="flex items-center justify-center"
      >
        <img
          src={src}
          alt={fileName}
          style={{ transform: `scale(${scale})`, transformOrigin: 'center', maxWidth: '90vw', maxHeight: '90vh', transition: 'transform 0.1s' }}
        />
      </div>
    </Modal>
  );
}

// テキストモーダル
function TextModal({ text, fileName, fileData, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div
        className="bg-gray-900 rounded-lg overflow-auto font-mono text-xs text-green-300"
        style={{ maxWidth: '85vw', maxHeight: '85vh', minWidth: '320px', padding: '16px' }}
      >
        <div className="text-gray-400 mb-2 text-xs">{fileName}</div>
        <pre className="whitespace-pre-wrap break-all">{text}</pre>
        {fileData && (
          <a href={fileData} download={fileName} className="block mt-4 text-blue-400 underline text-xs">{fileName} をダウンロード</a>
        )}
      </div>
    </Modal>
  );
}

// ファイルプレビューコンポーネント
function FilePreview({ msg }) {
  const [expanded, setExpanded] = useState(false);
  const [imageModal, setImageModal] = useState(false);
  const [textModal, setTextModal] = useState(false);
  const isImage = msg.mimeType && msg.mimeType.startsWith('image/');
  const isText = isTextFile(msg.mimeType, msg.fileName);
  const PREVIEW_LINES = 3;
  const EXPAND_LINES = 10;

  if (isImage) {
    return (
      <>
        {imageModal && <ImageModal src={msg.fileData} fileName={msg.fileName} onClose={() => setImageModal(false)} />}
        <div className="flex flex-col gap-2">
          <img
            src={msg.fileData}
            alt={msg.fileName}
            className="max-w-xs sm:max-w-sm rounded cursor-pointer hover:opacity-90"
            style={{ maxHeight: '300px', objectFit: 'contain' }}
            onClick={() => setImageModal(true)}
          />
          {msg.fileData && (
            <a href={msg.fileData} download={msg.fileName} className="text-xs opacity-60 hover:opacity-100 underline">{msg.fileName}</a>
          )}
        </div>
      </>
    );
  }

  if (isText && msg.fileData) {
    const fullText = getTextFromDataUrl(msg.fileData) || '';
    const lines = fullText.split('\n');
    const previewLines = lines.slice(0, PREVIEW_LINES);
    const expandLines = lines.slice(0, EXPAND_LINES);
    const remaining = lines.length - EXPAND_LINES;
    const showLines = expanded ? expandLines : previewLines;
    const canExpand = lines.length > PREVIEW_LINES;
    const hasMore = expanded && remaining > 0;

    return (
      <>
        {textModal && <TextModal text={fullText} fileName={msg.fileName} fileData={msg.fileData} onClose={() => setTextModal(false)} />}
        <div className="flex flex-col gap-1">
          <div className="text-xs font-semibold opacity-70 mb-1">{msg.fileName} ({(msg.text.match(/\((.*?)\)/)?.[1] || '')})</div>
          <div
            className="bg-gray-900 text-green-300 rounded p-2 font-mono text-xs whitespace-pre-wrap break-all cursor-pointer hover:bg-gray-800"
            style={{ maxWidth: '320px' }}
            onClick={() => setTextModal(true)}
          >
            {showLines.join('\n')}
            {hasMore && <div className="text-gray-500 mt-1">{'────────'} 残り {remaining} 行 {'────────'}</div>}
          </div>
          {canExpand && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs opacity-60 hover:opacity-100 text-left mt-1 flex items-center gap-1"
            >
              <span>{expanded ? '▲ 折りたたむ' : '▼ もっと見る'}</span>
            </button>
          )}
          {msg.fileData && (
            <a href={msg.fileData} download={msg.fileName} className="text-xs opacity-60 hover:opacity-100 underline mt-1">{msg.fileName} をダウンロード</a>
          )}
        </div>
      </>
    );
  }

  const isAudio = msg.mimeType && msg.mimeType.startsWith('audio/');
  const isVideo = msg.mimeType && msg.mimeType.startsWith('video/');

  if (isAudio && msg.fileData) {
    return (
      <div className="flex flex-col gap-1">
        <div className="text-xs opacity-70 mb-1">{msg.fileName}</div>
        <audio controls src={msg.fileData} style={{ maxWidth: '280px' }} />
        <a href={msg.fileData} download={msg.fileName} className="text-xs opacity-60 hover:opacity-100 underline mt-1">{msg.fileName} をダウンロード</a>
      </div>
    );
  }

  if (isVideo && msg.fileData) {
    return (
      <div className="flex flex-col gap-1">
        <div className="text-xs opacity-70 mb-1">{msg.fileName}</div>
        <video controls src={msg.fileData} style={{ maxWidth: '300px', maxHeight: '220px', borderRadius: '6px' }} />
        <a href={msg.fileData} download={msg.fileName} className="text-xs opacity-60 hover:opacity-100 underline mt-1">{msg.fileName} をダウンロード</a>
      </div>
    );
  }

  return msg.fileData ? (
    <a href={msg.fileData} download={msg.fileName} className="block p-2 bg-white rounded hover:bg-gray-100 text-blue-600 underline break-words">{msg.text}</a>
  ) : (
    <div className="break-words">{msg.text}</div>
  );
}


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
      const objectUrl = URL.createObjectURL(selectedFile);
      setMessages(prev => [...prev, {
        sender: 'local',
        text: `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(2)} KB)`,
        timestamp: formatTimestamp(),
        isFile: true,
        fileName: selectedFile.name,
        fileData: objectUrl,
        mimeType: selectedFile.type,
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
      const blob = new Blob([decrypted], { type: data.mimeType });
      const objectUrl = URL.createObjectURL(blob);
      setMessages(prev => [...prev, {
        sender: 'remote',
        text: `${data.fileName} (${(data.fileSize / 1024).toFixed(2)} KB)`,
        timestamp: formatTimestamp(),
        isFile: true,
        fileName: data.fileName,
        fileData: objectUrl,
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

        // receiverの場合：先に自分の公開鍵を返送してからderiveSharedKey
        if (data.needsReply) {
          const myPubKeyBase64 = await exportPublicKey(myKeyPair.current);
          connRef.current.send({ type: 'pubkey', key: myPubKeyBase64, needsReply: false });
        }

        // 共有キーを導出
        cryptoKey.current = await deriveSharedKey(myKeyPair.current.privateKey, remotePubKey);

        if (!cryptoKey.current) {
          console.error('deriveSharedKey returned null');
          showNotification('keyImportFailed');
          return;
        }

        setMessages(prev => [...prev, { sender: 'system', text: t('keyReceived'), timestamp: formatTimestamp() }]);
        setConnectionStatus('connected');
        showNotification('connectionEstablished');

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
            setConnectionStatus('connecting');

            conn.on('data', handleData);
            conn.on('close', async () => {
              setConnectionStatus('disconnected');
              setMessages(prev => [...prev, { sender: 'system', text: t('connectionClosed'), timestamp: formatTimestamp() }]);
              connRef.current = null;
              cryptoKey.current = null;
              myKeyPair.current = await generateX25519KeyPair();
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

      showNotification('connectionEstablished');

      conn.on('data', handleData);
      conn.on('close', async () => {
        setConnectionStatus('disconnected');
        setMessages(prev => [...prev, { sender: 'system', text: t('connectionClosed'), timestamp: formatTimestamp() }]);
        connRef.current = null;
        cryptoKey.current = null;
        myKeyPair.current = await generateX25519KeyPair();
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
  const disconnect = async () => {
    if (connRef.current) {
      connRef.current.close();
      connRef.current = null;
      cryptoKey.current = null;
      myKeyPair.current = await generateX25519KeyPair();
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
                      <FilePreview msg={msg} />
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