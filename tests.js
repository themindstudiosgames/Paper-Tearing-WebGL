// Test UI Module
(function () {
    'use strict';

    window.initTests = function (unityInstance) {
        console.log('[Tests] Initializing test UI...');

        var notificationQueue = [];
        var isShowingNotification = false;

        var toggleBtn = document.createElement('button');
        toggleBtn.id = 'toggle-tests';
        toggleBtn.textContent = '🧪 Test UI';
        document.body.appendChild(toggleBtn);

        var testPanel = document.createElement('div');
        testPanel.id = 'tests-panel';
        testPanel.innerHTML = `
            <h3>
                <span>🧪 Tests</span>
                <button id="close-tests">✕</button>
            </h3>
            <button id="btn-upload">📤 Upload Image</button>
            <input type="file" id="file-input" accept="image/*">
            <button id="btn-test-uv">🎨 UV Debug (2x2)</button>
            <button id="btn-test-checker">⬛ Checkerboard</button>
            <div class="config-section">
                <label>
                    Unwrap Threshold (0-1):
                    <input type="number" id="unwrap-threshold" min="0" max="1" step="0.01" value="0.8">
                </label>
                <label>
                    Max Tear Count:
                    <input type="number" id="max-tear-count" min="1" max="20" step="1" value="5">
                </label>
            </div>
            <div id="test-status" class="status"></div>`;
        document.body.appendChild(testPanel);

        toggleBtn.onclick = function () {
            testPanel.classList.toggle('show');
            toggleBtn.classList.toggle('hidden');
        };

        document.getElementById('close-tests').onclick = function (e) {
            e.stopPropagation();
            testPanel.classList.remove('show');
            toggleBtn.classList.remove('hidden');
        };

        function processNotificationQueue() {
            if (isShowingNotification || notificationQueue.length === 0) {
                return;
            }

            isShowingNotification = true;
            var notification = notificationQueue.shift();
            var status = document.getElementById('test-status');

            status.textContent = notification.message;
            status.className = 'status ' + notification.type;
            status.style.display = 'block';

            setTimeout(function () {
                status.style.display = 'none';
                status.textContent = '';
                status.className = 'status';
                isShowingNotification = false;
                processNotificationQueue();
            }, 1200);
        }

        function showStatus(message, type) {
            notificationQueue.push({ message: message, type: type });
            processNotificationQueue();
        }

        function sendToUnity(dataUrl) {
            try {
                unityInstance.SendMessage('WrappingPaper', 'ReceiveImageDataURL', dataUrl);
                showStatus('✓ Image sent to Unity', 'success');
            } catch (e) {
                console.error('[Tests] Error sending to Unity:', e);
                showStatus('✗ Failed to send: ' + e.message, 'error');
            }
        }

        document.getElementById('btn-upload').onclick = function () {
            document.getElementById('file-input').click();
        };

        document.getElementById('file-input').onchange = function (e) {
            var file = e.target.files[0];
            if (!file) return;

            showStatus('⏳ Loading ' + file.name + '...', 'info');

            var reader = new FileReader();
            reader.onload = function (event) {
                sendToUnity(event.target.result);
            };
            reader.onerror = function () {
                showStatus('✗ Failed to read file', 'error');
            };
            reader.readAsDataURL(file);
        };

        document.getElementById('btn-test-uv').onclick = function () {
            var canvas = document.createElement('canvas');
            canvas.width = 2;
            canvas.height = 2;
            var ctx = canvas.getContext('2d');
            var imageData = ctx.createImageData(2, 2);
            var d = imageData.data;
            d[0] = 0; d[1] = 0; d[2] = 255; d[3] = 255;
            d[4] = 255; d[5] = 255; d[6] = 0; d[7] = 255;
            d[8] = 255; d[9] = 0; d[10] = 0; d[11] = 255;
            d[12] = 0; d[13] = 255; d[14] = 0; d[15] = 255;
            ctx.putImageData(imageData, 0, 0);
            sendToUnity(canvas.toDataURL('image/png'));
        };

        document.getElementById('btn-test-checker').onclick = function () {
            var canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            var ctx = canvas.getContext('2d');
            var size = 64;
            for (var y = 0; y < 512; y += size) {
                for (var x = 0; x < 512; x += size) {
                    ctx.fillStyle = ((x / size) + (y / size)) % 2 === 0 ? '#FFFFFF' : '#000000';
                    ctx.fillRect(x, y, size, size);
                }
            }
            sendToUnity(canvas.toDataURL('image/png'));
        };

        document.getElementById('unwrap-threshold').oninput = function (e) {
            try {
                unityInstance.SendMessage('TearingEvents', 'SetUnwrapThreshold', e.target.value);
                console.log('[Tests] Set unwrap threshold:', e.target.value);
            } catch (error) {
                console.error('[Tests] Error setting threshold:', error);
            }
        };

        document.getElementById('max-tear-count').oninput = function (e) {
            try {
                unityInstance.SendMessage('TearingEvents', 'SetMaxTearCount', parseInt(e.target.value, 10));
                console.log('[Tests] Set max tear count:', e.target.value);
            } catch (error) {
                console.error('[Tests] Error setting max tear count:', error);
            }
        };

        // Listen for tearing events
        document.addEventListener('tearing-update', function (e) {
            var detail = e.detail;
            console.log('[Tests] tearing-update:', detail);
            showStatus('📊 Progress: ' + (detail.progress * 100).toFixed(1) + '%, Tears: ' + detail.tears, 'info');
        });

        document.addEventListener('tearing-complete', function (e) {
            var detail = e.detail;
            console.log('[Tests] tearing-complete:', detail);
            showStatus('✅ Complete! Reason: ' + detail.reason + ', Progress: ' + (detail.progress * 100).toFixed(1) + '%', 'success');
        });

        console.log('[Tests] Test UI initialized. Click "Test UI" button to show controls.');
    };
})();

