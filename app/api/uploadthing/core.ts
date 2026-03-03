import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/auth";

const f = createUploadthing();

export const ourFileRouter = {
    menuImageUploader: f({
        image: {
            maxFileSize: "4MB",
            maxFileCount: 1,
        },
    })
        .middleware(async () => {
            // 🔒 ตรวจสอบ auth — เฉพาะ admin เท่านั้นที่อัปโหลดได้
            const session = await auth();
            if (!session?.user) throw new Error("Unauthorized");
            return { userId: session.user.name };
        })
        .onUploadComplete(async ({ file }) => {
            return { url: file.ufsUrl };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
