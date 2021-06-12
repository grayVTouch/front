(function(){
    "use strict";

    function VideoPlayer(selector , option)
    {
        this.dom = {
            root: G(selector)
        };
        if (!this.dom.root.isDom()) {
            throw new Error('参数 1 错误');
        }
        this.option = {
            debug: true ,
            // 海报
            // poster: './res/poster.jpg' ,
            poster: '' ,
            // 单次步进时间，单位：s
            step: 30 ,
            // 音频步进：0-1
            soundStep: 0.08 ,
            // 视频源
            playlist: [
                // {
                //     // 视频名臣
                //     name: '初音岛 01' ,
                //     // 索引
                //     index: 1 ,
                //     // 视频封面
                //     thumb: '' ,
                //     // 视频预览图片
                //     preview: {
                //         src: './res/test.jpeg' ,
                //         width: 160 ,
                //         height: 90 ,
                //         duration: 1 ,
                //         count: 5 ,
                //     } ,
                //     definition: [
                //         {
                //             name: '360P' ,
                //             src: './res/test.mp4' ,
                //         } ,
                //     ] ,
                //     // 字幕
                //     subtitle: [
                //         {
                //             name: '简体中文' ,
                //             src: './res/cyd_04.vtt' ,
                //         } ,
                //     ] ,
                // } ,
            ] ,
            index: 1 ,
            muted: false ,
            volume: 1 ,
            speed: 1 ,
            // 开启字幕
            enableSubtitle: true ,
            speeds: [
                {
                    key: 0.5 ,
                    value: ' 0.5x' ,
                } ,
                {
                    key: 1 ,
                    value: '正常' ,
                } ,
                {
                    key: 2,
                    value: '2x' ,
                } ,
                {
                    key: 3 ,
                    value: '3x' ,
                } ,
            ] ,
            definition: '480P' ,
            // 当视频播放结束时的回调
            ended: null ,
            // 视频切换后索引
            switch: null ,
            // 单位：ms
            initPlayerInterval: 6 * 1000 ,
            minIndex: 1 ,
            maxIndex: 1 ,
        };

        if (!G.isObject(option)) {
            option = this.option;
        }
        this.option.index   = option.index ? option.index : this.option.index;
        this.option.poster  = option.poster ? option.poster : this.option.poster;
        this.option.muted   = G.isBoolean(option.muted) ? option.muted : this.option.muted;
        this.option.volume  = G.isNumeric(option.volume) && option.volume >= 0 && option.volume <= 1 ? option.volume : this.option.volume;
        this.option.speed   = G.isNumeric(option.speed) ? option.speed : this.option.speed;
        this.option.speeds  = option.speeds ? option.speeds : this.option.speeds;
        this.option.definition = option.definition ? option.definition : this.option.definition;
        this.option.ended       = option.ended ? option.ended : this.option.ended;
        this.option.switch       = option.switch ? option.switch : this.option.switch;
        this.option.step        = option.step ? option.step : this.option.step;
        this.option.soundStep   = G.isNumeric(option.soundStep) && option.soundStep >= 0 && option.soundStep <= 1 ? option.soundStep : this.option.soundStep;
        this.option.playlist        = option.playlist ? option.playlist : this.option.playlist;
        this.option.enableSubtitle  = G.isBoolean(option.enableSubtitle) ? option.enableSubtitle : this.option.enableSubtitle;
        this.option.minIndex  = G.isNumeric(option.minIndex) ? option.minIndex : this.option.minIndex;
        this.option.maxIndex  = G.isNumeric(option.maxIndex) ? option.maxIndex : this.option.maxIndex;

        this.run();
    }

    VideoPlayer.prototype = {
        constructor: VideoPlayer ,

        initData: function(){
            this.data = Object.assign({} , G.copy(this.option , true) , {
                minIndex: this.option.minIndex ,
                maxIndex: this.option.maxIndex ,
                volumeBack: this.option.volume ,
                minVolume: 0 ,
                maxVolume: 1 ,
                canAjustVolume: false ,
                canAjustProgress: false ,
                minRatio: 0 ,
                maxRatio: 1 ,
                paused: true ,
                loadedMetaData: false ,
                innerForProgressW: 0 ,
                innerForSoundW: 0 ,
                rootW: 0 ,
                rootH: 0 ,
                previewW: 0 ,
                previewH: 0 ,
                innerForPreviewW: 0 ,
                moveForPreviewW: 0 ,
                previewMinLeftVal: 0 ,
                previewMaxLeftVal: 0 ,
                showPreview: false ,
                // 单位 ms
                previewTransitionDuration: 120 ,
                canShowPreview: true ,
                fullscreen: false ,
                // 当前播放时间（用于切换视频清晰度的时候重新定位用）
                currentTime: 0 ,
                formatTime: '--:--' ,
                formatDuration: '--:--' ,
                cacheKeyPrefix: 'video_player_ratio_' ,
                canHideControl: true ,
                mouseIsInVideo: true ,
                // 移动画面在全屏装填下缩放相关数据
                moveForPreviewInFullscreen: {
                    scaleX: 1.5 ,
                    scaleY: 1.5 ,
                } ,
                // 是否首次执行（用于跳过一些重复执行的动作）
                onceForInit: true ,
                onceForLoadedData: true ,
                onceForSwitchVideoByDefinition: true ,
                onceForPlay: true ,
                extraH: 15 ,
                playCtrlTipDuration: 600 ,

            });

            this.data.playlist.forEach(function(v){
                v.preview       = v.preview     ? v.preview : {};
                v.definition    = v.definition  ? v.definition : [];
                v.subtitle      = v.subtitle    ? v.subtitle : [];
                v.thumb         = v.thumb       ? v.thumb : '';
                v.name          = v.name        ? v.name : '';
                v.index          = v.index        ? v.index : 1;

                v.preview.src       = v.preview.src ? v.preview.src : '';
                v.preview.width     = v.preview.width ? v.preview.width : '';
                v.preview.height    = v.preview.height ? v.preview.height : '';
                v.preview.duration  = v.preview.duration ? v.preview.duration : '';
                v.preview.count     = v.preview.count ? v.preview.count : '';
            });
        } ,

        initStatic: function(){

            this.dom.win = G(window);
            this.dom.html = G(document.documentElement);
            this.dom.body = G(document.body);
            this.dom.videoPlayer = G('.video-player' , this.dom.root.get(0));
            this.dom.control = G('.control' , this.dom.videoPlayer.get(0));
            this.dom.title = this.dom.videoPlayer.children({
                className: 'title' ,
                tagName: 'div'
            } , false , true);
            this.dom.actions = G('.actions' , this.dom.videoPlayer.get(0));
            this.dom.preview = G('.preview' , this.dom.videoPlayer.get(0));
            this.dom.loading = G('.loading' , this.dom.videoPlayer.get(0));
            this.dom.playCtrlTip = G('.play-ctrl-tip' , this.dom.videoPlayer.get(0));

            this.dom.playForPlayCtrlTip = G('.play' , this.dom.playCtrlTip.get(0));
            this.dom.pauseForPlayCtrlTip = G('.pause' , this.dom.playCtrlTip.get(0));
            this.dom.volumeForPlayCtrlTip = G('.volume' , this.dom.playCtrlTip.get(0));


            this.dom.innerForPreview = G('.inner' , this.dom.preview.get(0));
            this.dom.moveForPreview = G('.move' , this.dom.innerForPreview.get(0));
            this.dom.imageWrapper = G('.image-wrapper' , this.dom.moveForPreview.get(0));
            this.dom.imageForPreview = G('.image' , this.dom.imageWrapper.get(0));
            this.dom.timepointForPreview = G('.time-point' , this.dom.moveForPreview.get(0));

            this.dom.videoWrapper = G('.video-wrapper' , this.dom.videoPlayer.get(0));
            this.dom.video = G('.video' , this.dom.videoWrapper.get(0));

            this.dom.progress = G('.progress' , this.dom.videoPlayer.get(0));
            this.dom.innerForProgress = G('.inner' , this.dom.progress.get(0));
            this.dom.amount = G('.amount' , this.dom.innerForProgress.get(0));
            this.dom.ratio = G('.ratio' , this.dom.amount.get(0));
            this.dom.loaded = G('.loaded' , this.dom.amount.get(0));
            this.dom.atPosition = G('.at-position' , this.dom.amount.get(0));
            this.dom.point = G('.point' , this.dom.innerForProgress.get(0));


            this.dom.play = G('.play' , this.dom.actions.get(0));
            this.dom.pause = G('.pause' , this.dom.actions.get(0));
            this.dom.prev = G('.prev' , this.dom.actions.get(0));
            this.dom.next = G('.next' , this.dom.actions.get(0));

            this.dom.timeInfo = G('.time-info' , this.dom.actions.get(0));
            this.dom.currentTime = G('.current-time' , this.dom.timeInfo.get(0));
            this.dom.duration = G('.duration' , this.dom.timeInfo.get(0));

            this.dom.notMuted = G('.not-muted' , this.dom.actions.get(0));
            this.dom.muted = G('.muted' , this.dom.actions.get(0));

            this.dom.soundCtrl = G('.sound-ctrl' , this.dom.actions.get(0));
            this.dom.sound = G('.sound' , this.dom.soundCtrl.get(0));
            this.dom.innerForSound = G('.inner' , this.dom.sound.get(0));
            this.dom.ratioForSound = G('.ratio' , this.dom.sound.get(0));
            this.dom.pointForSound = G('.point' , this.dom.sound.get(0));

            this.dom.fullscreen = G('.full-screen' , this.dom.actions.get(0));
            this.dom.notFullscreen = G('.not-full-screen' , this.dom.actions.get(0));

            this.dom.definition = G('.definition' , this.dom.actions.get(0));
            this.dom.settingsForDefinition = G('.settings' , this.dom.definition.get(0));
            this.dom.itemsForDefinition = G('.item' , this.dom.settingsForDefinition.get(0));
            this.dom.nameForDefinition = G('.name' , this.dom.definition.get(0));

            this.dom.speed = G('.speed' , this.dom.actions.get(0));
            this.dom.settingsForSpeed = G('.settings' , this.dom.speed.get(0));
            this.dom.nameForSpeed = G('.name' , this.dom.speed.get(0));

            this.dom.settings = G('.right > .settings' , this.dom.actions.get(0));
            this.dom.set = G('.right > .settings > .set' , this.dom.actions.get(0));
            this.dom.config = G('.config' , this.dom.settings.get(0));
            this.dom.operation = G('.operation' , this.dom.config.get(0));
            this.dom.mapping = G('.mapping' , this.dom.config.get(0));

            this.dom.itemsForOperation  = G('.item' , this.dom.operation.get(0));
            this.dom.itemsForMapping    = G('.mapping-item' , this.dom.mapping.get(0));

            this.dom.subtitleInMapping        = G('.subtitle' , this.dom.mapping.get(0));
            this.dom.backToOperation = G('.back-to-operation' , this.dom.mapping.get(0));
            this.dom.listForSubtitleInMapping = G('.list' , this.dom.subtitleInMapping.get(0));

            this.dom.textForSubtitleInOperation = G('.subtitle .value .text' , this.dom.operation.get(0));

            this.dom.poster = G('.poster' , this.dom.videoPlayer.get(0));
            this.dom.imageForPoster = G('.image' , this.dom.poster.get(0));

            this.data.rootBoxSizing = this.dom.root.css('box-sizing');

            var self = this;

            // 初始化速度
            this.data.speeds.forEach(function(v){
                var div = document.createElement('div');
                    div = G(div);
                    div.addClass('item');
                    div.text(v.value);
                    div.data('speed' , v.key);
                    div.on('click' , function(){
                        self.speed(v.key);
                    });
                    self.dom.settingsForSpeed.append(div.get(0));
                    if (v.key === self.data.speed) {
                        div.addClass('cur');
                    }
            });
            this.dom.itemsForSpeed = G('.item' , this.dom.settingsForSpeed.get(0));
        } ,

        initDynamic: function(){
            // 初始化动作
            this.dom.preview.removeClass('hide');

            // 数据值获取
            this.data.rootW = this.dom.root.width(this.data.rootBoxSizing);
            this.data.rootW = this.dom.root.width(this.data.rootBoxSizing);

            this.data.innerForSoundW = this.dom.innerForSound.width();
            this.data.innerForSoundLeftVal = this.dom.innerForSound.getWindowOffsetVal('left');
            this.data.ratioForSoundW = this.dom.ratioForSound.width();

            this.data.innerForProgressW = this.dom.innerForProgress.width();
            this.data.innerForProgressLeftVal = this.dom.innerForProgress.getWindowOffsetVal('left');

            this.data.pointW = this.dom.point.width();
            this.data.pointForSoundW = this.dom.pointForSound.width();

            this.data.previewW = this.dom.preview.width();
            this.data.innerForPreviewW = this.dom.innerForPreview.width();
            this.data.moveForPreviewW = this.dom.moveForPreview.width();
            this.data.moveForPreviewH = this.dom.moveForPreview.height();

            this.data.controlH = this.dom.control.height();


            if (!this.data.fullscreen) {
                // 普通状态
                this.data.previewMinLeftVal = 0;
                this.data.previewMaxLeftVal = this.data.innerForPreviewW - this.data.moveForPreviewW;
                this.dom.preview.css({
                    bottom: this.data.controlH + this.data.extraH + 'px'
                });
            } else {
                // 全屏状态
                this.data.previewMinLeftVal = this.data.moveForPreviewW * (this.data.moveForPreviewInFullscreen.scaleX - 1) / 2;
                this.data.previewMaxLeftVal = this.data.innerForPreviewW - this.data.moveForPreviewW - this.data.previewMinLeftVal;

                this.dom.moveForPreview.css({
                    scaleX: this.data.moveForPreviewInFullscreen.scaleX ,
                    scaleY: this.data.moveForPreviewInFullscreen.scaleY ,
                });
                this.dom.preview.css({
                    bottom: this.data.controlH + this.data.moveForPreviewH * (this.data.moveForPreviewInFullscreen.scaleY - 1) / 2 + this.data.extraH + 'px'
                });
            }
            // 结束动作
            this.dom.preview.addClass('hide');
            var self = this;

            if (!this.data.onceForInit) {
                this.progress(this.data.ratio , false , true);
                this.volume(this.data.volume);
            }

        } ,

        init: function(){
            this.showControl();
            this._index(this.data.index);
            this.initVideoCtrlStyle();
            this.initVideo();
            this.initPreview();
            this.volume(this.data.volume);
            this.muted(this.data.muted , false);
            this.data.fullscreen ? this.fullscreen() : this.notFullscreen();
            this.data.onceForInit = false;
            if (G.isFunction(this.data.switch)) {
                this.data.switch.call(this , this.data.index);
            }

        } ,

        initPoster: function(poster){
            this.dom.imageForPoster.native('src' , poster);
        } ,

        hidePoster: function(){
            this.dom.poster.addClass('hide');
        } ,

        attr: function(key , val){
            if (G.isValid(val)) {
                return this.dom.video.native(key , val);
            }
            return this.dom.video.native(key);
        } ,

        native: function(){
            var args = G.toArray(arguments);
            return this.dom.video.origin.apply(this.dom.video , args);
        } ,

        timeUpdateEvent: function(e){
            if (!this.data.loadedMetaData) {
                return ;
            }
            var currentTime = this.currentTime();
            var duration = this.duration();
            var ratio = currentTime / duration;
            this.hideLoading();
            this.progress(ratio , false , !this.data.canAjustProgress);
            this.buffered();
        } ,

        progressEvent: function(e){
            this.buffered();
        } ,

        soundSeekByClick: function(e){
            G.prevent(e);
            var endX = e.clientX;
            var leftVal = this.dom.innerForSound.getWindowOffsetVal('left');
            var amount = endX - leftVal;
            var ratio = amount / this.data.innerForSoundW;
            this.volume(ratio);
        } ,

        // 视频定位开始
        seekStartByMouseDown: function(e){
            G.prevent(e);
            this.data.canAjustProgress = true;
            this.data.startXForVideo = e.clientX;
            var wAmount = this.data.startXForVideo - this.data.innerForProgressLeftVal;
            this.data.tempRatio = wAmount / this.data.innerForProgressW;

            // 结果设置
            this.dom.amount.addClass('hover');
            this.progress(this.data.tempRatio , false , true);
        } ,

        // 视频定位中
        seekingByMouseMove: function(e){
            if (!this.data.canAjustProgress) {
               return ;
            }
            G.prevent(e);
            // 视频进度
            this.data.endXForVideo = e.clientX;
            var xAmount = this.data.endXForVideo - this.data.startXForVideo;
            var ratio = xAmount / this.data.innerForProgressW;
            this.data.endRatio = Math.max(this.data.minRatio , Math.min(this.data.maxRatio , this.data.tempRatio + ratio));
            this.progress(this.data.endRatio , false , true);
            this.preview(this.data.endRatio);
        } ,

        // 视频定位结束
        seekEndByMouseUp: function(e){
            if (!this.data.canAjustProgress) {
                return ;
            }
            G.prevent(e);
            this.data.canAjustProgress = false;
            this.progress(this.data.endRatio , true);
            this.buffered();
        } ,

        // 预览开始
        previewStartByMouseEnter: function(e){
            this.data.canPreview = true;
            var x       = e.clientX;
            var xAmount = x - this.data.innerForProgressLeftVal;
            var ratio   = xAmount / this.data.innerForProgressW;
            this.dom.atPosition.css('scaleX' , ratio);
            this.preview(ratio);
        } ,

        // 预览移动中
        previewingByMouseMove:function(e){
            if (!this.data.canPreview) {
                return ;
            }
            // 预览进度
            var x = e.clientX;
            var xAmount = x - this.data.innerForProgressLeftVal;
            var ratio = xAmount / this.data.innerForProgressW;
            this.dom.atPosition.css('scaleX' , ratio);
            this.preview(ratio);
        } ,

        // 预览结束
        previewEndByMouseLeave: function(){
            this.data.canPreview = false;
            this.hidePreview();
        } ,

        // 显示视频进度控制条
        showVideoProgressCtrl: function(){
            this.dom.amount.addClass('hover');
            this.dom.point.addClass('show');
        } ,

        // 隐藏视频进度控制条
        hideVideoProgressCtrl: function(){
            this.dom.amount.removeClass('hover');
            this.dom.point.removeClass('show');
        } ,

        showVideoProgressCtrlByMouseEnter: function(){
            this.showVideoProgressCtrl();
        } ,

        hideVideoProgressCtrlByMouseLeave: function(){
            if (this.data.canAjustProgress) {
                return ;
            }
            this.hideVideoProgressCtrl();
        } ,

        seekByClick: function(e){
            G.prevent(e);
            var x = e.clientX;
            var xAmount = x - this.data.innerForProgressLeftVal;
            var ratio = xAmount / this.data.innerForProgressW;
            this.progress(ratio , true , true);
            this.buffered();
            this.preview(ratio);
            this.hidePoster();
        } ,

        playEvent: function(){
            this.play();
        } ,

        pauseEvent: function(){
            this.pause();
        } ,

        mutedEvent: function(){
            this.muted(false , true);
        } ,

        notMutedEvent: function(){
            this.muted(true , true);
        } ,

        waitingEvent: function(){
            this.showLoading();
        } ,

        seekingEvent: function(e){
            this.showLoading();
        } ,

        seekedEvent: function(e){
            this.hideLoading();
        } ,

        showLoading: function(){
            if (this.data.showLoading) {
                return ;
            }
            this.data.showLoading = true;
            this.dom.loading.removeClass('hide');
        } ,

        hideLoading: function(){
            if (!this.data.showLoading) {
                return ;
            }
            this.data.showLoading = false;
            this.dom.loading.addClass('hide');
        } ,

        resizeEvent: function(){
            this.initDynamic();
        } ,

        prev: function(){
            if (this.data.index === this.data.minIndex) {
                return ;
            }
            var index = this.data.index - 1;
            this.switchVideoByIndex(index);
        } ,

        index: function(index){
            if (G.isUndefined(index)) {
                return this.data.index;
            }
            this.switchVideoByIndex(index);
        } ,

        initVideoCtrlStyle: function(){
            if (this.data.index === this.data.maxIndex) {
                this.dom.next.addClass('disabled');
            } else {
                this.dom.next.removeClass('disabled');
            }
            if (this.data.index === this.data.minIndex) {
                this.dom.prev.addClass('disabled');
            } else {
                this.dom.prev.removeClass('disabled');
            }
        } ,

        next: function(){
            if (this.data.index === this.data.maxIndex) {
                return ;
            }
            var index = this.data.index + 1;
            this.switchVideoByIndex(index);
        } ,

        initTimeInfo: function(){
            this.dom.currentTime.text(this.data.formatTime);
            this.dom.duration.text(this.data.formatDuration);
        } ,

        // 切换视频
        switchVideoByIndex: function(index){
            // 相关参数重置
            this.data.speed = 1;
            this.data.currentTime = 0;
            this.data.ratio = 0;
            this.data.paused = false;
            this._index(index);
            this.initVideoCtrlStyle();
            this.initVideo();
            this.initPreview();
            if (G.isFunction(this.data.switch)) {
                this.data.switch.call(this , this.data.index);
            }
        } ,

        endedEvent: function(){
            this.pause();
            if (G.isFunction(this.data.ended)) {
                this.data.ended.call(this);
            }
        } ,

        soundSeekByWheel: function(e) {
            G.prevent(e);
            let soundStep;
            if (e.deltaY < 0) {
                // 音量放大
                soundStep = this.data.soundStep;
            } else {
                // 音量缩小
                soundStep = -this.data.soundStep;
            }
            this.soundStep(soundStep);
        } ,

        initEvent: function(){
            var self = this;

            // 视频可以播放，但无法完整播放时触发
            this.dom.video.on('canplay' , this.canPlayEvent.bind(this));
            // 能够完整播放到结束时触发
            this.dom.video.on('canplaythrough' , this.canPlayThrough.bind(this));
            // 元数据已经加载完毕时触发
            this.dom.video.on('loadeddata' , this.loadedData.bind(this));
            // 播放时间更新的时候触发
            this.dom.video.on('timeupdate' , this.timeUpdateEvent.bind(this));
            // 视频无法播放时触发
            this.dom.video.on('waiting' , this.waitingEvent.bind(this));
            // 缓冲时触发
            this.dom.video.on('progress' , this.progressEvent.bind(this));
            // 定位中
            this.dom.video.on('seeking' , this.seekingEvent.bind(this));
            // 已定位
            this.dom.video.on('seeked' , this.seekedEvent.bind(this));
            // 视频播放结束
            this.dom.video.on('ended' , this.endedEvent.bind(this));
            // 禁止右键功能
            if (!this.data.debug) {
                // 非开发模式禁用右键菜单
                this.dom.video.on('contextmenu' , G.prevent);
            }

            // 播放
            this.dom.play.on('click' , this.playEvent.bind(this));
            // 暂停
            this.dom.pause.on('click' , this.pauseEvent.bind(this));
            // 静音
            this.dom.muted.on('click' , this.mutedEvent.bind(this));
            // 取消静音
            this.dom.notMuted.on('click' , this.notMutedEvent.bind(this));
            // 全屏
            this.dom.fullscreen.on('click' , this.fullscreen.bind(this));
            // 取消全屏
            this.dom.notFullscreen.on('click' , this.notFullscreen.bind(this));
            // 上一个视频
            this.dom.prev.on('click' , this.prev.bind(this));
            // 下一个视频
            this.dom.next.on('click' , this.next.bind(this));

            // 视频预览
            this.dom.innerForProgress.on('mouseenter' , this.previewStartByMouseEnter.bind(this));
            this.dom.win.on('mousemove' , this.previewingByMouseMove.bind(this));
            this.dom.innerForProgress.on('mouseleave' , this.previewEndByMouseLeave.bind(this));

            // 视频进度控制条
            this.dom.innerForProgress.on('mouseenter' , this.showVideoProgressCtrlByMouseEnter.bind(this));
            this.dom.innerForProgress.on('mouseleave' , this.hideVideoProgressCtrlByMouseLeave.bind(this));

            // 视频定位
            this.dom.innerForProgress.on('click' , this.seekByClick.bind(this));
            this.dom.point.on('mousedown' , this.seekStartByMouseDown.bind(this));
            this.dom.win.on('mousemove' , this.seekingByMouseMove.bind(this));
            this.dom.win.on('mouseup' , this.seekEndByMouseUp.bind(this));

            // 音量调节
            this.dom.innerForSound.on('click' , this.soundSeekByClick.bind(this));
            this.dom.pointForSound.on('mousedown' , this.soundSeekStartByMouseDown.bind(this));
            this.dom.win.on('mousemove' , this.soundSeekingByMouseMove.bind(this));
            this.dom.win.on('mouseup' , this.soundSeekEndByMouseUp.bind(this));

            // 清晰度
            this.dom.definition.on('click' , this.definitionEvent.bind(this));
            this.dom.settingsForDefinition.on('click' , G.stop);
            this.dom.win.on('click' , this.hideDefinition.bind(this));

            // 播放速度
            this.dom.speed.on('click' , this.speedEvent.bind(this));
            this.dom.settingsForSpeed.on('click' , G.stop);
            this.dom.win.on('click' , this.hideSpeed.bind(this));

            // 设置
            this.dom.set.on('click' , this.settingsEvent.bind(this));
            this.dom.set.on('click' , G.stop);
            this.dom.win.on('click' , this.hideSettings.bind(this));
            this.dom.config.on('click' , G.stop);

            // 窗口调整
            this.dom.win.on('resize' , this.resizeEvent.bind(this));

            // 设置项
            this.dom.itemsForOperation.on('click' , this.mappingEvent.bind(this));
            this.dom.backToOperation.on('click' , this.backToOperation.bind(this));

            this.dom.videoPlayer.on('mouseenter' , this.initVideoPlayerByMouseEnter.bind(this));
            this.dom.videoPlayer.on('mouseleave' , this.initVideoPlayerByMouseLeave.bind(this));
            this.dom.videoPlayer.on('mousemove' , this.initVideoPlayerEvent.bind(this));
            this.dom.videoPlayer.on('dblclick' , this.screenBydblClick.bind(this));
            this.dom.videoPlayer.on('click' , this.autoSwitchVideoPlayerPlayStatus.bind(this));

            this.dom.title.on('click' , G.stop);
            this.dom.control.on('click' , function(e){
                G.stop(e);
                self.hideDefinition();
                self.hideSpeed();
                self.hideSettings();
            });

            // 音量调节
            this.dom.soundCtrl.on('wheel' , this.soundSeekByWheel.bind(this));


            // this.dom.win.on('keydown' , G.prevent);
            // this.dom.win.on('keydown' , G.stop);

            this.dom.html.on('keyup' , this.keyboardEvent.bind(this));
        } ,

        screenBydblClick: function(){
            if (this.data.fullscreen) {
                this.notFullscreen();
            } else {
                this.fullscreen();
            }
        } ,

        showTitle: function(){
            this.dom.title.addClass('hover');
        } ,

        hideTitle: function(){
            if (this.data.paused) {
                return ;
            }
            this.dom.title.removeClass('hover');
        } ,

        initVideoPlayerEvent: function(){
            var self = this;
             this.showTitle();
             this.showControl();
             window.clearTimeout(this.data.videoPlayerTimer);
             this.data.videoPlayerTimer = window.setTimeout(function(){
                 self.hideControl();
                 self.hideTitle();
                 // console.log('隐藏控制器等');
             } , this.data.initPlayerInterval);
        } ,

        keyboardEvent: function(e){
            var keyCode = e.keyCode;
            console.log('key up event' , keyCode);
            switch (keyCode)
            {
                case 13:
                    // 回车键

                    break;
                case 32:
                    // 空格键
                    this.autoSwitchVideoPlayerPlayStatus();
                    break;
                case 27:
                    // esc
                    // this.notFullscreen();
                    break;
                case 37:
                    // left
                    this.step(-this.data.step);
                    break;
                case 39:
                    // right
                    this.step(this.data.step);
                    break;
                case 38:
                    // top
                    this.soundStep(this.data.soundStep);
                    break;
                case 40:
                    // bottom
                    this.soundStep(-this.data.soundStep);
                    break;
                case 33:
                    // page up
                    this.prev();
                    break;
                case 34:
                    // page down
                    this.next();
                    break;

            }
        } ,

        autoSwitchVideoPlayerPlayStatus:function(){
            if (this.data.paused) {
                this.play();
            } else {
                this.pause();
            }
        } ,

        step: function(step){
            var duration = this.duration();
            var currentTime = Math.max(0 , Math.min(duration , this.currentTime() + step));
            var ratio = currentTime / duration;
            this.progress(ratio , true , true);
        } ,

        soundStep: function(step){
            var volume = Math.max(0 , Math.min(1 , this.data.volume + step));
            this.data.tempVolume = volume;
            this.volume(volume , true);
            if (volume === 0) {
                this.muted(true , false);
            } else {
                this.muted(false , false);
            }
            // this.switchPlayCtrlTip('volume');
        } ,


        initVideoPlayerByMouseEnter: function(){
            this.data.mouseIsInVideo = true;
            this.showControl();
            this.showTitle();
        } ,

        initVideoPlayerByMouseLeave: function(){
            this.data.mouseIsInVideo = false;
            this.hideControl();
            this.hideTitle();
        } ,

        showControl: function(){
            this.dom.videoPlayer.removeClass('not-control');
            this.dom.control.addClass('hover');
        } ,

        hideControl: function(){
            if (this.data.paused) {
                return ;
            }
            if (!this.data.canHideControl) {
                return ;
            }
            // if (this.data.mouseIsInVideo) {
            //     return ;
            // }
            this.dom.videoPlayer.addClass('not-control');
            this.dom.control.removeClass('hover');
        } ,


        findMappingItemById: function(id){
            var i = 0;
            var cur = null;
            for (i = 0; i < this.dom.itemsForMapping.length; ++i)
            {
                cur = this.dom.itemsForMapping.jump(i , true);
                if (cur.data('id') == id) {
                    return cur.get(0);
                }
            }
            throw new Error('未找到 id: ' + id + '映射的内容');
        } ,

        mappingEvent: function(e){
            var tar = G(e.currentTarget);
            var id = tar.data('id');
            var mappingItem = G(this.findMappingItemById(id));
            mappingItem.highlight('hide' , this.dom.itemsForMapping.get() , true);
            this.dom.operation.addClass('hide');
        } ,

        backToOperation: function(){
            this.dom.operation.removeClass('hide');
            this.dom.itemsForMapping.addClass('hide');
        } ,

        showDefinition: function(){
            this.hideSpeed();
            this.hideSettings();
            this.data.definitionVisible = true;
            this.data.canShowPreview = false;
            this.data.canHideControl = false;
            this.dom.settingsForDefinition.removeClass('hide');
            this.dom.settingsForDefinition.startTransition('show');
        } ,

        hideDefinition: function(){
            if (!this.data.definitionVisible) {
                return ;
            }
            var self = this;
            this.data.definitionVisible = false;
            this.data.canShowPreview = true;
            this.data.canHideControl = true;
            this.hideControl();
            console.log('hide definition');
            this.dom.settingsForDefinition.endTransition('show' , function () {
                self.dom.settingsForDefinition.addClass('hide');
            });
        } ,

        showSpeed: function(){
            this.hideDefinition();
            this.hideSettings();
            this.data.speedVisible = true;
            this.data.canShowPreview = false;
            this.data.canHideControl = false;
            this.dom.settingsForSpeed.removeClass('hide');
            this.dom.settingsForSpeed.startTransition('show');
        } ,

        hideSpeed: function(){
            if (!this.data.speedVisible) {
                return ;
            }
            var self = this;
            this.data.speedVisible = false;
            this.data.canShowPreview = true;
            this.data.canHideControl = true;
            this.hideControl();
            this.dom.settingsForSpeed.endTransition('show' , function () {
                self.dom.settingsForSpeed.addClass('hide');
            });
        } ,

        showSettings: function(){
            this.hideDefinition();
            this.hideSpeed();
            this.data.settingsVisible = true;
            this.data.canShowPreview = false;
            this.data.canHideControl = false;
            this.dom.operation.removeClass('hide');
            this.dom.subtitleInMapping.addClass('hide');
            this.dom.config.removeClass('hide');
            this.dom.config.startTransition('show');
        } ,

        hideSettings: function(){
            if (!this.data.settingsVisible) {
                return ;
            }
            var self = this;
            this.data.settingsVisible = false;
            this.data.canShowPreview = true;
            this.data.canHideControl = true;
            this.hideControl();
            this.dom.config.endTransition('show' , function () {
                self.dom.config.addClass('hide');
            });
        } ,


        definitionEvent: function(e){
            G.stop(e);
            this.showDefinition();
        } ,

        speedEvent: function(e){
            G.stop(e);
            this.showSpeed();
        } ,

        settingsEvent: function(e){
            G.stop(e);
            this.showSettings();
        } ,

        soundSeekStartByMouseDown: function(e){
            G.prevent(e);
            this.data.canAjustVolume = true;
            this.data.volumeX = e.clientX;
            var leftVal = this.dom.innerForSound.getWindowOffsetVal('left');
            var amount = this.data.volumeX - leftVal;
            var ratio = amount / this.data.innerForSoundW;
            this.data.tempVolume = ratio;
            this.muted(false , false);
            this.volume(ratio);
        } ,

        soundSeekingByMouseMove: function(e){
            if (!this.data.canAjustVolume) {
                return ;
            }
            G.prevent(e);
            var volumeX = e.clientX;
            var amount = volumeX - this.data.volumeX;
            var ratio = amount / this.data.innerForSoundW;
            this.volume(this.data.tempVolume + ratio);
            if (this.data.volume === 0) {
                this.muted(true , false);
            } else {
                this.muted(false , false);
            }
        } ,

        soundSeekEndByMouseUp: function(e){
            if (!this.data.canAjustVolume) {
                return ;
            }
            G.prevent(e);
            this.data.canAjustVolume = false;
            this.data.tempVolume = this.data.volume;
        } ,

        // 查找对应的 index
        findVideoByIndex: function(index){
            var i;
            var cur;
            for (i = 0; i < this.data.playlist.length; ++i)
            {
                cur = this.data.playlist[i];
                if (cur.index === index) {
                    return cur;
                }
            }
            throw new Error('未找到当前索引【' + index + '】对应的视频');
        } ,

        _index: function(index){
            this.data.video = this.findVideoByIndex(index);
            this.data.index = index;
        } ,

        canPlayEvent: function(){
            // console.log('can play event handler');
        } ,

        canPlayThrough: function(){
            // console.log('can play through event handler');
        } ,

        // 首帧已经加载完毕
        loadedData: function(){
            // 必须提前设置，否则会触发保护机制
            this.data.loadedMetaData = true;
            var currentTime = this.data.currentTime;
            var duration = this.duration();
            this.progress(currentTime / duration , true , true);
            this.buffered();
            this.muted(this.data.muted , false);
            this.volume(this.data.volume);
            if (this.data.video.subtitle.length > 0) {
                this.switchSubtitleById(this.data.video.subtitle[0].name);
            } else {
                this.dom.textForSubtitleInOperation.text('无');
            }
            this.speed(this.data.speed);
            if (!this.data.onceForLoadedData) {
                if (this.data.paused) {
                    this.pause();
                } else {
                    this.play();
                }
            } else {
                this.data.onceForLoadedData = false;
            }
        } ,

        findVideoItemByDefinition: function(definition){
            var items = G('.item' , this.dom.settingsForDefinition.get(0));
            var i;
            var cur;
            for (i = 0 ; i < items.length; ++i)
            {
                cur = items.jump(i , true);
                if (cur.data('definition') === definition) {
                    return cur.get(0);
                }
            }
            throw new Error('不支持的清晰度：' + definition);
        } ,

        findDefinitionByDefinition: function(definition){
            var i;
            var cur;
            for (i = 0 ; i < this.data.video.definition.length; ++i)
            {
                cur = this.data.video.definition[i];
                if (cur.name === definition) {
                    return cur;
                }
            }
            return null;
        } ,

        // 切换清晰度
        switchVideoByDefinition: function(definition){
            var item = G(this.findVideoItemByDefinition(definition));
            var items = G('.item' , this.dom.settingsForDefinition.get(0));
            var _definition = this.findDefinitionByDefinition(definition);
            this.data.currentDefinition = _definition;
            this.dom.nameForDefinition.text(_definition.name);
            item.highlight('cur' , items.get());
            this.hideDefinition();
            var paused = this.data.paused;
            if (!this.data.onceForSwitchVideoByDefinition) {
                this.pause();
            }
            this.initTimeInfo();
            this.attr('src' , _definition.src);
            this.data.paused = paused;
            this.data.loadedMetaData = false;
        } ,

        // 切换视频预览
        switchPreviewByIndex: function(index){
            var video = this.findVideoByIndex(index);
            this.dom.imageForPreview.native('src' , video.preview.src);
        } ,

        // 字幕的移除必须通过移除节点的方式
        // 否则实际仅移除了字幕节点
        // 然实际视频仍然包含被移除的视频
        removeAllTrack: function(){
            var self = this;
            var tracks = this.dom.video.children({
                tagName: 'track' ,
            } , false , true);
            tracks.each(function(dom){
                self.dom.video.remove(dom);
            });
        } ,

        initVideo: function(){
            var self = this;

            this.initPoster(this.data.video.thumb);

            this.dom.settingsForDefinition.html('');
            this.dom.listForSubtitleInMapping.html('');
            this.dom.title.text(this.data.video.name);
            this.removeAllTrack();
            // 初始化清晰度
            this.data.video.definition.forEach(function(v){
                var div = document.createElement('div');
                div = G(div);
                div.addClass('item');
                div.text(v.name);
                div.data('definition' , v.name);
                div.on('click' , function(){
                    self.data.currentTime = self.currentTime();
                    self.switchVideoByDefinition(v.name);
                });
                self.dom.settingsForDefinition.append(div.get(0));
            });

            this.data.video.subtitle.forEach(function(v){
                // 渲染字幕菜单
                var div = document.createElement('div');
                    div = G(div);
                    div.addClass('item');
                    div.text(v.name);
                    div.data('id' ,v.name);
                div.on('click' , function(e){
                    var tar = G(e.currentTarget);
                    var id = tar.data('id');
                    self.switchSubtitleById(id);
                });
                self.dom.listForSubtitleInMapping.append(div.get(0));

                // 渲染音轨
                var track = document.createElement('track');
                    track = G(track);

                track.native('label' , v.name);
                track.native('kind' , 'subtitles');
                track.native('srclang' , 'en');
                track.native('src' , v.src);
                track.native('mode' , 'disabled');
                track.data('id' , v.name);
                self.dom.video.append(track.get(0));
            });

            this.dom.itemsForSubtitleInMapping = G('.item' , this.dom.listForSubtitleInMapping.get(0));
            this.dom.tracksForVideo = G('track' , this.dom.video.get(0));
            this.dom.itemsForDefinition = G('.item' , this.dom.settingsForDefinition.get(0));
            var definition = this.findDefinitionByDefinition(this.data.definition);
            // console.log('before' , definition);
            if (!G.isValid(definition)) {
                var video = this.findVideoByIndex(this.data.index);
                definition = video.definition[0];
            }
            self.switchVideoByDefinition(definition.name);
        } ,

        switchSubtitleById: function(id){
            var i;
            var cur;
            var track;
            for (i = 0 ; i < this.dom.tracksForVideo.length; ++i)
            {
                cur = this.dom.tracksForVideo.jump(i , true);
                track = cur.native('track');
                if (cur.data('id') === id) {
                    track.mode = 'showing';
                } else {
                    track.mode = 'disabled';
                }
            }
            var item = G(this.findSubtitleItemById(id));
            item.highlight('cur' , this.dom.itemsForSubtitleInMapping.get());
            this.dom.textForSubtitleInOperation.text(id);
            this.hideSettings();
        } ,

        findTrackById: function(id){
            var i;
            var cur;
            for (i = 0 ; i < this.dom.tracksForVideo.length; ++i)
            {
                cur = this.dom.tracksForVideo.jump(i , true);
                if (cur.data('id') === id) {
                    return cur.get(0);
                }
            }
            throw new Error('未找到 id: ' + id  + ' 对应的 track 元素');
        } ,

        findSubtitleItemById: function(id){
            var i;
            var cur;
            for (i = 0 ; i < this.dom.itemsForSubtitleInMapping.length; ++i)
            {
                cur = this.dom.itemsForSubtitleInMapping.jump(i , true);
                if (cur.data('id') === id) {
                    return cur.get(0);
                }
            }
            throw new Error('未找到 id: ' + id  + ' 对应的 track 元素');
        } ,

        initPreview: function(){
            this.switchPreviewByIndex(this.data.index);
        } ,

        currentTime: function(){
            return parseInt(this.attr('currentTime'));
        } ,

        duration: function(){
            return parseInt(this.attr('duration'));
        } ,

        // 静音
        muted: function(muted , reset){
            reset = G.isBoolean(reset) ? reset : true;
            muted = G.isBoolean(muted) ? muted : true;
            this.attr('muted' , muted);
            if (muted) {
                this.dom.muted.removeClass('hide');
                this.dom.notMuted.addClass('hide');
                this.data.volumeBack = this.data.volume;
                this.volume(0);
            } else {
                this.dom.muted.addClass('hide');
                this.dom.notMuted.removeClass('hide');
                if (reset) {
                    this.volume(this.data.volumeBack);
                }
            }
        } ,

        /**
         * 音量调节
         *
         * @param volume 0-1
         */
        volume: function(volume){
            volume = Math.max(this.data.minVolume , Math.min(this.data.maxVolume , volume));
            this.attr('volume' , volume);
            this.dom.ratioForSound.css('scaleX' , volume);
            this.dom.pointForSound.css({
                translateX: volume * this.data.innerForSoundW + 'px' ,
                translateY: '-50%' ,
            });
            this.data.volume = volume;
        } ,

        findSpeedBySpeed: function(speed){
            var i = 0;
            var cur = null;
            for (i = 0; i < this.data.speeds.length; ++i)
            {
                cur = this.data.speeds[i];
                if (cur.key == speed) {
                    return cur;
                }
            }
            throw new Error('未找到当前速度：' + speed + ' 对应的速度选项');
        } ,

        findSpeedItemBySpeed: function(speed){
            var i = 0;
            var cur = null;
            for (i = 0; i < this.dom.itemsForSpeed.length; ++i)
            {
                cur = this.dom.itemsForSpeed.jump(i , true);
                if (cur.data('speed') == speed) {
                    return cur.get(0);
                }
            }
            throw new Error('未找到当前速度: ' + speed + ' 对应的 item');
        } ,

        // 变速 正常速度 1.0
        speed: function(speed){
            var _speed = this.findSpeedBySpeed(speed);
            var item = G(this.findSpeedItemBySpeed(speed));
            this.attr('playbackRate' , _speed.key);
            this.dom.nameForSpeed.text(_speed.value);
            item.highlight('cur' , this.dom.itemsForSpeed.get());
            this.hideSpeed();
        } ,

        poster: function(poster){
            this.attr('poster' , poster);
        } ,

        /**
         * 1 - 视频未初始化
         * 2 - 元数据初始化
         * 3 - 视频可播放，当不足以支持持续播放
         * 4 - 视频可播放，支持播放到结束
         *
         * @param speed
         * @returns {*|void|string|Buffer}
         */
        readyState: function(speed){
            return this.attr('readyState');
        } ,

        // 全屏|非全屏
        fullscreen: function(){
            this.data.fullscreen = true;
            this.dom.fullscreen.addClass('hide');
            this.dom.notFullscreen.removeClass('hide');
            this.dom.videoPlayer.addClass('full-screen');
            this.dom.videoPlayer.requestFullScreen();
        } ,

        notFullscreen: function(){
            this.data.fullscreen = false;
            this.dom.fullscreen.removeClass('hide');
            this.dom.notFullscreen.addClass('hide');
            this.dom.videoPlayer.exitFullScreen();
            this.dom.videoPlayer.removeClass('full-screen');
        } ,

        // 播放
        play: function(){
            var self = this;
            this.data.paused = false;
            this.dom.play.addClass('hide');
            this.dom.pause.removeClass('hide');
            this.switchPlayCtrlTip('play');
            this.hideLoading();
            this.data.playing = true;
            this.native('play');
            if (this.data.onceForPlay) {
                this.data.onceForPlay = false;
                this.hidePoster();
            }
        } ,

        pause: function(){
            var self = this;
            this.data.paused = true;
            this.hideLoading();
            this.switchPlayCtrlTip('pause');
            this.dom.pause.addClass('hide');
            this.dom.play.removeClass('hide');
            this.native('pause');
        } ,

        switchPlayCtrlTip: function(type){
            var self = this;
            switch (type)
            {
                case 'play':
                    this.dom.playForPlayCtrlTip.removeClass('hide');
                    this.dom.pauseForPlayCtrlTip.addClass('hide');
                    this.dom.volumeForPlayCtrlTip.addClass('hide');
                    break;
                case 'pause':
                    this.dom.playForPlayCtrlTip.addClass('hide');
                    this.dom.pauseForPlayCtrlTip.removeClass('hide');
                    this.dom.volumeForPlayCtrlTip.addClass('hide');
                    break;
                case 'volume':
                    this.dom.playForPlayCtrlTip.addClass('hide');
                    this.dom.pauseForPlayCtrlTip.addClass('hide');
                    this.dom.volumeForPlayCtrlTip.removeClass('hide');
                    break;
            }
            this.dom.playCtrlTip.removeClass(['hide' , 'animate']);
            this.dom.playCtrlTip.startTransition('animate');
            window.clearTimeout(this.data.playStatusTimer);
            this.data.playStatusTimer = window.setTimeout(function(){
                self.dom.playCtrlTip.removeClass('animate');
                self.dom.playCtrlTip.addClass('hide');
            } , this.data.playCtrlTipDuration);
        } ,

        progress: function(ratio , initTime , initStyle){
            initStyle = G.isBoolean(initStyle) ? initStyle : true;
            initTime = G.isBoolean(initTime) ? initTime : true;

            // 显示时间
            var duration = this.duration();
            var currentTime = parseInt(duration * ratio);

            // console.log(this.dom.video.native('duration') , this.dom.video.native('currentTime') , 'timeupdate event handler');

            this.dom.currentTime.text(this.formatTime(currentTime));
            this.dom.duration.text(this.formatTime(duration));

            if (initStyle) {
                // 设置样式
                this.dom.ratio.css('scaleX' , ratio);
                // this.dom.point.css('left' , 'calc(' + ratio * 100 + '% - ' + this.data.pointW / 2 + 'px');
                this.dom.point.css({
                    translateX: ratio * this.data.innerForProgressW + 'px' ,
                    translateY: '-50%' ,
                });
            }

            if (initTime) {
                // 视频定位
                this.data.ratio = ratio;
                G.s.set(this.cacheKey('duration_' + this.data.currentDefinition.value) , currentTime);
                this.attr('currentTime' , currentTime);
            }
        } ,

        cacheKey: function(value){
            return this.data.cacheKeyPrefix + window.encodeURI(value);
        } ,

        buffered: function(){
            var duration = this.duration();
            var loaded = 0;
            var bufRange = this.dom.video.native('buffered');
            if (bufRange.length > 0) {
                var buffered = (bufRange.end(bufRange.length - 1) - bufRange.start(bufRange.length - 1));
                var bRatio	 =  buffered / duration;
                loaded = Math.max(0 , Math.min(1 , this.data.ratio + bRatio ));
            }
            this.dom.loaded.css('scaleX' , loaded);
        } ,

        formatTime: function(duration){
            return G.formatTime(duration , 'HH:II:SS' , true);
        } ,

        formatTimeInfo: function(currentTime , duration){
            var formatCurrentTime = G.formatTime(currentTime , 'HH:II:SS');
            var formatDuration = G.formatTime(duration , 'HH:II:SS');
            return formatCurrentTime + '/' + formatDuration;
        } ,



        showPreview: function(){
            if (!this.data.canShowPreview) {
                return ;
            }
            this.dom.preview.removeClass('hide');
            this.dom.preview.startTransition('show');
        } ,

        hidePreview: function(){
            var self = this;
            this.dom.atPosition.css('scaleX' , 0);
            this.dom.preview.endTransition('show');
            window.setTimeout(function(){
                self.dom.preview.addClass('hide');
            } , this.data.previewTransitionDuration);
        } ,

        preview: function(ratio){
            var self = this;
            var formatTime;
            if (this.data.loadedMetaData) {
                var duration = this.duration();
                var currentTime = parseInt(duration * ratio);
                formatTime = this.formatTime(currentTime);
            } else {
                formatTime = this.data.formatTime;
            }
            var leftVal = this.data.innerForPreviewW * ratio - this.data.moveForPreviewW / 2;
                leftVal = Math.max(this.data.previewMinLeftVal , Math.min(this.data.previewMaxLeftVal , leftVal));
            this.dom.moveForPreview.css({
                translateX: leftVal + 'px' ,
                scaleX: this.data.fullscreen ? this.data.moveForPreviewInFullscreen.scaleX : 1 ,
                scaleY: this.data.fullscreen ? this.data.moveForPreviewInFullscreen.scaleY : 1 ,
            });
            this.dom.timepointForPreview.text(formatTime);
            var count = Math.floor(currentTime / this.data.video.preview.duration);
            var x = -Math.max(0 , (count  % this.data.video.preview.count - 1) * this.data.video.preview.width);
            var y = -Math.max(0 , Math.ceil(count / this.data.video.preview.count) - 1) * this.data.video.preview.height;
            this.dom.imageForPreview.css({
                translateX: x + 'px' ,
                translateY: y + 'px'
            });
            this.showPreview();
        } ,

        timepointForPreview: function(){
            // this.dom.timepoint.;

        } ,

        message: function(text){
            var self = this;
            var div = document.createElement('div');
            div = G(div);
            div.addClass('message');
            div.text(text);
            this.dom.videoPlayer.append(div.get(0));
            G.nextTick(function(){
                div.addClass('show');
                window.setTimeout(function(){
                    div.endTransition('show' , function(){
                        div.parent().remove(div.get(0));
                    });
                } , 3 * 1000);
            });
        } ,

        run: function () {
            this.initData();
            this.initStatic();
            this.initDynamic();
            this.initEvent();
            this.init();
        }
    };

    window.VideoPlayer = VideoPlayer;
})();
