import { z } from "zod";

// ─── Table ───────────────────────────────────────────────
export const createTableSchema = z.object({
    tableNo: z.coerce.number().int().min(1).max(9999),
});

export const deleteTableSchema = z.object({
    id: z.string().min(1, "กรุณาระบุ ID โต๊ะ"),
});

// ─── Menu ────────────────────────────────────────────────
export const createMenuItemSchema = z.object({
    name: z.string().min(1).max(100).trim(),
    category: z.string().min(1).max(50).trim(),
    basePrice: z.coerce.number().positive("ราคาต้องมากกว่า 0").max(99999),
    image: z.string().url().optional().nullable(),
    isAvailable: z.boolean().default(true),
    options: z.array(z.object({
        groupName: z.string().min(1).max(50),
        name: z.string().min(1).max(50),
        additionalPrice: z.coerce.number().min(0).max(99999),
    })).optional(),
});

export const patchMenuItemSchema = z.object({
    id: z.string().min(1, "กรุณาระบุ ID เมนู"),
    isAvailable: z.boolean(),
});

export const deleteMenuItemSchema = z.object({
    id: z.string().min(1, "กรุณาระบุ ID เมนู"),
});

// ─── Menu Options ────────────────────────────────────────
export const createMenuOptionSchema = z.object({
    menuItemId: z.string().min(1),
    groupName: z.string().min(1).max(50).trim(),
    name: z.string().min(1).max(50).trim(),
    additionalPrice: z.coerce.number().min(0).max(99999),
});

export const deleteMenuOptionSchema = z.object({
    id: z.string().min(1, "กรุณาระบุ ID option"),
});

// ─── Orders ──────────────────────────────────────────────
export const patchOrderSchema = z.object({
    orderId: z.string().min(1).optional(),
    status: z.enum(["OPEN", "PAID", "CANCELLED", "PENDING_APPROVAL"]).optional(),
    itemId: z.string().min(1).optional(),
    itemStatus: z.enum(["PENDING", "COOKING", "SERVED", "CANCELLED"]).optional(),
});

export const deleteOrderItemSchema = z.object({
    itemId: z.string().min(1, "กรุณาระบุ ID ของรายการที่ต้องการลบ"),
});

// ─── Customer Order (Table Order) ────────────────────────
export const customerOrderItemSchema = z.object({
    menuItemId: z.string().min(1),
    menuItemName: z.string().min(1).max(200),
    quantity: z.coerce.number().int().min(1).max(100),
    price: z.number().optional(), // ignored — server will look up from DB
    optionsText: z.string().max(500).optional().nullable(),
});

export const createCustomerOrderSchema = z.object({
    session: z.string().min(1),
    sign: z.string().min(1),
    items: z.array(customerOrderItemSchema).min(1).max(50),
});
