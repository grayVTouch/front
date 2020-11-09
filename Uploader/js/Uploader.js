(function(global){
    "use strict";

    function Uploader(selector , option)
    {
        var root = G(selector);
        if (!root.isDom()) {
            throw new Error('参数 1 错误');
        }
        const _default = {
            // 上传地址
            api: '' ,
            // 上传字段
            field: 'file' ,
            // 模式：append-追加 override-覆盖
            mode: 'append' ,
            // 单文件上传
            multiple: false ,
            // 单个文件上传完成调用
            uploaded: null ,
            // 全部上传完成回调函数
            completed: null ,
            // 清空后回调函数
            cleared: null ,
            // 文件上传超时时间，默认：0-不限制
            // 单位： s
            timeout: 0 ,
            // 是否启用清空所有的功能
            clear: false ,
            // 直接上传
            direct: true ,
        };
        if (G.isUndefined(option)) {
            option = _default;
        }
        var modeRange = ['append' , 'override'];
        option.api      = G.isString(option.api) ? option.api : _default.api;
        option.field    = G.isString(option.field) ? option.field : _default.field;
        option.mode     = G.contain(option.mode , modeRange) ? option.mode : _default.mode;
        option.multiple = G.isBoolean(option.multiple) ? option.multiple : _default.multiple;
        option.uploaded = G.isFunction(option.uploaded) ? option.uploaded : _default.uploaded;
        option.failed = G.isFunction(option.failed) ? option.failed : _default.failed;
        option.completed = G.isFunction(option.completed) ? option.completed : _default.completed;
        option.cleared = G.isFunction(option.cleared) ? option.cleared : _default.cleared;
        option.timeout = G.isNumber(option.timeout) ? option.timeout : _default.timeout;
        option.clear = G.isBoolean(option.clear) ? option.clear : _default.clear;
        option.direct = G.isBoolean(option.direct) ? option.direct : _default.direct;

        this.option = option;
        this.dom = {
            root: root ,
        };

        this.run();
    }

    Uploader.prototype = {
        constructor: Uploader ,

        version: '1.0.0' ,

        initStatic: function(){
            var self = this;

            this.dom.uploader         = G('.uploader' , this.dom.root.get(0));
            this.dom.fileInput          = G('.file-input' , this.dom.uploader.get(0));
            this.dom.handler            = G('.handler' , this.dom.uploader.get(0));
            this.dom.clear              = G('.clear' , this.dom.uploader.get(0));
            this.dom.preview            = G('.preview' , this.dom.uploader.get(0));

            // 文件列表
            this.file = [];

            this.imageExtRange = ['jpg' , 'jpeg' , 'png' , 'gif' , 'bmp' , 'ico' , 'tif' , 'webp'];
            this.videoExtRange = ['mp4' , 'mkv' , 'mov' , 'avi' , 'ts' , 'flv' , 'rmvb' , 'webm'];

            if (this.option.multiple) {
                this.dom.fileInput.native('multiple' , true);
            }

            this.pending = {
                upload: false ,
            };

            this.option.timeout *= 1000;

            if (!this.option.clear) {
                this.dom.clear.addClass('hide');
            }

            this.dom.preview.children().each(function (dom) {
                self.initPreviewFileDomEvent(dom);
            });
        } ,

        initDynamic: function(){

        } ,

        initEvent: function(){
            this.dom.handler.on('click' , this.showFileSelector.bind(this) , true , false);
            this.dom.fileInput.on('change' , this.fileEvent.bind(this) , true , false);
            this.dom.clear.on('click' , this.clearEvent.bind(this) , true , false);
        } ,

        clearEvent: function(e){
            G.stop(e);
            this.clearAll();
            G.invoke(this.option.cleared , this);
        } ,

        clearAll:function(){
            this.file = [];
            this.dom.preview.html('');
        } ,

        toArray: function(similarArray){
            var res = [];
            var i = 0;
            var cur;
            for (i = 0; i < similarArray.length; ++i)
            {
                cur = similarArray[i];
                res.push(cur);
            }
            return res;
        } ,

        handleFile (files) {
            files.forEach((file) => {
                file.id = G.randomArray(32 , 'mixed' , true);
            });
        } ,

        fileEvent: function(){
            var files = this.dom.fileInput.native('files');
                files = this.toArray(files);
            this.handleFile(files);
            switch (this.option.mode)
            {
                case 'append':
                    this.append(files , function () {
                        if (this.option.direct) {
                            this.upload();
                        }
                    });
                    break;
                case 'override':
                    this.override(files , function () {
                        if (this.option.direct) {
                            this.upload();
                        }
                    });
                    break;
            }
        } ,

        showFileSelector: function(){
            this.dom.fileInput.origin('click');
        } ,

        // 追加模式
        append: function(files , callback){
            this.file.push.apply(this.file , files);
            this.renderForAppend(files , callback);
        } ,

        // 重写模式
        override: function(files , callback){
            this.file = files;
            this.renderForOverride(files , callback);
        } ,

        items: function(){
            return this.dom.preview.children().get();
        } ,

        findItemById: function(id){
            var items = G(this.items());
            var i = 0;
            var cur;
            for (; i < items.length; ++i)
            {
                cur = items.jump(i , true);
                if (cur.data('id') === id) {
                    return cur.get(0);
                }
            }
            throw new Error('未找到 id 对应的项：' + id);
        } ,

        // 设置图片上传状态
        status: function(id , success){
            // flag 仅允许设置 成功 和 失败两种状态
            success = G.isBoolean(success) ? success : true;
            var item        = this.findItemById(id);
                item        = G(item);
            var progress    = G('.progress' , item.get(0));
            var mask        = G('.mask' , item.get(0));
            var status      = G('.status' , item.get(0));
            var successInStatus = G('.success' , status.get(0));
            var errorInStatus   = G('.error' , status.get(0));
            mask.addClass('hide');
            progress.addClass('hide');
            status.removeClass('hide');
            if (success) {
                successInStatus.highlight('hide' , status.children().get() , true);
            } else {
                errorInStatus.highlight('hide' , status.children().get() , true);
            }
        } ,

        // 设置图片上传进度
        progress: function(id , val){
            var item        = this.findItemById(id);
                item        = G(item);
            var progress    = G('.progress' , item.get(0));
            var current     = G('.current' , progress.get(0));
            var mask        = G('.mask' , item.get(0));
            var status      = G('.status' , item.get(0));
            mask.addClass('hide');
            status.addClass('hide');
            progress.removeClass('hide');
            current.css({
                width: val + '%' ,
            });
        } ,

        initFileDomEvent: function(dom){
            dom = G(dom);

            var self = this;
            var view = G('.view' , dom.get(0));
            var del  = G('.delete' , dom.get(0));

            view.on('click' , function () {
                var url = dom.data('url');
                window.open(url , '_blank');
            } , true , false);

            del.on('click' , function () {
                var id = dom.data('id');
                var index = self.findIndexById(id);
                self.file.splice(index , 1);
                dom.parent().remove(dom.get(0));
            });
        } ,

        initPreviewFileDomEvent: function(dom){
            dom = G(dom);

            var self = this;
            var view = G('.view' , dom.get(0));

            view.on('click' , function () {
                var url = dom.data('url');
                window.open(url , '_blank');
            } , true , false);
        } ,

        findFileById: function(id){
            var i = 0;
            var cur;
            for (; i < this.file.length; ++i)
            {
                cur = this.file[i];
                if (cur.id === id) {
                    return cur;
                }
            }
            throw new Error('未找到 id 对应的项：' + id);
        } ,

        findIndexById: function(id){
            var i = 0;
            var cur;
            for (; i < this.file.length; ++i)
            {
                cur = this.file[i];
                if (cur.id === id) {
                    return i;
                }
            }
            throw new Error('未找到 id 对应的项：' + id);
        } ,

        _render: function(file , callback){
            var self = this;
            G.getBlobUrl(file , function(blobUrl){
                var dom;
                var ext = G.getFileSuffix(file.name);
                if (G.contain(ext , self.imageExtRange)) {
                    dom = self.createImage(file.id , blobUrl);
                } else if (G.contain(ext , self.videoExtRange)) {
                    dom = self.createVideo(file.id , blobUrl);
                } else {
                    dom = self.createFile(file.id , file.name , blobUrl);
                }
                self.initFileDomEvent(dom);
                self.dom.preview.append(dom);
                if (G.isFunction(callback)) {
                    callback.call(self);
                }
            });
        } ,

        // 追加模式：渲染内容
        renderForAppend: function(files , callback){
            var self = this;
            var count = 0;
            files.forEach(function (file) {
                self._render(file , function () {
                    count++;
                    if (count === files.length) {
                        if (G.isFunction(callback)) {
                            callback.call(self);
                        }
                    }
                });
            });
        } ,

        // 检查待上传文件是否为空
        empty: function(){
            return this.file.length < 1;
        } ,

        // 文件上传
        upload: function(callback){
            if (this.empty()) {
                console.log('待上传文件列表为空');
                if (G.isFunction(callback)) {
                    callback();
                }
                return ;
            }
            if (this.pending.upload) {
                console.log('文件上传中...请耐心等待');
                return ;
            }
            this.pending.upload = true;
            var self = this;
            // 总文件数量
            var total = this.file.length;
            // 上传成功的文件数量
            var uploaded = 0;
            // 上传失败的文件数量
            var failed   = 0;
            var upload = function () {
                if (this.file.length < 1) {
                    // 队列已经消费完毕
                    this.pending.upload = false;
                    if (G.isFunction(this.option.completed)) {
                        this.option.completed.call(this , total , uploaded , failed);
                    }
                    if (G.isFunction(callback)) {
                        callback();
                    }
                    return ;
                }
                var file = this.file.shift();
                var formData = G.formData(this.option.field , file);
                G.ajax({
                    url: this.option.api ,
                    method: 'post' ,
                    data: formData ,
                    wait: this.option.timeout ,
                    before: function(){
                        self.progress(file.id , 0);
                    } ,
                    uProgress: function(e){
                        if (!e.lengthComputable) {
                            return ;
                        }
                        var percent = e.loaded / e.total;
                        percent *= 100;
                        self.progress(file.id , percent);
                    } ,

                    success: function () {
                        // 上传文件完成
                        self.progress(file.id , 100);
                        uploaded++;
                        if (G.isFunction(self.option.uploaded)) {
                            var args = self.toArray(arguments);
                                args.unshift(file);
                            self.option.uploaded.apply(self , args);
                        }
                        upload.call(self);
                    } ,
                    error: function (e) {
                        failed++;
                        self.status(file.id , false);
                        // 继续消费队列
                        upload.call(self);

                        console.log('error' , e);
                    } ,
                    uError: function(e){
                        console.log('uError' , e);
                    } ,
                    netError: function (e) {
                        failed++;
                        self.status(file.id , false);
                        upload.call(self);
                        console.log('netError' , e);
                    } ,
                    timeout: function (e) {
                        failed++;
                        self.status(file.id , false);
                        upload.call(self);
                        console.log('timeout' , e);
                    }
                });
            };
            upload.call(this);
        } ,

        // 追加模式：渲染内容
        renderForOverride: function(files , callback){
            var self = this;
            var count = 0;
            this.dom.preview.html('');
            files.forEach(function (file) {
                self._render(file , function () {
                    count++;
                    if (count === files.length) {
                        if (G.isFunction(callback)) {
                            callback.call(self);
                        }
                    }
                });
            });
        } ,

        render: function(val){
            if (!G.isValid(val)) {
                return ;
            }
            var dom;
            var filename;
            var ext = G.getFileSuffix(val);
            if (G.contain(ext , this.imageExtRange)) {
                dom = this.createPreviewImage(val);
            } else if (G.contain(ext , this.videoExtRange)) {
                dom = this.createPreviewVideo(val);
            } else {
                filename = G.getFilename(val);
                dom = this.createPreviewFile(filename , val);
            }
            this.initFileDomEvent(dom);
            if (this.option.mode === 'override') {
                this.clearAll();
            }
            this.dom.preview.append(dom);
        } ,

        createFile: function(id , name , url) {
            var div = document.createElement('div');
                div = G(div);
                div.addClass(['item' , 'file']);
                div.data('id' , id);
                div.data('url' , url);
            var html = '';
                html += '    <div class="inner">';
                html += '       <div class="line ico"><i class="iconfont run-iconfont run-iconfont-wenjian"></i></div>';
                html += '       <div class="line text">' + name + '</div>';
                html += '    </div>';
                html += '   <div class="mask">';
                html += '       <div class="line view run-action-feedback-round"><i class="iconfont run-iconfont run-iconfont-chakan"></i></div>';
                html += '       <div class="line delete run-action-feedback-round"><i class="iconfont run-iconfont run-iconfont-shanchu"></i></div>';
                html += '   </div>';
                html += '   <div class="progress hide">';
                html += '       <div class="total">';
                html += '           <div class="current"></div>';
                html += '       </div>';
                html += '    </div>';
                html += '   <div class="status hide">';
                html += '       <i class="success iconfont run-iconfont run-iconfont-chenggong hide"></i>';
                html += '       <i class="error iconfont run-iconfont run-iconfont-shibai hide"></i>';
                html += '    </div>';


            div.html(html);
            return div.get(0);
        } ,

        createImage: function(id , src) {
            var div = document.createElement('div');
                div = G(div);
                div.addClass(['item' , 'image']);
                div.data('id' , id);
                div.data('url' , src);
            var html = '';
            html += '    <div class="inner">';
            html += '       <img src="' + src + '" class="image">';
            html += '    </div>';
            html += '   <div class="mask">';
            html += '       <div class="line view run-action-feedback-round"><i class="iconfont run-iconfont run-iconfont-chakan"></i></div>';
            html += '       <div class="line delete run-action-feedback-round"><i class="iconfont run-iconfont run-iconfont-shanchu"></i></div>';
            html += '   </div>';
            html += '   <div class="progress hide">';
            html += '       <div class="total">';
            html += '           <div class="current"></div>';
            html += '       </div>';
            html += '    </div>';
            html += '   <div class="status hide">';
            html += '       <i class="success iconfont run-iconfont run-iconfont-chenggong hide"></i>';
            html += '       <i class="error iconfont run-iconfont run-iconfont-shibai hide"></i>';
            html += '    </div>';
            div.html(html);
            return div.get(0);
        } ,

        createVideo: function(id , src) {
            var div = document.createElement('div');
            div = G(div);
            div.addClass(['item' , 'video']);
            div.data('id' , id);
            div.data('url' , src);
            var html = '';
            html += '    <div class="inner">';
            html += '       <video src="' + src + '"></video>';
            html += '    </div>';
            html += '   <div class="mask">';
            html += '       <div class="line view run-action-feedback-round"><i class="iconfont run-iconfont run-iconfont-chakan"></i></div>';
            html += '       <div class="line delete run-action-feedback-round"><i class="iconfont run-iconfont run-iconfont-shanchu"></i></div>';
            html += '   </div>';
            html += '   <div class="progress hide">';
            html += '       <div class="total">';
            html += '           <div class="current"></div>';
            html += '       </div>';
            html += '    </div>';
            html += '   <div class="status hide">';
            html += '       <i class="success iconfont run-iconfont run-iconfont-chenggong hide"></i>';
            html += '       <i class="error iconfont run-iconfont run-iconfont-shibai hide"></i>';
            html += '    </div>';
            div.html(html);
            return div.get(0);
        } ,

        createPreviewFile: function(name , url) {
            var div = document.createElement('div');
            div = G(div);
            div.addClass(['item' , 'file']);
            div.data('url' , url);
            var html = '';
            html += '    <div class="inner">';
            html += '       <div class="line ico"><i class="iconfont run-iconfont run-wenjian"></i></div>';
            html += '       <div class="line text">' + name + '</div>';
            html += '    </div>';
            html += '   <div class="mask">';
            html += '       <div class="line view run-action-feedback-round"><i class="iconfont run-iconfont run-iconfont-chakan"></i></div>';
            html += '   </div>';
            html += '   <div class="progress hide">';
            html += '       <div class="total">';
            html += '           <div class="current"></div>';
            html += '       </div>';
            html += '    </div>';
            html += '   <div class="status hide">';
            html += '       <i class="success iconfont run-iconfont run-iconfont-chenggong hide"></i>';
            html += '       <i class="error iconfont run-iconfont run-iconfont-shibai hide"></i>';
            html += '    </div>';


            div.html(html);
            return div.get(0);
        } ,

        createPreviewImage: function(src) {
            var div = document.createElement('div');
            div = G(div);
            div.addClass(['item' , 'image']);
            div.data('url' , src);
            var html = '';
            html += '    <div class="inner">';
            html += '       <img src="' + src + '" class="image">';
            html += '    </div>';
            html += '   <div class="mask">';
            html += '       <div class="line view run-action-feedback-round"><i class="iconfont run-iconfont run-iconfont-chakan"></i></div>';
            html += '   </div>';
            html += '   <div class="progress hide">';
            html += '       <div class="total">';
            html += '           <div class="current"></div>';
            html += '       </div>';
            html += '    </div>';
            html += '   <div class="status hide">';
            html += '       <i class="success iconfont run-iconfont run-iconfont-chenggong hide"></i>';
            html += '       <i class="error iconfont run-iconfont run-iconfont-shibai hide"></i>';
            html += '    </div>';
            div.html(html);
            return div.get(0);
        } ,

        createPreviewVideo: function(src) {
            var div = document.createElement('div');
            div = G(div);
            div.addClass(['item' , 'image']);
            div.data('url' , src);
            var html = '';
            html += '    <div class="inner">';
            html += '       <video src="' + src + '" controls type="video/mp4"></video>';
            html += '    </div>';
            html += '   <div class="mask">';
            html += '       <div class="line view run-action-feedback-round"><i class="iconfont run-iconfont run-iconfont-chakan"></i></div>';
            html += '   </div>';
            html += '   <div class="progress hide">';
            html += '       <div class="total">';
            html += '           <div class="current"></div>';
            html += '       </div>';
            html += '    </div>';
            html += '   <div class="status hide">';
            html += '       <i class="success iconfont run-iconfont run-iconfont-chenggong hide"></i>';
            html += '       <i class="error iconfont run-iconfont run-iconfont-shibai hide"></i>';
            html += '    </div>';
            div.html(html);
            return div.get(0);
        } ,

        run: function(){
            this.initStatic();
            this.initDynamic();
            this.initEvent();
        } ,
    };

    global.Uploader = Uploader;
})(typeof window === 'undefined' ? this : window);
