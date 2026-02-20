// 暗号化・復号化ユーティリティ関数

// ArrayBufferをBase64に変換
const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

// Base64をArrayBufferに変換
const base64ToArrayBuffer = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
};

// 暗号化キーの生成
const generateKey = async () => {
    try {
        return await window.crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256,
            },
            true,
            ['encrypt', 'decrypt']
        );
    } catch (e) {
        console.error('Failed to generate key:', e);
        return null;
    }
};

// メッセージの暗号化
const encryptMessage = async (text, cryptoKey) => {
    if (!cryptoKey) {
        console.error('No crypto key available');
        return null;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        cryptoKey,
        data
    );
    return {
        iv: arrayBufferToBase64(iv),
        encrypted: arrayBufferToBase64(encrypted)
    };
};

// メッセージの復号化
const decryptMessage = async ({ iv, encrypted }, cryptoKey) => {
    try {
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: base64ToArrayBuffer(iv),
            },
            cryptoKey,
            base64ToArrayBuffer(encrypted)
        );
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (e) {
        console.error('Failed to decrypt message:', e);
        return 'Decryption Error';
    }
};

// キーを ArrayBuffer に変換して送信形式で出力
const exportKey = async (key) => {
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return arrayBufferToBase64(exported);
};

// Base64をArrayBufferに変換（ファイル用）
const base64ToBufferForFile = (base64) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

// ファイルをBase64に変換
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
};

// ファイルの暗号化
const encryptFile = async (fileData, cryptoKey) => {
    if (!cryptoKey) {
        console.error('No crypto key available');
        return null;
    }
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const buffer = base64ToBufferForFile(fileData);
    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        cryptoKey,
        buffer
    );
    return {
        iv: arrayBufferToBase64(iv),
        encrypted: arrayBufferToBase64(encrypted),
    };
};

// ファイルの復号化
const decryptFile = async ({ iv, encrypted }, cryptoKey) => {
    try {
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: base64ToArrayBuffer(iv),
            },
            cryptoKey,
            base64ToArrayBuffer(encrypted)
        );
        return decrypted;
    } catch (e) {
        console.error('Failed to decrypt file:', e);
        return null;
    }
};
