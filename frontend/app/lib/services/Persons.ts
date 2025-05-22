import axios from "axios";
import { Roles, Users } from "../types/persons";

export async function getUsersData(): Promise<Users[]> {
    const Res = await fetch("http://127.0.0.1:8000/pharmacy/users/");

    if (!Res.ok) {
        throw new Error("Failed to fetch data");
    }

    const Data: Users[] = await Res.json();

    return Data;
}

export async function getUserData({ user_id }: { user_id: number }): Promise<Users> {
    const Res = await axios.get<Users>(
        `http://127.0.0.1:8000/pharmacy/users/${user_id}/`
    );

    const data = Array.isArray(Res.data)
        ? Res.data[0]
        : Res.data;

    return data;
}

export async function getRoleData(): Promise<Roles[]> {
    const Res = await fetch("http://127.0.0.1:8000/pharmacy/roles/");

    if (!Res.ok) {
        throw new Error("Failed to fetch data");
    }

    const Data: Roles[] = await Res.json();

    return Data;
}