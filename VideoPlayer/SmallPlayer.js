/*
 * Author 陈学龙 2016-10-30 22:56:00
 * SmallPlayer 播放器
 */

var SmallPlayer = (function(){
    function SmallPlayer(ele , opt){
        var thisRange = [null , undefined];

        if (G.contain(this , thisRange) || !G.contain(this , thisRange) && this.constructor !== SmallPlayer) {
            return new SmallPlayer(ele , opt);
        }


        /*
         * 默认设置
            this._defaultOpt = {
                carTime: 200 ,									// 动画效果时长
                diyPlayerPosterSrc: '' ,						// 自定义播放器海报
                advertisement: [
                                    {							// 广告
                                        type: '' ,				// 视频广告，支持两种类型： video || image
                                        mime: '' ,				// 广告媒体mime信息
                                        src: '' ,				// 广告源
                                        duration: 20 ,			// 广告持续时间，默认时间：10s。单位：s
                                        link: ''				// 广告对应的链接
                                    }
                               ] ,
                playList: [										// 播放列表
                            {
                                src:  '' ,						// 视频源
                                mime: '' ,						// 支持三种类型 mp4 ogg webm
                                title: '' ,						// 视频标题
                                desc: '' ,						// 视频描述
                                initVolume: 1 ,					// 初始音量
                                initTime: 0 ,					// 初始播放时间
                                initSpeed: 1 ,					// 初始播放速度
                                initStatus: ''				    // 初始播放状态
                            }
                          ] ,
                playIdx: 1 ,									// 指定播放播放列表中的哪一个视频，默认是第一个视频 ,
                isPlayAd: true ,								// 是否播放指定广告
                closeAdBtnEvent: null ,
                defaultAdDuration: 10 ,							// 在没有设置广告播放时长时，广告的默认播放时间
                isDebug: true ,									// 是否调试模式，调试模式下，全部功能为测试功能（点击有效）
                posterShowTime: 0 ,
                resourceDir: ''									// 资源存放目录，必须。这个目录指定了所有相关图片存放目录！！！必须提供
            };
         */

        this._defaultOpt = {
            carTime: 200 ,
            diyPlayerPosterSrc: '' ,
            advertisement: [] ,
            playList: [] ,
            playIdx: 0 ,
            isPlayAd: false ,
            closeAdBtnEvent: null ,
            defaultAdDuration: 10 ,
            isDebug: false ,
            posterShowTime: 2000 ,
            playErrorBgSrc: '' ,
            initStatus: 'play' ,
            initSpeed: 1 ,
            initTime: 0 ,
            initVolume: 1 ,
            resourceDir: '' ,
            videoLoadedCallBack: null
        };

        if (opt === undefined) {
            var opt = this._defaultOpt;
        }

        // 相关设置
        this._statusRange		= ['play' , 'pause'];								// 初始化播放状态
        this._speedRange		= [0.25 , 0.5 , 1 , 1.25 , 1.5 , 1.75 , 2];		    // 初始化播放速度
        this._con				= ele;
        this._carTime			= G.getValType(opt['carTime']) !== 'number'				? this._defaultOpt['carTime']		: opt['carTime'];
        this._playList			= G.getValType(opt['playList']) !== 'array'				? this._defaultOpt['playList']		: opt['playList'];
        this._playIdx			= G.getValType(opt['playIdx']) !== 'number' || (G.getValType(opt['playIdx']) === 'number' && opt['playIdx'] >= 0 && opt['playIdx'] <= this._playList.length) ? this._defaultOpt['playIdx'] : opt['playIdx']
        this._isPlayAd			= G.getValType(opt['isPlayAd']) !== 'boolean'			? this._defaultOpt['isPlayAd']		: opt['isPlayAd'];
        this._advertisement		= this._defaultOpt['advertisement'];//opt['advertisement'];
        this._diyPlayerPosterSrc  = G.getValType(opt['diyPlayerPosterSrc']) !==  'string' ? this._defaultOpt['diyPlayerPosterSrc']  : opt['diyPlayerPosterSrc'];
        this._defaultAdDuration = G.getValType(opt['defaultAdDuration']) !== 'number'	  ? this._defaultOpt['defaultAdDuration']	: opt['defaultAdDuration'];
        this._closeAdBtnEvent   = opt['closeAdBtnEvent'];
        this._isDebug			= G.getValType(opt['isDebug']) !== 'boolean'			  ? this._defaultOpt['isDebug']				: opt['isDebug'];
        this._posterShowTime    = G.getValType(opt['posterShowTime']) !== 'number'		  ? this._defaultOpt['posterShowTime']		: opt['posterShowTime'];
        this._playErrorBgSrc    = G.getValType(opt['playErrorBgSrc']) === ''			  ? this._defaultOpt['playErrorBgSrc']		: opt['playErrorBgSrc'];
        this._resourceDir		= opt['resourceDir'];
        this._videoLoadedCallBack = opt['videoLoadedCallBack'];

        // 播放器
        this._SmallPlayer		= G('.SmallPlayer' , this._con).first();
        this._playerCon			= G('.player_con' , this._SmallPlayer.get()).first();
        this._playing			= G('.playing' , this._playerCon.get()).first();
        this._control			= G('.control' , this._playerCon.get()).first();
        this._controlIn			= G('.control_in' , this._control.get()).first();

        // 视频预览
        this._preview			= G('.preview' , this._controlIn.get()).first();
        this._previewIn			= G('.preview_in' , this._preview.get()).first();
        this._previewTime		= G('.preview_time' , this._previewIn.get()).first();
        // 进度条
        this._progressBar		= G('.progress_bar' , this._controlIn.get()).first();
        this._progress			= G('.progress' , this._progressBar.get()).first();
        this._curTimePointer	= G('.cur_time_pointer' , this._progressBar.get()).first();
        this._pointer			= G('.pointer' , this._curTimePointer.get()).first();
        this._curTime			= G('.cur_time' , this._progressBar.get()).first();
        this._bufferedTime		= G('.buffered_time' , this._progressBar.get()).first();
        this._userSetTime		= G('.user_set_time' , this._progressBar.get()).first();
        this._totalTime			= G('.total_time' , this._progressBar.get()).first();
        // btn 区域
        this._btnArea			= G('.btn_area' , this._controlIn.get()).first();
        this._left				= G('.left' , this._btnArea.get()).first();
        this._right				= G('.right' , this._btnArea.get()).first();
        // 控制按钮
        this._prevVideo			= G('.prev_video'   , this._left.get()).first();
        this._nextVideo			= G('.next_video'   , this._left.get()).first();
        this._playControl		= G('.play_control'   , this._left.get()).first();
        this._playSvg			= G('.play_svg'   , this._playControl.get()).first();
        this._volumeControl		= G('.volume_control' , this._left.get()).first();
        this._volumePic			= G('.volume_pic' , this._volumeControl.get()).first();
        this._volumeSvg			= G('.volume_svg' , this._volumePic.get()).first();
        this._volumeBar			= G('.volume_bar' , this._volumeControl.get()).first();
        this._volumeBarOut		= G('.volume_bar_out' , this._volumeControl.get()).first();
        this._volumeBarIn		= G('.volume_bar_in' , this._volumeBarOut.get()).first();
        this._curVolume			= G('.cur_volume' , this._volumeBarIn.get()).first();
        this._totalVolume		= G('.total_volume' , this._volumeBarIn.get()).first();
        this._curVolumePointer	= G('.cur_volume_pointer' , this._volumeBarIn.get()).first();
        this._playerSet			= G('.player_set' , this._right.get()).first();
        this._screenSet         = G('.screen_set' , this._right.get()).first();
        // 时间显示
        this._viewTime			= G('.view_time' , this._left.get()).first();
        this._curTimeView		= G('.cur_time' , this._viewTime.get()).first();
        this._totalTimeView		= G('.total_time' , this._viewTime.get()).first();
        // 播放器设置
        this._playerSetCon		= G('.player_set_con' , this._playerCon.get()).first();
        this._menu				= G('.menu' , this._playerCon.get()).first();
        this._menuItem			= G('.item' , this._playerSetCon.get()).first();

        // 播放器设置：速度设置
        this._speedItem			= G('.speed' , this._playerSetCon.get()).first();
        this._curSpeedExplain	= G('.explain' , this._speedItem.get()).first();
        this._playSpeedSet		= G('.play_speed_set' , this._playerSetCon.get()).first();
        this._playSpeedSetHeader = G('.header' , this._playSpeedSet.get()).first();
        this._playSpeedSetItemList = G('.item' , this._playSpeedSet.get());
        this._playSpeedSetItemPicList = G('.speed_pic' , this._playSpeedSet.get());

        // 屏幕操作
        this._screenSetPic				= G('.pic' , this._screenSet.get()).first();

        // 视频加载事件
        this._loading			= G('.loading' , this._SmallPlayer.get()).first();
        this._previewLoading	= G('.loading' , this._previewIn.get()).first();

        // 播放暂停效果
        this._pc				= G('.pc' , this._playerCon.get()).first();
        this._picInPc			= G('.pic' , this._pc.get()).first();

        // 播放失败
        this._playError			= G('.play_error' , this._SmallPlayer.get()).first();

        // 播放器海报
        this._poster			= G('.poster' , this._SmallPlayer.get()).first();

        // 广告相关元素
        this._ad				= G('.ad' , this._SmallPlayer.get()).first();
        this._videoAd			= G('.video_ad' , this._ad.get()).first();
        this._imageAd			= G('.image_ad' , this._ad.get()).first();
        this._screenSetAd		= G('.screen_set' , this._ad.get()).first();
        this._adSet				= G('.ad_set' , this._ad.get()).first();
        this._adSetRight		= G('.right' , this._adSet.get()).first();
        this._timeCountAd		= G('.duration' , this._adSetRight.get()).first();
        this._volumeControlAd	= G('.muted' , this._adSetRight.get()).first();
        this._svgAd				= G('.svg' , this._volumeControlAd.get()).first();
        this._closeAdBtn		= G('.close_ad' , this._adSetRight.get()).first();
        this._adLink			= G('.link' , this._ad.get()).first();

        // 广告标题相关设置
        this._header			= G('.header' , this._SmallPlayer.get()).first();
        this._tit				= G('.tit' , this._header.get()).first();
        this._setScreenSize		= G('.set_screen_size' , this._header.get()).first();
        this._halfVideo			= G('.half' , this._header.get()).first();
        this._twoThirdsVideo	= G('.two-thirds' , this._header.get()).first();
        this._fullVideo			= G('.full' , this._header.get()).first();
        this._rightHeader		= G('.right' , this._header.get()).first();
        this._curTimeHeader		= G('.cur_time' , this._rightHeader.get()).first();
        this._screenSetHeader   = G('.screen_set' , this._rightHeader.get()).first();

        this._run();
    }

    SmallPlayer.prototype = {
        version: '1.0' ,

        cTime: '2016-10-31 16:32:00' ,

        constructor: SmallPlayer ,

        _initHTML: function(){
            // 播放器主体：播放控制 svg
            this._playControlBtn   = VideoPlayBtn(this._playSvg.get() , {
                carTime: 200 ,
                initStatus: this._initStatus
            });

            // 播放器主体：音量控制 svg
            this._volumeControlBtn = VolumeOpr(this._volumeSvg.get());

            // 广告主体：音量控制 svg
            this._volumeControlAdBtn = VolumeOpr(this._svgAd.get());
        } ,

        // 显示播放器主体
        _showPlayerCon: function(){
            this._playerCon.removeClass('hide');
        } ,

        _hidePlayerCon: function(){
            this._playerCon.addClass('hide');
        } ,

        // 设置播放器海报
        _showPoster: function(){
            this._poster.removeClass('hide');
        } ,

        _hidePoster: function(){
            this._poster.addClass('hide');
        } ,

        // 设置播放列表当前视频源
        _setCurPlayerSrc: function(){
            var curItem = this._playList[this._playIdx];
            var vCn = 'video';
            var pCn = 'preview_video';
            var existsV = G('.' + vCn , this._playing.get());
            var existsP = G('.' + pCn , this._playing.get());

            if (existsV.length === 1) {
                this._playing.get().removeChild(existsV.first().get());
            }

            if (existsP.length === 1) {
                this._previewIn.get().removeChild(existsP.first().get());
            }

            // 创建元素
            var t = new Date().getTime();
            var v = document.createElement('video');
            var p = document.createElement('video');

            // 添加元素
            this._playing.get().appendChild(v);
            this._previewIn.get().appendChild(p);

            // 播放视频视频源
            this._video = G(v);

            v.src = curItem['src'] + '?reqTime=' + t;
            v.type = curItem['type'];
            p.src = curItem['src'] + '?reqTime=' + t;

            // 设置视频标题
            this._tit.get().textContent = curItem['title'];

            // 设置默认音量
            this._initVolume = Math.max(0 , Math.min(1 , G.getValType(curItem['initVolume']) !== 'number' ? this._defaultOpt['initVolume'] : curItem['initVolume']));
            this._lastVolume = this._initVolume;

            // 设置默认播放状态
            this._initStatus = G.contain(curItem['initStatus'] , this._statusRange) ? curItem['initStatus'] : this._defaultOpt['initStatus'];

            // 设置默认播放速度
            this._initSpeed = G.contain(curItem['initSpeed'] , this._speedRange) ? curItem['initSpeed'] : this._defaultOpt['initSpeed'] ;

            // 设置默认播放时间
            this._initTime = G.getValType(curItem['initTime']) === 'number' ?  curItem['initTime'] : this._defaultOpt['initTime'];

            // 视频预览
            this._previewVideo = G(p);
            this._defineVideoEvent();

        } ,

        // 定义视频 + 预览视频事件
        _defineVideoEvent: function(){
            // 正常视频
            this._video.loginEvent('loadeddata' , this._videoLoadedData.bind(this), false , false);
            this._video.loginEvent('timeupdate' , this._playingVideo.bind(this) , false , false);
            this._video.loginEvent('ended' , this._playOver.bind(this) , false , false);
            this._video.loginEvent('waiting' , this._videoLoading.bind(this) , false , false);
            this._video.loginEvent('canplay' , this._videoLoadingCompleted.bind(this) , false , false);
            this._video.loginEvent('seeking' , this._videoSeeking.bind(this) , false , false);
            this._video.loginEvent('seeked' , this._videoSeeked.bind(this) , false , false);
            this._video.loginEvent('error' , this._playErrorEvent.bind(this) , false , false);

            // 视频预览
            this._previewVideo.loginEvent('seeking' , this._previewVideoSeeking.bind(this) , false , false);
            this._previewVideo.loginEvent('seeked' , this._previewVideoSeeked.bind(this) , false , false);
        } ,

        // 设置广告html
        _initAdHTML: function(curItem){

            this._adLink.get().href = curItem['link'];
        } ,

        _setCurPlayerAdSrc: function(curItem){

            this._removeAdSrc();

            var curSrc = curItem['src'];

            if (curItem['type'] === 'image') {
                var iCn = 'pic';
                var existsI = G('.' + iCn , this._imageAd.get());

                if (existsI.length === 1) {
                    this._imageAd.get().removeChild(existsI.first().get());
                }


                var t = new Date().getTime();
                var i = document.createElement('img');

                i.className = iCn;
                i.src = curSrc + '?reqTime=' + t;


                this._imageAd.get().appendChild(i);

                this._picInImageAd = G(i);

            }

            if (curItem['type'] === 'video') {
                var vCn = 'video';
                var existsV = G('.' + vCn , this._videoAd.get());

                if (existsV.length === 1) {
                    this._videoAd.get().removeChild(existsV.first().get());
                }


                var t = new Date().getTime();
                var v = document.createElement('video');

                v.src = curSrc + '?reqTime=' + t;
                v.className = vCn;
                v.autoplay = true;
                v.type = curItem['type'];

                this._videoAd.get().appendChild(v);

                this._videoInVideoAd = G(v);
            }

        } ,

        // 获取广告总时长
        _getAdDuration: function(){
            var d = 0;
            var i = 0;
            var curItem = null;

            for (; i < this._advertisement.length; ++i)
            {
                curItem = this._advertisement[i];

                if (curItem['duration'] === undefined) {
                    d += this._defaultAdDuration;
                } else {
                    d += curItem['duration'];
                }
            }

            return d;
        } ,

        // 移除广告相关播放元素（防止广告倒计时已结束，但是却还在播放）
        _removeAdSrc: function(){
            var iCn = 'pic';
            var vCn = 'video';
            var existsI = G('.' + iCn , this._imageAd.get());
            var existsV = G('.' + vCn , this._videoAd.get());

            // 移除图片广告源
            if (existsI.length === 1) {
                this._imageAd.get().removeChild(existsI.first().get());
            }

            // 移除视频广告源
            if (existsV.length === 1) {
                this._videoAd.get().removeChild(existsV.first().get());
            }
        } ,

        // 获取当前播放的视频广告
        _getCurVideoAd: function(){
            var v = G('.video' , this._videoAd.get());

            return v.length === 0 ? false : v.first().get();
        } ,

        // 获取当前播放的音频广告
        _getCurPicAd: function(){
            var i = G('.pic' , this._imageAd.get());

            return i.length === 0 ? false : i.first().get();
        } ,

        // 广告静音
        _mutedAdClick: function(){

            var v = this._getCurVideoAd();

            var isMuted = this._volumeControlAd.get().getAttribute('data-isMuted') === 'true' ? true : false;

            //console.log(v.muted);
            if (v && !isMuted) {
                v.volume = 0;
                this._volumeControlAd.get().setAttribute('data-isMuted' , 'true');
                this._volumeControlAdBtn.muteVolume();
            }

            if (v && isMuted) {
                v.volume = 1;
                this._volumeControlAd.get().setAttribute('data-isMuted' , 'false');
                this._volumeControlAdBtn.highVolume();
            }

        } ,

        // 关闭广告按钮点击事件
        _closeAdBtnClick: function(){
            if (this._isDebug) {
                this.closeAd();
                this._play();
            } else {
                if (G.getValType(this._closeAdBtnEvent) === 'function') {
                    this._closeAdBtnEvent();
                } else {
                    console.log('未定义关闭广告回调事件');
                }
            }
        } ,

        // 定义广告相关事件
        _defineAdEvent: function(){
            this._volumeControlAd.loginEvent('click' , this._mutedAdClick.bind(this) , false , false);
            this._screenSetAd.loginEvent('click' , this._screenSetClick.bind(this) , false , false);
            this._closeAdBtn.loginEvent('click' , this._closeAdBtnClick.bind(this) , false , false);
            this._adLink.loginEvent('click' , this._normalScreen.bind(this) , false , false);
        } ,

        // 播放视频
        _playVideo: function(){
            if (this._initStatus === 'play') {
                this._video.get().play();
            } else {
                this._video.get().pause();
            }
        } ,

        // 正式开始播放视频
        _play: function(){
            this._setCurPlayerSrc();
            this._showPlayerCon();
            this._initDynamic();
            this._defineEvent();
            this._hideVideoLoading();
            this._hidePoster();

            this._playVideo();
        } ,

        // 显示播放主体
        _showAd: function(){
            this._ad.removeClass('hide');
        } ,
        // 隐藏播放主体
        _hideAd: function(){
            this._ad.addClass('hide');
        } ,

        // 播放广告
        _playAd: function(){
            //console.log('play_ad');
            //this._play();
            //throw 1;
            //return ;
            //console.log(this._advertisement);
            //console.log('播放广告列表....');
            if (this._advertisement.length === 0) {
                throw Error('广告列表不能为空!');
            }

            this._hideVideoLoading();
            this._hidePoster();
            this._showAd();

            //console.log('loading');

            var self = this;
            var sTime = 0;
            var duration = this._getAdDuration();
            var curItem = self._advertisement.shift();

            this._setCurPlayerAdSrc(curItem);
            this._initAdHTML(curItem);

            if (curItem['type'] === 'image') {
                this._switchAdCon('image');
                this._picInImageAd.get().src = curItem['src'];
            }

            if (curItem['type'] === 'video') {
                this._switchAdCon('video');
                this._videoInVideoAd.get().src = curItem['src'];
            }

            var playAd = function(){
                sTime += 1;


                // 继续播放下一个广告
                if (sTime > curItem['duration']) {
                    // 广告播放完毕时
                    if (self._advertisement.length === 0) {
                        return ;
                    }

                    curItem = self._advertisement.shift();

                    if (curItem['type'] === 'image') {
                        console.log('图片类型');
                        self._setCurPlayerAdSrc(curItem);
                        self._switchAdCon('image');
                        self._picInImageAd.get().src = curItem['src'];
                    }

                    if (curItem['type'] === 'video') {
                        self._setCurPlayerAdSrc(curItem);
                        self._switchAdCon('video');
                        self._videoInVideoAd.get().src = curItem['src'];
                    }

                    sTime = 1;
                    self._initAdHTML(curItem);

                    //console.log(self._advertisement.length);
                }

                if (!self._isCloseAd) {
                    window.setTimeout(playAd , 1000);
                }
            };

            playAd();

            G.timeCount(duration , 1 , function(time){
                //console.log('计时..');
                self._timeCountAd.get().textContent = time;

                if (time < 0) {
                    self.closeAd();
                    self._play();
                }
            });
        } ,

        // 关闭广告
        closeAd: function(){
            console.log('关闭广告');
            window.clearTimeout(G.timeCountTimer);
            this._isCloseAd = true;

            this._removeAdSrc();
            this._hideAd();
        } ,

        // 内容区切换
        _switchAdCon: function(type){
            var typeRange = ['image' , 'video'];

            if (!G.contain(type , typeRange)) {
                throw new RangeError('不支持的广告类型，当前受支持的广告类型有： ' + typeRange.join(' '));
            }

            if (type === 'image') {
                this._videoAd.addClass('hide');
                this._imageAd.removeClass('hide');
            }

            if (type === 'video') {
                this._videoAd.removeClass('hide');
                this._imageAd.addClass('hide');
            }

        } ,


        _initStatic: function(){
            var self = this;

            // 播放器海报
            this._isTriggeredVideoLoadedEvent  = false;
            this._isTriggeredPosterLoadedEvent  = false;
            this._posterLoadedTime			   = 300;
            this._posterLoadedTimer			   = null;

            // 控制面板事件
            this._pannelTimer			= null;
            this._controlPannelShowTime			= 15 * 1000;
            this._controlPannelStartOpacity		= parseFloat(this._control.getStyleVal('opacity'));
            this._controlPannelEndOpacity		= 1;
            this._isShowControlPannel			= false;

            // 滚动条设置
            this._canSetCurTime					= false;
            this._canSetUserTime				= false;

            // 音频控制
            this._canAdjustVolume				= false;
            this._isMuted						= false;
            // 两者之间的是 中
            this._highVolume					= 0.55;
            this._mutedVolume					= 0;
            this._lastVolume					= 1;

            // 屏幕操作
            this._isFullScreen					= false;
            this._waitingScreenSetTimer			= null;
            this._waitingScreenSetTime			= 300;

            // 播放控制
            this._videoStepOne = 5;
            this._videoStepTwo = 30;
            this._volumeStep = 0.01;
            this._isClick = true;
            this._playControlTimer = null;
            this._canAjustProgress = true;

            /*** 初始化操作 ***/


            // 播放器设置
            this._playerSetConStartOpacity = parseFloat(this._playerSetCon.getStyleVal('opacity'));
            this._playerSetConEndOpacity   = 1;

            // 视频出错后
            this._isError            = false;
            this._videoLoadingFailed = new VedioLoadingFailed(this._playError.get());
            this._videoLoadingFailed.imageSrc = this._resourceDir + '/bg.png';

            // 按钮设置
            this._canAdjustProgress = true;

            // 播放 || 暂停效果
            this._playIcoSrc  = this._resourceDir + '/play.png';
            this._pauseIcoSrc = this._resourceDir + '/pause.png';

            // 全屏 || 退出全屏
            this._requestFullScreenPicSrc	= this._resourceDir + '/requestFullScreen.png';
            this._exitFullScreenPicSrc		= this._resourceDir + '/exitFullScreen.png';

            // 广告相关参数
            this._isCloseAd = false;

            //console.log(this._curTimeHeader);
            // 显示当前时间
            G.showClock(function(data){
                self._curTimeHeader.get().textContent = data;
            });

            /*
             * 按钮悬浮提示
                var top = 25;
                var height = 30;

                ViewTip(this._prevVideo.get() , {
                    text: '上一个' ,
                    topDistance: top ,
                    height: height ,
                    carTime: this._carTime
                });

                ViewTip(this._playControl.get() , {
                    text: '播放 | 暂停' ,
                    topDistance: top ,
                    height: height ,
                    carTime: this._carTime
                });

                ViewTip(this._playerSet.get() , {
                    text: '设置' ,
                    topDistance: top ,
                    height: height ,
                    carTime: this._carTime
                });
            */

        } ,

        _initDynamic: function(){
            //console.log('调用中....initDynamic');
            this._progress.eleCenter(this._progressBar.get() , 'all');

            this._pointer.eleCenter(this._curTimePointer.get() , 'all');

            // 容器元素尺寸
            var con                     = G(this._con);
            this._conW					= con.getEleW('content-box');
            this._conH					= con.getEleH('content-box');

            // 进度条动画效果相关参数
            this._progressBarH			= this._progressBar.getEleH('content-box');
            this._progressStartH		= this._isFullScreen ? 5 : 3;;
            this._progressEndH			= this._isFullScreen ? 8 : 5;
            this._progressStartTopVal	= this._progress.getCoordVal('top');
            this._progressEndTopVal		= Math.min(this._progressBarH - this._progressEndH , Math.max(0 , this._progressStartTopVal - Math.abs(this._progressEndH - this._progressStartH)));
            this._progressStartOpacity	= parseFloat(this._progress.getStyleVal('opacity'));
            this._progressEndOpacity	= 1;

            this._progress.css({
                height: this._progressStartH + 'px'
            });

            // 当前时间指针
            this._curTimePointerW		= this._curTimePointer.getEleW('border-box');
            this._curTimePointerH		= this._curTimePointer.getEleW('border-box');
            this._pointerW				= this._curTimePointerW;
            this._pointerH				= this._curTimePointerH;
            this._pointerStartW			= 0;
            this._pointerEndW			= this._pointerW;
            this._pointerStartH			= 0;
            this._pointerEndH			= this._pointerH;
            this._pointerStartTopVal	= this._pointer.getCoordVal('top');
            this._pointerEndTopVal		= 0
            this._pointerStartLeftVal	= this._pointer.getCoordVal('left');
            this._pointerEndLeftVal		= 0;

            // 用户设置时间
            this._progressW					= this._progress.getEleW('content-box');
            this._progressH					= this._progress.getEleH('content-box');
            this._progressLXRange			= this._progress.getWindowOffsetVal('left');
            this._progressTYRange			= this._progress.getWindowOffsetVal('top');
            this._progressRXRange			= this._progressLXRange + this._progressW;
            this._progressBYRange			= this._progressTYRange + this._progressH;
            this._userSetTimeStartOpacity   = parseFloat(this._userSetTime.getStyleVal('opacity'));
            this._userSetTimeEndOpacity		= 0.6;

            // 跳帧操作
            this._curTimePointerW				= this._curTimePointer.getEleW('border-box');
            this._curTimePointerMinLeftVal		= -(this._curTimePointerW / 2);
            this._curTimePointerMaxLeftVal		= this._progressW - (this._curTimePointerW / 2);
            this._progressBarW					= this._progressBar.getEleW('border-box');

            this._progressBarTYRange			= this._progressBar.getWindowOffsetVal('top');
            this._progressBarLXRange			= this._progressBar.getWindowOffsetVal('left');
            this._progressBarBYRange			= this._progressBarTYRange + this._progressBarH;
            this._progressBarRXRange			= this._progressBarLXRange + this._progressBarW;
            this._progressBarMinLeftVal			= -(this._curTimePointerW / 2);
            this._progressBarMaxLeftVal			=  this._progressBarMinLeftVal + this._progressBarW

            // 视频预览操作
            this._previewInStartBtmVal			=  -(this._progressEndH - this._progressStartH);
            this._previewInEndBtmVal			= 0;
            this._previewInStartOpacity			= 0;
            this._previewInEndOpacity			= this._progressEndOpacity;
            this._previewW						= this._progressBarW;
            this._previewInW					= this._previewIn.getEleW('border-box');
            this._previewInH					= this._previewIn.getEleH('border-box');
            this._previewInCW					= this._previewIn.getEleW('content-box');
            this._previewInCH					= this._previewIn.getEleH('content-box');
            this._baseVal						= this._previewInCW;
            this._previewInMinLeftVal			= 0
            this._previewInMaxLeftVal			= this._previewW - this._previewInW;

            this._preview.addClass('hide');
            this._previewIn.css({
                bottom:  this._previewInStartBtmVal + 'px' ,
                opacity: this._previewInStartOpacity
            });

            // 音频控制
            this._controlW						= this._control.getEleW('border-box');
            this._controlH						= this._control.getEleH('border-box');
            this._controlLXRange				= this._control.getWindowOffsetVal('left');
            this._controlRXRange				= this._control.getWindowOffsetVal('left') + this._controlW;
            this._controlTYRange				= this._control.getWindowOffsetVal('top');
            this._controlBYRange				= this._control.getWindowOffsetVal('top') + this._controlH;
            this._volumeBarWindowLeftVal		= this._volumeBar.getWindowOffsetVal('left');
            this._volumeBarInW					= this._volumeBarIn.getEleW('border-box');
            this._curVolumePointerW				= this._curVolumePointer.getEleW('border-box');

            this._curVolumePointerMinLeftVal	= 0;
            this._curVolumePointerMaxLeftVal    = this._volumeBarInW - this._curVolumePointerW;
            this._volumeBarStartW				= 0;
            this._volumeBarEndW					= this._volumeBarInW;
            this._volumeControlLXRange          = this._controlLXRange
            this._volumeControlRXRange          = this._controlRXRange
            this._volumeControlTYRange          = this._controlTYRange
            this._volumeControlBYRange          = this._controlBYRange
            this._totalVolumeW					= this._totalVolume.getEleW('border-box');
            this._totalVolumeH					= this._totalVolume.getEleH('border-box');
            this._totalVolumeTopVal				= this._totalVolume.getCoordVal('top');

            this._totalVolumeLXRange			= this._totalVolume.getWindowOffsetVal('left');
            this._totalVolumeTYRange		    = this._totalVolume.getWindowOffsetVal('top');
            this._totalVolumeRXRange			= this._totalVolumeLXRange + this._totalVolumeW;
            this._totalVolumeBYRange			= this._totalVolumeTYRange + this._totalVolumeTopVal + this._totalVolumeH;

            // 初始化音频音量
            this._setEndVolume(this._lastVolume);

            // 视频设置

            // 屏幕设置
            this._SmallPlayerW			= this._SmallPlayer.getEleW('border-box');
            this._SmallPlayerH			= this._SmallPlayer.getEleH('border-box');
            this._SmallPlayerLXRange	= this._SmallPlayer.getWindowOffsetVal('left');
            this._SmallPlayerTYRange	= this._SmallPlayer.getWindowOffsetVal('top');
            this._SmallPlayerRXRange	= this._SmallPlayerLXRange + this._SmallPlayerW;
            this._SmallPlayerBYRange	= this._SmallPlayerTYRange + this._SmallPlayerH;

            this._dblClickLXRange		= this._SmallPlayerLXRange;
            this._dblClickRXRange		= this._SmallPlayerRXRange;
            this._dblClickTYRange		= this._SmallPlayerTYRange;
            this._dblClickBYRange		= this._SmallPlayerBYRange - this._controlH;

            // 播放器设置：设置主体DOM位置
            this._playSpeedSet.removeClass('hide');
            this._playerSetCon.removeClass('hide');

            this._playerSetConW			= this._playerSetCon.getEleW('border-box');
            this._playerSetConH			= this._playerSetCon.getEleH('border-box');

            this._playerSetCon.css({
                bottom: this._controlH + 10 + 'px'
            });

            // 播放器设置：设置速度控制界面
            this._menuW = this._menu.getEleW('border-box');
            this._menuH = this._menu.getEleH('border-box');
            this._playSpeedSetW	= this._playSpeedSet.getEleW('border-box');
            this._playSpeedSetH = this._playSpeedSet.getEleH('border-box');
            this._playSpeedSet.addClass('hide');
            this._playerSetCon.addClass('hide');

            // 视频出错时
            if (this._isError) {
                this._videoLoadingFailed.resize();
            }

            // 播放暂停效果
            this._pcStartW	= 20;
            this._pcStartH  = 20;
            this._pcStartOpacity = 0;
            this._pcMiddleW = 80;
            this._pcMiddleH = 80;
            this._pcMiddleOpacity = 0.6;
            this._pcEndW    = 0;
            this._pcEndH	= 0;
            this._pcEndOpacity = 0;

            this._pcStartToMiddleEndLeftVal = (this._SmallPlayerW - this._pcMiddleW) / 2;
            this._pcMiddleToEndEndLeftVal = (this._SmallPlayerW - this._pcEndW) / 2;
            this._pcStartToMiddleEndTopVal = (this._SmallPlayerH - this._pcMiddleH) / 2;
            this._pcMiddleToEndEndTopVal = (this._SmallPlayerH - this._pcEndH) / 2;

            this._pc.css({
                width: this._pcStartW + 'px' ,
                height: this._pcStartH + 'px' ,
                lineHeight: this._pcStartH + 'px' ,
                opacity: this._pcStartOpacity
            });

            this._pc.eleCenter(this._playerCon.get() , 'all');
            this._pc.addClass('hide');

            // 视频播放器设置
            this._playingW = this._SmallPlayerW;
            this._playingH = this._SmallPlayerH;
            this._playing.css({
                lineHeight: this._playingH + 'px'
            });
        } ,

        // 获取当前鼠标指针x坐标所在位置 在整个进度条容器内的 left 值
        _getXOccupyProgressLeftVal: function(x){
            return Math.max(0 , Math.min(this._progressLXRange + this._progressW , x - this._progressLXRange));
        } ,

        _progressMouseOver: function(event){
            var e			= event || window.event;
            var progressCurH		= this._progress.getEleH('border-box');
            var progressEndH		= this._progressEndH;
            var progressCurTopVal	= this._progress.getCoordVal('top');
            var progressEndTopVal	= this._progressEndTopVal;
            var progressCurOpacity	= parseFloat(this._progress.getStyleVal('opacity'));
            var progressEndOpacity	= this._progressEndOpacity;
            var pointerCurW         = this._pointer.getEleW('border-box');
            var pointerEndW         = this._pointerEndW;
            var pointerCurH			= this._pointer.getEleH('border-box');
            var pointerEndH			= this._pointerEndW;
            var pointerCurTopVal    = this._pointer.getCoordVal('top');
            var pointerEndTopVal	= this._pointerEndTopVal;
            var pointerCurLeftVal   = this._pointer.getCoordVal('left');
            var pointerEndLeftVal	= this._pointerEndLeftVal;

            var userSetTimeCurOpacity   = parseFloat(this._userSetTime.getStyleVal('opacity'));
            var userSetTimeEndOpacity   = this._userSetTimeEndOpacity;

            // 用户设置设置
            this._canSetUserTime	= true;
            var curX				= e.clientX;
            var offsetX				= curX - this._progressLXRange;
            var ratio				= Math.max(0 , Math.min(1 , offsetX / this._progressW)) * 100 + '%';

            // 视频预览
            this._preview.removeClass('hide');

            var previewInCurBtmVal	= this._previewIn.getCoordVal('bottom');
            var previewInCurOpacity = parseFloat(this._previewIn.getStyleVal('opacity'));
            var previewInEndLeftVal   = Math.max(this._previewInMinLeftVal , Math.min(this._previewInMaxLeftVal , this._getXOccupyProgressLeftVal(curX) - this._previewInW / 2));

            this._userSetTime.css({
                width: ratio
            });

            this._previewIn.css({
                left: previewInEndLeftVal + 'px'
            });

            this._progressBar.css({
                cursor: 'pointer'
            });

            this._progress.animate({
                carTime: this._carTime ,
                json: [
                    {
                        attr: 'height' ,
                        sVal: progressCurH ,
                        eVal: progressEndH
                    } ,
                    {
                        attr: 'top' ,
                        sVal: progressCurTopVal ,
                        eVal: progressEndTopVal
                    } ,
                    {
                        attr: 'opacity' ,
                        sVal: progressCurOpacity ,
                        eVal: progressEndOpacity
                    }
                ]
            });

            this._pointer.animate({
                carTime: this._carTime ,
                json: [
                    {
                        attr: 'width' ,
                        sVal: pointerCurW ,
                        eVal: pointerEndW
                    } ,
                    {
                        attr: 'height' ,
                        sVal: pointerCurH ,
                        eVal: pointerEndH
                    } ,
                    {
                        attr: 'top' ,
                        sVal: pointerCurTopVal ,
                        eVal: pointerEndTopVal
                    } ,
                    {
                        attr: 'left' ,
                        sVal: pointerCurLeftVal ,
                        eVal: pointerEndLeftVal
                    }
                ]
            });

            this._userSetTime.animate({
                carTime: this._carTime ,
                json: [
                    {
                        attr: 'opacity' ,
                        sVal: userSetTimeCurOpacity ,
                        eVal: userSetTimeEndOpacity
                    }
                ]
            });

            this._previewIn.animate({
                carTime: this._carTime ,
                json: [
                    {
                        attr: 'bottom' ,
                        sVal: previewInCurBtmVal ,
                        eVal: this._previewInEndBtmVal
                    } ,
                    {
                        attr: 'opacity' ,
                        sVal: previewInCurOpacity ,
                        eVal: this._previewInEndOpacity
                    }
                ]
            });
        } ,

        _progressMouseOut: function(event){
            var e = event || window.event;
            e.stopPropagation();
        } ,

        // 根据当前视频控制点相对他最近的已定位祖先元素的 left值（实际上等价于宽度） 计算出视频进度条占比
        _getProgressRatio: function(w){
            return Math.max(0 , Math.min(1 , w / this._progressBarW));
        } ,

        // 根据当前音频控制点相对他最近的已定位祖先元素的 left值（实际上等价于宽度） 计算出音频进度条占比
        _getVolumeRatio: function(w){
            return Math.max(0 , Math.min(1 , w / this._totalVolumeW));
        } ,

        _progressBarMouseOver: function(){
            if (this._canSetUserTime) {
                var e		= event || window.event;
                var curX	= e.clientX;
                var offsetX	= curX - this._progressLXRange;
                var vRatio	= this._getProgressRatio(offsetX);

                this._setUserSetTime(vRatio);
                this._setPreview(vRatio , curX);
            }
        } ,

        _progressBarMouseMove: function(event){
            if (this._canSetUserTime) {
                var e		= event || window.event;
                var curX	= e.clientX;
                var offsetX	= curX - this._progressLXRange;
                var vRatio	= this._getProgressRatio(offsetX);

                this._setUserSetTime(vRatio);
                this._setPreview(vRatio , curX);
            }
        } ,

        _progressBarClick: function(event){
            var e		  = event || window.event;
            var curX	  = e.clientX;
            var offsetX   = curX - this._progressLXRange;
            var vRatio	  = this._getProgressRatio(offsetX);
            var totalTime = this._videoDuration;
            var curTime	  = totalTime * vRatio;

            this._setEndTime(curTime);
            this._setPreview(vRatio , curX);
        } ,

        // 设置最终播放时间
        _setEndTime: function(curTime){
            var vRatio    = Math.max(0 , Math.min(1 , curTime / this._videoDuration));
            var buf		  = this._videoBuffered;
            var bufLen	  = buf.end(buf.length - 1) - buf.start(buf.length - 1);
            var bufRatio  = Math.max(0 , Math.min(1 , vRatio + bufLen / this._videoDuration));

            this._setCurTimePointer(vRatio);
            this._setCurTime(curTime);
            this._setCurTimeStyle(vRatio);
            this._setBufTime(bufRatio);
            this._setTimeExplain();
        } ,

        _progressBarMouseOut: function(){
            //console.log('mouse out' , this._canSetCurTime);
            if (this._canSetCurTime) {
                return ;
            }

            var self = this;
            this._canSetUserTime	= false;

            var progressCurH		= this._progress.getEleH('border-box');
            var progressEndH		= this._progressStartH;
            var progressCurTopVal	= this._progress.getCoordVal('top');
            var progressEndTopVal	= this._progressStartTopVal;
            var progressCurOpacity	= parseFloat(this._progress.getStyleVal('opacity'));
            var progressEndOpacity	= this._progressStartOpacity;

            var pointerCurW         = this._pointer.getEleW('border-box');
            var pointerEndW         = this._pointerStartW;
            var pointerCurH			= this._pointer.getEleH('border-box');
            var pointerEndH			= this._pointerStartW;
            var pointerCurTopVal    = this._pointer.getCoordVal('top');
            var pointerEndTopVal	= this._pointerStartTopVal;
            var pointerCurLeftVal   = this._pointer.getCoordVal('left');
            var pointerEndLeftVal	= this._pointerStartLeftVal;

            // 显示用户设置时间
            var userSetTimeCurOpacity   = parseFloat(this._userSetTime.getStyleVal('opacity'));
            var userSetTimeEndOpacity   = this._userSetTimeStartOpacity;

            // 视频预览

            var previewInCurBtmVal	= this._previewIn.getCoordVal('bottom');
            var previewInCurOpacity = parseFloat(this._previewIn.getStyleVal('opacity'));

            // 恢复指针外观
            this._progressBar.css({
                cursor: 'default'
            });

            // 显示进度条
            this._progress.animate({
                carTime: this._carTime ,
                json: [
                    {
                        attr: 'height' ,
                        sVal: progressCurH ,
                        eVal: progressEndH
                    } ,
                    {
                        attr: 'top' ,
                        sVal: progressCurTopVal ,
                        eVal: progressEndTopVal
                    } ,
                    {
                        attr: 'opacity' ,
                        sVal: progressCurOpacity ,
                        eVal: progressEndOpacity
                    }
                ]
            });

            // 显示当前时间戳
            this._pointer.animate({
                carTime: this._carTime ,
                json: [
                    {
                        attr: 'width' ,
                        sVal: pointerCurW ,
                        eVal: pointerEndW
                    } ,
                    {
                        attr: 'height' ,
                        sVal: pointerCurH ,
                        eVal: pointerEndH
                    } ,
                    {
                        attr: 'top' ,
                        sVal: pointerCurTopVal ,
                        eVal: pointerEndTopVal
                    } ,
                    {
                        attr: 'left' ,
                        sVal: pointerCurLeftVal ,
                        eVal: pointerEndLeftVal
                    }
                ]
            });

            this._userSetTime.animate({
                carTime: this._carTime ,
                json: [
                    {
                        attr: 'opacity' ,
                        sVal: userSetTimeCurOpacity ,
                        eVal: userSetTimeEndOpacity
                    }
                ]
            });

            this._previewIn.animate({
                carTime: this._carTime ,
                json: [
                    {
                        attr: 'bottom' ,
                        sVal: previewInCurBtmVal ,
                        eVal: this._previewInStartBtmVal
                    } ,
                    {
                        attr: 'opacity' ,
                        sVal: previewInCurOpacity ,
                        eVal: this._previewInStartOpacity
                    }
                ] ,
                fn: function(){
                    self._preview.addClass('hide');
                }
            });
        } ,

        _curTimePointerMouseDown: function(event){
            var e									= event || window.event;
            var curX								= e.clientX;
            var vRatio   = 0;
            var vLen	 = curX - this._progressLXRange;
            var vRatio   = this._getProgressRatio(vLen);
            var curTime  = this._videoDuration * vRatio;
            var buf      = this._videoBuffered;
            var bufLen   = buf.end(buf.length - 1) - buf.start(buf.length - 1);
            var bufRatio = Math.max(0 , Math.min(vRatio + bufLen / this._videoDuration));

            this._canSetCurTime = true;
            this._canAjustProgress = false;
            this._isShowControlPannel = true;

            this._setCurTime(curTime);
            this._setCurTimePointer(vRatio);
            this._setCurTimeStyle(vRatio);
            this._setBufTime(bufRatio);
            this._setPreview(vRatio , curX);
            this._setTimeExplain();

        } ,

        _curTimePointerMouseOut: function(event){
            var e = event || window.event;
            var curX = e.clientX;
            var curY = e.clientY;

            this._canSetCurTime = false;
            this._canAjustProgress = true;
            this._isShowControlPannel = false;
            // 准确判断鼠标是否已离开操作区域
            if (curX > this._progressBarRXRange || curX < this._progressBarLXRange || curY > this._progressBarBYRange || curY < this._progressBarTYRange) {
                this._progressBarMouseOut();
            }
        } ,

        _curTimePointerMouseMove: function(event){
            var e						 = event || window.event;
            var curX					 = e.clientX;
            var curY					 = e.clientY;

            if (this._canSetCurTime) {
                e.preventDefault();

                var vRatio   = 0;
                var vLen	 = curX - this._progressLXRange;
                var vRatio   = this._getProgressRatio(vLen);
                var curTime  = this._videoDuration * vRatio;
                var buf      = this._videoBuffered;
                var bufLen   = buf.end(buf.length - 1) - buf.start(buf.length - 1);
                var bufRatio = Math.max(0 , Math.min(vRatio + bufLen / this._videoDuration));

                this._setCurTime(curTime);
                this._setCurTimePointer(vRatio);
                this._setCurTimeStyle(vRatio);
                this._setBufTime(bufRatio);
                this._setPreview(vRatio , curX);
                this._setTimeExplain();
            }

            // 准确判断鼠标是否已离开操作区域
            if (curX > this._progressBarRXRange || curX < this._progressBarLXRange || curY > this._progressBarBYRange || curY < this._progressBarTYRange) {
                this._progressBarMouseOut();
            }
        } ,

        // 音量图标动画
        _setVolumePic: function(curVolume){
            var curVolume = Math.max(0 , Math.min(1 , curVolume));

            if (curVolume >= this._highVolume) {

                this._volumeControlBtn.highVolume();

            } else if (curVolume === this._mutedVolume) {

                this._volumeControlBtn.muteVolume();

            } else {
                if (this._lastVolume - curVolume >= 0) {

                    this._volumeControlBtn.middleVolumeLower();

                } else {

                    this._volumeControlBtn.middleVolumeUpper();

                }
            }
        } ,

        _setCurVolume: function(volume){
            //console.log(volume);
            this._video.get().volume		= volume;
        } ,

        _setCurVolumeStyle: function(ratio){
            this._curVolume.css({
                width: ratio * this._totalVolumeW + 'px'
            });
        } ,

        _setCurVolumePointer: function(endLeftVal){
            this._curVolumePointer.css({
                left: endLeftVal + 'px'
            });
        } ,

        _curVolumePointerMouseDown: function(event){
            var e = event || window.event;
            var curX = e.clientX;
            var curY = e.clientY;

            if (curX >= this._volumeControlLXRange && curX <= this._volumeControlRXRange) {
                var e							= event || window.event;
                this._canAdjustVolume			= true;
                this._moveCurVolumePointerSx	= curX;
                this._moveCurVolumePointerLeftVal = this._curVolumePointer.getCoordVal('left');
            }
        } ,

        _curVolumePointerMouseMove: function(event){

            if (this._canAdjustVolume) {
                var e = event || window.event;

                e.preventDefault();

                this._moveCurVolumePointerEx = e.clientX;
                var offsetX = this._moveCurVolumePointerEx - this._moveCurVolumePointerSx
                var curVolumeW = this._moveCurVolumePointerLeftVal + offsetX;
                var ratio		= this._getVolumeRatio(curVolumeW);

                this._setEndVolume(ratio);
            }
        } ,

        _curVolumePointerMouseUp: function(){
            this._canAdjustVolume			= false;
        } ,

        _volumeBarInClick: function(event){
            var e	= event || window.event;
            var curX = e.clientX;

            // 判断有效区域
            if (curX >= this._totalVolumeLXRange && curX <= this._totalVolumeRXRange) {
                var curVolumeW = curX - this._totalVolumeLXRange;
                var ratio = this._getVolumeRatio(curVolumeW);

                this._setEndVolume(ratio);
            }
        } ,

        // 设置最终音量
        _setEndVolume: function(ratio){
            var ratio      = Math.max(0 , Math.min(1 , ratio));
            var curVolumeW = Math.max(0 , Math.min(this._totalVolumeW , this._totalVolumeW * ratio));
            var endLeftVal = Math.max(this._curVolumePointerMinLeftVal , Math.min(this._curVolumePointerMaxLeftVal , curVolumeW));

            //console.log(ratio);
            this._setVolumePic(ratio);
            this._setCurVolumePointer(endLeftVal);
            this._setCurVolume(ratio);
            this._setCurVolumeStyle(ratio);

            this._lastVolume				= ratio;
        } ,

        _volumeBarInWheel: function(event){
            var e = event || window.event;
            var curVolumeW = this._curVolume.getEleW('border-box');
            var step = 1;
            var ratio = 0;
            var endleft = 0;

            if (e.deltaY > 0) {
                curVolumeW = Math.max(0 , Math.min(this._totalVolumeW , curVolumeW + step));
            } else {
                curVolumeW = Math.max(0 , Math.min(this._totalVolumeW , curVolumeW - step));
            }

            ratio  = this._getVolumeRatio(curVolumeW)
            this._setEndVolume(ratio);
            this._showVolumeBar();
        } ,

        _playerConWheel: function(event){
            this._volumeBarInWheel(event);
        } ,

        _hideVolumeBar: function(){
            var volumeBarCurW = this._volumeBar.getEleW('border-box');
            var volumeBarEndW = this._volumeBarStartW;

            this._volumeBar.animate({
                carTime: this._carTime ,
                json: [
                    {
                        attr: 'width' ,
                        sVal: volumeBarCurW ,
                        eVal: volumeBarEndW
                    }
                ]
            });
        } ,

        _showVolumeBar: function(){
            var volumeBarCurW = this._volumeBar.getEleW('border-box');
            var volumeBarEndW = this._volumeBarEndW;

            this._volumeBar.animate({
                carTime: this._carTime ,
                json: [
                    {
                        attr: 'width' ,
                        sVal: volumeBarCurW ,
                        eVal: volumeBarEndW
                    }
                ]
            });
        } ,

        _volumeControlMouseOver: function(){
            this._showVolumeBar();
        } ,

        _volumeControlMouseOut: function(event){
            if (this._canAdjustVolume) {
                return ;
            }

            var e = event || window.event;
            var curX = e.clientX;
            var curY = e.clientY;

            // 判断是否超出范围
            if (curX < this._volmeControlLXRange || curX > this._volumeControlRXRange || curY < this._volumeControlTYRange || curY > this._volumeControlBYRange) {
                this._hideVolumeBar();
            }
        } ,

        _volumePicClick: function(){

            if (this._tempLastVolume === undefined) {
                this._tempLastVolume = this._lastVolume;
            }

            var ratio		= Math.max(0 , Math.min(1 , this._video.get().volume));

            if (ratio === 0) {
                this._setCurVolume(this._tempLastVolume);

                this._tempLastVolume     = undefined;
            } else {
                this._setCurVolume(this._mutedVolume);
            }

            ratio			= Math.max(0 , Math.min(1 , this._video.get().volume));
            var curVolumeW	= ratio * this._totalVolumeW;
            var endLeftVal	= curVolumeW;

            this._setVolumePic(ratio);
            this._setCurVolumePointer(endLeftVal);
            this._setCurVolumeStyle(ratio);

            this._lastVolume = ratio;

        } ,

        // 相关元素自动设置为缩小后位置
        _adaptation: function(){
            var curTime = this._video.get().currentTime;
            var vRatio  = Math.max(0 , Math.min(1 , curTime / this._videoDuration));
            var volumeRatio = this._video.get().volume;
            var curVolumeW	= volumeRatio * this._totalVolumeW;
            var endLeftVal	= curVolumeW;

            // 进度条
            this._setCurTimePointer(vRatio);

            // 音频
            this._setCurVolumePointer(endLeftVal);
            this._setCurVolumeStyle(volumeRatio);
        } ,

        _setFullScreenStyle: function(){
            this._control.removeClass('control_normal');
        } ,

        _setNormalScreenStyle: function(){
            this._control.addClass('control_normal');
        } ,

        _fullScreen: function(){
            var self = this;
            this._SmallPlayer.requestFullScreen();

            this._screenSetPic.get().src = self._exitFullScreenPicSrc + '?reqTime=' + new Date().getTime();

            window.clearTimeout(this._waitingScreenSetTimer);

            this._setFullScreenStyle();
            this._titFullSet();
            this.waitingScreenSetTimer = window.setTimeout(function(){
                self._isFullScreen = true;
                self._initDynamic();
                self._adaptation();
                self._setVideoSize('full');
            } , this._waitingScreenSetTime);
        } ,

        _normalScreen: function(){
            var self = this;
            this._SmallPlayer.exitFullScreen();

            this._screenSetPic.get().src = self._requestFullScreenPicSrc + '?reqTime=' + new Date().getTime();

            window.clearTimeout(this._waitingScreenSetTimer);

            this._setNormalScreenStyle();
            this._titNotFullSet();
            this._setVideoSize('origin');
            this.waitingScreenSetTimer = window.setTimeout(function(){
                self._isFullScreen = false;
                self._initDynamic();
                self._adaptation();
            } , this._waitingScreenSetTime);

        } ,

        _screenSetClick: function(){
            if (!this._isFullScreen) {
                this._fullScreen();
            } else {
                this._normalScreen();
            }
        } ,

        _screenSetKeyUp: function(event){
            var e		= event || window.event;
            var tar     = e.currentTarget;
            var keyCode = e.keyCode || e.which;
            var self	= this;

            //tar.focus();

            // ESC 退出全屏
            if (keyCode === 27) {
                this._normalScreen();
            }

            // 回车键 进入全屏 || 退出全屏
            if (keyCode === 13) {
                if (!this._isFullScreen) {
                    this._fullScreen();
                } else {
                    this._normalScreen();
                }
            }

            // 空格键 播放 || 暂停
            if (keyCode === 32) {
                if (this._video.get().paused) {
                    this._video.get().play();
                    this._playControlBtn.play();
                    this._playRel();
                } else {
                    this._video.get().pause();
                    this._playControlBtn.pause();
                    this._pauseRel();
                }
            }
        } ,

        _screenSetKeyDown: function(event){
            var e		= event || window.event;
            var tar     = e.currentTarget;
            var keyCode = e.keyCode || e.which;
            var self	= this;

            // 一级回退
            if (keyCode === 37 && !e.ctrlKey) {
                var curTime  = Math.max(0 , Math.min(this._videoDuration , this._video.get().currentTime - this._videoStepOne));
                var buf      = this._videoBuffered;
                var bufLen   = buf.end(buf.length - 1) - buf.start(buf.length - 1);
                var vRatio	 = Math.max(0 , Math.min(1 , curTime / this._videoDuration));
                var bufRatio =	Math.max(0 , Math.min(1 , vRatio + bufLen / this._videoDuration));
                this._canAjustProgress = false;

                this._showPannel();
                this._clearTimeoutToHidePannel();
                this._setTimeoutToHidePannel();

                this._setCurTime(curTime);
                this._setCurTimeStyle(vRatio);
                this._setBufTime(bufRatio);
                this._setCurTimePointer(vRatio);
                this._setTimeExplain();
            }

            // 二级回退
            if (keyCode === 37 && e.ctrlKey) {
                var curTime  = Math.max(0 , Math.min(this._videoDuration , this._video.get().currentTime - this._videoStepTwo));
                var buf      = this._videoBuffered;
                var bufLen   = buf.end(buf.length - 1) - buf.start(buf.length - 1);
                var vRatio	 = Math.max(0 , Math.min(1 , curTime / this._videoDuration));
                var bufRatio =	Math.max(0 , Math.min(1 , vRatio + bufLen / this._videoDuration));

                this._showPannel();
                this._clearTimeoutToHidePannel();
                this._setTimeoutToHidePannel();

                this._setCurTime(curTime);
                this._setCurTimeStyle(vRatio);
                this._setBufTime(bufRatio);
                this._setCurTimePointer(vRatio);
                this._setTimeExplain();
            }

            // 一级前进
            if (keyCode === 39 && !e.ctrlKey) {
                var curTime  = Math.max(0 , Math.min(this._videoDuration , this._video.get().currentTime + this._videoStepOne));
                var buf      = this._videoBuffered;
                var bufLen   = buf.end(buf.length - 1) - buf.start(buf.length - 1);
                var vRatio	 = Math.max(0 , Math.min(1 , curTime / this._videoDuration));
                var bufRatio =	Math.max(0 , Math.min(1 , vRatio + bufLen / this._videoDuration));
                this._canAjustProgress = false;

                this._showPannel();
                this._clearTimeoutToHidePannel();
                this._setTimeoutToHidePannel();

                this._setCurTime(curTime);
                this._setCurTimeStyle(vRatio);
                this._setBufTime(bufRatio);
                this._setCurTimePointer(vRatio);
                this._setTimeExplain();
            }

            // 二级前进
            if (keyCode === 39 && e.ctrlKey) {
                var curTime  = Math.max(0 , Math.min(this._videoDuration , this._video.get().currentTime + this._videoStepTwo));
                var buf      = this._videoBuffered;
                var bufLen   = buf.end(buf.length - 1) - buf.start(buf.length - 1);
                var vRatio	 = Math.max(0 , Math.min(1 , curTime / this._videoDuration));
                var bufRatio =	Math.max(0 , Math.min(1 , vRatio + bufLen / this._videoDuration));

                this._showPannel();
                this._clearTimeoutToHidePannel();
                this._setTimeoutToHidePannel();

                this._setCurTime(curTime);
                this._setCurTimeStyle(vRatio);
                this._setBufTime(bufRatio);
                this._setCurTimePointer(vRatio);
                this._setTimeExplain();
            }

            // 音量减小
            if (keyCode === 38) {
                var curVolume		= Math.max(0 , Math.min(1 , this._video.get().volume + this._volumeStep));
                var volumeRatio		= curVolume;
                var endLeftVal		= this._totalVolumeW * volumeRatio;

                this._showPannel();
                this._clearTimeoutToHidePannel();
                this._setTimeoutToHidePannel();
                this._showVolumeBar();

                this._setVolumePic(volumeRatio);
                this._setCurVolumePointer(endLeftVal);
                this._setCurVolume(volumeRatio);
                this._setCurVolumeStyle(volumeRatio);

                this._lastVolume = volumeRatio;
            }

            // 音量增大
            if (keyCode === 40) {
                var curVolume		= Math.max(0 , Math.min(1 , this._video.get().volume - this._volumeStep));
                var volumeRatio		= curVolume;
                var endLeftVal		= this._totalVolumeW * volumeRatio;

                this._showPannel();
                this._clearTimeoutToHidePannel();
                this._setTimeoutToHidePannel();
                this._showVolumeBar();

                this._setVolumePic(volumeRatio);
                this._setCurVolumePointer(endLeftVal);
                this._setCurVolume(volumeRatio);
                this._setCurVolumeStyle(volumeRatio);

                this._lastVolume = volumeRatio;
            }
        } ,

        _SmallPlayerDBLClick: function(event){
            var self = this;
            var e = event || window.event;
            var curX = e.clientX;
            var curY = e.clientY;

            // 限制点击有效范围
            if (curX >= this._dblClickLXRange && curX <= this._dblClickRXRange && curY >= this._dblClickTYRange && curY <= this._dblClickBYRange) {
                this._isClick = false;

                if (!this._isFullScreen) {
                    this._fullScreen();
                } else {
                    this._normalScreen();
                }
            }
        } ,

        // 播放暂停事件
        _playVideoEvent: function(event){
            var e = event || window.event;
            e.stopPropagation();
            e.preventDefault();

            if (this._video.get().paused) {
                this._video.get().play();
                this._playControlBtn.play();
                this._playRel();
            } else {
                this._video.get().pause();
                this._playControlBtn.pause();
                this._pauseRel();
            }

        } ,

        _playingVideo: function(event){
            //console.log('播放视频中...' , this._canAjustProgress);
            if (!this._canAjustProgress) {
                return ;
            }

            var e		 = event || window.event;
            var v		 = e.currentTarget;
            var curTime	 = v.currentTime;
            var duration = v.duration;
            var buf		 = v.buffered;
            var bufLen	 = (buf.end(buf.length - 1) - buf.start(buf.length - 1)) / duration;
            var vRatio	 = Math.max(0 , Math.min(1 , curTime / duration));
            var bufRatio = Math.max(0 , Math.min(1 , vRatio + bufLen ));

            this._setCurTimePointer(vRatio);
            this._setCurTimeStyle(vRatio);
            this._setBufTime(bufRatio);
            this._setTimeExplain();

        } ,

        _playOver: function(){
            this._playControlBtn.pause();
        } ,

        _playControlClick: function(event){
            var e	 = event || window.event;
            var curX = e.clientX;
            var curY = e.clientY;
            var self = this;

            this._isClick = true;

            window.clearTimeout(this._playControlTimer);
            this._playControlTimer = window.setTimeout(function(){
                if (!self._isClick) {
                    return ;
                }

                if (curX >= self._dblClickLXRange && curX <= self._dblClickRXRange && curY >= self._dblClickTYRange && curY <= self._dblClickBYRange) {
                    if (self._video.get().paused) {
                        self._video.get().play();
                        self._playControlBtn.play();
                        self._playRel();
                    } else {
                        self._video.get().pause();
                        self._playControlBtn.pause();
                        self._pauseRel();
                    }
                }
            } , 300);
        } ,

        // 设置当前时间控制点
        _setCurTimePointer: function(vRatio){
            var endCurTimePointerLeftVal = this._progressW * vRatio - this._curTimePointerW / 2;

            this._curTimePointer.css({
                left: endCurTimePointerLeftVal + 'px'
            });
        } ,

        // 设置当前时间表现
        _setCurTimeStyle: function(vRatio){
            this._curTime.css({
                width: vRatio * 100 + '%'
            });
        } ,

        // 设置当前时间
        _setCurTime: function(curTime){
            //console.log(curTime);
            this._video.get().currentTime = Math.max(0 , Math.min(this._videoDuration , curTime));
        } ,

        // 设置以缓冲的时间
        _setBufTime: function(bufRatio){
            var buf    = this._videoBuffered;
            var curBufRatio = (buf.end(buf.length - 1) - buf.start(buf.length - 1)) / this._videoDuration;
            curBufRatio  = Math.max(0 , Math.min(1 , curBufRatio));

            this._bufferedTime.css({
                width: bufRatio * 100 + '%'
            });
        } ,

        // 设置用户设置时间
        _setUserSetTime: function(vRatio){
            this._userSetTime.css({
                width: vRatio * 100 + '%'
            });
        } ,

        // 设置视频预览
        _setPreview: function(vRatio , clientX){
            this._preview.removeClass('hide');

            var duration			= this._videoDuration;
            var curTime				= duration * vRatio;
            var timeExplain			= G.formatTime(curTime , 'HH:II:SS' , false);
            var previewInEndLeftVal = Math.max(this._previewInMinLeftVal , Math.min(this._previewInMaxLeftVal , this._getXOccupyProgressLeftVal(clientX) - this._previewInW / 2));

            if (this._videoWidth === undefined) {
                this._videoWidth = this._video.get().videoWidth;
            }

            if (this._videoHeight === undefined) {
                this._videoHeight = this._video.get().videoHeight;
            }

            this._previewVideo.get().currentTime = curTime;

            this._previewIn.css({
                left: previewInEndLeftVal + 'px'
            });


            this._previewTime.get().textContent = timeExplain;
        } ,

        // 设置时间描述
        _setTimeExplain: function(){
            var curTime		= this._video.get().currentTime;
            var duration	=  this._videoDuration;

            var totalTime   = G.formatTime(duration , 'HH:II:SS' , false);
            var currentTime = G.formatTime(curTime , 'HH:II:SS' , false);

            this._curTimeView.get().textContent = currentTime;
            this._totalTimeView.get().textContent = totalTime;
        } ,

        _setPlayerSetStyle: function(){
            if (this._playerSetCon.hasClass('hide')) {
                this._playerSet.removeClass('player_set_unactivated');
                this._playerSet.addClass('player_set_active');
            } else {
                this._playerSet.removeClass('player_set_active');
                this._playerSet.addClass('player_set_unactivated');
            }
        } ,

        // 初始化播放器设置
        _initPlayerSetStyle: function(){
            this._playSpeedSet.addClass('hide');
            this._menu.removeClass('hide');

            this._playerSetCon.css({
                width: this._menuW + 'px' ,
                height: this._menuH + 'px'
            });
        } ,

        _SHPlayerSetCon: function(){
            var curOpacity = parseFloat(this._playerSetCon.getStyleVal('opacity'));
            var endOpacity = 0;
            var self	   = this;

            if (this._playerSetCon.hasClass('hide')) {
                endOpacity = this._playerSetConEndOpacity;

                this._playerSet.removeClass('player_set_unactivated');
                this._playerSet.addClass('player_set_active');
                this._playerSetCon.removeClass('hide');

                this._playerSetCon.animate({
                    carTime: this._carTime ,
                    json: [
                        {
                            attr: 'opacity' ,
                            sVal: curOpacity ,
                            eVal: endOpacity
                        }
                    ]
                });
            } else {
                endOpacity = this._playerSetConStartOpacity;

                this._playerSetCon.animate({
                    carTime: this._carTime ,
                    json: [
                        {
                            attr: 'opacity' ,
                            sVal: curOpacity ,
                            eVal: endOpacity
                        }
                    ] ,
                    fn: function(){
                        self._playerSetCon.addClass('hide');
                        self._playerSet.removeClass('player_set_active');
                        self._initPlayerSetStyle();
                    }

                });
            }
        } ,

        _hidePlayerSetCon: function(){
            var curOpacity = parseFloat(this._playerSetCon.getStyleVal('opacity'));
            var endOpacity = endOpacity = this._playerSetConStartOpacity;
            var self	   = this;

            this._playerSetCon.animate({
                carTime: this._carTime ,
                json: [
                    {
                        attr: 'opacity' ,
                        sVal: curOpacity ,
                        eVal: endOpacity
                    }
                ] ,
                fn: function(){
                    self._playerSetCon.addClass('hide');
                    self._playerSet.removeClass('player_set_active');
                    self._initPlayerSetStyle();
                }

            });
        } ,

        // 播放器设置
        _playerSetClick: function(event){
            var e = event || window.event;
            e.stopPropagation();

            this._SHPlayerSetCon();
        } ,

        // 从速度控制界面 回到 播放器菜单界面
        _playSpeedSetToPlaySpeedCon: function(){
            var self = this;

            this._playSpeedSet.addClass('hide');

            this._playerSetCon.animate({
                carTime: this._carTime ,
                json: [
                    {
                        attr: 'width' ,
                        sVal: this._playSpeedSetW ,
                        eVal: this._menuW
                    } ,
                    {
                        attr: 'height' ,
                        sVal: this._playSpeedSetH ,
                        eVal: this._menuH
                    } ,
                ] ,
                fn: this._setPlaySpeedExplain.bind(this)
            });
        } ,

        _setPlaySpeedExplain: function(){

            if (this._video.get().playbackRate === 1) {
                this._curSpeedExplain.get().textContent = '正常';
            } else {
                this._curSpeedExplain.get().textContent = this._video.get().playbackRate;
            }

            this._menu.removeClass('hide');
        } ,

        // 从 播放器菜单界面 回到 速度控制界面
        _playSpeedConToPlaySpeedSet: function(){
            var self = this;

            this._menu.addClass('hide');

            this._playerSetCon.animate({
                carTime: this._carTime ,
                json: [
                    {
                        attr: 'width' ,
                        sVal: this._menuW ,
                        eVal: this._playSpeedSetW
                    } ,
                    {
                        attr: 'height' ,
                        sVal: this._menuH ,
                        eVal: this._playSpeedSetH
                    } ,
                ] ,
                fn: function(){
                    self._playSpeedSet.removeClass('hide');
                }
            });
        } ,

        // 显示速度控制列表：速度菜单点击事件
        _speedItemClick: function(event){
            this._playSpeedConToPlaySpeedSet();
        } ,

        //  回到主菜单：速度菜单点击事件
        _playSpeedSetHeaderClick: function(){
            this._playSpeedSetToPlaySpeedCon();
        } ,

        // 设置播放速度
        _setPlayRate: function(rate){
            this._video.get().playbackRate = rate;
        } ,

        // 设置播放速度样式
        _setPlaySpeedSetStyle: function(ele){
            var itemList = this._playSpeedSetItemList.get();
            var pic		 = null;

            for (var i = 0; i < itemList.length; ++i)
            {
                //console.log(itemList[i] , ele);
                if (itemList[i] === ele) {
                    G(itemList[i]).addClass('focus');
                    G('.pic' , itemList[i]).first().removeClass('hide');
                } else {
                    G(itemList[i]).removeClass('focus');
                    G('.pic' , itemList[i]).first().addClass('hide');
                }
            }
        } ,

        // 根据速度找到对应的 item 元素
        _getRateEqualEle: function(rate){
            var curSpeedItem	 = null;
            var curSpeedExplain  = null;
            var curSpeed		 = 0;
            var rate			 = parseFloat(rate);
            var item			 = null;
            for (var i = 0; i < this._playSpeedSetItemList.length; ++i)
            {
                curSpeedExplain = G('.explain' , this._playSpeedSetItemList.get()[i]).first();
                curSpeed		= curSpeedExplain.get().textContent;
                curSpeed		= parseFloat(curSpeed);

                if (rate === curSpeed) {
                    item = G(curSpeedExplain.get()).parentFind({
                        tagName: 'div' ,
                        className: 'item'
                    });
                    return item.get();
                }
            }
        } ,

        // 设置最终播放速度
        _setEndPlaySpeed: function(rate){
            var tar = this._getRateEqualEle(rate);
            //console.log(rate , tar);
            this._setPlayRate(rate);
            this._setPlaySpeedSetStyle(tar);
            this._setPlaySpeedExplain();
        } ,

        // 速度控制列表 item 元素点击事件
        _playSpeedSetItemListClick: function(event){
            var e		= event || window.event;
            var tar		= e.currentTarget;
            var rate    = parseFloat(G('.explain' , tar).first().get().textContent);
            this._setEndPlaySpeed(rate);
            this._playSpeedSetToPlaySpeedCon();
        } ,



        // 隐藏速度播放菜单
        _hidePlayerSetConClick: function(){
            this._hidePlayerSetCon();
        } ,

        // 速度控制列表容器元素点击事件，防止事件冒泡（阻止隐藏）
        _playerSetConClick: function(event){
            var e = event || window.event;
            e.stopPropagation();
        } ,

        // 播放失败时触发
        _playErrorEvent: function(){
            this._isError = true;
            this._playError.removeClass('hide');
            this._videoLoadingFailed.animate();
        } ,

        _showPannel: function(){
            var curOpacity = parseFloat(this._control.getStyleVal('opacity'));
            var endOpacity = this._controlPannelEndOpacity;

            // 标题
            this._header.animate({
                carTime: this._carTime ,
                json: [
                    {
                        attr: 'opacity' ,
                        sVal: curOpacity ,
                        eVal: endOpacity
                    }
                ]
            });

            // 控制面板
            this._control.animate({
                carTime: this._carTime ,
                json: [
                    {
                        attr: 'opacity' ,
                        sVal: curOpacity ,
                        eVal: endOpacity
                    }
                ]
            });
        } ,

        _hidePannel: function(){
            var curOpacity = parseFloat(this._control.getStyleVal('opacity'));
            var endOpacity = this._controlPannelStartOpacity;

            // 标题
            this._header.animate({
                carTime: this._carTime ,
                json: [
                    {
                        attr: 'opacity' ,
                        sVal: curOpacity ,
                        eVal: endOpacity
                    }
                ]
            });

            this._control.animate({
                carTime: this._carTime ,
                json: [
                    {
                        attr: 'opacity' ,
                        sVal: curOpacity ,
                        eVal: endOpacity
                    }
                ]
            });
        } ,

        _clearTimeoutToHidePannel: function(){
            window.clearTimeout(this._pannelTimer);
        } ,

        _setTimeoutToHidePannel: function(){
            var self = this;
            var hide = function(){
                self._hidePannel();
            };

            this._pannelTimer = window.setTimeout(hide , this._controlPannelShowTime);
        } ,

        // 全屏时标题设置
        _titFullSet: function(){
            this._header.removeClass('normal_header');
            this._header.addClass('full_header');
            this._setScreenSize.removeClass('hide');
            this._rightHeader.removeClass('hide');

        } ,

        // 非全屏时标题设置
        _titNotFullSet: function(){
            this._header.addClass('normal_header');
            this._header.removeClass('full_header');
            this._setScreenSize.addClass('hide');
            this._rightHeader.addClass('hide');
        } ,

        // 设置视频宽度
        _setVideoSize: function(size){
            var self      = this;
            var sizeRange = ['origin' , 'half' , 'two-thirds' , 'full'];

            if (!G.contain(size , sizeRange)) {
                throw new RangeError('不支持的类型，当前受支持的类型有：' + sizeRange.join(' '));
            }

            var w = 0;
            var h = 0;

            if (size === 'origin') {
                w = this._conW;
                h = this._conH;
            }

            if (size === 'half') {
                w = this._SmallPlayerW * 1/2;
                h = this._SmallPlayerH * 1/2;
            }

            if (size === 'two-thirds') {
                w = this._SmallPlayerW * 2/3;
                h = this._SmallPlayerH * 2/3;
            }

            if (size === 'full') {
                w = this._SmallPlayerW * 1;
                h = this._SmallPlayerH * 1;
            }

            var curW = this._video.getEleW('border-box');
            var curH = this._video.getEleH('border-box');

            this._video.animate({
                carTime: this._carTime ,
                json: [
                    {
                        attr: 'width' ,
                        sVal: curW ,
                        eVal: w
                    } ,
                    {
                        attr: 'height' ,
                        sVal: curH,
                        eVal: h
                    }
                ] ,
                fn: function(){
                    if (size === 'origin') {
                        self._video.css({
                            verticalAlign: 'top'
                        });
                    }

                    if (size === 'half') {
                        self._video.css({
                            verticalAlign: 'middle'
                        });
                    }

                    if (size === 'two-thirds') {
                        self._video.css({
                            verticalAlign: 'middle'
                        });
                    }

                    if (size === 'full') {
                        self._video.css({
                            verticalAlign: 'middle'
                        });
                    }
                }
            });
        } ,

        // 半屏
        _halfVideoClick: function(){
            this._setVideoSize('half');
        } ,

        // 2/3 屏
        _twoThirdsVideoClick: function(){
            this._setVideoSize('two-thirds');
        } ,

        // 全屏
        _fullVideoClick: function(){
            this._setVideoSize('full');
        } ,

        _SmallPlayerMouseOver: function(event){
            //console.log('over');
            //var e	 = event || window.event;
            //var curX = e.clientX;
            //var curY = e.clientY;

            //if (curX >= this._SmallPlayerLXRange && curX <= this._SmallPlayerRXRange && curY >= this._SmallPlayerTYRange && curY <= this._SmallPlayerBYRange) {
            this._showPannel();
            this._clearTimeoutToHidePannel();
            this._setTimeoutToHidePannel();
            //}
        } ,

        _SmallPlayerMouseOut: function(event){
            //console.log('out');
            //var e	 = event || window.event;
            //var curX = e.clientX;
            //var curY = e.clientY;

            //if (curX < this._SmallPlayerLXRange || curX > this._SmallPlayerRXRange || curY < this._SmallPlayerTYRange || curY > this._SmallPlayerBYRange) {
            if (this._isShowControlPannel) {
                return ;
            } else {
                this._isShowControlPannel = false;
                this._hidePannel();
            }
            //} else {
            if (this._isShowControlPannel) {
                this._showPannel();
            } else {
                this._clearTimeoutToHidePannel();
                this._setTimeoutToHidePannel();
            }
            //}
        } ,

        _outSmallPlayerRelAreaDBLClick: function(event){
            var e = event || window.event;
            e.stopPropagation();
        } ,

        _showVideoLoading: function(){
            this._loading.removeClass('hide');
        } ,

        _hideVideoLoading: function(){
            this._loading.addClass('hide');
        } ,

        _showPreviewVideoLoading: function(){
            this._previewLoading.removeClass('hide');
        } ,

        _hidePreviewVideoLoading: function(){
            this._previewLoading.addClass('hide');
        } ,

        _videoLoading: function(){
            this._showVideoLoading();
        } ,

        _videoLoadingCompleted: function(){
            this._hideVideoLoading();
        } ,

        _videoSeeking: function(){
            this._showVideoLoading();
        } ,

        _videoSeeked: function(){
            this._hideVideoLoading();
        } ,

        _previewVideoSeeking: function(){
            this._showPreviewVideoLoading();
        } ,

        _previewVideoSeeked: function(){
            this._hidePreviewVideoLoading();
        } ,

        // 由小变大
        _startToMiddlePlayRel: function(fn){
            this._pc.removeClass('hide');

            this._pc.css({
                width: this._pcStartW + 'px' ,
                height: this._pcStartH + 'px' ,
                lineHeight: this._pcStartH + 'px' ,
                opacity: this._pcStartOpacity
            });

            this._pc.eleCenter(this._playerCon.get() , 'all');

            var curW = this._pcStartW;
            var curH = this._pcStartH;
            var curOpacity = this._pcStartOpacity;
            var curLeftVal = this._pc.getCoordVal('left');
            var curTopVal  = this._pc.getCoordVal('top');
            var curLineHeight = parseFloat(this._pc.getStyleVal('lineHeight'));

            this._pc.animate({
                carTime: 800 ,
                json: [
                    {
                        attr: 'width' ,
                        sVal: curW ,
                        eVal: this._pcMiddleW
                    } ,
                    {
                        attr: 'height' ,
                        sVal: curH ,
                        eVal: this._pcMiddleH
                    } ,
                    {
                        attr: 'opacity' ,
                        sVal:  curOpacity,
                        eVal: this._pcMiddleOpacity
                    } ,
                    {
                        attr: 'left' ,
                        sVal: curLeftVal ,
                        eVal: this._pcStartToMiddleEndLeftVal
                    } ,
                    {
                        attr: 'top' ,
                        sVal: curTopVal ,
                        eVal: this._pcStartToMiddleEndTopVal
                    } ,
                    {
                        attr: 'lineHeight' ,
                        sVal: curLineHeight ,
                        eVal: this._pcMiddleH
                    }
                ] ,
                fn: function(){
                    if (G.getValType(fn) === 'function') {
                        fn();
                    }
                }
            });

        } ,
        // 由大变小
        _middleToEndPlayRel: function(){
            var self = this;
            var curW = this._pc.getEleW('border-box');
            var curH = this._pc.getEleH('border-box');
            var curOpacity = parseFloat(this._pc.getStyleVal('opacity'));
            var curLeftVal = this._pc.getCoordVal('left');
            var curTopVal  = this._pc.getCoordVal('top');
            var curLineHeight = parseFloat(this._pc.getStyleVal('lineHeight'));

            this._pc.animate({
                carTime: 800 ,
                json: [
                    {
                        attr: 'width' ,
                        sVal: curW ,
                        eVal: this._pcEndW
                    } ,
                    {
                        attr: 'height' ,
                        sVal: curH ,
                        eVal: this._pcEndH
                    } ,
                    {
                        attr: 'opacity' ,
                        sVal:  curOpacity,
                        eVal: this._pcEndOpacity
                    } ,
                    {
                        attr: 'left' ,
                        sVal: curLeftVal ,
                        eVal: this._pcMiddleToEndEndLeftVal
                    } ,
                    {
                        attr: 'top' ,
                        sVal: curTopVal ,
                        eVal: this._pcMiddleToEndEndTopVal
                    } ,
                    {
                        attr: 'lineHeight' ,
                        sVal: curLineHeight ,
                        eVal: this._pcEndH
                    }
                ] ,
                fn: function(){
                    self._pc.addClass('hide');
                }
            });
        } ,

        // 播放效果
        _playRel: function(){
            this._picInPc.get().src = this._playIcoSrc + '?reqTime=' + new Date().getTime();
            this._startToMiddlePlayRel(this._middleToEndPlayRel.bind(this));
        } ,

        // 暂停效果
        _pauseRel: function(){
            this._picInPc.get().src = this._pauseIcoSrc + '?reqTime=' + new Date().getTime();
            this._startToMiddlePlayRel(this._middleToEndPlayRel.bind(this));
        } ,

        // 海报加载事件
        _posterLoaded: function(){
            var self = this;
            this._showVideoLoading();

            //console.log('海报加载完成');
            /*
            if (this._isTriggeredVideoLoadedEvent) {
                window.setTimeout(function(){
                    if (self._isPlayAd) {
                        self._defineAdEvent();
                        self._playAd();

                    } else {
                        self._play();
                    }
                } , this._posterShowTime);
            }

            this._isTriggeredPosterLoadedEvent = true;
            */

            window.setTimeout(function(){
                if (self._isPlayAd) {
                    self._defineAdEvent();
                    self._playAd();

                } else {
                    self._play();
                }
            } , this._posterShowTime);
        } ,

        // 视频加载完成第一帧事件
        _videoLoadedData: function(){
            this._videoDuration	= this._video.get().duration;
            this._videoBuffered = this._video.get().buffered;

            // 初始化播放器
            this._setEndVolume(this._initVolume);
            this._setEndPlaySpeed(this._initSpeed);
            this._setEndTime(this._initTime);

            if (G.getValType(this._videoLoadedCallBack) === 'function') {
                this._videoLoadedCallBack();
            }
        } ,

        // 窗口调整事件
        _windowResize: function(){
            this._initDynamic();
        } ,

        // 控制面板点击事件（阻止事件冒泡，防止事件重复触发）
        _controlClick: function(event){
            var e = event || window.event;
            e.stopPropagation();
        } ,

        _defineEvent: function(){
            // 标题事件
            this._halfVideo.loginEvent('click' , this._halfVideoClick.bind(this) , false , false);
            this._twoThirdsVideo.loginEvent('click' , this._twoThirdsVideoClick.bind(this) , false , false);
            this._fullVideo.loginEvent('click' , this._fullVideoClick.bind(this) , false , false);

            // 控制面板事件
            this._SmallPlayer.loginEvent('mouseover' , this._SmallPlayerMouseOver.bind(this) , false , false);
            this._SmallPlayer.loginEvent('mouseout' , this._SmallPlayerMouseOut.bind(this) , false , false);
            this._control.loginEvent('click' , this._controlClick.bind(this) , false , false);

            // 进度条事件 + 视频预览事件
            this._progress.loginEvent('mouseover' , this._progressMouseOver.bind(this) , false , false);
            this._progress.loginEvent('mouseout'  , this._progressMouseOut.bind(this)  , false , false);

            // 进度条容器事件 + 视频预览事件
            this._progressBar.loginEvent('click' , this._progressBarClick.bind(this) , false , false);
            //this._progressBar.loginEvent('mouseout' , this._progressBarMouseOver.bind(this)  , false , false);
            this._progressBar.loginEvent('mousemove' , this._progressBarMouseMove.bind(this)  , false , false);
            this._progressBar.loginEvent('mouseout'  , this._progressBarMouseOut.bind(this)  , false , false);
            this._curTimePointer.loginEvent('mousedown' , this._curTimePointerMouseDown.bind(this) , false , false);
            G(window).loginEvent('mouseup'  , this._curTimePointerMouseOut.bind(this) , true , false);
            G(window).loginEvent('mousemove' , this._curTimePointerMouseMove.bind(this) , true , false);

            // 音频控制事件
            this._playerCon.loginEvent('wheel' , this._playerConWheel.bind(this) , false , false);
            this._volumeControl.loginEvent('mouseover' , this._volumeControlMouseOver.bind(this) , false , false);
            this._volumeBarOut.loginEvent('click' , this._volumeBarInClick.bind(this) , false , false);
            this._volumeBarOut.loginEvent('wheel' , this._volumeBarInWheel.bind(this) , false , false);
            this._volumePic.loginEvent('click' , this._volumePicClick.bind(this) , false , false);
            G(window).loginEvent('mousemove' , this._volumeControlMouseOut.bind(this) , true , false); // 名字是根据其用途才命名为 mouseout（功效如此，所以命名如此）
            this._curVolumePointer.loginEvent('mousedown' , this._curVolumePointerMouseDown.bind(this) , false , false);
            G(window).loginEvent('mousemove' , this._curVolumePointerMouseMove.bind(this) , true , false);
            G(window).loginEvent('mouseup' , this._curVolumePointerMouseUp.bind(this) , true , false);

            // 屏幕操作：包括全屏 播放 暂停 音量加减 视频回放
            this._screenSet.loginEvent('click' , this._screenSetClick.bind(this) , false , false);
            this._playerCon.loginEvent('dblclick' , this._SmallPlayerDBLClick.bind(this) , false , false);
            this._screenSetHeader.loginEvent('click' , this._normalScreen.bind(this) , false , false);
            G(window).loginEvent('keyup' , this._screenSetKeyUp.bind(this) , false , false);
            G(window).loginEvent('keydown' , this._screenSetKeyDown.bind(this) , false , false);
            this._playerSetCon.loginEvent('dblclick' , this._outSmallPlayerRelAreaDBLClick.bind(this) , false , false);

            // 播放操作
            this._playControl.loginEvent('click' , this._playVideoEvent.bind(this) , false , false);
            this._playerCon.loginEvent('click' , this._playControlClick.bind(this) , false , false);

            // 播放器设置
            this._playerSetCon.loginEvent('click' , this._playerSetConClick.bind(this) , false , false);
            this._playerSet.loginEvent('click' , this._playerSetClick.bind(this) , false , false);
            this._speedItem.loginEvent('click' , this._speedItemClick.bind(this) , false , false);
            this._playSpeedSetHeader.loginEvent('click' , this._playSpeedSetHeaderClick.bind(this) , false , false);
            this._playSpeedSetItemList.loginEvent('click' , this._playSpeedSetItemListClick.bind(this) , false , false);
            G(window).loginEvent('click' , this._hidePlayerSetConClick.bind(this) , true , false);

            // 窗口调整的时候参数重新初始化
            G(window).loginEvent('resize' , this._windowResize.bind(this) , true , false);
        } ,

        // 定义海报事件
        _definePosterEvent: function(){
            // 最高优先级：播放海报事件
            this._picInPoster.loginEvent('load' , this._posterLoaded.bind(this) , false , false);

            // 设置海报源
            this._picInPoster.get().src	 = this._diyPlayerPosterSrc; // 最好不要这样重复带 随机数字防止缓存这种....
        } ,

        // 添加海报
        _addPosterEle: function(){
            var iCn = 'pic';
            this._picInPoster = G('.' + iCn , this._poster.get());

            if (this._picInPoster.length === 1) {
                this._poster.get().removeChild(this._picInPoster.first().get());
            }

            var img = new Image();
            img.className = iCn;

            this._poster.get().appendChild(img);
            this._picInPoster = G(img);
        } ,

        // 获取播放时长
        getPlayDuration: function(){
            return this._video.get().currentTime;
        } ,

        // 获取视频长度
        getVideoDuration: function(){
            return this._videoDuration;
        } ,

        _run: function(){
            this._initHTML();
            this._initStatic();
            this._addPosterEle();
            this._definePosterEvent();
        } ,
    };

    return SmallPlayer;
})();







