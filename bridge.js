/**
 * Playgama Bridge SDK Integration Wrapper for Froggy Jump 2D
 * Multiplatform support for Yandex Games, VK Play, CrazyGames, GameDistribution, Telegram, OK, etc.
 */

class PlaygamaBridgeIntegration {
    constructor() {
        this.bridge = null;
        this.isInitialized = false;
        this.isMock = false;
        this.platformId = 'mock';
        this.language = 'ru';
        this.deviceType = 'desktop';
        this.isMobile = false;

        this.lastAdTime = 0;
        this.adCooldown = 60000; // 60s minimum interval
        this.isAdActive = false;

        this._interstitialCallback = null;
        this._rewardedRewardCallback = null;
        this._rewardedCompleteCallback = null;
        this._rewardGranted = false;
    }

    async init() {
        if (typeof window.bridge === 'undefined') {
            console.log('[PlaygamaBridge] window.bridge not found (Running locally or GitHub Pages). Mock mode active.');
            this.setupMock();
            return false;
        }

        this.bridge = window.bridge;

        try {
            await this.bridge.initialize();
            this.isInitialized = true;
            this.platformId = this.bridge.platform ? this.bridge.platform.id : 'unknown';
            this.language = (this.bridge.platform && this.bridge.platform.language) ? this.bridge.platform.language : 'ru';
            this.deviceType = (this.bridge.device && this.bridge.device.type) ? this.bridge.device.type : 'desktop';
            this.isMobile = (this.deviceType === 'mobile' || this.deviceType === 'tablet') || this.detectDeviceFallback();

            console.log(`[PlaygamaBridge] Successfully initialized! Platform: ${this.platformId}, Lang: ${this.language}, Device: ${this.deviceType}`);

            this.setupEventListeners();
            this.gameReady();

            return true;
        } catch (err) {
            console.warn('[PlaygamaBridge] Initialization error, falling back to mock:', err);
            this.setupMock();
            return false;
        }
    }

    setupMock() {
        this.isMock = true;
        this.platformId = 'mock';
        this.detectDeviceFallback();
        this.language = (navigator.language || 'ru').toLowerCase().startsWith('ru') ? 'ru' : 'en';
    }

