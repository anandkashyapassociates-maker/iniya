<?php

namespace App\Console\Commands;

use App\Models\AdminActivityLog;
use App\Models\SuperAdmin;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateSuperAdminCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'superadmin:create
                            {--name= : The name of the Super Admin}
                            {--email= : The email address of the Super Admin}
                            {--password= : The initial password}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Securely create an initial Super Admin account without exposing public registration';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('==========================================');
        $this->info('  Super Admin Account Creation Utility    ');
        $this->info('==========================================');

        $name = $this->option('name') ?: $this->ask('Super Admin Name');
        $email = $this->option('email') ?: $this->ask('Super Admin Email');
        $password = $this->option('password') ?: $this->secret('Super Admin Password (min 8 characters)');

        $validator = Validator::make([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ], [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:super_admins,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            return self::FAILURE;
        }

        $superAdmin = SuperAdmin::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'is_active' => true,
            'email_verified_at' => Carbon::now(),
        ]);

        AdminActivityLog::record(
            'super_admin',
            $superAdmin->id,
            'superadmin_cli_created',
            "Initial Super Admin account created via CLI ({$email})."
        );

        $this->info("✓ Super Admin [{$name}] <{$email}> created successfully!");
        $this->line('Account is active and ready for authentication at /superadmin.');

        return self::SUCCESS;
    }
}

