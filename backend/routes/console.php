<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Dọn lệch hoàn thành khoá học (vd buổi offline cuối qua session_end mà không có
// hành động nào tự kích hoạt recalc) — chạy mỗi đêm.
Schedule::command('learning:recompute-completion')->daily();
