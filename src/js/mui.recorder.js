(function (mui) {
    /*-----------------------基础的一些东西，常用的类似jquery的一些函数，不依赖jquery*/
    //严格模式，尽早发现一些可能存在的错误
    "use strict";
    /*
    *   _$ 类jquery的$
    *   FPS 为帧数，默认为60
    *   ids 唯一标识符，自增的，确保唯一性
    * */
    var _$=_$||{};var FPS=60,ids=0;
    /*空函数*/
    _$.noop=function () {};
    /*是否是数组*/
    _$.isArray=function (o) {
        return Object.prototype.toString.call(o)=='[object Array]';
    };
    /*是否是纯对象，毕竟万物皆对象*/
    _$.isPlainObject=function (o) {
        return Object.prototype.toString.call(o)=='[object Object]';
    };
    /*是否是一个函数*/
    _$.isFunction=function (o) {
        return Object.prototype.toString.call(o)=='[object Function]';
    };
    /*是否在数组内部   当然对象貌似也可以，但我没有测试过*/
    _$.inArray=function (a,b) {
        var _a,_b;
        if(typeof a == "object"){
            _a=JSON.stringify(a);
        }
        if(typeof b=="object"){
            _b=JSON.stringify(b);
        }
        return new RegExp(_a).test(_b);
    };
    /*jquery中的强大的一个函数，多种传参默认，具体参考就jquery的extend,这里不再赘述*/
    _$.extend = function() {
        var src, copyIsArray, copy, name, options, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;

        // Handle a deep copy situation
        if ( typeof target === "boolean" ) {
            deep = target;

            // skip the boolean and the target
            target = arguments[ i ] || {};
            i++;
        }

        // Handle case when target is a string or something (possible in deep copy)
        if ( typeof target !== "object" && !_$.isFunction(target) ) {
            target = {};
        }

        // extend jQuery itself if only one argument is passed
        if ( i === length ) {
            target = this;
            i--;
        }

        for ( ; i < length; i++ ) {
            // Only deal with non-null/undefined values
            if ( (options = arguments[ i ]) != null ) {
                // Extend the base object
                for ( name in options ) {
                    src = target[ name ];
                    copy = options[ name ];

                    // Prevent never-ending loop
                    if ( target === copy ) {
                        continue;
                    }

                    // Recurse if we're merging plain objects or arrays
                    if ( deep && copy && ( _$.isPlainObject(copy) || (copyIsArray = _$.isArray(copy)) ) ) {
                        if ( copyIsArray ) {
                            copyIsArray = false;
                            clone = src && _$.isArray(src) ? src : [];

                        } else {
                            clone = src && _$.isPlainObject(src) ? src : {};
                        }

                        // Never move original objects, clone them
                        target[ name ] = _$.extend( deep, clone, copy );

                        // Don't bring in undefined values
                    } else if ( copy !== undefined ) {
                        target[ name ] = copy;
                    }
                }
            }
        }
        // Return the modified object
        return target;
    };
    /*一个类似jquery的each函数，
    * 不同的是这个如果回调函数返回的是字符串break，则打破for循环
    * this指针同样也会改变，这点和jquery一样 callback中也会有三个参数  第一个为序号，第二个为当前和this等同
    * 暂不支持对象的遍历
    * */
    function each(arr,callback) {
        for (var i=0;i<arr.length;i++){
            if(callback.call(arr[i],i,arr[i])=="break"){
                break
            }
        }
    }
    /*
    * 检验方法是否是通过new触发的，如果不是则抛出错误
    * */
    function checkConstruction(_object) {
        if(_object==window){
            throw "此方法只能通过new来创建，不允许直接调用，此举会污染window对象！"
        }
    }
    /*
     * 原型函数的继承
     * */
    function beget(_object) {
        var FF=function () {};
        FF.prototype=_object;
        return new FF();
    }
    /*-------------------- Stage 解析 ---------------------
     * 理解成  空间，舞台，世界都可以
     * 你所看见的所有的东西都在这个东西里面。
     * 要想让用户看到这个东西，我们可以分为以下4个简单的步骤
     * 1：创造一个空间   2：创造一个物体  3：将这个物体放入这个空间中    4：加入时间概念。
     * 代码如何实现呢？
     * var testWorld=new Stage(xxx);
     * var test1=new Circle();
     * testWorld.add(test1);
     * testWorld.render();
     * 这样就完成了，暂时忘记css吧，你可不是在写页面，你现在在创造一些新的规则。
     * */
    function Stage(canvas,options) {
        /*
        *  -------------参数解析--------------
        *  canvas，页面中的canvas对象，必须是一个canvas节点对象
        *  ----------options配置解析--------
        *  id,暂时没有用
        *  width 画布的宽度
        *  height 画布的高度
        *  ----------this解析-----------------
        *  this.canvas  canvas真实的节点信息
        *  this.ctx 当前canvas的上下文
        *  this.box 这个虚拟世界的容器，所有的物体都放入了这里才能展现出来
        * */
        var defaultOptions={
            id:ids++,
            width:null,
            height:null
        };
        _$.extend(this,defaultOptions,options);
        this.canvas=canvas;
        this.canvas.width=this.width;
        this.canvas.height=this.height;
        this.ctx=this.canvas.getContext("2d");
        this.box=[];
    }
    /*这个空间拥有的一些能力
    * 1.加入一个或一堆物体
    * 2.移除一个物体
    * 3.查找一个或一堆物体
    * 4.时间的能力
    * 5.画出矩形
    * 6.画圆形
    * 7.画波动
    * 8.画文本
    * 9.画线
    *
    * 上面的顺序没有严格对照下面的顺序
    * 我会逐步解析每一个能力
    * */
    Stage.prototype={
        ids:0,//ids 这个暂时没有用
        add:function (_object,index) {
            /*---------- 加入一个物体-----------
            * 第一个参数为这个具体的物体    第二个参数为层级（越往后层级越高，我们按照后来居上的原则）
            * */
            var _this=this;
            /*对位置进行处理，不符合要求就为0*/
            index=isNaN(index)&&(this.box.length)||0;
            /*判断你是传入了一个物体还是一堆物品
            * 如果是一堆，则批量插入
            * */
            if(_$.isArray(_object)){
                each(_object,function () {
                    _this.box.splice(index,0,this)
                })
            }else {
                _this.box.splice(index,0,_object)
            }
            /*这个空间的容量
            * 限制下是为了防止物体过多引起的卡顿，如果物体数量超过1500，则先进先出的原则踢出这个空间
            * */
            if(this.box.length>1500){
                this.box.splice(0,1);
            }
        },
        remove:function (id) {
            var _this=this;
            /*移除一个物体的能力
            * 暂不支持多个移除，因为没有地方用到
            * 每个物体都有一个唯一id值，类似身份证号，我们就通过这个来移除
            * */
            each(this.box,function (i) {
                if(id==this.id){
                    _this.box.splice(i,1);
                    return "break";
                }
            })
        },
        render:function (animate,ctx,box) {
            var _this=this;
            /*   时间的能力
            * 时间一旦停止就像拍出的照片一样，画面永远定格在那一刻
            * 而我们要做的就是给空间赋予时间的概念，就像从宇宙大爆炸开始时时间就诞生了一样
            * 当我们把空间创造出来  stage.render()触发的那一刻，时间就开始了，永不停歇。
            * 现实生活中，最小的时间间隔是普朗克时间，在这里最小的时间间隔是1000/FPS 因为FPS默认是60，所以我们的时间间隔是60分之1秒
            * ------------参数解析------------------
            * 后面两个暂时不用，所以只解析第一个
            * animate可以理解为上帝想干的事情
            * 每一帧都会触发这个函数，你想干什么都可以，前提必须是一个函数
            * */
            clearInterval(this.interval);
            this.interval=setInterval(function () {
                if(animate){
                    animate();
                }
                ctx=ctx||_this.ctx;
                box=box||_this.box;
                /*前一秒的东西全部清除。那些都是过去式*/
                ctx.clearRect(0,0,_this.width,_this.height);
                /*遍历这个空间里所有的物体，并根据物体的性质，来做他们想做的事情*/
                each(box,function (i) {
                    /*如果这个物体是隐藏的或者不显示的，就跳过这个物体
                    * 疑惑解答
                    * 隐藏属性     是从一开始到最后都是不变的值，从创造这个物体就存在
                    * 不显示属性   可变的值，前期可能不显示，达到某些条件也许就显示了
                    *
                    * */
                    if(!this.show||this.hide)return;
                    /*通过这个物体的类型来执行相应的事件*/
                    switch (this.type){
                        case "rect":
                            _this.drawRect(this);//画矩形
                            break;
                        case "temperament":
                            _this.drawTemperament(this);//画频率图
                            break;
                        case "img":
                            _this.drawRect(this);//画图片
                            break;
                        case "line":
                            _this.drawLine(this);//画线
                            break;
                        case "circle":
                            _this.drawCircle(this);//画圆
                            break;
                        case "text":
                            _this.drawText(this);//画文本
                            break;
                        default:
                            break;
                    }
                })
            },1000/FPS);
        },
        drawRect:function (option,ctx) {
            var _this=this;
            ctx=ctx||this.ctx;
            //存储当前状态，为后面的复原做准备
            ctx.save();
            //移动画布到这个物体的中心点
            ctx.translate(option.center.x,option.center.y);
            //旋转画布来达到旋转物体的效果
            ctx.rotate(option.angle);
            //设置填充色
            ctx.fillStyle=option.backgroundColor;
            //设置填充区域
            ctx.fillRect(-option.width/2,-option.height/2,option.width,option.height);
            //是否有边框
            if(option.strokeStyle){
                //开始路径
                ctx.beginPath();
                //线宽度，实际是边框宽度
                ctx.lineWidth=option.lineWidth||0;
                //线的颜色
                ctx.strokeStyle=option.strokeStyle;
                //线的矩形路径
                ctx.strokeRect(-option.width/2,-option.height/2,option.width,option.height);
                //关闭路径
                ctx.closePath();
            }
            //是否有文本
            if(option.text){
                //设置字体效果
                ctx.font=option.font||"48px";
                //设置字体上下基准
                ctx.textBaseline=option.textBaseline||"middle";
                //设置字体左右基准
                ctx.textAlign=option.textAlign||"center";
                //设置字体颜色
                ctx.fillStyle=option.color||option.colorDeafult||"#000";
                //在指定的位置写字，我们默认是矩形的中心点
                ctx.fillText(option.text,0,0);
            }
            //是否有背景图片
            if(option.img){
                //绘制背景图
                ctx.drawImage(option.img,option.x,option.y,option.width,option.height)
            }
            //对刚才的旋转和位移做还原处理
            ctx.restore();
        },
        drawTemperament:function (option,ctx) {
            /*画频率图
            * 由许多个小矩形组成，把每个矩形画上去就行了
            * */
            this.drawRect(option,ctx);
            /*如果当前的这个物体不允许动的画就不做处理，只显示即可*/
            if(!option.enableAnimation)return ;
            /*如果是活动的，进行高度模拟，每一次增加1，达到最大值后，随机一个高度，然后再执行。*/
            option.dir=option.dir||1;
            option.height+=option.dir;
            if(option.height>option.src.height){
                option.dir=-1;
                option.height=parseInt(Math.random()*option.src.flux)
            }else if(option.height<option.src.height-option.src.flux){
                option.dir=1;
            }
        },
        drawLine:function (option,ctx) {
            /*画线
             * 将线的路径依次输入即可
             * 路径是点的集合，全部存在points中
             * */
            var _this=this;
            ctx=ctx||this.ctx;
            if(option.points.length>1){
                ctx.fillStyle="rgba(0,0,0,0)";
                for (var i=1;i<option.points.length;i++){
                    (function (_start) {
                        ctx.lineWidth=this.width||option.width||2;
                        ctx.strokeStyle=this.strokeStyle||option.strokeStyle;
                        ctx.beginPath();
                        ctx.moveTo(_start.x,_start.y);
                        /*二次贝塞尔，用来创造曲线*/
                        ctx.bezierCurveTo(_start.x,_start.y+(this.y-_start.y)/2,this.x-(this.x-_start.x)/2,this.y,this.x,this.y);
                        ctx.stroke();
                    }).call(option.points[i].center||option.points[i],option.points[i-1].center||option.points[i-1]);
                }
            }
        },
        drawCircle:function (option,ctx) {
            /*画圆
             * 和矩形差不多，同样的内容这个不再赘述
             * */
            var _this=this;
            ctx=ctx||this.ctx;
            ctx.beginPath();
            ctx.strokeStyle=option.strokeStyle;
            ctx.lineWidth=option.lineWidth||0;
            ctx.arc(option.center.x,option.center.y,option.r,option.startRad,option.endRad,option.anticlockwise);
            ctx.stroke();
            if(option.backgroundColor){
                ctx.fillStyle=option.backgroundColor;
                ctx.fill();
            }
            ctx.closePath();
            if(option.text){
                ctx.font=option.font||"48px";
                ctx.textBaseline=option.textBaseline||"middle";
                ctx.textAlign=option.textAlign||"center";
                ctx.fillStyle=option.color||option.colorDeafult||"#000";
                ctx.fillText(option.text,option.center.x,option.center.y);
            }
            if(option.img){
                ctx.drawImage(option.img,option.x,option.y,option.width,option.height)
            }
            /*如果这个物体有render函数，则每一桢都会执行一次这个函数
            * 例如  进度条就很有用，要不停的获取音频当前的百分比位置
            * */
            if(option.render){
                option.render.call(option)
            }
        },
        drawText:function (option,ctx) {
            /*文本
             * 同样的内容这个不再赘述，
             * 唯一的不同就是这里多了个render函数，另外可以指定x，y的坐标
             * */
            var _this=this;
            ctx=ctx||this.ctx;
            ctx.save();
            if(option.render){
                option.render();
            }
            ctx.translate(option.center.x,option.center.y);
            ctx.rotate(option.angle);
            ctx.font=option.font||"24px";
            ctx.textBaseline=option.textBaseline;
            ctx.textAlign=option.textAlign;
            ctx.fillStyle=option.color||"#000";
            ctx.fillText(option.text,0,0);
            ctx.restore();
        },
        getType:function (option) {
            /*查找物体的能力
             * 如果参入的参数是字符串，就默认查type的值
             * 如果传入的是对象
             * 则是精确查找指定的参数
             * 例如 {id:1} 就是查找id为1的物体，返回值都是数组
             * */
            var arr=[];
            for(var i=0;i<this.box.length;i++){
                if(typeof option=="string"){
                    if(this.box[i].type==option){
                        arr.push(this.box[i]);
                    }
                }else {
                    (function () {
                        for(var key in option){
                            if(this[key] !=option[key]){
                                return
                            }
                        }
                        arr.push(this);
                    }).call(this.box[i])
                }
            }
            return arr
        },
        pointIn:function (point) {
            /*暂时没有用到*/
            var obstacles=this.getType({gameType:"obstacle"});
            for(var i=0;i<obstacles.length;i++){
                var _obs=obstacles[i];
                if(pointInRect(point,_obs.rotatePoints)){
                    return _obs
                }
            }
            return false
        }
    };
    function swtichXY(_option,_stage) {
        /*坐标的转换，宽高的转换
        * 让本来不支持百分比，left，center之类的值也变的支持
        * _option 是需要转换的物体
        * _stage  是这个物体所在的空间
        * */
        if(_option.width<1){
            _option.width=_option.width*_stage.width;
        }
        if(_option.height<1){
            _option.height=_option.height*_stage.height;
        }
        if(_option.x=="center"){
            _option.x=(_stage.width-_option.width)/2;
        }else if(_option.align){
            if(_option.align[0]=="right"){
                _option.x=_stage.width-_option.x-_option.width
            }else if(_option.align[0]=="center"){
                _option.x=(_stage.width-_option.width)/2+_option.x
            }
        }
        if(_option.y=="center"){
            _option.y=(_stage.height-_option.height)/2;
        }else if(_option.align){
            if(_option.align[1]=="bottom"){
                _option.y=_stage.height-_option.y-_option.height
            }else if(_option.align[1]=="center"){
                _option.y=(_stage.height-_option.height)/2+_option.y
            }
        }
    }
    /*获取两个数的平方和的根，也就是常见的三角函数，求斜边长的*/
    function getDistance(a,b) {
        return Math.sqrt(Math.pow(a.x-b.x,2)+Math.pow(a.y-b.y,2))
    }
    /*所有物体的基础属性，就像每个人都会吃饭，都要睡觉。都有的基础属性
    * 每个基础物体拥有一个共同的setWidthHeight方法
    *setWidthHeight为设置新的宽度和高度的方法
    * */
    function BaseRes(options) {
        var _this=this;
        /*每创造一个物体，ids就加1，确保每个物体都有唯一的id值*/
        ids++;
        options=options||{};
        var defaultOptions={
            id:ids,
            angle:0,//旋转角度
            name:null,//名字
            width:null,//宽度
            height:null,//高度
            x:0,//x坐标
            y:0,//y坐标
            type:"rect",//类型
            url:null,//地址（暂时没有用）
            zIndex:0,//层级（暂时没有用）
            padding:5//内边距（暂时没有用）
        };
        if(options.angle){
            options.angle=Math.PI/180*options.angle;
        }
        _$.extend(this,defaultOptions,options);
        /*算出中心点*/
        this.center=this.center||{
                x:_this.x+_this.width/2,
                y:_this.y+_this.height/2
            };
        if((this.type=="rect"||this.type=="circle")&&!this.points){
            var rx=this.center.x-this.x;
            var ry=this.center.y-this.y;
            /*算出每个点的坐标和旋转后的坐标*/
            this.points=[{x:_this.center.x-rx,y:_this.center.y-ry},{x:_this.center.x+rx,y:_this.center.y-ry},{x:_this.center.x+rx,y:_this.center.y+ry},{x:_this.center.x-rx,y:_this.center.y+ry}];
            this.rotatePoints=[
                rotetedPosition(_this.points[0].x,_this.x+_this.width/2,_this.points[0].y,_this.y+_this.height/2,_this.angle),
                rotetedPosition(_this.points[1].x,_this.x+_this.width/2,_this.points[1].y,_this.y+_this.height/2,_this.angle),
                rotetedPosition(_this.points[2].x,_this.x+_this.width/2,_this.points[2].y,_this.y+_this.height/2,_this.angle),
                rotetedPosition(_this.points[3].x,_this.x+_this.width/2,_this.points[3].y,_this.y+_this.height/2,_this.angle)
            ];
            /*算出矩形的斜边长*/
            this.hypotenuse=Math.sqrt(Math.pow(this.width,2)+Math.pow(this.height,2));
        }
    }
    BaseRes.prototype={
        draw:function () {
            //console.log(456)
        },
        scalPadding:function () {
            /*旋转后的点坐标集合再向外扩大一个内边距范围，暂时没有用*/
            var _this=this;
            var arr=[];
            var center={
                x:_this.x+_this.width/2,
                y:_this.y+_this.height/2
            };
            each(_this.rotatePoints,function () {
                var angle=Math.atan2(this.x-center.x,this.y-center.y);
                var _x=Math.sin(angle)*_this.padding+this.x;
                var _y=Math.cos(angle)*_this.padding+this.y;
                arr.push({x:_x,y:_y});
            });
            return arr
        },
        setWidthHeight:function (width,height) {
            /*设置物体新的宽高，在已有中心点的基础上扩大*/
            var _this=this;
            this.width=width||this.width;
            this.height=height||this.height;
            /* this.center={
             x:_this.x+_this.width/2,
             y:_this.y+_this.height/2
             };*/
            var rx=_this.width/2;
            var ry=_this.height/2;
            /*算出每个点的坐标和旋转后的坐标*/
            this.points=[{x:_this.center.x-rx,y:_this.center.y-ry},{x:_this.center.x+rx,y:_this.center.y-ry},{x:_this.center.x+rx,y:_this.center.y+ry},{x:_this.center.x-rx,y:_this.center.y+ry}];
            this.rotatePoints=[
                rotetedPosition(_this.points[0].x,_this.x+_this.width/2,_this.points[0].y,_this.y+_this.height/2,_this.angle),
                rotetedPosition(_this.points[1].x,_this.x+_this.width/2,_this.points[1].y,_this.y+_this.height/2,_this.angle),
                rotetedPosition(_this.points[2].x,_this.x+_this.width/2,_this.points[2].y,_this.y+_this.height/2,_this.angle),
                rotetedPosition(_this.points[3].x,_this.x+_this.width/2,_this.points[3].y,_this.y+_this.height/2,_this.angle)
            ];
            this.hypotenuse=Math.sqrt(Math.pow(this.width,2)+Math.pow(this.height,2));
        },
        isShow:function () {
            return this.show&&!this.hide
        }
    };
    /*线
    * new Line()可以创建一条线
    * */
    function Line(options) {
        checkConstruction(this);
        options=options||{};
        options.type=options.type||"line";
        options.width=options.width||1;
        options.height=options.height||0;
        options.points=options.points||[];
        options.strokeStyle=options.strokeStyle||"#999";
        BaseRes.call(this,options);
    }
    /*原型，BaseResProto为基础物体的原型
    让line去继承BaseRes的原型，这样就可以使线也拥有BaseRes的方法了
     * */
    var BaseResProto = beget(BaseRes.prototype);
    Line.prototype=BaseResProto;
    /*扩展线的add方法，用于在当前的路径集合中添加新的点*/
    Line.prototype.add=function (point) {
        this.points.push(point);
    };
    /*扩展线的copy方法，用于复制当前的线，并返回复制的结果*/
    Line.prototype.copy=function (option) {
        ids++;
        return new Line(_$.extend(true,{id:ids},option||{},this));
    };
    /*圆形物体
    * 基本上和矩形差不多，无非就是拥有圆的一些特性
    * startRad  开始角度
    * endRad    结束角度
    * anticlockwise  是否是顺时针
    * */
    function Circle(options) {
        checkConstruction(this);
        options=options||{};
        options.type=options.type||"circle";
        options.width=options.width||0;
        options.height=options.height||0;
        options.startRad =options.startRad ||0;
        options.endRad =options.endRad ||Math.PI*2;
        options.anticlockwise =options.anticlockwise ==true;
        BaseRes.call(this,options);
        if(!this.center){
            this.center={
                x:this.x+this.width/2,
                y:this.y+this.height/2
            }
        }
    }
    /*继承，让圆去继承基础物体的一些特性*/
    Circle.prototype=BaseResProto;
    /*文本
    * 属性大致和其他的类同
    * */
    function Text(options) {
        checkConstruction(this);
        options=options||{};
        options.type=options.type||"text";
        options.width=options.width||0;
        options.height=options.height||0;
        options.textBaseline=options.textBaseline||"middle";
        options.textAlign=options.textAlign||"center";
        options.font=options.font||"24px";
        options.fillStyle=options.color||"#000";
        BaseRes.call(this,options);
        if(!this.center){
            this.center={
                x:this.x+this.width/2,
                y:this.y+this.height/2
            }
        }
    }
    /*继承，让文本去继承基础物体的一些特性*/
    Text.prototype=BaseResProto;
    /*这个方法暂时没有用*/
    function deepPoints(points,obs,index,j) {
        var insertPoint=obs.rotatePaddingPoints[j];
        var arr=[];
        for(var i=0;i<points.length;i++){
            if(i==index){
                arr.push({x:insertPoint.x,y:insertPoint.y});
                arr.push({x:points[i].x,y:points[i].y});
            }else {
                if(points[i].status!=undefined){
                    arr.push(_$.extend(true,{},points[i]));
                }else {
                    arr.push({x:points[i].x,y:points[i].y});
                }
            }
        }
        return arr;
    }
    /*时间戳转换成时分秒*/
    function timeToStr(ts) {
        if(isNaN(ts)) {
            return "--:--:--";
        }
        ts=parseInt(ts/1000);
        var h = parseInt(ts / 3600);
        var m = parseInt((ts % 3600) / 60);
        var s = parseInt(ts % 60);
        return(ultZeroize(h) + ":" + ultZeroize(m) + ":" + ultZeroize(s));
    }
    /*时间的补0操作*/
    function ultZeroize(v, l) {
        var z = "";
        l = l || 2;
        v = String(v);
        for(var i = 0; i < l - v.length; i++) {
            z += "0";
        }
        return z + v;
    }
    /*一个点（x1,y1）围绕着另外一个点(x2,y2)，并旋转a角度后的坐标点*/
    function rotetedPosition(x1,x2,y1,y2,a) {
        return {
            x:(x1-x2)*Math.cos(a)-(y1-y2)*Math.sin(a)+x2,
            y:(y1-y2)*Math.cos(a)+(x1-x2)*Math.sin(a)+y2
        }
    }
    /*一个点（x1,y1）是否在一个长方形内*/
    function pointInRect(point,rect) {
        var getCross=function (p1,p2,p) {
            return (p2.x-p1.x)*(p.y-p1.y)-(p.x-p1.x)*(p2.y-p1.y);
        };
        return getCross(rect[0],rect[3],point)*getCross(rect[2],rect[1],point)>=0&&getCross(rect[3],rect[2],point)*getCross(rect[1],rect[0],point)>=0
    }
    //以上是关于空间，时间，物体的解析

    /*-----------------------------------------------分割----------------------------------------------------*/

    //以下是关于录音的真正部分
    var Record=function(element,option) {
        var _this=this;
        /*传入的参数覆盖默认参数，并返回新的参数*/
        this.options=_$.extend(true,{},Record.DEFAULTS,option);
        /*保存当前的节点*/
        this.$element=element;
        /*在当前的节点下创建canvas并加入到当前当前节点下*/
        this.$canvas=document.createElement("canvas");
        this.$element.appendChild(this.$canvas);
        /*初始化*/
        this.init();
    };
    Record.prototype={
        init:function () {
            var _this=this;
            /*对canvas绑定事件*/
            this.bind();
            /*重置状态
            * this.status.longtap   true为长按
            * this.options.status   0为未录音无音频文件   1为已录音未播放   2为已录音正在播放
            * */
            this.status={};
            /*初始化空间*/
            this.stage=new Stage(this.$canvas,{width:(_this.options.canvasStyle.width||_this.$element.offsetWidth)*2,height:(_this.options.canvasStyle.height||_this.$element.offsetHeight)*2});
            //提前转换，宽高左右位置的确定
            swtichXY(this.options.recordButton,this.stage);
            /*初始化录音按钮*/
            this.recordButton=new Circle(this.options.recordButton);
            /*初始化背景图*/
            if(this.recordButton.imagesUrl){
                _this.recordButton.images=[];
                each(this.recordButton.imagesUrl,function () {
                    var _image=new Image();
                    _image.src=this;
                    /*_this.recordButton.images  储存了包括录音，播放，暂停三个图片对象*/
                    _this.recordButton.images.push(_image);
                });
                /*当前显示的图片保存在this.recordButton.img里面
                * this.options.status为当前状态 0为未录音无音频文件   1为已录音未播放   2为已录音正在播放
                * */
                this.recordButton.img=this.recordButton.images[this.options.status];
            }
            /*将录音按钮加入到空间中，以展示出来*/
            this.stage.add(this.recordButton);

            //提前转换，宽高左右位置的确定
            swtichXY(this.options.cancelButton,this.stage);
            /*初始化取消按钮*/
            this.cancelButton=new Circle(this.options.cancelButton);
            /*将取消按钮加入到空间中，以展示出来*/
            this.stage.add(this.cancelButton);

            //提前转换，宽高左右位置的确定
            swtichXY(this.options.playButton,this.stage);
            /*初始化播放按钮*/
            this.playButton=new Circle(this.options.playButton);
            /*将播放按钮加入到空间中，以展示出来*/
            this.stage.add(this.playButton);

            //提前转换，宽高左右位置的确定
            swtichXY(this.options.tipText,this.stage);
            /*初始化提示文本*/
            this.tipText= new Text(this.options.tipText);
            /*将提示文本加入到空间中，以展示出来*/
            this.stage.add(this.tipText);

            //提前转换，宽高左右位置的确定
            swtichXY(this.options.duration,this.stage);
            /*初始化时长文本*/
            this.duration= new Text(this.options.duration);
            /*将时长文本加入到空间中，以展示出来*/
            this.stage.add(this.duration);

            /*初始化连接线，可能存在多条。*/
            if(this.recordButton.lines.length>0){
                each(this.recordButton.lines,function () {
                    /*线
                    * 线不像录音，可以直接用this.recordButton拿到他的值，目前没有直接的变量去访问他，
                    * 但还是有办法去访问他，用空间的查找能力去找他们，具体的操作如下
                    * this.stage.getType("line");能拿到所有的线
                    * 每条线是两个或者以上顶点之间的连线，顶点信息放入points里面即可，支持物体对象和纯坐标。
                    * */
                    var line=new Line({points:[_this[this],_this["recordButton"]],strokeStyle:_this.playButton.strokeStyle});
                    /*将线加入到空间中，以展示出来
                    * 这里的0表示，将线加入到最底层（也就是数组的最前面），他可以被别的物体覆盖。当然，这也是我们想要的效果
                    * */
                    _this.stage.add(line,0);
                });
            }
            /*初始化矩形块*/
            this.temperament=[];
            (function () {
                var temperament=this.options.temperament;
                swtichXY(temperament,this.stage);
                /*频率图 _width 用总宽度除以数量减去间隙得到 */
                var _width=(temperament.width+temperament.interval)/temperament.total-temperament.interval;
                /*高度的画大家都一样，默认就是传的高度*/
                var _height=temperament.height;
                /*x，y的位置*/
                var _x=temperament.x;
                var _y=temperament.y;
                /*遍历总数量，也就是显示多少个上线波动的矩形*/
                for(var i=0 ;i<temperament.total;i++){
                    /*x轴的累加，从最左侧开始，一直到最右侧结束*/
                    _x=_x+temperament.interval+_width;
                    (function (index) {
                        /*矩形
                         * 每个矩形和线稍微不一样，目前没有直接的变量去访问单独的矩形
                         * _this.temperament可以访问所有的频率矩形集合，或者this.stage.getType("temperament")，也能得到
                         * 我们默认他不显示，等到长按开始后再显示
                         * */
                        var _rect=new BaseRes({x:_x,y:_y,width:_width,height:_height,type:"temperament",backgroundColor:temperament.backgroundColorDeafult,strokeStyle:temperament.strokeStyleDeafult,lineWidth:temperament.lineWidth,src:temperament,show:false});
                        /*存入_this.temperament，后期能更快获取到，就可以不用通过空间的查找*/
                        _this.temperament.push(_rect);
                    }).call(this.options.temperament,i);
                }
            }).call(this);
            /*将这一堆矩形加入空间，等待后续显示了就会获得展示*/
            this.stage.add(this.temperament);

            //提前转换，宽高左右位置的确定
            swtichXY(this.options.listenSpeed,this.stage);
            /*初始化试听进度条*/
            this.listenSpeed=new Circle(this.options.listenSpeed);
            /*将试听加入到空间中，以展示出来*/
            this.stage.add(this.listenSpeed);

            //提前转换，宽高左右位置的确定
            swtichXY(this.options.listenSave,this.stage);
            /*初始化试听后的保存按钮*/
            this.listenSave=new BaseRes(this.options.listenSave);
            /*将试听后的保存按钮加入到空间中，以展示出来*/
            this.stage.add(this.listenSave);

            //提前转换，宽高左右位置的确定
            swtichXY(this.options.listenCancel,this.stage);
            /*初始化试听后的取消按钮*/
            this.listenCancel=new BaseRes(this.options.listenCancel);
            /*将试听后的取消按钮加入到空间中，以展示出来*/
            this.stage.add(this.listenCancel);

            /*
            * 时间，从这开始产生，并且永远不会停止（目前没有加入时间停止的概念，后期如有需要可以加入，将定时器保存，然后清除定时器即可）
            * 传入一个函数，或者不传，
            * 每一个时间间隔也就是每一帧画面都会触发这个函数。
            * 用来判断手势的事件效果是不错的，这里要特别说明一点
            * 我们虽然在下面给canvas注册了三个事件，但我已经把事件和渲染分开了。
            * 当手指按下会触发相应的值改变，如_this.touch.touched=true，说明手指被按下了。赋值过程几乎是瞬时的
            * 每一帧都会去判断这些值，然后根据值的变化来触发相应的函数，
            * 也就是说当手指按下 触发了touched=true，也许60分之1秒后，渲染函数察觉到了touch的值改变了，才会触发相应的函数。
            * 所以这和我们平时dom的点击触发，是有一点思想上的改变的。
            *
            * */
            this.stage.render(function () {
                //判断是否手指按下了，因为只有当我们手指按下了，我们才需要在界面上给用户一个反馈。
                if(_this.touch.touched){
                    //判断当前的状态是什么，0为未录音无音频文件   1为已录音未播放   2为已录音正在播放
                    if(_this.options.status==0){
                        //判断是否已经触发了长按，如果长按触发了，那就可以去检测手指的移动事件了。因为我们当前状态下，首先就要求长按触发
                        if(_this.status.longtap){
                            //开始检测手指移动
                            _this.longtapMoving();
                        }else {
                            //没有触发长按，手指不能乱动哦，乱动是不符合长按的需求的
                            if(!_this.touch.touchMoving){
                                /*
                                * 没有乱动的并且手指按下的时候，那我们就来判断以下两点
                                * 1.按压的时长，我们按压的时间间隔必须超过设置的值，才属于长按，这个值的设定在recordButton.longtapTime里面（单位是毫秒）
                                * 2.按压的位置，必须在录音的矩形框内才行。按别的地方当然不被认为生效
                                * 满足以上两点，那我们长按就启动了，后续就开始检测手指的移动即可
                                * */
                                if(_this.touch.startTime&&new Date().getTime()-_this.touch.startTime>=_this.recordButton.longtapTime&&pointInRect(_this.touch.position,_this.recordButton.rotatePoints)){
                                   // console.log("长按录音启动");
                                    //长按开始，触发这个函数
                                    _this.longtapStart();
                                }
                            }
                        }
                    }else if(_this.options.status==1){
                        //暂时用不到唉
                    }
                }
            });
            /*查看audio文件夹
            * 我们录音文件都放入_doc/record文件夹内，方便管理，
            * 如果没有这个文件夹就创建
            * */
            if(window.plus){
                plus.io.resolveLocalFileSystemURL('_doc/', function(entry) {
                    entry.getDirectory('record', {
                        create: true
                    }, function(dir) {
                        _this.directory=dir;
                    }, function(e) {
                        _this.tipText.text="Get directory record failed: " + e.message;
                    });
                }, function(e) {
                    _this.tipText.text="Resolve _doc/ failed: " + e.message;
                });
            }
        },
        longtapStart:function () {//长按后触发一次
            var _this=this;
            this.cancelButton.img="";
            //将提示语改为这个，让用户也知道我们的程序目前在做干什么
            this.tipText.text="加载录音组件...";
            /*检测plus*/
            if(window.plus){
                //获得录音对象
                this.recordObject=plus.audio.getRecorder();
                //判断录音对象
                if(!this.recordObject) {
                    this.options.viewApi.error('录音对象未获取');
                    this.tipText.text="录音对象未获取";
                    return;
                }
                //开始录音
                this.recordObject.record({
                    filename: '_doc/record/'
                }, function(p) {
                    //录音完成啦，用提示语告知用户
                    _this.tipText.text="录音完成"+ p;
                    //获取这个录音文件
                    plus.io.resolveLocalFileSystemURL(p, function(entry) {
                        //设置录音对象为空，因为已经录完了，下次录音会重新初始化
                        _this.recordObject = null;
                        //音频文件对象保存起来
                        _this.recordEntry=entry;
                        //音频文件路径保存起来
                        _this.audioPath="_doc/record/"+entry.name;
                        //录音完成后触发，长按结束事件
                        _this.longtapEnd(entry);
                    }, function(e) {
                        _this.tipText.text="读取录音文件错误:"+ e.message;
                    });
                }, function(e) {
                    _this.tipText.text="录音失败:"+ e.message;
                });
                //返回给外部程序，告诉他我们开始录音了
                this.options.viewApi.start.call(this,this.recordObject);
            }
            //把长按的值设置为true
            this.status.longtap=true;
            //这个时候就可以把线给显示出来了
            each(this.stage.getType("line"),function () {
                this.show=true;
            });
            //这个时候把频率图给显示出来
            each(_this.stage.getType("temperament"),function () {
                this.show=true;
                //设置频率为运动的
                this.enableAnimation=true;
            });
            //设置开始录音的时间，后面通过减去他我们就知道自己录了多久了
            this.duration.startTime=new Date().getTime();
            //取消按钮是否要隐藏起来？
            if(!this.cancelButton.hide){
                //把取消按钮显示出来
                this.cancelButton.show=true;
                //设置从哪出来
                this.cancelButton.center.x-=this.cancelButton.flux;
                //开始一段动画，从出来的位置走向我们设置的位置
                this.cancelButtonAnimation(this.cancelButton.flux/2);
            }
            //取消按钮是否要隐藏起来？
            if(!this.playButton.hide){
                //把试听按钮显示出来
                this.playButton.show=true;
                //设置从哪出来
                this.playButton.center.x+=this.playButton.flux;
                //开始一段动画，从出来的位置走向我们设置的位置
                this.playButtonAnimation(this.playButton.flux/2);
            }
            //取消按钮是否要隐藏起来？
            if(!this.recordButton.hide){
                /*
                * 既然是长按录音按钮了，我们的录音会改变颜色，并弹一下来给用户一个反馈，让他知道我们开始录音了
                * */
                /*设置录音按下的边框颜色*/
                this.recordButton.strokeStyle=this.recordButton.strokeStyleTap;
                /*设置录音按下的背景颜色*/
                this.recordButton.backgroundColor=this.recordButton.backgroundColorTap;
                //开始一段动画，感觉就像弹一下一样
                this.recordButtonAnimation(_this.recordButton.flux);
            }
        },
        restoreStatus1:function () {//录音完成后回到初始化状态
            //将状态设置为0
            this.options.status=0;
            /*将录音的背景图换成第一个状态时的样子*///
            this.recordButton.img=this.recordButton.images[0];
            /*将录音的背景颜色回到默认*///
            this.recordButton.backgroundColor=this.recordButton.backgroundColorDeafult;
            /*将录音的边框颜色回到默认*///
            this.recordButton.strokeStyle=this.recordButton.strokeStyleDeafult;
            /*将试听隐藏*/
            this.listenSave.show=false;
            /*将取消隐藏*/
            this.listenCancel.show=false;
            /*将进度条隐藏*/
            this.listenSpeed.show=false;
            /*将频率隐藏*/
            each(this.stage.getType("temperament"),function () {
                this.show=false;
                /*将频率动画关闭*/
                this.enableAnimation=false;
            });
            /*将提示语回到初始状态*/
            this.tipText.text="长按开始录音";
            /*将时长回到0*/
            this.duration.text="00:00:00";
        },
        recordEnd:function (entry) {//录音完成时触发一次
            //返回给外部程序，告诉他我们录音完成啦
            this.options.viewApi.end.call(this,entry);
        },
        clearDirectory:function () {//清空录音文件
            var _this=this;
            /*判断录音文件夹是否存在（这个在我们初始化的时候就拿到了文件夹的对象）*/
            if(_this.directory){
                //将录音文件对象清空
                this.recordEntry=null;
                //开始删除
                _this.directory.removeRecursively(function() {
                    _this.tipText.text="音频删除成功！";
                }, function(e) {
                    _this.options.viewApi.error("音频删除失败！");
                });
            }
        },
        longtapMoving:function () {//持续触发的哦，在你长按开始的手指移动过程中持续触发
            var _this=this;
            //进行一个手指当前位置的判断
            if(_this.playButton.isShow()&&pointInRect(_this.touch.position,_this.playButton.rotatePoints)){
                //如果试听按钮在显示着并且我们的手指移动时的坐标正好位于试听按钮内，则触发
                //将试听按钮的背景颜色改为另外一种
                _this.playButton.backgroundColor=_this.playButton.backgroundColorTap;
                //将试听按钮的边框颜色改为另外一种
                _this.playButton.strokeStyle=_this.playButton.strokeStyleTap;
                //将提示语更新
                this.tipText.text="松手试听";
                //将试听按钮的文字颜色设为另外一种
                this.playButton.color=this.playButton.colorTap;
            }else if(_this.cancelButton.isShow()&&pointInRect(_this.touch.position,_this.cancelButton.rotatePoints)){
                //如果取消按钮在显示着并且我们的手指移动时的坐标正好位于取消按钮内，则触发
                //将取消按钮的背景颜色改为另外一种
                _this.cancelButton.backgroundColor=_this.cancelButton.backgroundColorTap;
                //将取消按钮的边框颜色改为另外一种
                _this.cancelButton.strokeStyle=_this.cancelButton.strokeStyleTap;
                //将提示语更新
                this.tipText.text="松手取消录音";
                //将取消按钮的文字颜色设为另外一种
                this.cancelButton.color=this.cancelButton.colorTap;
            }else {
                //如果不在上面的区域内
                //提示文本清空
                _this.tipText.text="";
                //取消按钮是否在显示着
                if(_this.cancelButton.isShow()){
                    /*计算取消按钮中心点与手指触点的距离*/
                    var cancelDistance=getDistance(_this.touch.position,_this.cancelButton.center);
                    //如果距离大于限制的最远距离
                    if(cancelDistance>=_this.cancelButton.limit){
                        //如果距离大于限制的最远距离，则距离等于最大距离
                        cancelDistance=_this.cancelButton.limit
                    }
                    //将半径的值设为   初始半径值+（势力范围-当前距离）/增量
                    _this.cancelButton.r=(_this.cancelButton.rAdd-cancelDistance)/_this.cancelButton.scale+_this.cancelButton.rDefault;
                    //拿到新半径后，设宽度和高度为新半径的2倍，也就是直径
                    _this.cancelButton.setWidthHeight(_this.cancelButton.r*2,_this.cancelButton.r*2);
                    //将按钮的背景颜色恢复成默认
                    _this.cancelButton.backgroundColor=_this.cancelButton.backgroundColorDeafult;
                    //将按钮的边框颜色恢复成默认
                    _this.cancelButton.strokeStyle=_this.cancelButton.strokeStyleDeafult;
                    //将按钮的字体颜色恢复成默认
                    this.cancelButton.color=this.cancelButton.colorDeafult;
                }
                //试听按钮是否在显示着
                if(_this.playButton.isShow()){
                    /*计算试听按钮中心点与手指触点的距离*/
                    var playDistance=getDistance(_this.touch.position,_this.playButton.center);
                    //如果距离大于限制的最远距离
                    if(playDistance>=_this.playButton.limit){
                        //如果距离大于限制的最远距离，则距离等于最大距离
                        playDistance=_this.playButton.limit
                    }
                    //将半径的值设为   初始半径值+（势力范围-当前距离）/增量
                    _this.playButton.r=(_this.playButton.rAdd-playDistance)/_this.playButton.scale+_this.playButton.rDefault;
                    //拿到新半径后，设宽度和高度为新半径的2倍，也就是直径
                    _this.playButton.setWidthHeight(_this.playButton.r*2,_this.playButton.r*2);
                    //将按钮的背景颜色恢复成默认
                    _this.playButton.backgroundColor=_this.playButton.backgroundColorDeafult;
                    //将按钮的边框颜色恢复成默认
                    _this.playButton.strokeStyle=_this.playButton.strokeStyleDeafult;
                    //将按钮的字体颜色恢复成默认
                    this.playButton.color=this.playButton.colorDeafult;
                }
            }
        },
        longtapEnd:function (entry) {//结束
            /*
            * 这个函数会触发多次，录音完成时会触发，手指松开也会触发
            * 通过判断录音对象的有无来区别，
            * this.recordObject有值：我们应该是松开手指了触发的
            * this.recordObject无值：我们应该是录音完成了触发的
            * */
            var _this=this;
            if(this.recordObject) {
                //有值说明录音没有完成，我们就手动stop
                this.recordObject.stop();
            }else {
                //如果长按都没有启动就松开了，就直接返回
                if(!this.status.longtap)return;
                //定义一个状态
                var status="";
                //进行一个手指松开位置的判断
                if(_this.playButton.isShow()&&pointInRect(_this.touch.position,_this.playButton.rotatePoints)){
                    //如果试听按钮在显示着并且我们的手指松开时的坐标正好位于试听按钮内，则触发播放
                    //设置状态为播放
                    status="playing";
                    //返回给外部程序，告诉他我们录音完成后开始试听啦
                    this.options.viewApi.listen.call(this,this.recordEntry);
                    //this.options.viewApi.listen.call(this,this.recordObject);
                    //开始试听的准备
                    this.startListen();
                }else if(_this.cancelButton.isShow()&&pointInRect(_this.touch.position,_this.cancelButton.rotatePoints)){
                    //如果取消按钮在显示着并且我们的手指松开时的坐标正好位于取消按钮内，则触发取消
                    //将时长清空为0
                    this.cancelButton.show=false;
                    this.duration.text="00:00:00";
                    //设置状态为取消
                    status="cancel";
                    //返回给外部程序，告诉他我们录音完成后取消啦
                    this.options.viewApi.cancel.call(this,this.recordEntry);
                    //我们将录音文件删除
                    _this.clearDirectory();
                }else {
                    //如果手指松开的位置不在上面两个区域，那我们就是直接触发保存
                    //设置状态为保存
                    status="save";
                    //触发录音完成事件
                    this.recordEnd(entry);
                    //返回给外部程序，告诉他我们录音完成啦
                    this.options.viewApi.end.call(this,this.recordEntry);
                }
                //将录音开始的时间清空
                this.duration.startTime=null;
                //将长按状态恢复成false
                this.status.longtap=false;
                //将点击开始时间清空
                this.touch.startTime=null;
                //将试听按钮隐藏
                this.playButton.show=false;
                //将取消按钮隐藏
                this.cancelButton.show=false;
                //将连接线隐藏
                each(this.stage.getType("line"),function () {
                    this.show=false;
                });
                //如果状态不等于试听，会触发以下事件
                if(status!="playing"){
                    //将频率图隐藏
                    each(_this.stage.getType("temperament"),function () {
                        this.show=false;
                    });
                    //将录音按钮边框重置为默认
                    this.recordButton.strokeStyle=this.recordButton.strokeStyleDeafult;
                    //将录音按钮背景重置为默认
                    this.recordButton.backgroundColor=this.recordButton.backgroundColorDeafult;
                    //一秒后文本恢复成默认（在一秒内可能会提示别的语句）
                    setTimeout(function () {
                        _this.tipText.text="长按开始录音";
                    },1000)
                }
            }
        },
        playButtonAnimation:function (flux) {//试听按钮的动画
            var _this=this;
            //弹性值递减
            flux--;
            //中心点递减2
            this.playButton.center.x-=2;
            //判断当前弹性值
            if(flux>0){
                //如果弹性值大于0 则下一桢再触发本函数，（这好像算一个递归函数）
                setTimeout(function () {
                    _this.playButtonAnimation(flux)
                },1000/60)
            }
        },
        cancelButtonAnimation:function (flux) {//取消按钮的动画
            var _this=this;
            //弹性值递减
            flux--;
            //中心点递加2
            this.cancelButton.center.x+=2;
            //判断当前弹性值
            if(flux>0){
                //如果弹性值大于0 则下一桢再触发本函数，（这好像算一个递归函数）
                setTimeout(function () {
                    _this.cancelButtonAnimation(flux)
                },1000/60)
            }
        },
        recordButtonAnimation:function (flux) {//录音按钮的动画
            var _this=this;
            //弹性值递减
            flux--;
            //判断当前弹性值的绝对值和初始弹性值的一个大小关系
            if(Math.abs(flux)<_this.recordButton.flux){
                //将当前半径值改变，（可能是放大，或者缩小，因为当大的一定程度时就会开始缩小，这个一定程度就是flux）
                _this.recordButton.r+=flux;
                //依然，我们递归本函数
                setTimeout(function () {
                    _this.recordButtonAnimation(flux);
                },1000/60)
            }
        },
        startListen:function () {//点了试听后
            var _this=this;
            //将提示语清空
            this.tipText.text="";
            //将频率图显示出来
            each(this.stage.getType("temperament"),function () {
                this.show=true;
                //将频率图的动画关闭
                this.enableAnimation=false;
            });
            //进度条显示出来
            this.listenSpeed.show=true;
            //进度条的边框改为灰色
            this.listenSpeed.strokeStyle="#eee";
            //将状态设置为1 0为未录音无音频文件   1为已录音未播放   2为已录音正在播放
            this.options.status=1;
            //将录音按钮转换成播放按钮，
            this.recordButton.img=this.recordButton.images[1];
            //将录音按钮的背景颜色设为透明
            this.recordButton.backgroundColor="rgba(0,0,0,0)";
            //将试听后的保存按钮显示出来
            this.listenSave.show=true;
            //将试听后的取消按钮显示出来
            this.listenCancel.show=true;
        },
        listening:function () {//在this.options.status==1时，松开手指就会触发
            var _this=this;            
            //判断松开手指的坐标位置
            if(this.recordButton.isShow()&&pointInRect(this.touch.position,this.recordButton.rotatePoints)){
                //如果位于试听按钮内部，则触发播放开始操作
                this.audioStart();
            }else if(this.listenSave.isShow()&&pointInRect(this.touch.position,this.listenSave.rotatePoints)){
                //如果位于保存按钮内部，则触发保存操作
                this.audioSave();
            }else if(this.listenCancel.isShow()&&pointInRect(this.touch.position,this.listenCancel.rotatePoints)){
                //如果位于取消内部，则触发取消操作
                this.audioCancel();
            }
        },
        endListening:function () {//在this.options.status==2时，松开手指就会触发
            //判断松开手指的坐标位置
            if(this.recordButton.isShow()&&pointInRect(this.touch.position,this.recordButton.rotatePoints)){
                //如果位于试听按钮内部，则触发播放结束操作
                this.audioStop();
            }else if(this.listenSave.isShow()&&pointInRect(this.touch.position,this.listenSave.rotatePoints)){
                //如果位于保存按钮内部，则触发保存操作               
                this.audioSave();
            }else if(this.listenCancel.isShow()&&pointInRect(this.touch.position,this.listenCancel.rotatePoints)){
                //如果位于取消内部，则触发取消操作
                this.audioCancel();
            }
        },
        audioSave:function () {//保存操作
            var _this=this;
            this.cancelButton.show=false;
            //返回给外部程序，告诉他我们录音完成了，虽然是试听后的保存，但和不试听直接保存是一样的
            this.options.viewApi.end.call(this,this.recordEntry);
            //判断音频是否存在
            if(this.audio){
                //如存在则停止播放，虽然不知道是不是真的在播放
                this.audio.stop();
                //600毫秒后将录音按钮的背景图恢复成默认
                setTimeout(function () {
                    _this.recordButton.img=_this.recordButton.images[0];
                },600)
            }
            //重置最初始状态
            this.restoreStatus1();
        },
        audioCancel:function () {
            var _this=this;
            this.cancelButton.show=false;
            //返回给外部程序，告诉他我们录音取消了，虽然是试听后的取消，但和不试听直接取消是一样的
            this.options.viewApi.cancel.call(this);
            //判断音频是否存在
            if(this.audio){
                //如存在则停止播放，虽然不知道是不是真的在播放
                this.audio.stop();
                //600毫秒后将录音按钮的背景图恢复成默认
                setTimeout(function () {
                    _this.recordButton.img=_this.recordButton.images[0];
                },600)
            }
            //清空文件夹
            this.clearDirectory();
            //重置最初始状态
            this.restoreStatus1();
        },
        audioStart:function () {//开始播放的准备
            var _this=this;
            //判断plus
            if(window.plus){
                //如果是5+模式，将之前的录音路径放进去，新建一个音频播放对象
                this.audio=plus.audio.createPlayer(_this.audioPath);
                //将进度条的音频对象关联到当前的音频上
                this.listenSpeed.audio=this.audio;
            }
            //将时长的音频对象关联到当前的音频上
            this.duration.audio=this.audio;
            //判断当前音频
            if(this.audio){
                //开始播放
                this.audio.play(function () {
                    //播放完毕时触发
                    _this.audioStop(true);
                },function (e) {
                    //console.log(JSON.stringify(e))
                });
            }
            //设置状态为2   0为未录音无音频文件   1为已录音未播放   2为已录音正在播放
            this.options.status=2;
            //设置录音按钮的背景图片为停止播放的那个图片
            this.recordButton.img=this.recordButton.images[2];
            //设置录音按钮的背景颜色为透明
            this.recordButton.backgroundColor="rgba(0,0,0,0)";
            //将频率图的动画启用
            each(this.stage.getType("temperament"),function () {
                this.enableAnimation=true;
            });
        },
        audioStop:function () {//播放停止时触发
            //设置状态为1   0为未录音无音频文件   1为已录音未播放   2为已录音正在播放
            this.options.status=1;
            //设置录音按钮的背景图片为播放的那个图片
            this.recordButton.img=this.recordButton.images[1];
            //设置录音按钮的背景颜色为透明
            this.recordButton.backgroundColor="rgba(0,0,0,0)";
            //将频率图的动画关闭
            each(this.stage.getType("temperament"),function () {
                this.enableAnimation=false;
            });
            //判断当前音频
            if(this.audio){
                //如存在则停止播放
                this.audio.stop();
                //时长文本显示为音频的总长度
                this.duration.text=timeToStr(this.audio.getDuration()*1000);
            }
            //进度条的结束点清空
            this.listenSpeed.endRad=0;
            //将进度条关联的音频清空
            this.listenSpeed.audio=null;
            //将时长关联的音频清空
            this.duration.audio=null;
        },
        getRelative:function (elem,pagePosition) {//通过点击时的x，y坐标，转换为canvas的坐标
            //获取当前节点的偏移值
            var position={
                x:elem.offsetLeft,
                y:elem.offsetLeft
            };
            //将ele变为自己的父元素
            elem=elem.offsetParent;
            //循环处理，纸质算到最后一个父节点
            while(elem!=null){
                position.x+=elem.offsetLeft;
                position.y+=elem.offsetTop;
                elem=elem.offsetParent;
            }
            //将返回值转换后的canvas坐标返回
            //这里要乘以2，为什么呢？
            //因为我们的canvas宽度实际是当前节点的宽度的二倍，为了生成高清晰度的图片而故意这样设置的，所以要乘以2
            return {
                x:(pagePosition.pageX-position.x)*2,
                y:(pagePosition.pageY-position.y)*2
            };
        },
        bind:function () {//绑定事件
            var _this=this;
            //将touch初始化，
            _this.touch={};
            //将touch的位置初始化，
            _this.touch.position={x:0,y:0};
            //对canvas绑定touchstart函数，
            this.$canvas.addEventListener("touchstart",function (event) {
                //将touch的开始点和位置，设为当前手指的位置
                _this.touch.start=_this.touch.position=_this.getRelative(this,event.changedTouches[0]);
                //将开始点击的时间保存
                _this.touch.startTime=new Date().getTime();
                //将touched变为true
                _this.touch.touched=true;
                //将手指是否移动了 设为false
                _this.touch.touchMoving=false;
            });
            //对canvas绑定touchmove函数，
            this.$canvas.addEventListener("touchmove",function (event) {
                //将touch的位置，设为当前手指的位置
                _this.touch.position=_this.getRelative(this,event.changedTouches[0]);
                //判断手指移动的幅度
                if(!_this.touch.touchMoving&&getDistance(_this.touch.position,_this.touch.start)>10){
                    //防止误操作，移动距离大于10则设touchMoving为true，这样的话就不会触发长按了
                    _this.touch.touchMoving=true;
                }
            });
            //对canvas绑定touchend函数，
            this.$canvas.addEventListener("touchend",function (event) {
                //将touch的位置，设为当前手指的位置
                _this.touch.position=_this.getRelative(this,event.changedTouches[0]);
                //将touch的结束时间，设为当前时间
                _this.touch.endTime=new Date().getTime();
                //60分1秒触发touched为false
                //这样做的原因是：用户在快速点击然后松开，如果其中的间隔小于60分之1秒，则有可能不能被渲染函数捕捉到变化，所以做个延迟处理
                setTimeout(function () {
                    _this.touch.touched=false;
                },1000/60);
                //判断当前的状态
                switch (_this.options.status){
                    case 0:
                        //0则触发长按结束（还不确定是否启动了长按，如果没有的话，那个函数就直接返回，并不会做操作）
                        _this.longtapEnd();
                        break;
                    case 1:
                        //1则触发试听后未播放状态下的手指松开事件
                        _this.listening();
                        break;
                    case 2:
                        //2则触发试听后已播放状态下的手指松开事件
                        _this.endListening();
                        break;
                    default:
                        break;
                }
            });
        }
    };
    //我们的默认值，这个在recoder.html有详细的说明
    Record.DEFAULTS={
        canvasStyle:{
            width:0,
            height:0
        },
        recordButton:{
            show:true,
            flux:5,
            x:"center",
            y:120,
            width:240,
            height:240,
            r:120,
            rDefault:120,
            strokeStyle:"#edcea2",
            lineWidth:2,
            type:"circle",
            startRad:0,
            endRad:0,
            anticlockwise:true,
            align:["left","bottom"],
            lines:["playButton","cancelButton"],
            longtapTime:500,
            backgroundColor:"#edcea2",
            strokeStyleTap:"#e0935f",
            backgroundColorTap:"#e0935f",
            strokeStyleDeafult:"#edcea2",
            backgroundColorDeafult:"#edcea2",
            imagesUrl:["src/img/common/record.png","src/img/common/playing.png","src/img/common/stop.png"]
        },
        cancelButton:{
            hide:false,
            show:false,
            id:"cancel",
            x:200,
            y:335,
            width:80,
            height:80,
            r:40,
            rDefault:40,
            scale:4,
            strokeStyle:"#e0935f",
            flux:40,
            lineWidth:2,
            type:"circle",
            startRad:0,
            endRad:0,
            anticlockwise:true,
            align:["center","bottom"],
            backgroundColor:"#fff",
            text:"取消",
            strokeStyleTap:"#e0935f",
            backgroundColorTap:"#e0935f",
            strokeStyleDeafult:"#e0935f",
            backgroundColorDeafult:"#fff",
            font:"400 28px 黑体",
            colorDeafult:"#e0935f",
            colorTap:"#fff",
            limit:200,
            rAdd:200
        },
        playButton:{
            show:false,
            id:"play",
            x:-200,
            y:335,
            width:80,
            height:80,
            flux:40,
            r:40,
            rDefault:40,
            scale:4,
            strokeStyle:"#e0935f",
            lineWidth:2,
            type:"circle",
            font:"400 28px 黑体",
            startRad:0,
            endRad:0,
            anticlockwise:true,
            align:["center","bottom"],
            backgroundColor:"#fff",
            strokeStyleTap:"#e0935f",
            backgroundColorTap:"#e0935f",
            strokeStyleDeafult:"#e0935f",
            backgroundColorDeafult:"#fff",
            limit:200,
            rAdd:200,
            text:"试听",
            colorDeafult:"#e0935f",
            colorTap:"#fff"
        },
        tipText:{
            show:true,
            x:"center",
            y:440,
            width:0,
            height:0,
            textBaseline:"middle",
            textAlign:"center",
            font:"400 28px 黑体",
            align:["center","bottom"],
            text:"长按开始录音",
            color:"#666"
        },
        duration:{
            show:true,
            startTime:null,
            x:"center",
            y:-300,
            width:0,
            height:0,
            textBaseline:"middle",
            textAlign:"center",
            font:"400 120px 黑体",
            align:["center","center"],
            text:"00:00:00",
            color:"#666",
            render:function () {
                if(this.startTime){
                    this.text=timeToStr(new Date().getTime()-this.startTime);
                }else if(this.audio){
                    this.text=timeToStr(this.audio.getPosition()*1000);
                }
            }
        },
        temperament:{
            show:false,
            interval:6,
            total:60,
            x:"center",
            y:-100,
            align:["center","center"],
            width:500,
            height:60,
            flux:30,
            lineWidth:1,
            backgroundColor:"#e0935f",
            strokeStyleTap:"#e0935f",
            backgroundColorTap:"#e0935f",
            strokeStyleDeafult:"#e0935f",
            backgroundColorDeafult:"#e0935f"
        },
        listenSpeed:{
            show:false,
            x:"center",
            y:120,
            width:240,
            height:240,
            r:120,
            rDefault:120,
            strokeStyle:"#edcea2",
            lineWidth:10,
            type:"circle",
            startRad:0,
            endRad:0,
            anticlockwise:true,
            align:["left","bottom"],
            render:function () {
                if(this.audio){
                    this.endRad=(this.audio.getPosition()/this.audio.getDuration()||-1)*Math.PI*2;
                }
            }
        },
        listenSave:{//确定按钮
            show:false,
            x:-1,
            y:-1,
            align:["left","bottom"],
            width:0.5,
            height:80,
            lineWidth:2,
            strokeStyle:"#e0935f",
            text:"确定",
            color:"#666"
        },
        listenCancel:{//取消按钮
            show:false,
            angle:0,//旋转角度，默认为0
            x:-1,
            y:-1,
            align:["right","bottom"],
            width:0.5,//大于0小于1为百分比 例如0.5=50% 大于1的单位是px
            strokeStyle:"#e0935f",
            lineWidth:2,
            height:80,
            text:"取消",
            color:"#666"
        },
        viewApi:{
            start:_$.noop,
            end:_$.noop,
            cancel:_$.noop,
            listen:_$.noop,
            error:_$.noop
        },
        status:0// 0未录音未播放  1已录音未播放  2已录音已播放
    };
    Record.setDefaults=function () {
        //设置默认，目前没有用
    };
    //声明全局变量
    window.record=function (ele,option) {
        //new 一个 新的录音对象   第一个参数是节点，第二个是配置
        return new Record(document.querySelector(ele),option);
    }
})();