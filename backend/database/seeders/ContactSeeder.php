<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Contact;
use Illuminate\Support\Str;

class ContactSeeder extends Seeder
{
	/**
	 * Run the database seeds.
	 */
	public function run(): void
	{
		for ($i = 1; $i <= 5; $i++) {
			Contact::firstOrCreate(
				['email' => "student{$i}@gmail.com"],
				[
					'full_name' => "Student {$i}",
					'message' => "Message {$i}",
				]
			);
		}
	}
}
