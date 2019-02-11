/**
 * Created by grayVTouch on 2017/9/17.
 */

/**
 * ****************************
 * 定义 component-select 事件
 * ****************************
 */
var ComponentSelect = (function(){
    function ComponentSelect(dom , opt){
        var thisRange = [undefined , null , window];

        if (G.contain(this , thisRange) || !G.contain(this , thisRange) && this.constructor !== ComponentSelect) {
            return new ComponentSelect(dom , opt);
        }

        if (!G.isDOMEle(dom)) {
            throw new TypeError('参数 1 类型错误');
        }

        this._defaultOpt = {
            status: 'n' , // 选择状态： y | n
        };

        if (G.getValType(opt) === 'Undefined') {
            opt = this._defaultOpt;
        }

        this._componentSelect = G(dom);

        this._statusRange = ['y' , 'n'];
        this._status      = G.contain(opt['status'] , this._statusRange) ? opt['status'] : this._defaultOpt['status'];

        this._run();
    }

    ComponentSelect.prototype = {
        constructor: ComponentSelect ,

        _initStaticArgs: function(){
            this._picCon   = G('.pic-con'  , this._componentSelect.get()).first();
            this._pic      = G('.pic'      , this._picCon.get()).first();
            this._textCon  = G('.text-con' , this._componentSelect.get()).first();
        } ,

        _initStaticHTML: function(){

        } ,

        _initStatic: function(){
            // 设置状态
            this.setStatus();
        } ,

        _initDynamicArgs: function(){

        } ,

        _initDynamicHTML: function(){

        } ,

        _initDynamic: function(){

        } ,

        setStatus: function(){
            if (this._status === 'y') {
                this._pic.get().src = this._pic.data('selected');
            } else {
                this._pic.get().src = this._pic.data('pending');
            }
        } ,

        // 获取状态
        getStatus: function(){
            return this._status;
        } ,

        _clickEvent: function(){
            if (this._status === 'y') {
                this._status = 'n';
            } else {
                this._status = 'y';
            }

            this.setStatus();
        } ,

        _defineEvent: function(){
            this._componentSelect.loginEvent('click' , this._clickEvent.bind(this) , true , false);
        } ,

        _run: function(){
            this._initStaticArgs();
            this._initStaticHTML();
            this._initStatic();
            this._initDynamicArgs();
            this._initDynamicHTML();
            this._initDynamic();

            this._defineEvent();
        }
    };

    return ComponentSelect;
})();

/**
 * ***********************************
 * input-item 表单
 * ***********************************
 */
var ComponentInput = (function(){
    function ComponentInput(dom , opt){
        var thisRange = [undefined , null , window];

        if (G.contain(this , thisRange) || !G.contain(this , thisRange) && this.constructor !== ComponentInput) {
            return new ComponentInput(dom , opt);
        }

        if (!G.isDOMEle(dom)) {
            throw new TypeError('参数 1 类型错误');
        }

        this._defaultOpt = {

        };

        if (G.getValType(opt)) {
            opt = this._defaultOpt;
        }

        this._componentInput = G(dom);

        this._run();
    }

    ComponentInput.prototype = {
        constructor: ComponentInput ,

        _initStaticHTML: function(){

        } ,

        _initStaticArgs: function(){
            // 元素
            this._field = G('.field' , this._componentInput.get()).first();
            this._value = G('.value' , this._componentInput.get()).first();
            this._input  = G('.form-text' , this._value.get()).first();

            // 类名
            this._focus     = 'focus-component-input';
            this._nEmpty    = 'not-empty-component-input';

            // 当前状态是 input 焦点状态
            this._status = 'none';
        } ,

        _initStatic: function(){
            if (this._input.get().value !== '') {
                this.focus();
            }
        } ,

        _initDynamicHTML: function(){

        } ,

        _initDynamicArgs: function(){

        } ,

        _initDynamic: function(){

        } ,

        // input 获取焦点
        focus: function(event){
            event.stopPropagation();
            this._status = 'focus';
            this.notEmpty();
            this._componentInput.addClass(this._focus);
        } ,

        // input 失去焦点
        blur: function(event){
            event.stopPropagation();

            this._status = 'blur';
            this._componentInput.removeClass(this._focus);

            if (this._input.get().value === '') {
                this.empty();
            }
        } ,

        // input 为空
        empty: function(){
            this._componentInput.removeClass(this._nEmpty);
        } ,

        // input 不为空
        notEmpty: function(){
            this._componentInput.addClass(this._nEmpty);
        } ,

        _keyUp: function(){
            // 选中状态不做任何处理
            if (this._status === 'focus') {
                return ;
            }

            if (this._input.get().value !== '') {
                this.notEmpty();
            } else {
                this.empty();
            }
        } ,

        _defineEvent: function(){
            this._input.loginEvent('focus' , this.focus.bind(this) , true , false);
            this._input.loginEvent('blur' , this.blur.bind(this) , true , false);
            this._input.loginEvent('keyup' , this._keyUp.bind(this) , true , false);
        } ,

        _run: function(){
            this._initStaticHTML();
            this._initStaticArgs();
            this._initStatic();
            this._initDynamicHTML();
            this._initDynamicArgs();
            this._initDynamic();

            this._defineEvent();
        }
    };

    return ComponentInput;
})();