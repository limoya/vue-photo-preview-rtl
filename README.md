# vue-photo-preview-rtl

> \"基于vue-photo-preview的vue图片预览组件\" - 增加rtl版本

## 说明
原作者 xiaobaozi <826327700@qq.com>    
[原地址链接](https://github.com/826327700/vue-photo-preview)  
#### 新增
增加rtl的展示 option {rtl: true}  
改为两张图片可以loop

## 使用
``` bash
# 安装
npm install vue-photo-preview-rtl --save
```
```
# 引入
import preview from 'vue-photo-preview-rtl'
import 'vue-photo-preview-rtl/dist/skin.css'
Vue.use(preview)
//或者 
//var option={....} option配置请查看 http://photoswipe.com/documentation/options.html
//Vue.use(preview,option)
```
```
# umd
<link rel="stylesheet" type="text/css" href="路径/dist/skin.css"/>

<script src="路径/dist/vue-photo-preview.js" type="text/javascript" charset="utf-8"></script>
<script type="text/javascript">
	var options={
		fullscreenEl:false, //关闭全屏按钮
        rtl: true // 开启rtl
	}
	
	Vue.use(vuePhotoPreview,options)
	
	new Vue({
		el:'#app'
	})
</script>
```
```
# html
//在img标签添加preview属性 preview值相同即表示为同一组
<img src="xxx.jpg" preview="0" preview-text="描述文字">

//分组
<img src="xxx.jpg" preview="1" preview-text="描述文字">
<img src="xxx.jpg" preview="1" preview-text="描述文字">

<img src="xxx.jpg" preview="2" preview-text="描述文字">
<img src="xxx.jpg" preview="2" preview-text="描述文字">

<img src="xxx.jpg" large="xxx_3x.jpg" preview="2" preview-text="缩略图与大图模式">
```

## Options   
[插件配置文档](http://photoswipe.com/documentation/options.html) 

## DEMO   
[地址](https://826327700.github.io/vue-photo-preview/demo/)  

