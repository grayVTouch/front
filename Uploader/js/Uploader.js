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
            multiple: true ,
            // 单个文件上传完成调用
            uploaded: null ,
            // 全部上传完成回调函数
            completed: null ,
            // 文件上传超时时间，默认：0-不限制
            // 单位： s
            timeout: 0 ,
            // 是否启用清空所有的功能
            clear: true ,
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
        option.timeout = G.isNumber(option.timeout) ? option.timeout : _default.timeout;
        option.clear = G.isBoolean(option.clear) ? option.clear : _default.clear;

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
            this.dom.uploader         = G('.uploader' , this.dom.root.get(0));
            this.dom.fileInput          = G('.file-input' , this.dom.uploader.get(0));
            this.dom.handler            = G('.handler' , this.dom.uploader.get(0));
            this.dom.clear              = G('.clear' , this.dom.uploader.get(0));
            this.dom.preview            = G('.preview' , this.dom.uploader.get(0));

            // 文件列表
            this.file = [];

            this.imageExtRange = ['jpg' , 'jpeg' , 'png' , 'gif' , 'bmp' , 'ico' , 'tif' , 'webp'];

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
        } ,

        clearAll:function(){
            this.file = [];
            this.dom.preview.html('');
        } ,

        fileListToArray: function(fileList){
            var res = [];
            var i = 0;
            var file;
            for (i = 0; i < fileList.length; ++i)
            {
                file = fileList[i];
                file.id = G.randomArr(16 , 'mixed' , true);
                res.push(file);
            }
            return res;
        } ,

        fileEvent: function(){
            var files = this.dom.fileInput.native('files');
                files = this.fileListToArray(files);
                console.log(files);
            switch (this.option.mode)
            {
                case 'append':
                    this.append(files);
                    break;
                case 'override':
                    this.override(files);
                    break;
            }
        } ,

        showFileSelector: function(){
            this.dom.fileInput.origin('click');
        } ,

        // 追加模式
        append: function(files){
            this.file.push.apply(this.file , files);
            this.renderForAppend(files);
        } ,

        // 重写模式
        override: function(files){
            this.file = files;
            this.renderForOverride(files);
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
            var del = G('.delete' , dom.get(0));

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

        render: function(file){
            var self = this;
            G.getBlobUrl(file , function(blobUrl){
                var dom;
                var ext = G.getFileSuffix(file.name);
                if (G.contain(ext , self.imageExtRange)) {
                    dom = self.createImage(file.id , blobUrl);
                } else {
                    dom = self.createFile(file.id , file.name , blobUrl);
                }
                self.initFileDomEvent(dom);
                self.dom.preview.append(dom);
            });
        } ,

        // 追加模式：渲染内容
        renderForAppend: function(files){
            var self = this;
            files.forEach(function (file) {
                self.render(file);
            });
        } ,

        // 检查待上传文件是否为空
        empty: function(){
            return this.file.length < 1;
        } ,

        // 文件上传
        upload: function(){
            if (this.empty()) {
                console.log('待上传文件列表为空');
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
                            self.option.uploaded.call(self , arguments);
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
        renderForOverride: function(files){
            var self = this;
            this.dom.preview.html('');
            files.forEach(function (file) {
                self.render(file);
            });
        } ,

        createFile (id , name , url) {
            var div = document.createElement('div');
                div = G(div);
                div.addClass(['item' , 'file']);
                div.data('id' , id);
                div.data('url' , url);
            var html = '';
                html += '    <div class="inner">';
                html += '       <div class="line ico"><i class="iconfont run-iconfont run-wenjian"></i></div>';
                html += '       <div class="line text">' + name + '</div>';
                html += '    </div>';
                html += '   <div class="mask">';
                html += '       <div class="line view run-action-feedback"><i class="iconfont run-iconfont run-chakan"></i></div>';
                html += '       <div class="line delete run-action-feedback"><i class="iconfont run-iconfont run-shanchu"></i></div>';
                html += '   </div>';
                html += '   <div class="progress hide">';
                html += '       <div class="total">';
                html += '           <div class="current"></div>';
                html += '       </div>';
                html += '    </div>';
                html += '   <div class="status hide">';
                html += '       <i class="success iconfont run-iconfont run-chenggong hide"></i>';
                html += '       <i class="error iconfont run-iconfont run-shibai hide"></i>';
                html += '    </div>';


            div.html(html);
            return div.get(0);
        } ,

        createImage (id , src) {
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
            html += '       <div class="line view run-action-feedback"><i class="iconfont run-iconfont run-chakan"></i></div>';
            html += '       <div class="line delete run-action-feedback"><i class="iconfont run-iconfont run-shanchu"></i></div>';
            html += '   </div>';
            html += '   <div class="progress hide">';
            html += '       <div class="total">';
            html += '           <div class="current"></div>';
            html += '       </div>';
            html += '    </div>';
            html += '   <div class="status hide">';
            html += '       <i class="success iconfont run-iconfont run-chenggong hide"></i>';
            html += '       <i class="error iconfont run-iconfont run-shibai hide"></i>';
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