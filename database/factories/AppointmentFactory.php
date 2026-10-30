<?php

namespace Database\Factories;

use App\Models\Admin;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Staff;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    protected $model = Appointment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'appointment_number' => Appointment::generateAppointmentNumber(),
            'customer_id' => Customer::factory(),
            'staff_id' => Staff::factory(),
            'admin_id' => Admin::factory(),
            'appointment_date' => fake()->date(),
            'appointment_time' => '10:00 AM',
            'session_slot' => fake()->randomElement(['Morning', 'Afternoon', 'Evening']),
            'session_number' => 1,
            'total_sessions' => 3,
            'treatment_name' => fake()->randomElement(['Physical Therapy', 'Skin Rejuvenation', 'Dental Checkup', 'Consultation']),
            'treatment_details' => fake()->sentence(),
            'status' => 'scheduled',
            'fee' => 500.00,
            'payment_status' => 'pending',
            'notes' => fake()->sentence(),
        ];
    }
}
