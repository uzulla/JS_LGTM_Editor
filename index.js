"use strict";

var MAX_PX_SIZE = 1000;

var stage;
var canvas;
var lgtm_text;
var lgtm_text_outline;
var container;
var img;

$(function(){ // init
    $("#imageFile").change(loadImage);

    canvas = document.getElementById("canvas");
    stage = new createjs.Stage(canvas);

    img = new createjs.Bitmap("lgtm.jpg");
    img.image.onload = imageLoadFinish;
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

});

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
    lgtm_text.text = $(this).val();
    lgtm_text_outline.text = $(this).val();
}

function imageLoadFinish(e){
    var w = parseInt(e.target.width);
    var h = parseInt(e.target.height);
//    console.log('img loaded '+w+'x'+h);

    // 許容最大サイズをこえていたらアスペクト比をたもったままリサイズ
    if(w>MAX_PX_SIZE || h>MAX_PX_SIZE){
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
        canvas.width = w;
        canvas.height = h;
        stage.width = w;
        stage.height = h;
    }

    // テキストを中央に移動
    container.x = (stage.width - lgtm_text.getMeasuredWidth()) / 2;
    container.y = stage.height - (lgtm_text.getMeasuredHeight()*2);

}

function saveImage(){
    window.location.href = canvas.toDataURL('image/jpeg', 0.7);
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
    var list = target.font.split(' ');
    target.font = list[0]+" "+px+"px "+list[2];
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

