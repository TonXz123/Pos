"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn("credentials", {
            username: formData.get("username"),
            password: formData.get("password"),
            redirectTo: "/admin",
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
                default:
                    return "เกิดข้อผิดพลาดบางอย่าง";
            }
        }
        throw error;
    }
}

export async function logout() {
    await signOut({ redirectTo: "/" });
}
