"use strict";

var MAX_PX_SIZE = 600;

var stage;
var canvas;
var lgtm_text;
var lgtm_text_outline;
var container;
var img;
var fontNameList = ['Arial'];

$(function(){ // init
    loadFont();

    $("#imageFile").change(loadImage);

    canvas = document.getElementById("canvas");
    stage = new createjs.Stage(canvas);

    img = new createjs.Bitmap("lgtm.jpg");
    img.image.onload = imageLoadFinish;
    img.image.onerror = imageLoadError;
    stage.addChild(img);

    container = new createjs.Container();

    lgtm_text = new createjs.Text('', 'Bold 80px Arial', '#FFF');
    lgtm_text.x = 0;
    lgtm_text.y = 0;
    lgtm_text_outline = lgtm_text.clone();
    lgtm_text_outline.outline = 2;
    lgtm_text_outline.color = "#000";
    container.addChild(lgtm_text);
    container.addChild(lgtm_text_outline);

    container.addEventListener('mousedown', dragMove);

    stage.addChild(container);

    createjs.Ticker.addEventListener("tick", stage);

    $('#string').on('keyup change', textChange).trigger('change');
    $('#save').on('click', saveImage);
    $('#generateImage').on('click', generateImage);

    //DnD
    var dropZone = document.getElementById('dnd_area');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleFileSelect, false);
    dropZone.addEventListener('dragleave', handleDragLeave, false);

    $('#loadByUrl').on('click', loadByUrl);
    $('#fontName').on('change', changeFontName);
    $('#color_fill').on('change', changeFontColor);
    $('#color_stroke').on('change', changeFontColor).trigger('change');

    // one touch change
    $.each(sample_message_list, function(){
        var text = this;
        var _onclick = function(text){
            return function(){
                $('#string').val(text);
                textChange();
                moveTextCenter();
            }
        }
        $('#oneTouchMessages').append(
            $('<button></button>')
                .text(text)
                .on('click', _onclick(text))
        );
    });
});

function changeFontColor(){
    lgtm_text.color = $('#color_fill').val();
    lgtm_text_outline.color = $('#color_stroke').val();
}

function changeFontName(e){
    var elm = e.target;
    var fontName = $('option:selected', elm).val();
    setFont(fontName);
}

function loadFont(){
    $.each(fontList, function(index,value){
        var css = $("<link rel='stylesheet' type='text/css'>");
        css.prop('href', value[1]);
        $('head').append(css);
        fontNameList.push(value[0]);
        $('#fontName').append($('<option>').text(value[0]));
    });
    console.log(fontNameList);
}

function setFont(fontName){
    var list = lgtm_text.font.match('^([^ ]+) ([^ ]+) (.+)$');
    var cssstr = list[1]+" "+list[2]+" "+fontName;
    lgtm_text.font = cssstr;
    lgtm_text_outline.font = cssstr;
}

function imageLoadError(){
    alert("Error:画像のロードに失敗しました\n指定したものが画像でないか、取得できません。");
}

function loadByUrl(){
    var url = "proxy.php?url="+$("#imageUrl").val();
    console.log(url);
    img.image.src = url;
}

function loadImage(){
    var file = this.files[0];

    if (!file.type.match(/^image\/(png|jpeg|gif)$/)){
        alert('plz set jpg,gif,png');
        return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
        img.image.src = e.target.result;
    };
    reader.readAsDataURL(file);
}


function textChange(){
    lgtm_text.text = $('#string').val();
    lgtm_text_outline.text = $('#string').val();
}

function imageLoadFinish(e){
    resizeImage();
}

function resizeImage(){
    var w = parseInt(img.image.width);
    var h = parseInt(img.image.height);
//    console.log('img loaded '+w+'x'+h);

    // アスペクト比をたもったままリサイズ
    if(w>MAX_PX_SIZE || h>MAX_PX_SIZE || $('#fit_flag').prop('checked')){
        var scale = Math.min(MAX_PX_SIZE/w,MAX_PX_SIZE/h);
//        console.log(scale);
        img.scaleX = scale;
        img.scaleY = scale;
        var rsizew = img.image.width * scale;
        var rsizeh = img.image.height * scale;
        canvas.width = rsizew;
        canvas.height = rsizeh;
        stage.width = rsizew;
        stage.height = rsizeh;
    }else{
        img.scaleX = 1;
        img.scaleY = 1;
        canvas.width = w;
        canvas.height = h;
        stage.width = w;
        stage.height = h;
    }

    moveTextCenter();
}

function moveTextCenter(){
    // テキストを中央に移動
    container.x = (stage.width - lgtm_text.getMeasuredWidth()) / 2;
    container.y = stage.height - (lgtm_text.getMeasuredHeight()*2);
}


function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();
    $(e.target).removeClass('on');
    $(e.target).addClass('send');

    var files = e.dataTransfer.files; // FileList object.

    if(files.length!=1){
        alert('allow only one file in upload.');
        return;
    }

    var file = files[0];

    if (!file.type.match(/^image\/(png|jpeg|gif)$/)){
        alert('plz set jpg,gif,png');
        return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
        img.image.src = e.target.result;
    };
    reader.readAsDataURL(file);
    $(e.target).css('backgroundColor', '');

}

function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    $(e.target).css('backgroundColor', 'red');
}

function handleDragLeave(e) {
    e.stopPropagation();
    e.preventDefault();
    $(e.target).css('backgroundColor', '');
}

function generateImage(e){
    try{
        var dataURL = canvas.toDataURL('image/jpeg', 0.8);
        $('#downloadImageLink').attr('href', dataURL);
    }catch(e){
        alert("変換に失敗しました。"+e);
    }
}

function saveImage(){
    try{
        var data_url = canvas.toDataURL('image/jpeg', 0.8);
        var form = $('<form method="post" action="save.php" target="_blank">');
        form.append($('<input name="data_url">').val(data_url));
        $('body').append(form);
        form.submit();
    }catch(e){
        alert("保存に失敗しました"+e);
    }
}

function dragMove(eventObject){
    var instance = eventObject.currentTarget;
    instance.addEventListener("pressmove", drag);
    instance.addEventListener("pressup", stopDrag);
    instance.offset = new createjs.Point(instance.x - eventObject.stageX, instance.y - eventObject.stageY);
}

function drag(eventObject) {
    var instance = eventObject.currentTarget;
    var offset = instance.offset;
    instance.x = eventObject.stageX + offset.x;
    instance.y = eventObject.stageY + offset.y;
    stage.update();
}

function stopDrag(eventObject) {
    var instance = eventObject.currentTarget;
    instance.removeEventListener("pressmove", drag);
    instance.removeEventListener("pressup", stopDrag);
}

function setFontSize(target, px){
    var list = lgtm_text.font.match('^([^ ]+) ([^ ]+) (.+)$');
    target.font = list[1]+" "+px+"px "+list[3];
}

function getFontSize(target){
    var list = target.font.match(/ ([0-9]+)px /);
    return parseInt(list[1]);
}

function deltaFontSize(diff){
    var px = getFontSize(lgtm_text);
    px = px + diff;
    setFontSize(lgtm_text, px);
    setFontSize(lgtm_text_outline, px);
}

function moveText(direction){
   if(direction=='k'){
       container.y += -10;
   }
    if(direction=='j'){
        container.y += 10;
    }
    if(direction=='l'){
        container.x += 10;
    }
    if(direction=='h'){
        container.x -= 10;
    }

}
