<?php

namespace Tests\Feature;

use App\Enums\PermissionsEnum;
use App\Enums\RolesEnum;
use App\Models\AcademicStructureImport;
use App\Models\Faculty;
use App\Models\Major;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AcademicStructureImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_import_academic_structure_from_csv(): void
    {
        $admin = $this->createAdminUser();

        $file = UploadedFile::fake()->createWithContent(
            'academic-structure.csv',
            implode("\n", [
                'faculty_label,major_label,class_label',
                'Công nghệ thông tin,Kỹ thuật phần mềm,CTK42',
                'Công nghệ thông tin,Kỹ thuật phần mềm,CTK43',
                'Công nghệ thông tin,Kỹ thuật phần mềm,CTK43',
            ]),
        );

        $response = $this
            ->actingAsAdmin($admin)
            ->post('/api/v1/academic-structure/import', ['file' => $file], [
                'Accept' => 'application/json',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.processed_rows', 3)
            ->assertJsonPath('data.created.faculties', 1)
            ->assertJsonPath('data.created.majors', 1)
            ->assertJsonPath('data.created.school_classes', 2)
            ->assertJsonPath('data.existing.school_classes', 1);

        $this->assertDatabaseCount('faculties', 1);
        $this->assertDatabaseCount('majors', 1);
        $this->assertDatabaseCount('school_classes', 2);
    }

    public function test_import_continues_when_some_rows_are_invalid(): void
    {
        $admin = $this->createAdminUser();

        $file = UploadedFile::fake()->createWithContent(
            'academic-structure.csv',
            implode("\n", [
                'faculty_label,major_label,class_label',
                'Khoa Kinh tế,Quản trị kinh doanh,QTKD01',
                ',,Lớp thiếu ngành',
            ]),
        );

        $response = $this
            ->actingAsAdmin($admin)
            ->post('/api/v1/academic-structure/import', ['file' => $file], [
                'Accept' => 'application/json',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.processed_rows', 1)
            ->assertJsonCount(1, 'data.errors')
            ->assertJsonPath('data.errors.0.row', 3);

        $this->assertDatabaseHas('faculties', ['slug' => 'khoa-kinh-te']);
        $this->assertDatabaseHas('majors', ['slug' => 'quan-tri-kinh-doanh']);
        $this->assertDatabaseHas('school_classes', ['slug' => 'qtkd01']);
    }

    public function test_import_with_unsupported_file_type_is_recorded_as_failed(): void
    {
        $admin = $this->createAdminUser();

        $file = UploadedFile::fake()->createWithContent(
            'academic-structure.pdf',
            'not a supported spreadsheet',
        );

        $response = $this
            ->actingAsAdmin($admin)
            ->post('/api/v1/academic-structure/import', ['file' => $file], [
                'Accept' => 'application/json',
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('errors.file.0', 'Chỉ hỗ trợ file .xlsx hoặc .csv.');

        $this->assertDatabaseHas('academic_structure_imports', [
            'original_file_name' => 'academic-structure.pdf',
            'file_type' => 'Other',
            'status' => 'failed',
            'processed_rows' => 0,
            'error_message' => 'Chỉ hỗ trợ file .xlsx hoặc .csv.',
        ]);

        $this->assertSame(1, AcademicStructureImport::query()->where('status', 'failed')->count());
    }

    private function createAdminUser(): User
    {
        $adminRole = Role::findOrCreate(RolesEnum::ADMIN->value, 'web');
        $adminRole->givePermissionTo(
            Permission::findOrCreate(PermissionsEnum::ADMIN_PANEL_ACCESS->value, 'web'),
            Permission::findOrCreate(PermissionsEnum::ACADEMIC_STRUCTURE_IMPORT->value, 'web'),
        );
        $user = User::factory()->create([
            'email' => 'admin@example.com',
            'full_name' => 'Admin User',
            'is_active' => true,
        ]);
        $user->assignRole($adminRole);

        return $user;
    }

    private function actingAsAdmin(User $user): self
    {
        Sanctum::actingAs($user);

        return $this;
    }
}
