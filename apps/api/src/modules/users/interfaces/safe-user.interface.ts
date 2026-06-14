import type {users} from "@spechub/database";

/**
 * SafeUser = User KHÔNG có password_hash.
 * Dùng cho mọi nơi trả về user data (response, JWT payload, /me endpoint).
 *
 * QUY TẮC: KHÔNG BAO GIỜ trả về kiểu `users` thẳng từ service ra ngoài.
 * Luôn dùng `SafeUser`. Đây là defense-in-depth — nếu lỡ controller serialize
 * user, password_hash cũng không có để leak.
 */

export type SafeUser = Omit<users, 'password_hash'>;

/**
 * UserWithPassword = full user record, CHỈ dùng internal trong AuthService
 * để validate password. Không được expose ra controller/response.
 */

export type UserWithPassword = users;