export interface Users {
    user_id: number;
    username: string;
    person_id: number;
    first_name: string;
    last_name: string;
    address: string;
    contact: string;
    email: string;
    role_id: number;
    role_name: string;
    location_id: number;
    location: string;
    status: string;
}

export interface Roles {
    role_id: number;
    role_name: string;
}
