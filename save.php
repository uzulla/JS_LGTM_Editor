<?php
require "vendor/autoload.php";

ini_set('post_max_size', '5M');

$data_url = $_POST['data_url'];
$matches = [];
$res = preg_match('/\Adata:image\/(png|gif|jpeg);base64,(.*)\z/i', $data_url, $matches);
if($res !== 1){
    die_and_log($status=400, 'invalid data');
}

$img_type = $matches[1];
$raw = base64_decode($matches[2]);

// dump
header("Content-Type: image/{$img_type}");
header("Content-Disposition: attachment; filename=\"lgtm_".time().".{$img_type}\"");
header("Expires: 1");
header("Cache-Control: no-cache");
header("Pragma: no-cache");
echo $raw;

//--functions--
function die_and_log($status=400, $str='', $extra=''){
    header("HTTP/1.1 {$status} Error");
    echo $str;
    error_log("{$str} :: {$extra}");
    exit;
}
