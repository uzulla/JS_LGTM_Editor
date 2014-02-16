<?php
define('MAX_SIZE', 3*1024*1024);

require "vendor/autoload.php";
use Respect\Validation\Validator as v;

$url = $_GET['url'];
$url_parts = parse_url($url);
//error_log(print_r($url_parts,1));

// check valid url.
if(
!v::arr()
    ->key('scheme', v::startsWith('http'))
    ->key('host',   v::domain())
    ->key('path',   v::string())
    ->validate($url_parts)
){
    die_and_log($status=400, 'invalid url', $url);
}

// head access
$c = new Curl();
$c->setHeader('X-Forwarded-For', getRemoteIP());
$c->setOpt(CURLOPT_NOBODY, true);
$c->setOpt(CURLOPT_RETURNTRANSFER, true);
$c->error(function(){
    die_and_log($status=500, "head request error");
});
$c->get($url);
error_log(print_r($c->response_headers,1));

// check head res
$length = null;
$content_type = null;
foreach($c->response_headers as $header){
    if(preg_match("/\AContent-Length/i", $header)){
        $length = (int)explode(":", $header, 2)[1];
    }else if(preg_match("/\AContent-Type/i", $header)){
        $content_type = trim(explode(":", $header, 2)[1]);
    }
}

if(is_null($length)){
    die_and_log($status=400, "unknown content size:", $url);
}
if($length > MAX_SIZE){
    die_and_log($status=400, "content size over: ".MAX_SIZE."<{$length}bytes", $url);
}
if(!preg_match("/\Aimage\/(png|jpeg|gif)\z/ui", $content_type)){
    die_and_log($status=400,"not support content type:".$content_type, $url);
}

// get access
$c = new Curl();
$c->setHeader('X-Forwarded-For', getRemoteIP());
$c->error(function(){
    die_and_log($status=500, "get request error");
});
$c->get($url);

// dump
header("Content-Type: {$content_type}");
echo $c->response;

//--functions--
function die_and_log($status=400, $str='', $extra=''){
    header("HTTP/1.1 {$status} Error");
    echo $str;
    error_log("{$str} :: {$extra}");
    exit;
}

function getRemoteIP(){
    $_SERVER_UC = array_change_key_case($_SERVER, CASE_UPPER);
    if(isset($_SERVER_UC['HTTP_CLIENT_IP']))
        return $_SERVER_UC['HTTP_CLIENT_IP'];

    if(isset($_SERVER_UC['HTTP_X_CLUSTER_CLIENT_IP']))
        return $_SERVER_UC['HTTP_X_CLUSTER_CLIENT_IP'];

    if(isset($_SERVER_UC['HTTP_FORWARDED_FOR']))
        return $_SERVER_UC['HTTP_FORWARDED_FOR'];
    if(isset($_SERVER_UC['HTTP_X_FORWARDED_FOR']))
        return $_SERVER_UC['HTTP_X_FORWARDED_FOR'];

    if(isset($_SERVER_UC['HTTP_FORWARDED']))
        return $_SERVER_UC['HTTP_FORWARDED'];
    if(isset($_SERVER_UC['HTTP_X_FORWARDED']))
        return $_SERVER_UC['HTTP_X_FORWARDED'];

    if(isset($_SERVER_UC['REMOTE_ADDR']))
        return $_SERVER_UC['REMOTE_ADDR'];
}