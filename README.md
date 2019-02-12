# front

前端插件库

# 插件列表

## Boundary

滚动检查。

- 滚动到顶部
- 滚动到底部
- 滚动中

```
<!-- 加载样式 -->
<link rel='stylesheet' href='css/Boundary.css'>

<!-- 测试范例 start -->
<style>
    .container {
        width: 200px;
        height: 300px;
        border: 1px solid red;
        margin: 20px;
        overflow: hidden;
        overflow-y: auto;
    }

    .container .con {
        height: 600px;
        background-color: green;
    }
</style>
<div class="container">
    <div class="con"></div>
</div>
<!-- 测试范例 end -->

<!-- 加载依赖 -->
<script src="../SmallJs/SmallJs.js"></script>
<script src="js/Boundary.js"></script>

<!-- 使用 -->
<script>
    // 支持 dom 元素
    let selector = document.getElementById('test');
    // 支持 id
    let selector = '#id';
    let boundary = new Boundary(selector , {
        // 是否进行初次检查
        once: true ,
        // 滚动条滚动到顶部时触发
        top: function(){
            console.log('滚动到顶部');
        } ,
        // 滚动条滚动到底部时触发
        bottom: function(){
            console.log('滚动到底部');
        } ,
        // 滚动条滚动时触发
        scroll: function(){
            console.log('滚动中');
        }
    });
</script>
```

## css

通用型样式风格。使用前务必载入：

```
<link rel='stylesheet' href='base.css'>
<link rel='stylesheet' href='ui/ui.css'>
```

#### form

表单输入。


`form/filter.css`，表单筛选，载入：

```
<link rel='stylesheet' href='form/filter.css'>
```

使用：

```
<div class='filter-option'>
    <div class='option'>
        <div class='field'>筛选字段1：</div>
        <div class='value'>
            <input type='text' class='form-text'>
        </div>
    </div>
    <div class='option'>
            <div class='field'>筛选字段2：</div>
            <div class='value'>
                <input type='text' class='form-text'>
            </div>
        </div>
</div>
```

`input.css`，输入表单，载入：

```
<link rel='stylesheet' href='form/input.css'>
```

使用：

```
<table class='input-tb'>
    <tbody>
        <tr>
            <td>字段1</td>
            <td>
                <input type='text'>
            </td>
        </tr>
        
        <tr>
            <td>字段2</td>
            <td>
                <input type='text'>
            </td>
        </tr>
    </tbody>
</table>
```

#### table

列表展示。

`line.css`，载入：

```
<link rel='stylesheet' href='line.css'>
```

使用：

```
<table>
    <thead>
        <tr>
            <th class='th-id'></th>
            <th class='th-name'></th>
            <th class='th-phone'></th>
            <th class='th-number'></th>
            <th class='th-status'></th>
            <th class='th-time'></th>
            <th class='th-sex'></th>
            <th class='th-mobile'></th>
            <th class='th-desc'></th>
            <th class='th-addr'></th>
            <th class='th-note'></th>
            <th class='th-opr'></th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>普通行</td>
            <!-- 多行 -->
            <td class='multiple-rows'>
                <div class='row'><img src='one.jpg' class='image'></div>
            </td>
            <td>普通行</td>
            <td>普通行</td>
            <td>普通行</td>
            <td>普通行</td>
            <td>普通行</td>
            <td>普通行</td>
            <td>普通行</td>
            <td>普通行</td>
            <td>普通行</td>
            <td>普通行</td>
        </tr>
    </tbody>
</table>
```

`column.css`，载入：

```
<link rel='stylesheet' href='table/column.css'>
```

使用：

```
<table class='column-tb'>
    <tbody>
        <tr>
            <td>字段：字段值</td>
        </tr>
        <tr>
            <td>字段：字段值</td>
        </tr>
    </tbody>
</table>
```

#### ui

`ui.css` 中主要提供了一些常用的样式结构：

按钮：

```
btn-1
btn-2
btn-3
...
btn-11
```

标题：

```
component-title
component-title-1
component-title-2
component-title-3

<!-- html 结构 -->
<div class='标题样式'>
    <div class='left'></div>
    <div class='right'></div>
</div>
```

字体：

```
f-12
f-13
f-14
f-15
f-16
```

颜色：

```
red 红色
green 绿色
gray 灰色
```

强调：

```
weight 加粗
```

## FunctionNav

导航菜单切换-适用于 `pc/mobile`。

```
<!-- 加载样式 -->
<link rel='stylesheet' href='css/FunctionNav.css'>

<style>
    .container {
        width: 200px;
    }
</style>
<div class="container">

    <!-- 加载结构 -->
    <div class="function-nav">
        <div class="functions clear-float">
            <div class="function" data-id="diary">日常11</div>
            <div class="function cur" data-id="image">图片1234</div>
            <div class="function" data-id="video">视频</div>
            <div class="function" data-id="article">文章123456</div>
            <div class="function" id="circle" data-id="circle">圈子</div>
        </div>
        <div class="slider"></div>
    </div>
    
</div>

<!-- 加载依赖 -->
<script src="../SmallJs/SmallJs.js"></script>
<script src="js/FunctionNav.js"></script>

<!-- 使用 -->
<script>
    var con = G('.container');
    var fn = new FunctionNav(con.get(0) , {

    });
</script>
```
