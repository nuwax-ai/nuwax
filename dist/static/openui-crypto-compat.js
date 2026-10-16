/**
 * OpenUI WebView compatibility helpers.
 *
 * 部分微信小程序 WebView 暴露 window.crypto/getRandomValues，但没有较新的
 * crypto.randomUUID。OpenUI Host 与固化 runtime 都依赖 randomUUID，因此须在
 * file-preview-openui.js / runtime.js 之前安装兼容实现。
 */
(function installOpenUiRandomUuid(globalObject) {
    if (!globalObject) return;

    var cryptoObject = globalObject.crypto;
    if (!cryptoObject) {
        cryptoObject = {};
        try {
            globalObject.crypto = cryptoObject;
        } catch (_error) {
            return;
        }
    }
    if (typeof cryptoObject.randomUUID === 'function') return;

    var randomUuid = function () {
        var bytes = new Uint8Array(16);
        if (typeof cryptoObject.getRandomValues === 'function') {
            cryptoObject.getRandomValues(bytes);
        } else {
            for (var i = 0; i < bytes.length; i += 1) {
                bytes[i] = Math.floor(Math.random() * 256);
            }
        }

        // RFC 4122 UUID v4: version=4, variant=10xx.
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        var hex = [];
        for (var j = 0; j < bytes.length; j += 1) {
            hex.push(bytes[j].toString(16).padStart(2, '0'));
        }
        return (
            hex.slice(0, 4).join('') +
            '-' +
            hex.slice(4, 6).join('') +
            '-' +
            hex.slice(6, 8).join('') +
            '-' +
            hex.slice(8, 10).join('') +
            '-' +
            hex.slice(10, 16).join('')
        );
    };

    try {
        Object.defineProperty(cryptoObject, 'randomUUID', {
            configurable: true,
            value: randomUuid,
        });
    } catch (_error) {
        try {
            cryptoObject.randomUUID = randomUuid;
        } catch (_assignError) {
            // 无法扩展的宿主 crypto 对象只能由浏览器升级解决。
        }
    }
})(typeof globalThis !== 'undefined' ? globalThis : window);