    detectDeviceFallback() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
            || (window.matchMedia && window.matchMedia("(max-width: 900px) and (hover: none)").matches);
        return this.isMobile;
    }

    setupEventListeners() {
        if (!this.bridge) return;

        // 1. Platform pause & audio events
        if (this.bridge.platform && this.bridge.platform.on && this.bridge.EVENT_NAME) {
            if (this.bridge.EVENT_NAME.PAUSE_STATE_CHANGED) {
                this.bridge.platform.on(this.bridge.EVENT_NAME.PAUSE_STATE_CHANGED, (isPaused) => {
                    console.log('[PlaygamaBridge] PAUSE_STATE_CHANGED:', isPaused);
                    if (window.onPlatformPauseChange) {
                        window.onPlatformPauseChange(isPaused);
                    }
                });
            }

            if (this.bridge.EVENT_NAME.AUDIO_STATE_CHANGED) {
                this.bridge.platform.on(this.bridge.EVENT_NAME.AUDIO_STATE_CHANGED, (isAudioEnabled) => {
                    console.log('[PlaygamaBridge] AUDIO_STATE_CHANGED:', isAudioEnabled);
                    if (window.onPlatformAudioChange) {
                        window.onPlatformAudioChange(isAudioEnabled);
                    }
                });
            }
        }

        // 2. Interstitial state changed
        if (this.bridge.advertisement && this.bridge.advertisement.on && this.bridge.EVENT_NAME) {
            if (this.bridge.EVENT_NAME.INTERSTITIAL_STATE_CHANGED) {
                this.bridge.advertisement.on(this.bridge.EVENT_NAME.INTERSTITIAL_STATE_CHANGED, (state) => {
                    console.log('[PlaygamaBridge] Interstitial state:', state);
                    if (state === 'opened') {
                        this.isAdActive = true;
                        if (window.onPlatformAudioChange) window.onPlatformAudioChange(false);
                    } else if (state === 'closed' || state === 'failed') {
                        this.isAdActive = false;
                        this.lastAdTime = Date.now();
                        if (window.onPlatformAudioChange) window.onPlatformAudioChange(true);
                        if (this._interstitialCallback) {
                            const cb = this._interstitialCallback;
                            this._interstitialCallback = null;
                            cb(state === 'closed');
                        }
                    }
                });
            }

            // 3. Rewarded state changed
            if (this.bridge.EVENT_NAME.REWARDED_STATE_CHANGED) {
                this.bridge.advertisement.on(this.bridge.EVENT_NAME.REWARDED_STATE_CHANGED, (state) => {
                    console.log('[PlaygamaBridge] Rewarded state:', state);
                    if (state === 'opened') {
                        this.isAdActive = true;
                        if (window.onPlatformAudioChange) window.onPlatformAudioChange(false);
                    } else if (state === 'rewarded') {
                        this._rewardGranted = true;
                        if (this._rewardedRewardCallback) {
                            this._rewardedRewardCallback();
                            this._rewardedRewardCallback = null;
                        }
                    } else if (state === 'closed' || state === 'failed') {
                        this.isAdActive = false;
                        if (window.onPlatformAudioChange) window.onPlatformAudioChange(true);
                        const wasRewarded = Boolean(this._rewardGranted);
                        this._rewardGranted = false;
                        if (this._rewardedCompleteCallback) {
                            const cb = this._rewardedCompleteCallback;
                            this._rewardedCompleteCallback = null;
                            cb(wasRewarded);
                        }
                    }
                });
            }
        }
    }

    gameReady() {
        try {
            if (this.bridge && this.bridge.platform && this.bridge.platform.sendMessage) {
                this.bridge.platform.sendMessage('game_ready');
                console.log('[PlaygamaBridge] Sent game_ready message');
            }
        } catch (e) {
            console.warn('[PlaygamaBridge] game_ready error:', e);
        }
    }

    gameplayStart() {
        try {
            if (this.bridge && this.bridge.platform && this.bridge.platform.sendMessage) {
                this.bridge.platform.sendMessage('gameplay_start');
            }
        } catch (e) {}
    }

    gameplayStop() {
        try {
            if (this.bridge && this.bridge.platform && this.bridge.platform.sendMessage) {
                this.bridge.platform.sendMessage('gameplay_stop');
            }
        } catch (e) {}
    }

    showFullscreenAdv(callback) {
        const now = Date.now();
        if (now - this.lastAdTime < this.adCooldown) {
            if (callback) callback(false);
            return;
        }

        if (!this.bridge || !this.bridge.advertisement || !this.bridge.advertisement.showInterstitial) {
            if (callback) callback(false);
            return;
        }

        this.gameplayStop();
        this._interstitialCallback = callback;
        try {
            this.bridge.advertisement.showInterstitial();
        } catch (err) {
            console.warn('[PlaygamaBridge] showInterstitial error:', err);
            if (callback) callback(false);
        }
    }

    showRewardedVideo(onReward, onComplete) {
        if (!this.bridge || !this.bridge.advertisement || !this.bridge.advertisement.showRewarded) {
            console.log('[PlaygamaBridge Mock] Rewarded Video simulated successfully!');
            if (onReward) onReward();
            if (onComplete) onComplete(true);
            return;
        }

        this.gameplayStop();
        this._rewardGranted = false;
        this._rewardedRewardCallback = onReward;
        this._rewardedCompleteCallback = onComplete;

        try {
            this.bridge.advertisement.showRewarded();
        } catch (err) {
            console.warn('[PlaygamaBridge] showRewarded error:', err);
            if (onComplete) onComplete(false);
        }
    }

    async saveProgress(data) {
        try {
            localStorage.setItem('froggy_progress', JSON.stringify(data));
            if (data.highScore !== undefined) {
                localStorage.setItem('froggy_highscore', data.highScore.toString());
            }
        } catch (e) {}

        if (!this.bridge || !this.bridge.storage || !this.bridge.storage.set) {
            return;
        }

        try {
            await this.bridge.storage.set('froggy_progress', JSON.stringify(data));
            console.log('[PlaygamaBridge] Froggy progress saved to cloud');
        } catch (err) {
            console.warn('[PlaygamaBridge] Storage save error:', err);
        }
    }

    async loadProgress() {
        let localData = null;
        try {
            const raw = localStorage.getItem('froggy_progress');
            if (raw) localData = JSON.parse(raw);
        } catch (e) {}

        if (!this.bridge || !this.bridge.storage || !this.bridge.storage.get) {
            return localData;
        }

        try {
            const val = await this.bridge.storage.get('froggy_progress');
            if (val) {
                return typeof val === 'string' ? JSON.parse(val) : val;
            }
            return localData;
        } catch (err) {
            console.warn('[PlaygamaBridge] Storage get error:', err);
            return localData;
        }
    }
}

window.PlatformBridge = new PlaygamaBridgeIntegration();
