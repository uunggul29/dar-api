// --- INTERFACE UTILITY ---
/**
 * Interface dasar untuk entitas yang memiliki ID
 */
export interface Entity {
    id: number;
}

/**
 * Interface dasar untuk data audit (created/updated/deleted timestamps)
 */
export interface Audit {
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
    is_active?: 'Y' | 'N';
}

// --- USER MODELS (DIBUTUHKAN UNTUK LOGIN) ---

/**
 * Interface untuk payload kredensial yang dikirim saat login.
 */
export interface LoginCredentials {
    username: string;
    password: string;
}

/**
 * Interface untuk detail pengguna setelah login berhasil.
 */
export interface UserDetail extends Entity, Audit {
    username: string;
    email: string;
    company_id: number | null;
    factory_id: number | null;
    // Tambahkan properti lain yang relevan dari tabel 'users' jika diperlukan
}

/**
 * Interface untuk respons lengkap dari endpoint login (/api/users/auth).
 */
export interface LoginResponse {
    token: string;
    user: UserDetail;
    message: string;
}

// --- MODEL DAR UTAMA ---

/**
 * Interface untuk data aktivitas driver (merujuk pada tabel driver_activity)
 */
export interface DriverActivity extends Entity, Audit {
    user_id: number;
    vehicle_id: number;
    departure_at: string;
    origin: string;
    origin_photo: string | null;
    origin_latitude: number | null;
    origin_longitude: number | null;
    odometer_before: number;
    arrival_at: string | null;
    destination: string | null;
    destination_photo: string | null;
    destination_latitude: number | null;
    destination_longitude: number | null;
    odometer_after: number | null;
    
    // Properti khusus frontend:
    incidents?: DriverIncident[]; // Array insiden yang terjadi selama aktivitas ini
}

/**
 * Interface untuk data insiden driver (merujuk pada tabel driver_incident)
 */
export interface DriverIncident extends Entity, Audit {
    driver_activity_id: number;
    incident_time: string;
    incident_name: string;
    incident_description: string | null;
    // Menggunakan incident_latitude/longitude sesuai ERD untuk lokasi kejadian
    incident_latitude: number | null;
    incident_longitude: number | null; 
    incident_cost: number | null;
    incident_status: 'Draft' | 'Reported' | 'Pending' | 'Resolved' | 'Cancelled';
}

/**
 * Interface untuk data kendaraan (merujuk pada tabel vehicles)
 */
export interface Vehicle extends Entity, Audit {
    number_plate: string;
    name: string;
    category: 'Small' | 'Medium' | 'Large';
    current_odometer: number;
    photo: string | null;
    company_id: number | null;
    factory_id: number | null;
}