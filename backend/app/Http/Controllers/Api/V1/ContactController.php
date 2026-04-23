<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use App\Http\Requests\Api\V1\Contact\StoreContactRequest;
use App\Models\Contact;
use Illuminate\Http\JsonResponse;

class ContactController extends BaseApiController
{
    public function store(StoreContactRequest $request): JsonResponse
    {
        $contact = Contact::create($request->validated());

        return $this->createdResponse(
            [
                'id' => $contact->id,
                'email' => $contact->email,
                'full_name' => $contact->full_name,
                'subject' => $contact->subject,
                'message' => $contact->message,
                'status' => $contact->status,
                'created_at' => $contact->created_at?->toISOString(),
            ],
            'Contact submitted successfully'
        );
    }
}
