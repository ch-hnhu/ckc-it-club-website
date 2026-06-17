<?php

namespace App\Observers;

use App\Models\EventCheckIn;
use App\Services\PointService;

class EventCheckInObserver
{
    public function created(EventCheckIn $checkIn): void
    {
        if ($checkIn->user) {
            PointService::award($checkIn->user, 'event.checkin', $checkIn);
        }
    }
}
