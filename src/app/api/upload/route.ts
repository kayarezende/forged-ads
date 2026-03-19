import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { saveFile } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    await getUserId();

    const formData = await request.formData();
    const file = formData.get("file");
    const directory = formData.get("directory");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (typeof directory !== "string" || !directory) {
      return NextResponse.json(
        { error: "No directory provided" },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be under 5MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() ?? "png";

    const url = await saveFile(buffer, {
      directory,
      extension: ext,
    });

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
